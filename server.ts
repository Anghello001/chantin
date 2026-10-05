import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  RoomData, 
  Player, 
  GameSettings, 
  ChatMessage, 
  RoomState, 
  PeerVoteEntry 
} from './src/types/game';
import { 
  ALPHABET, 
  CLASSIC_CATEGORIES, 
  ALL_PRESET_MODES 
} from './src/constants/gameCategories';
import { calculateAutomaticScores, calculateAutomaticScoresAsync } from './src/utils/scoreCalculator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = Number(process.env.PORT) || 3000;

// In-Memory volatile storage for rooms
const rooms = new Map<string, RoomData>();
const playerToRoom = new Map<string, string>(); // socket.id -> roomCode
const roomTimers = new Map<string, NodeJS.Timeout>();
const reviewTimers = new Map<string, NodeJS.Timeout>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function getDefaultSettings(): GameSettings {
  return {
    roundDuration: 60,
    gameMode: 'classic',
    totalRounds: 5,
    categories: [...CLASSIC_CATEGORIES],
    autoScoreAssistant: true,
    gracePeriodSeconds: 3,
  };
}

function broadcastRoom(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room_state_update', room);
}

function clearRoomTimer(roomCode: string) {
  const timer = roomTimers.get(roomCode);
  if (timer) {
    clearInterval(timer);
    roomTimers.delete(roomCode);
  }
  const revTimer = reviewTimers.get(roomCode);
  if (revTimer) {
    clearInterval(revTimer);
    reviewTimers.delete(roomCode);
  }
}

function pickRandomLetter(room: RoomData): string {
  const availableLetters = ALPHABET.filter(l => !room.usedLetters.includes(l));
  if (availableLetters.length === 0) {
    room.usedLetters = [];
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  const chosen = availableLetters[Math.floor(Math.random() * availableLetters.length)];
  room.usedLetters.push(chosen);
  return chosen;
}

function triggerFreezeAndReview(roomCode: string, stoppedBy?: { id: string; nickname: string; avatar: string }) {
  const room = rooms.get(roomCode);
  if (!room || (room.state !== 'playing' && room.state !== 'countdown')) return;

  clearRoomTimer(roomCode);
  room.state = 'freeze_countdown';
  room.freezeCountdownRemaining = room.settings.gracePeriodSeconds || 3;
  if (stoppedBy) {
    room.stoppedByPlayer = stoppedBy;
  }

  // Notify everyone instantly to freeze input and play buzzer
  io.to(roomCode).emit('game_frozen', {
    stoppedBy: room.stoppedByPlayer,
    freezeSeconds: room.freezeCountdownRemaining,
  });
  broadcastRoom(roomCode);

  // Grace countdown tick
  const graceInterval = setInterval(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || currentRoom.state !== 'freeze_countdown') {
      clearInterval(graceInterval);
      return;
    }

    if (currentRoom.freezeCountdownRemaining && currentRoom.freezeCountdownRemaining > 1) {
      currentRoom.freezeCountdownRemaining -= 1;
      io.to(roomCode).emit('freeze_tick', { remaining: currentRoom.freezeCountdownRemaining });
    } else {
      clearInterval(graceInterval);
      transitionToReview(roomCode);
    }
  }, 1000);
}

function finalizeRoundAndProceed(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== 'reviewing') return;

  const revTimer = reviewTimers.get(roomCode);
  if (revTimer) {
    clearInterval(revTimer);
    reviewTimers.delete(roomCode);
  }

  const roundScores: Record<string, number> = {};
  const roundAnswers: Record<string, Record<string, string>> = {};

  for (const [pid, player] of Object.entries(room.players)) {
    let roundTotal = 0;
    for (const detail of Object.values(player.roundScoreDetails || {})) {
      roundTotal += detail.points || 0;
    }
    player.totalRoundPoints = roundTotal;
    player.score += roundTotal;
    roundScores[pid] = roundTotal;
    roundAnswers[pid] = { ...player.currentRoundAnswers };
  }

  room.roundHistory.push({
    round: room.currentRound,
    letter: room.currentLetter,
    answers: roundAnswers,
    scores: roundScores,
    screamedBy: room.stoppedByPlayer?.nickname,
  });

  room.state = 'round_results';
  broadcastRoom(roomCode);
}

