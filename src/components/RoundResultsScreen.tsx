import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { RoomData, Player } from '../types/game';
import { soundFx } from '../utils/audio';
import { QuickShoutBar } from './QuickShoutBar';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onNextRound: () => void;
  onFinishGame: () => void;
  onSendShout: (text: string, type: string) => void;
}

export const RoundResultsScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onNextRound,
  onFinishGame,
  onSendShout,
}) => {
  const isHost = room.hostId === currentPlayerId;
  const isFinalRound = room.currentRound >= room.settings.totalRounds;
  
  const rankedPlayers: Player[] = Object.values(room.players).sort((a, b) => b.score - a.score);
  const roundWinner = Object.values(room.players).sort((a, b) => b.totalRoundPoints - a.totalRoundPoints)[0];

  useEffect(() => {
    soundFx.playCelebration();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 pb-20">
      {/* Round Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1">
          <Sparkles className="w-3 h-3" />
          <span>Ronda {room.currentRound} de {room.settings.totalRounds}</span>
        </div>

        <h1 className="text-2xl font-black font-outfit text-white">
          Letra <span className="text-amber-400">"{room.currentLetter}"</span>
        </h1>

        {roundWinner && (
          <p className="text-xs text-neutral-300">
            Líder de ronda: <strong className="text-amber-400">{roundWinner.avatar} {roundWinner.nickname} (+{roundWinner.totalRoundPoints} pts)</strong>
          </p>
        )}
      </div>

      {/* Leaderboard Stack */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-300 font-outfit">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Tabla General de Posiciones
          </span>
        </div>

        <div className="space-y-1.5">
          {rankedPlayers.map((player, idx) => {
            const isFirst = idx === 0;
            const isMe = player.id === currentPlayerId;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                  isFirst
                    ? 'bg-neutral-950 border-amber-500/50'
                    : isMe
                    ? 'bg-neutral-950 border-neutral-700'
                    : 'bg-neutral-950/60 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-outfit font-black text-xs text-neutral-400 w-4 text-center">
                    {idx + 1}
                  </span>

                  <span className="text-xl shrink-0">{player.avatar}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate font-outfit">
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[9px] bg-amber-500 text-neutral-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                          Tú
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      +{player.totalRoundPoints} pts en ronda
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-outfit font-black text-base text-amber-400">
                    {player.score}
                  </span>
                  <span className="text-[9px] text-neutral-400 block font-medium">
                    pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-40">
        {isHost ? (
          isFinalRound ? (
            <button
              onClick={onFinishGame}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-sm uppercase tracking-wider transition active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Ver Resultados Finales</span>
            </button>
          ) : (
            <button
              onClick={onNextRound}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-sm uppercase tracking-wider transition active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
            >
              <span>Siguiente Ronda ({room.currentRound + 1}/{room.settings.totalRounds})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        ) : (
          <div className="py-3 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-semibold text-center">
            Esperando al anfitrión para avanzar...
          </div>
        )}
      </div>
    </div>
  );
};
