import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Sparkles, Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QRModal: React.FC<Props> = ({ isOpen, onClose, roomCode }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !roomCode) return null;

  const joinUrl = `${window.location.origin}?room=${roomCode.toUpperCase()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `¡Únete a mi partida de Chantinchantón!`,
          text: `Entra a la sala con el código ${roomCode.toUpperCase()} para jugar Stop / Tutti Frutti:`,
          url: joinUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-neutral-100 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Escaneo Directo</span>
          </div>
          <h2 className="text-xl font-black font-outfit text-white uppercase tracking-tight">
            Código QR de la Sala
          </h2>
          <p className="text-xs text-neutral-400">
            Tus amigos pueden escanearlo con su cámara o desde la app para entrar directo
          </p>
        </div>

        {/* High Definition QR Code Card */}
        <div className="flex flex-col items-center justify-center bg-white p-5 rounded-3xl shadow-inner mx-auto max-w-[240px]">
          <QRCodeSVG
            value={joinUrl}
            size={190}
            level="H"
            includeMargin={false}
            fgColor="#0a0a0a"
            bgColor="#ffffff"
          />
        </div>

        {/* Room Code Indicator */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Código de Sala
          </span>
          <span className="text-2xl font-black font-outfit text-amber-400 tracking-widest">
            {roomCode.toUpperCase()}
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold flex items-center justify-center gap-1.5 transition border border-neutral-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={handleShareNative}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black font-outfit uppercase flex items-center justify-center gap-1.5 transition shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
