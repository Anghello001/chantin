import React, { useEffect, useState } from 'react';
import { ALPHABET } from '../constants/gameCategories';
import { soundFx } from '../utils/audio';

interface Props {
  currentRound: number;
  totalRounds: number;
  targetLetter: string;
}

export const CountdownModal: React.FC<Props> = ({
  currentRound,
  totalRounds,
  targetLetter,
}) => {
  const [displayedLetter, setDisplayedLetter] = useState('?');
  const [phase, setPhase] = useState<'roulette' | 'revealed'>('roulette');

  useEffect(() => {
    soundFx.playRoundStart();

    const interval = setInterval(() => {
      const rand = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      setDisplayedLetter(rand);
    }, 90);

    const revealTimer = setTimeout(() => {
      clearInterval(interval);
      setDisplayedLetter(targetLetter || 'A');
      setPhase('revealed');
      soundFx.playTick(true);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(revealTimer);
    };
  }, [targetLetter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-md animate-in fade-in duration-150">
      <div className="text-center space-y-4 max-w-xs w-full">
        <div className="inline-block px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 text-[10px] font-black uppercase tracking-widest">
          Ronda {currentRound} de {totalRounds}
        </div>

        <h2 className="text-xl font-black font-outfit text-white tracking-tight">
          {phase === 'roulette' ? 'Sorteando Letra...' : '¡A Escribir!'}
        </h2>

        {/* Letter Card */}
        <div className="mx-auto w-36 h-36 rounded-3xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-xl">
          <span
            className={`font-black font-outfit text-7xl text-amber-400 select-none transition-transform duration-200 ${
              phase === 'revealed' ? 'scale-110' : 'scale-100'
            }`}
          >
            {displayedLetter}
          </span>
        </div>

        <p className="text-xs text-neutral-400 font-medium">
          {phase === 'roulette' ? 'Girando el alfabeto...' : '¡Sé el más rápido en completar!'}
        </p>
      </div>
    </div>
  );
};
