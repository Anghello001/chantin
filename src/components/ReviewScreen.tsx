import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  ThumbsUp, 
  ThumbsDown, 
  Users, 
  Gavel, 
  Clock 
} from 'lucide-react';
import { RoomData, Player, Category } from '../types/game';
import { soundFx } from '../utils/audio';
import { wordStartsWithLetter } from '../utils/dictionary';
import { QuickShoutBar } from './QuickShoutBar';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onUpdateScore?: (targetPlayerId: string, categoryId: string, points: number, status: string, notes?: string) => void;
  onCastVote: (targetPlayerId: string, categoryId: string, voteType: 'up' | 'down') => void;
  onApproveReviews?: () => void;
  onSendShout: (text: string, type: string) => void;
}

export const ReviewScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onCastVote,
  onApproveReviews,
  onSendShout,
}) => {
  const categories = room.settings.categories;
  const players: Player[] = Object.values(room.players);
  const currentLetter = room.currentLetter;
  const peerVotes = room.peerVotes || {};

  const totalTime = room.reviewTimerTotal || 20;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => room.reviewTimerRemaining ?? totalTime);
  const autoProceedRef = useRef<boolean>(false);

  // Sync if server pushes a timer tick
  useEffect(() => {
    if (typeof room.reviewTimerRemaining === 'number') {
      setSecondsRemaining(room.reviewTimerRemaining);
    }
  }, [room.reviewTimerRemaining]);

  // Guaranteed active local countdown timer that decrements every 1000ms
  useEffect(() => {
    autoProceedRef.current = false;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!autoProceedRef.current) {
            autoProceedRef.current = true;
            if (onApproveReviews) {
              onApproveReviews();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onApproveReviews]);

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalTime) * 100));
  const isUrgent = secondsRemaining <= 5;

  const handleVote = (targetPlayerId: string, categoryId: string, voteType: 'up' | 'down') => {
    soundFx.playTick();
    onCastVote(targetPlayerId, categoryId, voteType);
  };

  const calculatePlayerRoundSum = (player: Player): number => {
    let sum = 0;
    for (const cat of categories) {
      sum += player.roundScoreDetails?.[cat.id]?.points || 0;
    }
    return sum;
  };

  // Find words that need peer review / community consensus
  const pendingOrUnregisteredWords: {
    player: Player;
    category: Category;
    word: string;
    scoreInfo: { points: number; notes?: string; status: string };
    voteEntry: { upvotes: string[]; downvotes: string[] };
    isApproved: boolean;
  }[] = [];

  for (const p of players) {
    for (const cat of categories) {
      const rawWord = (p.currentRoundAnswers?.[cat.id] || '').trim();
      if (!rawWord || !wordStartsWithLetter(rawWord, currentLetter)) continue;

      const scoreInfo = p.roundScoreDetails?.[cat.id] || { points: 0, status: 'invalid', notes: '' };
      const voteKey = `${p.id}_${cat.id}`;
      const voteEntry = peerVotes[voteKey] || { upvotes: [], downvotes: [] };

      const isUnregisteredOrSubjective = 
        scoreInfo.notes?.includes('no registr') || 
        scoreInfo.notes?.includes('No encontrad') || 
        scoreInfo.notes?.includes('Requiere') || 
        scoreInfo.notes?.includes('Votación') ||
        scoreInfo.notes?.includes('Rechazad') ||
        scoreInfo.notes?.includes('Aprobada por la sala') ||
        cat.validationType === 'subjective' ||
        room.settings.gameMode !== 'classic';

      if (isUnregisteredOrSubjective) {
        pendingOrUnregisteredWords.push({
          player: p,
          category: cat,
          word: rawWord,
          scoreInfo,
          voteEntry,
          isApproved: scoreInfo.points > 0,
        });
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 pb-20">
      {/* Dynamic Review Countdown Banner */}
      <div className={`p-4 rounded-3xl border shadow-xl transition-all ${
        isUrgent 
          ? 'bg-rose-950/80 border-rose-500/80' 
          : 'bg-neutral-900/90 border-neutral-800'
      }`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Tiempo de Votación
              </span>
              <span className={`text-lg font-black font-outfit ${isUrgent ? 'text-rose-300' : 'text-white'}`}>
                {secondsRemaining}s restantes
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block font-outfit">
              Letra: {currentLetter}
            </span>
            <span className="text-[10px] text-neutral-400">
              Ronda {room.currentRound} de {room.settings.totalRounds}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
          <div 
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-neutral-400 text-center mt-2 font-medium">
          ⚖️ Vota las palabras en duda con <strong className="text-emerald-400">👍 Aceptar</strong> o <strong className="text-rose-400">👎 Rechazar</strong>. La ronda continuará automáticamente al llegar a 0s.
        </p>
      </div>

      {/* Stop by player shoutout */}
      {room.stoppedByPlayer && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{room.stoppedByPlayer.avatar}</span>
            <div>
              <span className="text-xs font-bold text-amber-300 font-outfit">
                ¡{room.stoppedByPlayer.nickname} gritó Chantinchantón!
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Revisa las palabras y emite tus votos abajo
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-neutral-950 font-black text-xs font-outfit uppercase shrink-0">
            Stop
          </span>
        </div>
      )}

      {/* TRIBUNAL DE PALABRAS EN DUDA (Like / Dislike) */}
      {pendingOrUnregisteredWords.length > 0 && (
        <div className="bg-neutral-900 border-2 border-amber-500/40 rounded-3xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              <h3 className="font-outfit font-black text-sm text-white uppercase tracking-wide">
                Tribunal Comunitario ({pendingOrUnregisteredWords.length})
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Votación en vivo
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingOrUnregisteredWords.map((item, idx) => {
              const { player, category, word, scoreInfo, voteEntry, isApproved } = item;
              const isMyAnswer = player.id === currentPlayerId;
              const hasMyUp = voteEntry.upvotes.includes(currentPlayerId);
              const hasMyDown = voteEntry.downvotes.includes(currentPlayerId);

              return (
                <div 
                  key={`pending-${player.id}-${category.id}-${idx}`}
                  className={`p-3 rounded-2xl border transition-all ${
                    isApproved
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{player.avatar}</span>
                      <span className="text-xs font-bold text-neutral-200">
                        {player.nickname} {isMyAnswer && <span className="text-amber-400 font-normal">(Tú)</span>}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-400 font-medium border border-neutral-800">
                      {category.icon} {category.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="min-w-0">
                      <span className="text-sm font-black font-outfit uppercase text-white tracking-wide block truncate">
                        "{word}"
                      </span>
                      <span className="text-[10px] text-neutral-400 block truncate">
                        {scoreInfo.notes || 'Palabra sujeta a votación de la sala'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black font-outfit block ${isApproved ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {scoreInfo.points} pts
                      </span>
                      <span className="text-[9px] text-neutral-400">
                        {isApproved ? 'Aprobada' : 'En duda'}
                      </span>
                    </div>
                  </div>

                  {/* Voting Action Buttons (Like 👍 / Dislike 👎) */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800/80">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 font-bold">
                      <Users className="w-3 h-3 text-neutral-500" />
                      <span className="text-emerald-400">{voteEntry.upvotes.length} 👍</span>
                      <span>•</span>
                      <span className="text-rose-400">{voteEntry.downvotes.length} 👎</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isMyAnswer}
                        onClick={() => handleVote(player.id, category.id, 'up')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          hasMyUp
                            ? 'bg-emerald-500 text-neutral-950 shadow-md font-black scale-105'
                            : 'bg-neutral-900 text-neutral-300 hover:text-emerald-400 hover:bg-neutral-850 border border-neutral-800'
                        } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                        title={isMyAnswer ? 'No puedes votar tu propia palabra' : 'Aceptar palabra'}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Aceptar</span>
                      </button>

                      <button
                        type="button"
                        disabled={isMyAnswer}
                        onClick={() => handleVote(player.id, category.id, 'down')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          hasMyDown
                            ? 'bg-rose-600 text-white shadow-md font-black scale-105'
                            : 'bg-neutral-900 text-neutral-300 hover:text-rose-400 hover:bg-neutral-850 border border-neutral-800'
                        } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                        title={isMyAnswer ? 'No puedes votar tu propia palabra' : 'Rechazar palabra'}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAILED PLAYER SCORE CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Respuestas de los Jugadores
          </span>
          <span className="text-[11px] text-amber-400 font-semibold">
            Letra actual: <strong className="text-white text-xs">{currentLetter}</strong>
          </span>
        </div>

        {players.map((player) => {
          const isMe = player.id === currentPlayerId;
          const roundSum = calculatePlayerRoundSum(player);

          return (
            <div
              key={player.id}
              className={`rounded-3xl border p-4 transition-all ${
                isMe
                  ? 'bg-neutral-900/95 border-amber-500/50 shadow-md'
                  : 'bg-neutral-900/70 border-neutral-800'
              }`}
            >
              {/* Player Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xl shrink-0">
                    {player.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-outfit font-black text-sm text-white truncate">
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                          Tú
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      Total acumulado: {player.score} pts
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black font-outfit text-amber-400">
                    +{roundSum} pts
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Esta ronda
                  </span>
                </div>
              </div>

              {/* Answers Grid */}
              <div className="pt-3 space-y-2">
                {categories.map((cat) => {
                  const answer = player.currentRoundAnswers?.[cat.id] || '';
                  const scoreDetail = player.roundScoreDetails?.[cat.id] || {
                    points: 0,
                    status: 'invalid',
                    verified: false,
                    notes: '',
                  };

                  const isNonEmpty = Boolean(answer && answer.trim());
                  const pts = scoreDetail.points || 0;

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 min-w-0">
                          <span>{cat.icon}</span>
                          <span className="font-semibold truncate">{cat.name}:</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-black font-outfit px-2 py-0.5 rounded-lg ${
                              pts === 100
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : pts === 50
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : pts > 0
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                            }`}
                          >
                            {pts} pts
                          </span>
                        </div>
                      </div>

                      {/* Word text */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            isNonEmpty ? 'text-white' : 'text-neutral-600 italic'
                          }`}
                        >
                          {isNonEmpty ? answer : '— Sin respuesta —'}
                        </span>
                        {scoreDetail.notes && (
                          <span className="text-[10px] text-neutral-400 truncate max-w-[50%] text-right">
                            {scoreDetail.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>
    </div>
  );
};
