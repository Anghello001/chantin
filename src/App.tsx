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
import { ServerConfigModal } from './components/ServerConfigModal';
import { soundFx } from './utils/audio';
import { calculateAutomaticScores } from './utils/scoreCalculator';

const DEFAULT_RENDER_BACKEND = 'https://chantin.onrender.com';

export default function App() {
  const [backendUrl, setBackendUrl] = useState<string>(() => {
    return (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_SOCKET_URL ||
      localStorage.getItem('chantin_backend_url') ||
      DEFAULT_RENDER_BACKEND
    );
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState<boolean>(false);
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
  const initSocket = (targetUrl: string) => {
    if (socket) {
      socket.disconnect();
    }

    const socketClient = targetUrl 
      ? io(targetUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 15,
          timeout: 10000,
        })
      : io({
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 15,
          timeout: 10000,
        });

    setSocket(socketClient);

    socketClient.on('connect', () => {
      setIsConnected(true);
      setPlayerId(socketClient.id || '');
    });

    socketClient.on('disconnect', () => {
      setIsConnected(false);
    });

    socketClient.on('connect_error', () => {
      setIsConnected(false);
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

    socketClient.on('review_timer_tick', ({ remaining, total }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviewTimerRemaining: remaining,
          reviewTimerTotal: total,
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
      setTimeout(() => {
        setActiveShouts((prev) => prev.filter((m) => m.id !== msg.id));
      }, 1400);
    });

    socketClient.on('receive_chat_message', (msg: ChatMessage) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), msg],
        };
      });
    });
  };

  useEffect(() => {
    // Check URL params for room code (e.g. ?room=ABCD)
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setInitialUrlRoomCode(roomFromUrl.toUpperCase());
    }

    initSocket(backendUrl);

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleSaveBackendUrl = (newUrl: string) => {
    localStorage.setItem('chantin_backend_url', newUrl);
    setBackendUrl(newUrl);
    initSocket(newUrl);
  };

  const handleReconnect = () => {
    initSocket(backendUrl);
  };

  // Socket Actions
  const handleCreateRoom = (
    nickname: string, 
    avatar: string, 
    settings: Partial<GameSettings>
  ) => {
    if (!socket || !socket.connected) {
      setIsServerConfigOpen(true);
      return;
    }
    socket.emit('create_room', { nickname, avatar, settings });
  };

  const handleJoinRoom = (roomCode: string, nickname: string, avatar: string) => {
    if (!socket || !socket.connected) {
      setIsServerConfigOpen(true);
      return;
    }
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

      setRoom({
        ...room,
        players: {
          ...room.players,
          [targetPlayerId]: {
            ...targetPlayer,
            roundScoreDetails: {
              ...(targetPlayer.roundScoreDetails || {}),
              [categoryId]: {
                points: Number(points) || 0,
                status: status as any,
                verified: true,
                notes,
              },
            },
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
      const player = room.players[playerId];
      let roundTotal = 0;
      for (const d of Object.values(player?.roundScoreDetails || {})) {
        roundTotal += d.points || 0;
      }

      const newScore = (player?.score || 0) + roundTotal;
      const roundAnswers = { [playerId]: { ...(player?.currentRoundAnswers || {}) } };
      const roundScores = { [playerId]: roundTotal };

      setRoom({
        ...room,
        state: 'round_results',
        players: {
          ...room.players,
          [playerId]: {
            ...player,
            score: newScore,
            totalRoundPoints: roundTotal,
          },
        },
        roundHistory: [
          ...room.roundHistory,
          {
            round: room.currentRound,
            letter: room.currentLetter,
            answers: roundAnswers,
            scores: roundScores,
            screamedBy: room.stoppedByPlayer?.nickname,
          },
        ],
      });
      return;
    }

    if (!socket || !room) return;
    socket.emit('approve_all_reviews', { roomCode: room.code });
  };

  const handleNextRound = () => {
    if (isSoloPractice && room) {
      if (room.currentRound >= room.settings.totalRounds) {
        setRoom({ ...room, state: 'game_over' });
      } else {
        startSoloRound();
      }
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
        peerVotes: {},
        stoppedByPlayer: undefined,
        players: {
          [playerId]: {
            ...room.players[playerId],
            score: 0,
            totalRoundPoints: 0,
            currentRoundAnswers: {},
            roundScoreDetails: {},
            screamedChantin: false,
          },
        },
      });
      return;
    }

    if (!socket || !room) return;
    socket.emit('restart_game', { roomCode: room.code });
  };

  const handleSendShout = (text: string, type: string) => {
    if (isSoloPractice) {
      const msg: ChatMessage = {
        id: `shout-${Date.now()}-${Math.random()}`,
        senderId: playerId,
        senderName: room?.players[playerId]?.nickname || 'Tú',
        senderAvatar: room?.players[playerId]?.avatar || '🦙',
        text,
        isShout: true,
        shoutType: type as any,
        timestamp: Date.now(),
      };
      setActiveShouts((prev) => [...prev, msg]);
      soundFx.playTick();
      setTimeout(() => {
        setActiveShouts((prev) => prev.filter((m) => m.id !== msg.id));
      }, 1400);
      return;
    }

    if (!socket || !room) return;
    socket.emit('send_reaction', {
      roomCode: room.code,
      shoutType: type,
      text,
    });
  };

  const handleSendChatMessage = (text: string) => {
    if (isSoloPractice && room) {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: playerId,
        senderName: room.players[playerId]?.nickname || 'Tú',
        senderAvatar: room.players[playerId]?.avatar || '🦙',
        text,
        timestamp: Date.now(),
      };
      setRoom({
        ...room,
        chatMessages: [...room.chatMessages, msg],
      });
      return;
    }

    if (!socket || !room) return;
    socket.emit('send_chat_message', {
      roomCode: room.code,
      text,
    });
  };

  const handleLeaveRoom = () => {
    if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    setIsSoloPractice(false);
    setRoom(null);
    if (socket && room && !isSoloPractice) {
      socket.disconnect();
      initSocket(backendUrl);
    }
  };

  // Solo Practice Local Logic
  const handleStartSoloPractice = (nickname: string, avatar: string, mode: GameMode) => {
    const soloId = 'solo-player-1';
    setPlayerId(soloId);
    setIsSoloPractice(true);

    const soloPlayer: Player = {
      id: soloId,
      nickname: nickname || 'Modo Solitario',
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

    const preset = ALL_PRESET_MODES[mode] || ALL_PRESET_MODES.classic;

    const initialRoom: RoomData = {
      code: 'SOLO',
      hostId: soloId,
      state: 'lobby',
      currentRound: 0,
      currentLetter: '',
      usedLetters: [],
      settings: {
        roundDuration: 60,
        gameMode: mode,
        totalRounds: 5,
        categories: [...preset.categories],
        autoScoreAssistant: true,
        gracePeriodSeconds: 3,
      },
      players: { [soloId]: soloPlayer },
      peerVotes: {},
      timerRemaining: 60,
      timerTotal: 60,
      roundHistory: [],
      chatMessages: [
        {
          id: 'msg-solo-1',
          senderId: 'system',
          senderName: 'Sistema',
          senderAvatar: '🎯',
          text: '¡Modo Práctica Solitario! Completa las casillas y grita ¡Chantinchantón!',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    setRoom(initialRoom);
  };

  const startSoloRound = () => {
    if (!room) return;
    if (soloTimerRef.current) clearInterval(soloTimerRef.current);

    const availableLetters = ALPHABET.filter((l) => !room.usedLetters.includes(l));
    const nextLetter =
      availableLetters.length > 0
        ? availableLetters[Math.floor(Math.random() * availableLetters.length)]
        : ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

    const updatedUsed = [...room.usedLetters, nextLetter];

    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        state: 'countdown',
        currentRound: prev.currentRound + 1,
        currentLetter: nextLetter,
        usedLetters: updatedUsed,
        stoppedByPlayer: undefined,
        peerVotes: {},
        timerRemaining: prev.settings.roundDuration,
        timerTotal: prev.settings.roundDuration,
        players: {
          [playerId]: {
            ...prev.players[playerId],
            currentRoundAnswers: {},
            roundScoreDetails: {},
            screamedChantin: false,
            totalRoundPoints: 0,
          },
        },
      };
    });

    setTimeout(() => {
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, state: 'playing' };
      });

      soloTimerRef.current = setInterval(() => {
        setRoom((prev) => {
          if (!prev || prev.state !== 'playing') {
            if (soloTimerRef.current) clearInterval(soloTimerRef.current);
            return prev;
          }

          if (prev.timerRemaining > 0) {
            const nextRemaining = prev.timerRemaining - 1;
            if (nextRemaining <= 0) {
              if (soloTimerRef.current) clearInterval(soloTimerRef.current);
              freezeSoloGame(prev.players[playerId]?.currentRoundAnswers || {});
            }
            return { ...prev, timerRemaining: nextRemaining };
          }
          return prev;
        });
      }, 1000);
    }, 3200);
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
          reviewTimerRemaining: 20,
          reviewTimerTotal: 20,
          players: {
            ...prev.players,
            [playerId]: {
              ...prev.players[playerId],
              roundScoreDetails: autoScores[playerId] || {},
            },
          },
        };
      });

      // Start solo review timer countdown
      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
      soloTimerRef.current = setInterval(() => {
        setRoom((prev) => {
          if (!prev || prev.state !== 'reviewing') {
            if (soloTimerRef.current) clearInterval(soloTimerRef.current);
            return prev;
          }
          const currentRemaining = prev.reviewTimerRemaining ?? 20;
          if (currentRemaining > 1) {
            return {
              ...prev,
              reviewTimerRemaining: currentRemaining - 1,
            };
          } else {
            if (soloTimerRef.current) clearInterval(soloTimerRef.current);
            // Auto finalize solo round
            const player = prev.players[playerId];
            let roundTotal = 0;
            for (const d of Object.values(player?.roundScoreDetails || {})) {
              roundTotal += d.points || 0;
            }
            const newScore = (player?.score || 0) + roundTotal;
            const roundAnswers = { [playerId]: { ...(player?.currentRoundAnswers || {}) } };
            const roundScores = { [playerId]: roundTotal };

            return {
              ...prev,
              state: 'round_results',
              players: {
                ...prev.players,
                [playerId]: {
                  ...player,
                  score: newScore,
                  totalRoundPoints: roundTotal,
                },
              },
              roundHistory: [
                ...prev.roundHistory,
                {
                  round: prev.currentRound,
                  letter: prev.currentLetter,
                  answers: roundAnswers,
                  scores: roundScores,
                  screamedBy: prev.stoppedByPlayer?.nickname,
                },
              ],
            };
          }
        });
      }, 1000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Toast Shouts Overlay */}
      <ShoutToastOverlay messages={activeShouts} />

      {/* Global Header */}
      <Header
        roomCode={room?.code}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundFx.setMuted(next);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        playersCount={room ? Object.keys(room.players).length : undefined}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
        isConnected={isConnected}
        onOpenServerConfig={() => setIsServerConfigOpen(true)}
      />

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        currentBackendUrl={backendUrl}
        isConnected={isConnected}
        onSaveBackendUrl={handleSaveBackendUrl}
        onReconnect={handleReconnect}
      />

      {/* How to play modal */}
      <HowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {!room ? (
          <LobbyScreen
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartSoloPractice={handleStartSoloPractice}
            initialRoomCode={initialUrlRoomCode}
            isConnected={isConnected}
            onOpenServerConfig={() => setIsServerConfigOpen(true)}
          />
        ) : room.state === 'lobby' ? (
          <WaitingRoomScreen
            room={room}
            currentPlayerId={playerId}
            onStartGame={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onSendShout={handleSendShout}
            onSendChat={handleSendChatMessage}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : room.state === 'playing' ? (
          <GameBoardScreen
            room={room}
            currentPlayerId={playerId}
            onSyncAnswers={handleSyncAnswers}
            onScreamChantinchanton={handleScreamChantinchanton}
            onSendShout={handleSendShout}
          />
        ) : room.state === 'reviewing' ? (
          <ReviewScreen
            room={room}
            currentPlayerId={playerId}
            onUpdateScore={handleUpdateScore}
            onCastVote={handleCastVote}
            onApproveReviews={handleApproveReviews}
            onSendShout={handleSendShout}
          />
        ) : room.state === 'round_results' ? (
          <RoundResultsScreen
            room={room}
            currentPlayerId={playerId}
            onNextRound={handleNextRound}
            onFinishGame={handleFinishGame}
            onSendShout={handleSendShout}
          />
        ) : room.state === 'game_over' ? (
          <GameOverScreen
            room={room}
            currentPlayerId={playerId}
            onRestartGame={handleRestartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : null}

        {/* Global Countdown Suspense Overlay */}
        {room && room.state === 'countdown' && (
          <CountdownModal
            targetLetter={room.currentLetter}
            currentRound={room.currentRound}
            totalRounds={room.settings.totalRounds}
          />
        )}

        {/* Global Freeze / Stopped Overlay */}
        {room && room.state === 'freeze_countdown' && (
          <FreezeOverlay
            stoppedBy={room.stoppedByPlayer}
            countdownSeconds={room.freezeCountdownRemaining || 3}
          />
        )}
      </main>
    </div>
  );
}
