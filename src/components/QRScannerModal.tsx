import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (roomCode: string) => void;
}

export const QRScannerModal: React.FC<Props> = ({ isOpen, onClose, onScanSuccess }) => {
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'qr-reader-video-box';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
      return;
    }

    let isMounted = true;
    setErrorMsg('');
    setIsStarting(true);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isMounted) return;
            
            // Extract room code from URL (e.g., https://...?room=ABCD) or raw 4-letter string
            let detectedCode = '';
            try {
              if (decodedText.includes('room=')) {
                const url = new URL(decodedText.startsWith('http') ? decodedText : `https://${decodedText}`);
                detectedCode = (url.searchParams.get('room') || '').toUpperCase();
              } else if (decodedText.trim().length === 4 && /^[A-Z0-9]+$/i.test(decodedText.trim())) {
                detectedCode = decodedText.trim().toUpperCase();
              }
            } catch {
              // fallback regex for room code
              const match = decodedText.match(/[?&]room=([A-Za-z0-9]{4})/i);
              if (match) {
                detectedCode = match[1].toUpperCase();
              }
            }

            if (detectedCode && detectedCode.length === 4) {
              soundFx.playTick();
              if (navigator.vibrate) navigator.vibrate(80);
              
              // Stop scanner and invoke callback
              html5QrCode.stop().catch(() => {}).finally(() => {
                html5QrCode.clear();
                scannerRef.current = null;
                onScanSuccess(detectedCode);
              });
            }
          },
          () => {
            // Ignore scan parse frame errors
          }
        );

        if (isMounted) {
          setIsStarting(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsStarting(false);
          setErrorMsg(
            err?.message?.includes('Permission') 
              ? 'Por favor concede permiso a la cámara en tu navegador para escanear.'
              : 'No se pudo acceder a la cámara trasera. Asegúrate de tener la cámara habilitada.'
          );
        }
      }
    };

    // Timeout slightly to allow modal DOM rendering
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-neutral-100 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800 transition z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Escáner de Cámara</span>
          </div>
          <h2 className="text-lg font-black font-outfit text-white uppercase tracking-tight">
            Escanear Código QR
          </h2>
          <p className="text-xs text-neutral-400">
            Apunta al código QR del anfitrión para entrar directo a la partida
          </p>
        </div>

        {/* Scanner Viewport Container */}
        <div className="relative w-full aspect-square max-w-[260px] rounded-3xl overflow-hidden bg-neutral-950 border-2 border-amber-500/40 shadow-inner flex items-center justify-center">
          <div id={readerElementId} className="w-full h-full object-cover" />

          {/* Scanner Overlay Visual Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-amber-400/80 rounded-2xl relative animate-pulse">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br" />
            </div>
          </div>

          {isStarting && (
            <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center gap-2 text-center p-4">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
              <span className="text-xs text-neutral-300 font-bold">Iniciando cámara...</span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-2 text-left w-full text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-bold font-outfit uppercase transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
