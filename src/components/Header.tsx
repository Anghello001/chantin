import React from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, Users } from 'lucide-react';

interface Props {
  roomCode?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  playersCount?: number;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<Props> = ({
  roomCode,
  isMuted,
  onToggleMute,
  onOpenHelp,
  playersCount,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* Brand */}
        <div 
          onClick={onLeaveRoom}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center font-outfit text-sm font-black text-amber-400">
            CH
          </div>
          <div>
            <span className="font-outfit font-black text-base tracking-tight text-white block leading-none">
              CHANTIN<span className="text-amber-400">CHANTÓN</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              Ecuador • RAM Realtime
            </span>
          </div>
        </div>

        {/* Room badge */}
        {roomCode && (
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="font-outfit font-black text-amber-400 tracking-wider text-xs">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copiar código"
              className="p-1 text-neutral-400 hover:text-white"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {playersCount !== undefined && (
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 pl-1.5 border-l border-neutral-800">
                <Users className="w-3 h-3 text-neutral-400" />
                <span>{playersCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:bg-neutral-800 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onOpenHelp}
            aria-label="Reglas"
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:bg-neutral-800 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
