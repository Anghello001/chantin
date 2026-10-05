import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer as TimerIcon, 
  CheckCircle2, 
  AlertCircle, 
  BookCheck,
  Zap,
  Users
} from 'lucide-react';
import { RoomData, Player, Category } from '../types/game';
import { soundFx } from '../utils/audio';
import { wordStartsWithLetter, validarPalabraPorCategoria } from '../utils/dictionary';
import { QuickShoutBar } from './QuickShoutBar';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onSyncAnswers: (answers: Record<string, string>) => void;
  onScreamChantinchanton: (answers: Record<string, string>) => void;
  onSendShout: (text: string, type: string) => void;
}

export const GameBoardScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onSyncAnswers,
  onScreamChantinchanton,
  onSendShout,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    return room.players[currentPlayerId]?.currentRoundAnswers || {};
  });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const categories = room.settings.categories;
  const currentLetter = room.currentLetter;
  const timerRemaining = room.timerRemaining;
  const timerTotal = room.timerTotal || room.settings.roundDuration;
  const isCreativeMode = room.settings.gameMode !== 'classic';

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [currentLetter]);

  useEffect(() => {
    if (timerRemaining <= 10 && timerRemaining > 0) {
      soundFx.playTick(timerRemaining <= 5);
    }
  }, [timerRemaining]);

  const handleInputChange = (catId: string, val: string) => {
    const updated = { ...answers, [catId]: val };
    setAnswers(updated);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      onSyncAnswers(updated);
    }, 200);
  };

  const handleChantinchantonClick = () => {
    soundFx.playChantinchantonBuzzer();
    onScreamChantinchanton(answers);
  };

  // Count filled fields with valid start letter
  const filledCount = categories.filter(
    (c) => (answers[c.id] || '').trim().length > 0 && wordStartsWithLetter(answers[c.id], currentLetter)
  ).length;
  const totalCategories = categories.length;

  const timerPercent = Math.max(0, Math.min(100, (timerRemaining / timerTotal) * 100));
  const isUrgentTimer = timerRemaining <= 10;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 flex flex-col gap-3 pb-24">
      {/* Sticky Compact Header */}
      <div className="sticky top-14 z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between gap-3">
          {/* Active Letter */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-amber-500/60 flex items-center justify-center font-black font-outfit text-2xl text-amber-400 shrink-0">
              {currentLetter}
            </div>
            <div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Ronda {room.currentRound} / {room.settings.totalRounds}
              </div>
              <div className="text-xs font-black text-white font-outfit">
                Letra <span className="text-amber-400">"{currentLetter}"</span>
              </div>
            </div>
          </div>

          {/* Progress & Timer */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-medium">Llenas</span>
              <span className="text-xs font-black font-outfit text-amber-400">
                {filledCount}/{totalCategories}
              </span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                isUrgentTimer
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-neutral-900 border-neutral-800 text-white'
              }`}
            >
              <TimerIcon className={`w-3.5 h-3.5 ${isUrgentTimer ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="font-outfit font-black text-sm tabular-nums">
                {timerRemaining}s
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Timer Bar */}
        <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden mt-2.5">
          <div
            className={`h-full transition-all duration-1000 ${
              isUrgentTimer ? 'bg-rose-500' : timerRemaining <= 20 ? 'bg-amber-500' : 'bg-neutral-200'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      {/* Mode Indicator Bar */}
      {isCreativeMode && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-1.5 text-[10px] text-neutral-300 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-amber-400" />
            <span>Modo Creativo: las respuestas se validarán por votación de la sala.</span>
          </span>
        </div>
      )}

      {/* Categories Vertical Form */}
      <div className="space-y-2">
        {categories.map((cat, idx) => {
          const currentVal = answers[cat.id] || '';
          const isFilled = currentVal.trim().length > 0;
          const startsCorrectly = isFilled && wordStartsWithLetter(currentVal, currentLetter);
          const check = isFilled ? validarPalabraPorCategoria(currentVal, cat.id, currentLetter) : null;

          return (
            <div
              key={cat.id}
              className={`p-3 rounded-2xl border transition ${
                startsCorrectly
                  ? 'bg-neutral-900/90 border-neutral-700'
                  : isFilled
                  ? 'bg-neutral-900/90 border-rose-500/40'
                  : 'bg-neutral-900/50 border-neutral-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5 uppercase font-outfit">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </label>

                {/* Status indicator */}
                {isFilled && (
                  <div className="text-[10px] font-semibold flex items-center gap-1">
                    {!startsCorrectly ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Inicia con "{currentLetter}"
                      </span>
                    ) : check?.isValid ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <BookCheck className="w-3 h-3" /> Válida ✓
                      </span>
                    ) : isCreativeMode ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Votación sala
                      </span>
                    ) : (
                      <span className="text-amber-400/90 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" /> {check?.reason.replace(' (Requiere Aprobación 👍)', '')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {cat.description && (
                <p className="text-[10px] text-neutral-400 mb-1.5 italic">
                  {cat.description}
                </p>
              )}

              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type="text"
                value={currentVal}
                onChange={(e) => handleInputChange(cat.id, e.target.value)}
                placeholder={cat.placeholder || `Palabra con "${currentLetter}"...`}
                maxLength={40}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400 uppercase transition"
              />
            </div>
          );
        })}
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>

      {/* FLOATING BOTTOM CHANTINCHANTÓN BUTTON */}
      <div className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-40">
        <button
          type="button"
          onClick={handleChantinchantonClick}
          className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-neutral-950 font-black font-outfit text-lg tracking-wider uppercase transition shadow-2xl flex items-center justify-center gap-2 border border-amber-300/40"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>¡¡¡CHANTINCHANTÓN!!!</span>
          <Zap className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
};
