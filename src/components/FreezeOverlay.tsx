import React, { useEffect } from 'react';
import { AlertOctagon } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface Props {
  stoppedBy?: { id: string; nickname: string; avatar: string };
  countdownSeconds: number;
}

export const FreezeOverlay: React.FC<Props> = ({
  stoppedBy,
  countdownSeconds,
}) => {
  useEffect(() => {
    soundFx.playChantinchantonBuzzer();
  }, []);

  const isTimeOut = stoppedBy?.id === 'time';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/95 backdrop-blur-md animate-in zoom-in-95 duration-150">
      <div className="text-center space-y-4 max-w-xs w-full">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-3xl">
          {isTimeOut ? '⏰' : (stoppedBy?.avatar || '📢')}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Manos Arriba • Congelado</span>
          </div>

          <h1 className="text-2xl font-black font-outfit text-white tracking-tight uppercase">
            {isTimeOut ? '¡Tiempo Agotado!' : '¡Chantinchantón!'}
          </h1>

          {!isTimeOut && stoppedBy && (
            <p className="text-xs text-neutral-300 mt-1">
              <span className="text-amber-400 font-bold">{stoppedBy.nickname}</span> gritó Chantinchantón
            </p>
          )}
        </div>

        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl max-w-[180px] mx-auto">
          <span className="text-[10px] text-neutral-400 block mb-0.5">Revisando en:</span>
          <span className="font-outfit font-black text-3xl text-amber-400">
            {countdownSeconds}s
          </span>
        </div>
      </div>
    </div>
  );
};
