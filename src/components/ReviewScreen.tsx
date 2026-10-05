import React, { useState, useEffect, useRef } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Users, 
  Gavel, 
  Clock,
  Sparkles
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

  const totalTime = room.reviewTimerTotal || room.settings?.votingDuration || 20;
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

  // Collect all submitted answers for this round
  const roundAnswersList: {
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
      if (!rawWord) continue;

      const scoreInfo = p.roundScoreDetails?.[cat.id] || { points: 0, status: 'invalid', notes: '' };
      const voteKey = `${p.id}_${cat.id}`;
      const voteEntry = peerVotes[voteKey] || { upvotes: [], downvotes: [] };

      roundAnswersList.push({
        player: p,
        category: cat,
        word: rawWord,
        scoreInfo,
        voteEntry,
        isApproved: scoreInfo.points > 0,
      });
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
          ⚖️ Vota las palabras con <strong className="text-emerald-400">👍 Aceptar</strong> o <strong className="text-rose-400">👎 Rechazar</strong>. La ronda continuará automáticamente al llegar a 0s.
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
                Emite tus votos antes de que finalice el tiempo
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-neutral-950 font-black text-xs font-outfit uppercase shrink-0">
            Stop
          </span>
        </div>
      )}

      {/* TRIBUNAL & VOTACIÓN DE PALABRAS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-400" />
            <h3 className="font-outfit font-black text-sm text-white uppercase tracking-wide">
              Votación de Respuestas ({roundAnswersList.length})
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
            En vivo
          </span>
        </div>

        {roundAnswersList.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs font-medium">
            No se enviaron respuestas en esta ronda.
          </div>
        ) : (
          <div className="space-y-2.5">
            {roundAnswersList.map((item, idx) => {
              const { player, category, word, scoreInfo, voteEntry, isApproved } = item;
              const isMyAnswer = player.id === currentPlayerId;
              const hasMyUp = voteEntry.upvotes.includes(currentPlayerId);
              const hasMyDown = voteEntry.downvotes.includes(currentPlayerId);

              return (
                <div 
                  key={`answer-${player.id}-${category.id}-${idx}`}
                  className={`p-3 rounded-2xl border transition-all ${
                    isApproved
                      ? 'bg-emerald-950/30 border-emerald-500/40'
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
                      {scoreInfo.notes && (
                        <span className="text-[10px] text-neutral-400 block truncate">
                          {scoreInfo.notes}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black font-outfit block ${isApproved ? 'text-emerald-400' : 'text-neutral-500'}`}>
                        {scoreInfo.points} pts
                      </span>
                      <span className="text-[9px] text-neutral-400">
                        {isApproved ? 'Válida' : '0 pts'}
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
        )}
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>
    </div>
  );
};
