import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Copy, 
  Check, 
  Users, 
  Maximize2, 
  Minimize2,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Props {
  roomCode?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  playersCount?: number;
  onLeaveRoom?: () => void;
  isConnected?: boolean;
  onOpenServerConfig?: () => void;
}

export const Header: React.FC<Props> = ({
  roomCode,
  isMuted,
  onToggleMute,
  onOpenHelp,
  playersCount,
  onLeaveRoom,
  isConnected = true,
  onOpenServerConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle not permitted', e);
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Brand */}
        <div 
          onClick={onLeaveRoom}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center font-outfit text-sm font-black text-amber-400 shrink-0">
            CH
          </div>
          <div>
            <span className="font-outfit font-black text-sm tracking-tight text-white block leading-none">
              CHANTIN<span className="text-amber-400">CHANTÓN</span>
            </span>
            <span className="text-[9px] text-neutral-400 font-medium">
              Ecuador • Realtime
            </span>
          </div>
        </div>

        {/* Room badge */}
        {roomCode && (
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-xl">
            <span className="font-outfit font-black text-amber-400 tracking-wider text-xs">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copiar código"
              className="p-0.5 text-neutral-400 hover:text-white transition"
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
        <div className="flex items-center gap-1">
          {/* Server Connection Status / Config */}
          {onOpenServerConfig && (
            <button
              onClick={onOpenServerConfig}
              title={isConnected ? 'Servidor conectado' : 'Configurar URL Servidor Render'}
              className={`p-1.5 rounded-xl border transition ${
                isConnected
                  ? 'bg-neutral-900 border-neutral-800 text-emerald-400'
                  : 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse'
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Maximizar / Pantalla Completa Button */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            title={isFullscreen ? 'Restaurar pantalla' : 'Maximizar pantalla completa'}
            className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-amber-400 active:scale-95 transition"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Sonido */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Ayuda */}
          <button
            onClick={onOpenHelp}
            aria-label="Reglas"
            className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
