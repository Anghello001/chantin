import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  RoomData, 
  GameSettings, 
  GameMode, 
  ChatMessage, 
  Player 
} from './types/game';
import { ALL_PRESET_MODES, CLASSIC_CATEGORIES, ALPHABET } from './constants/gameCategories';
import { Header } from './components/Header';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LobbyScreen } from './components/LobbyScreen';
import { WaitingRoomScreen } from './components/WaitingRoomScreen';
import { CountdownModal } from './components/CountdownModal';
import { GameBoardScreen } from './components/GameBoardScreen';
import { FreezeOverlay } from './components/FreezeOverlay';
import { ReviewScreen } from './components/ReviewScreen';
import { RoundResultsScreen } from './components/RoundResultsScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { ShoutToastOverlay } from './components/ShoutToast';
import { soundFx } from './utils/audio';
import { calculateAutomaticScores } from './utils/scoreCalculator';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [activeShouts, setActiveShouts] = useState<ChatMessage[]>([]);
  const [isSoloPractice, setIsSoloPractice] = useState<boolean>(false);
  const [initialUrlRoomCode, setInitialUrlRoomCode] = useState<string>('');

  // Solo practice local timer ref
  const soloTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    // Check URL params for room code (e.g. ?room=ABCD)
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInitialUrlRoomCode(roomFromUrl.toUpperCase());
    }

    const socketClient = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    setSocket(socketClient);

    socketClient.on('connect', () => {
      setPlayerId(socketClient.id || '');
    });

    socketClient.on('room_created', ({ roomCode, room: newRoom }) => {
      setRoom(newRoom);
      setIsSoloPractice(false);
    });

    socketClient.on('joined_room_success', ({ roomCode, room: joinedRoom }) => {
      setRoom(joinedRoom);
      setIsSoloPractice(false);
    });

    socketClient.on('join_error', ({ message }) => {
      alert(message || 'Error al unirse a la sala.');
    });

    socketClient.on('room_state_update', (updatedRoom: RoomData) => {
      setRoom(updatedRoom);
    });

    socketClient.on('timer_tick', ({ remaining, total }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timerRemaining: remaining,
          timerTotal: total,
        };
      });
    });

    socketClient.on('game_frozen', ({ stoppedBy, freezeSeconds }) => {
      soundFx.playChantinchantonBuzzer();
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: 'freeze_countdown',
          stoppedByPlayer: stoppedBy,
          freezeCountdownRemaining: freezeSeconds,
        };
      });
    });

    socketClient.on('freeze_tick', ({ remaining }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          freezeCountdownRemaining: remaining,
        };
      });
    });

    socketClient.on('trigger_start_round', ({ roomCode }) => {
      socketClient.emit('start_round', { roomCode });
    });

    socketClient.on('receive_reaction', (msg: ChatMessage) => {
      setActiveShouts((prev) => [...prev, msg]);
      soundFx.playTick();
    });

    socketClient.on('receive_chat_message', (msg: ChatMessage) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, msg],
        };
      });
    });

    return () => {
      socketClient.disconnect();
    };
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
  };

  // Socket action dispatchers
  const handleCreateRoom = (nickname: string, avatar: string, settings: Partial<GameSettings>) => {
    if (!socket) return;
    socket.emit('create_room', { nickname, avatar, settings });
  };

  const handleJoinRoom = (roomCode: string, nickname: string, avatar: string) => {
    if (!socket) return;
    socket.emit('join_room', { roomCode, nickname, avatar });
  };

  const handleUpdateSettings = (settings: Partial<GameSettings>) => {
    if (isSoloPractice && room) {
      setRoom({
        ...room,
        settings: { ...room.settings, ...settings },
      });
      return;
    }
    if (!socket || !room) return;
    socket.emit('update_settings', { roomCode: room.code, settings });
  };

  const handleStartGame = () => {
    if (isSoloPractice && room) {
      startSoloRound();
      return;
    }
    if (!socket || !room) return;
    socket.emit('start_round', { roomCode: room.code });
  };

  const handleSyncAnswers = (answers: Record<string, string>) => {
    if (isSoloPractice && room) {
      setRoom({
        ...room,
        players: {
          ...room.players,
          [playerId]: {
            ...room.players[playerId],
            currentRoundAnswers: answers,
          },
        },
      });
      return;
    }
    if (!socket || !room) return;
    socket.emit('sync_player_answers', { roomCode: room.code, answers });
  };

  const handleScreamChantinchanton = (answers: Record<string, string>) => {
    if (isSoloPractice && room) {
      freezeSoloGame(answers);
      return;
    }
    if (!socket || !room) return;
    socket.emit('chantinchanton', { roomCode: room.code, answers });
  };

  const handleCastVote = (targetPlayerId: string, categoryId: string, voteType: 'up' | 'down') => {
    if (isSoloPractice && room) {
      const voteKey = `${targetPlayerId}_${categoryId}`;
      const currentEntry = room.peerVotes?.[voteKey] || { upvotes: [], downvotes: [] };
      const hadUp = currentEntry.upvotes.includes('solo-voter');
      const hadDown = currentEntry.downvotes.includes('solo-voter');

      const upvotes = currentEntry.upvotes.filter((id) => id !== 'solo-voter');
      const downvotes = currentEntry.downvotes.filter((id) => id !== 'solo-voter');

      if (voteType === 'up' && !hadUp) upvotes.push('solo-voter');
      if (voteType === 'down' && !hadDown) downvotes.push('solo-voter');

      const updatedPeerVotes = {
        ...(room.peerVotes || {}),
        [voteKey]: { upvotes, downvotes },
      };

      const answersByPlayer: Record<string, Record<string, string>> = {
        [playerId]: room.players[playerId]?.currentRoundAnswers || {},
      };
      const autoScores = calculateAutomaticScores(
        answersByPlayer,
        room.currentLetter,
        room.settings.categories,
        room.settings.gameMode,
        updatedPeerVotes
      );

      setRoom({
        ...room,
        peerVotes: updatedPeerVotes,
        players: {
          ...room.players,
          [playerId]: {
            ...room.players[playerId],
            roundScoreDetails: autoScores[playerId] || {},
          },
        },
      });
      return;
    }

    if (!socket || !room) return;
    socket.emit('vote_answer', {
      roomCode: room.code,
      targetPlayerId,
      categoryId,
      vote: voteType === 'up' ? 'accept' : 'reject',
    });
  };

  const handleUpdateScore = (
    targetPlayerId: string,
    categoryId: string,
    points: number,
    status: string,
    notes?: string
  ) => {
    if (isSoloPractice && room) {
      const targetPlayer = room.players[targetPlayerId];
      if (!targetPlayer) return;
      const updatedDetails = {
        ...targetPlayer.roundScoreDetails,
        [categoryId]: {
          points,
          status: status as 'valid_unique' | 'valid_repeated' | 'invalid' | 'bonus' | 'custom',
          verified: true,
          notes,
        },
      };
      setRoom({
        ...room,
        players: {
          ...room.players,
          [targetPlayerId]: {
            ...targetPlayer,
            roundScoreDetails: updatedDetails,
          },
        },
      });
      return;
    }
    if (!socket || !room) return;
    socket.emit('update_review_points', {
      roomCode: room.code,
      targetPlayerId,
      categoryId,
      points,
      status,
      notes,
    });
  };

  const handleApproveReviews = () => {
    if (isSoloPractice && room) {
      approveSoloReviews();
      return;
    }
    if (!socket || !room) return;
    socket.emit('approve_all_reviews', { roomCode: room.code });
  };

  const handleNextRound = () => {
    if (isSoloPractice && room) {
      startSoloRound();
      return;
    }
    if (!socket || !room) return;
    socket.emit('next_round', { roomCode: room.code });
  };

  const handleFinishGame = () => {
    if (isSoloPractice && room) {
      setRoom({ ...room, state: 'game_over' });
      return;
    }
    if (!socket || !room) return;
    socket.emit('finish_game', { roomCode: room.code });
  };

  const handleRestartGame = () => {
    if (isSoloPractice && room) {
      setRoom({
        ...room,
        state: 'lobby',
        currentRound: 0,
        currentLetter: '',
        usedLetters: [],
        roundHistory: [],
        players: {
          [playerId]: {
            ...room.players[playerId],
            score: 0,
            totalRoundPoints: 0,
            currentRoundAnswers: {},
            roundScoreDetails: {},
          },
        },
      });
      return;
    }
    if (!socket || !room) return;
    socket.emit('restart_game', { roomCode: room.code });
  };

  const handleSendShout = (text: string, type: string) => {
    const currentNick = room?.players[playerId]?.nickname || 'Jugador';
    const currentAvatar = room?.players[playerId]?.avatar || '📢';
    const shoutMsg: ChatMessage = {
      id: `shout-${Date.now()}`,
      senderId: playerId || 'solo',
      senderName: currentNick,
      senderAvatar: currentAvatar,
      text,
      isShout: true,
      timestamp: Date.now(),
    };
    setActiveShouts((prev) => [...prev, shoutMsg]);
    soundFx.playTick();

    if (!isSoloPractice && socket && room) {
      socket.emit('send_reaction', { roomCode: room.code, shoutType: type, text });
    }
  };

  const handleSendChat = (text: string) => {
    if (!socket || !room || isSoloPractice) return;
    socket.emit('send_chat_message', { roomCode: room.code, text });
  };

  const handleLeaveRoom = () => {
    if (soloTimerRef.current) {
      clearInterval(soloTimerRef.current);
    }
    setRoom(null);
    setIsSoloPractice(false);
  };

  // Solo Practice Mode Handlers
  const handleStartSoloPractice = (nickname: string, avatar: string, mode: GameMode) => {
    const soloId = 'solo-player';
    setPlayerId(soloId);
    setIsSoloPractice(true);

    const soloRoom: RoomData = {
      code: 'SOLO',
      hostId: soloId,
      state: 'lobby',
      currentRound: 0,
      currentLetter: '',
      usedLetters: [],
      settings: {
        roundDuration: 60,
        gameMode: mode,
        totalRounds: 3,
        categories: ALL_PRESET_MODES[mode].categories,
        autoScoreAssistant: true,
        gracePeriodSeconds: 3,
      },
      players: {
        [soloId]: {
          id: soloId,
          nickname,
          avatar,
          score: 0,
          totalRoundPoints: 0,
          isHost: true,
          isReady: true,
          currentRoundAnswers: {},
          roundScoreDetails: {},
          screamedChantin: false,
          connected: true,
        },
      },
      peerVotes: {},
      timerRemaining: 60,
      timerTotal: 60,
      roundHistory: [],
      chatMessages: [
        {
          id: 'solo-welcome',
          senderId: 'system',
          senderName: 'Sistema',
          senderAvatar: '🎯',
          text: 'Modo Práctica Activado. ¡Entrena tu velocidad!',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    setRoom(soloRoom);
  };

  const startSoloRound = () => {
    if (!room) return;
    const available = ALPHABET.filter((l) => !room.usedLetters.includes(l));
    const chosenLetter = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 'C';

    const nextRoundNumber = room.currentRound + 1;
    const roundDuration = room.settings.roundDuration;

    setRoom({
      ...room,
      state: 'countdown',
      currentRound: nextRoundNumber,
      currentLetter: chosenLetter,
      usedLetters: [...room.usedLetters, chosenLetter],
      timerRemaining: roundDuration,
      timerTotal: roundDuration,
      stoppedByPlayer: undefined,
      players: {
        [playerId]: {
          ...room.players[playerId],
          currentRoundAnswers: {},
          roundScoreDetails: {},
          screamedChantin: false,
        },
      },
    });

    setTimeout(() => {
      setRoom((prev) => (prev ? { ...prev, state: 'playing' } : null));

      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
      soloTimerRef.current = setInterval(() => {
        setRoom((prev) => {
          if (!prev || prev.state !== 'playing') return prev;
          if (prev.timerRemaining <= 1) {
            if (soloTimerRef.current) clearInterval(soloTimerRef.current);
            freezeSoloGame(prev.players[playerId]?.currentRoundAnswers || {});
            return { ...prev, timerRemaining: 0 };
          }
          return { ...prev, timerRemaining: prev.timerRemaining - 1 };
        });
      }, 1000);
    }, 2800);
  };

  const freezeSoloGame = (answers: Record<string, string>) => {
    if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    soundFx.playChantinchantonBuzzer();

    setRoom((prev) => {
      if (!prev) return prev;
      const updatedPlayer: Player = {
        ...prev.players[playerId],
        currentRoundAnswers: answers,
        screamedChantin: true,
      };

      return {
        ...prev,
        state: 'freeze_countdown',
        stoppedByPlayer: {
          id: playerId,
          nickname: updatedPlayer.nickname,
          avatar: updatedPlayer.avatar,
        },
        freezeCountdownRemaining: 3,
        players: {
          ...prev.players,
          [playerId]: updatedPlayer,
        },
      };
    });

    // Auto move to review
    setTimeout(() => {
      setRoom((prev) => {
        if (!prev) return prev;
        const answersByPlayer: Record<string, Record<string, string>> = {
          [playerId]: prev.players[playerId]?.currentRoundAnswers || {},
        };
        const autoScores = calculateAutomaticScores(
          answersByPlayer,
          prev.currentLetter,
          prev.settings.categories,
          prev.settings.gameMode,
          prev.peerVotes || {}
        );

        return {
          ...prev,
          state: 'reviewing',
          players: {
            ...prev.players,
            [playerId]: {
              ...prev.players[playerId],
              roundScoreDetails: autoScores[playerId] || {},
            },
          },
        };
      });
    }, 3000);
  };

  const approveSoloReviews = () => {
    setRoom((prev) => {
      if (!prev) return prev;
      const player = prev.players[playerId];
      let roundTotal = 0;
      for (const d of Object.values(player.roundScoreDetails || {})) {
        roundTotal += d.points || 0;
      }

      const updatedScore = player.score + roundTotal;
      const updatedPlayer: Player = {
        ...player,
        score: updatedScore,
        totalRoundPoints: roundTotal,
      };

      const historyItem = {
        round: prev.currentRound,
        letter: prev.currentLetter,
        answers: { [playerId]: { ...player.currentRoundAnswers } },
        scores: { [playerId]: roundTotal },
        screamedBy: prev.stoppedByPlayer?.nickname,
      };

      return {
        ...prev,
        state: 'round_results',
        roundHistory: [...prev.roundHistory, historyItem],
        players: {
          ...prev.players,
          [playerId]: updatedPlayer,
        },
      };
    });
  };

  const playersCount = room ? Object.keys(room.players).length : undefined;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Navigation */}
      <Header
        roomCode={room?.code}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHelp={() => setIsHelpOpen(true)}
        playersCount={playersCount}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
      />

      {/* Floating Shouts Overlay */}
      <ShoutToastOverlay messages={activeShouts} />

      {/* Rules / How To Play Modal */}
      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Letter Reveal Suspense Modal */}
      {room?.state === 'countdown' && (
        <CountdownModal
          currentRound={room.currentRound}
          totalRounds={room.settings.totalRounds}
          targetLetter={room.currentLetter}
        />
      )}

      {/* Freeze Grace Countdown Overlay */}
      {room?.state === 'freeze_countdown' && (
        <FreezeOverlay
          stoppedBy={room.stoppedByPlayer}
          countdownSeconds={room.freezeCountdownRemaining || 3}
        />
      )}

      {/* Main Screen Router (Vertical Mobile Container) */}
      <main className="flex-1 w-full max-w-md mx-auto flex flex-col">
        {!room && (
          <LobbyScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartSoloPractice={handleStartSoloPractice}
            initialRoomCode={initialUrlRoomCode}
          />
        )}

        {room && room.state === 'lobby' && (
          <WaitingRoomScreen
            room={room}
            currentPlayerId={playerId}
            onStartGame={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onSendShout={handleSendShout}
            onSendChat={handleSendChat}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {room && (room.state === 'playing' || room.state === 'countdown' || room.state === 'freeze_countdown') && (
          <GameBoardScreen
            room={room}
            currentPlayerId={playerId}
            onSyncAnswers={handleSyncAnswers}
            onScreamChantinchanton={handleScreamChantinchanton}
            onSendShout={handleSendShout}
          />
        )}

        {room && room.state === 'reviewing' && (
          <ReviewScreen
            room={room}
            currentPlayerId={playerId}
            onUpdateScore={handleUpdateScore}
            onCastVote={handleCastVote}
            onApproveReviews={handleApproveReviews}
            onSendShout={handleSendShout}
          />
        )}

        {room && room.state === 'round_results' && (
          <RoundResultsScreen
            room={room}
            currentPlayerId={playerId}
            onNextRound={handleNextRound}
            onFinishGame={handleFinishGame}
            onSendShout={handleSendShout}
          />
        )}

        {room && room.state === 'game_over' && (
          <GameOverScreen
            room={room}
            currentPlayerId={playerId}
            onRestartGame={handleRestartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900/80 py-3 px-4 text-center text-[10px] text-neutral-400 max-w-md mx-auto w-full">
        <p>
          🇪🇨 Chantinchantón • Diccionario RAM en vivo • Volátil sin Base de Datos
        </p>
      </footer>
    </div>
  );
}