async function transitionToReview(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.state = 'reviewing';
  room.freezeCountdownRemaining = 0;
  room.reviewTimerTotal = 20;
  room.reviewTimerRemaining = 20;

  // Compile answers map
  const answersByPlayer: Record<string, Record<string, string>> = {};
  for (const [pid, player] of Object.entries(room.players)) {
    answersByPlayer[pid] = player.currentRoundAnswers || {};
  }

  // Run auto scoring calculation with async dictionary API check & peer voting filter
  const autoScores = await calculateAutomaticScoresAsync(
    answersByPlayer, 
    room.currentLetter, 
    room.settings.categories, 
    room.settings.gameMode, 
    room.peerVotes
  );

  for (const [pid, player] of Object.entries(room.players)) {
    player.roundScoreDetails = autoScores[pid] || {};
  }

  broadcastRoom(roomCode);

  // Start 20s server review timer countdown
  const existingReview = reviewTimers.get(roomCode);
  if (existingReview) clearInterval(existingReview);

  const reviewInterval = setInterval(() => {
    const currentRoom = rooms.get(roomCode);
    if (!currentRoom || currentRoom.state !== 'reviewing') {
      clearInterval(reviewInterval);
      reviewTimers.delete(roomCode);
      return;
    }

    if (currentRoom.reviewTimerRemaining && currentRoom.reviewTimerRemaining > 1) {
      currentRoom.reviewTimerRemaining -= 1;
      io.to(roomCode).emit('review_timer_tick', {
        remaining: currentRoom.reviewTimerRemaining,
        total: currentRoom.reviewTimerTotal || 20,
      });
    } else {
      clearInterval(reviewInterval);
      reviewTimers.delete(roomCode);
      finalizeRoundAndProceed(roomCode);
    }
  }, 1000);

  reviewTimers.set(roomCode, reviewInterval);
}

// Socket handlers
io.on('connection', (socket: Socket) => {
  console.log(`[SOCKET CONECTADO] id: ${socket.id} | IP: ${socket.handshake.address}`);

  // Create Room
  socket.on('create_room', ({ nickname, avatar, settings }) => {
    const roomCode = generateRoomCode();
    console.log(`[CREAR SALA] Sala ${roomCode} creada por ${nickname || 'Anónimo'} (id: ${socket.id})`);
    const initialSettings: GameSettings = {
      ...getDefaultSettings(),
      ...(settings || {}),
    };

    const hostPlayer: Player = {
      id: socket.id,
      nickname: (nickname || 'Jugador 1').trim().slice(0, 20),
      avatar: avatar || '🦙',
      score: 0,
      totalRoundPoints: 0,
      isHost: true,
      isReady: true,
      currentRoundAnswers: {},
      roundScoreDetails: {},
      screamedChantin: false,
      connected: true,
    };

    const newRoom: RoomData = {
      code: roomCode,
      hostId: socket.id,
      state: 'lobby',
      currentRound: 0,
      currentLetter: '',
      usedLetters: [],
      settings: initialSettings,
      players: { [socket.id]: hostPlayer },
      peerVotes: {},
      timerRemaining: initialSettings.roundDuration,
      timerTotal: initialSettings.roundDuration,
      roundHistory: [],
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'Sistema',
          senderAvatar: '📢',
          text: `¡Sala creada! Comparte el código "${roomCode}" con tus amigos.`,
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    rooms.set(roomCode, newRoom);
    playerToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit('room_created', { roomCode, room: newRoom });
    broadcastRoom(roomCode);
  });

  // Join Room
  socket.on('join_room', ({ roomCode, nickname, avatar }) => {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(cleanCode);

    if (!room) {
      socket.emit('join_error', { message: 'La sala no existe o ha expirado.' });
      return;
    }

    if (Object.keys(room.players).length >= 12) {
      socket.emit('join_error', { message: 'La sala está llena (máximo 12 jugadores).' });
      return;
    }

    const newPlayer: Player = {
      id: socket.id,
      nickname: (nickname || `Jugador ${Object.keys(room.players).length + 1}`).trim().slice(0, 20),
      avatar: avatar || '🥑',
      score: 0,
      totalRoundPoints: 0,
      isHost: false,
      isReady: false,
      currentRoundAnswers: {},
      roundScoreDetails: {},
      screamedChantin: false,
      connected: true,
    };

    room.players[socket.id] = newPlayer;
    playerToRoom.set(socket.id, cleanCode);
    socket.join(cleanCode);

    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      senderId: 'system',
      senderName: 'Sistema',
      senderAvatar: '👋',
      text: `${newPlayer.nickname} se ha unido a la sala.`,
      timestamp: Date.now(),
    });

    socket.emit('joined_room_success', { roomCode: cleanCode, room });
    broadcastRoom(cleanCode);
  });

  // Update Settings (Host only)
  socket.on('update_settings', ({ roomCode, settings }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (settings.gameMode && settings.gameMode !== room.settings.gameMode) {
      const preset = ALL_PRESET_MODES[settings.gameMode as keyof typeof ALL_PRESET_MODES];
      if (preset) {
        settings.categories = [...preset.categories];
      }
    }

    room.settings = { ...room.settings, ...settings };
    room.timerRemaining = room.settings.roundDuration;
    room.timerTotal = room.settings.roundDuration;
    broadcastRoom(roomCode);
  });

  // Start Round (Host only)
  socket.on('start_round', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    clearRoomTimer(roomCode);
    room.currentRound += 1;
    room.currentLetter = pickRandomLetter(room);
    room.stoppedByPlayer = undefined;
    room.peerVotes = {}; // reset votes for new round
    room.timerRemaining = room.settings.roundDuration;
    room.timerTotal = room.settings.roundDuration;

    // Reset player round state
    for (const player of Object.values(room.players)) {
      player.currentRoundAnswers = {};
      player.roundScoreDetails = {};
      player.screamedChantin = false;
      player.totalRoundPoints = 0;
    }

    // Step 1: Countdown 3s suspense
    room.state = 'countdown';
    broadcastRoom(roomCode);

    setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (!currentRoom || currentRoom.state !== 'countdown') return;

      currentRoom.state = 'playing';
      broadcastRoom(roomCode);

      // Server-authoritative game timer
      const timer = setInterval(() => {
        const activeRoom = rooms.get(roomCode);
        if (!activeRoom || activeRoom.state !== 'playing') {
          clearInterval(timer);
          return;
        }

        if (activeRoom.timerRemaining > 0) {
          activeRoom.timerRemaining -= 1;
          io.to(roomCode).emit('timer_tick', { 
            remaining: activeRoom.timerRemaining,
            total: activeRoom.timerTotal 
          });

          if (activeRoom.timerRemaining <= 0) {
            clearInterval(timer);
            triggerFreezeAndReview(roomCode, { id: 'time', nickname: 'Tiempo Agotado', avatar: '⏰' });
          }
        }
      }, 1000);

      roomTimers.set(roomCode, timer);
    }, 3200);
  });

  // Player input answers real-time sync (buffered on server)
  socket.on('sync_player_answers', ({ roomCode, answers }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players[socket.id];
    if (player && (room.state === 'playing' || room.state === 'freeze_countdown')) {
      player.currentRoundAnswers = answers || {};
    }
  });

  // Chantinchanton Scream / Stop Button
  socket.on('chantinchanton', ({ roomCode, answers }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== 'playing') return;

    const player = room.players[socket.id];
    if (player) {
      player.screamedChantin = true;
      if (answers) {
        player.currentRoundAnswers = answers;
      }
      room.chatMessages.push({
        id: `msg-${Date.now()}`,
        senderId: socket.id,
        senderName: player.nickname,
        senderAvatar: player.avatar,
        text: '¡¡¡CHANTINCHANTÓN 1, 2, 3!!! 📢',
        isShout: true,
        shoutType: 'chantin',
        timestamp: Date.now(),
      });
      triggerFreezeAndReview(roomCode, { id: player.id, nickname: player.nickname, avatar: player.avatar });
    }
  });

  // REQUIRED SOCKET EVENT: 'vote_answer' (Peer review voting for subjective/custom categories)
  socket.on('vote_answer', async ({ roomCode, targetPlayerId, categoryId, vote }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== 'reviewing') return;

    const voteKey = `${targetPlayerId}_${categoryId}`;
    if (!room.peerVotes[voteKey]) {
      room.peerVotes[voteKey] = { upvotes: [], downvotes: [] };
    }

    const voteEntry = room.peerVotes[voteKey];
    const voterId = socket.id;

    const isApprove = vote === 'accept' || vote === 'up' || vote === 'approve';
    const isReject = vote === 'reject' || vote === 'down';

    const hadUp = voteEntry.upvotes.includes(voterId);
    const hadDown = voteEntry.downvotes.includes(voterId);

    voteEntry.upvotes = voteEntry.upvotes.filter(id => id !== voterId);
    voteEntry.downvotes = voteEntry.downvotes.filter(id => id !== voterId);

    if (isApprove && !hadUp) {
      voteEntry.upvotes.push(voterId);
    } else if (isReject && !hadDown) {
      voteEntry.downvotes.push(voterId);
    }

    // Re-evaluate automatic scores with live peer votes
    const answersByPlayer: Record<string, Record<string, string>> = {};
    for (const [pid, player] of Object.entries(room.players)) {
      answersByPlayer[pid] = player.currentRoundAnswers || {};
    }
    const autoScores = await calculateAutomaticScoresAsync(
      answersByPlayer, 
      room.currentLetter, 
      room.settings.categories, 
      room.settings.gameMode, 
      room.peerVotes
    );

    for (const [pid, player] of Object.entries(room.players)) {
      player.roundScoreDetails = autoScores[pid] || {};
    }

    broadcastRoom(roomCode);
  });

  // Alias event
  socket.on('cast_peer_vote', (data) => {
    socket.emit('vote_answer', { ...data, vote: data.voteType });
  });

  // Manual point update during review (Host override)
  socket.on('update_review_points', ({ roomCode, targetPlayerId, categoryId, points, status, notes }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== 'reviewing') return;

    const targetPlayer = room.players[targetPlayerId];
    if (!targetPlayer) return;

    if (!targetPlayer.roundScoreDetails) {
      targetPlayer.roundScoreDetails = {};
    }

    targetPlayer.roundScoreDetails[categoryId] = {
      points: Number(points) || 0,
      status: status || 'custom',
      verified: true,
      notes: notes || '',
    };

    broadcastRoom(roomCode);
  });

  // Approve all reviews and move to round results / leaderboard
  socket.on('approve_all_reviews', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== 'reviewing') return;

    const roundScores: Record<string, number> = {};
    const roundAnswers: Record<string, Record<string, string>> = {};

    for (const [pid, player] of Object.entries(room.players)) {
      let roundTotal = 0;
      for (const detail of Object.values(player.roundScoreDetails || {})) {
        roundTotal += detail.points || 0;
      }
      player.totalRoundPoints = roundTotal;
      player.score += roundTotal;
      roundScores[pid] = roundTotal;
      roundAnswers[pid] = { ...player.currentRoundAnswers };
    }

    room.roundHistory.push({
      round: room.currentRound,
      letter: room.currentLetter,
      answers: roundAnswers,
      scores: roundScores,
      screamedBy: room.stoppedByPlayer?.nickname,
    });

    room.state = 'round_results';
    broadcastRoom(roomCode);
  });

  // Next round or Finish game
  socket.on('next_round', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    if (room.currentRound >= room.settings.totalRounds) {
      room.state = 'game_over';
      broadcastRoom(roomCode);
    } else {
      socket.emit('trigger_start_round', { roomCode });
    }
  });

  // Finish game early
  socket.on('finish_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.state = 'game_over';
    broadcastRoom(roomCode);
  });

  // Restart / Play Again
  socket.on('restart_game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    clearRoomTimer(roomCode);
    room.state = 'lobby';
    room.currentRound = 0;
    room.currentLetter = '';
    room.usedLetters = [];
    room.roundHistory = [];
    room.peerVotes = {};
    room.stoppedByPlayer = undefined;
    room.timerRemaining = room.settings.roundDuration;

    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.totalRoundPoints = 0;
      player.currentRoundAnswers = {};
      player.roundScoreDetails = {};
      player.screamedChantin = false;
    }

    broadcastRoom(roomCode);
  });

  // Quick Chat / Shouts / Reactions
  socket.on('send_reaction', ({ roomCode, shoutType, text }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    const msg: ChatMessage = {
      id: `shout-${Date.now()}-${Math.random()}`,
      senderId: socket.id,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      text: (text || '').trim().slice(0, 100),
      isShout: true,
      shoutType: shoutType || 'general',
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    io.to(roomCode).emit('receive_reaction', msg);
  });

  // Send regular chat message
  socket.on('send_chat_message', ({ roomCode, text }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: socket.id,
      senderName: player.nickname,
      senderAvatar: player.avatar,
      text: (text || '').trim().slice(0, 150),
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 50) {
      room.chatMessages.shift();
    }

    io.to(roomCode).emit('receive_chat_message', msg);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomCode = playerToRoom.get(socket.id);
    if (!roomCode) return;

    playerToRoom.delete(socket.id);
    const room = rooms.get(roomCode);
    if (!room) return;

    const leavingPlayer = room.players[socket.id];
    delete room.players[socket.id];

    if (leavingPlayer) {
      room.chatMessages.push({
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Sistema',
        senderAvatar: '🚪',
        text: `${leavingPlayer.nickname} salió de la partida.`,
        timestamp: Date.now(),
      });
    }

    const remainingPlayerIds = Object.keys(room.players);
    if (remainingPlayerIds.length === 0) {
      clearRoomTimer(roomCode);
      setTimeout(() => {
        if (rooms.get(roomCode) && Object.keys(rooms.get(roomCode)!.players).length === 0) {
          rooms.delete(roomCode);
        }
      }, 10000);
    } else {
      if (room.hostId === socket.id) {
        room.hostId = remainingPlayerIds[0];
        room.players[room.hostId].isHost = true;
        room.chatMessages.push({
          id: `msg-${Date.now()}`,
          senderId: 'system',
          senderName: 'Sistema',
          senderAvatar: '👑',
          text: `${room.players[room.hostId].nickname} es el nuevo anfitrión.`,
          timestamp: Date.now(),
        });
      }
      broadcastRoom(roomCode);
    }
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    uptime: process.uptime(),
  });
});

app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }
  res.json({
    code: room.code,
    playersCount: Object.keys(room.players).length,
    state: room.state,
    gameMode: room.settings.gameMode,
  });
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`> Chantinchantón Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
