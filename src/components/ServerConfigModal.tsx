import React, { useState } from 'react';
import { Server, Wifi, WifiOff, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBackendUrl: string;
  isConnected: boolean;
  onSaveBackendUrl: (url: string) => void;
  onReconnect: () => void;
}

export const ServerConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentBackendUrl,
  isConnected,
  onSaveBackendUrl,
  onReconnect,
}) => {
  const [urlInput, setUrlInput] = useState(currentBackendUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);
    const cleanUrl = urlInput.trim().replace(/\/$/, '');

    try {
      const endpoint = cleanUrl ? `${cleanUrl}/api/health` : '/api/health';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        setTestResult({ success: true, message: '¡Conexión exitosa con el servidor backend!' });
        onSaveBackendUrl(cleanUrl);
      } else {
        setTestResult({
          success: false,
          message: `El servidor respondió con error ${res.status}. Verifica que esté activo en Render.`,
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'No se pudo conectar. Si está en Render (Plan Free), puede tardar hasta 40s en despertar.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-neutral-950 text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black font-outfit text-white uppercase">
              Conexión Render / Backend
            </h3>
            <div className="flex items-center gap-1.5 text-[11px]">
              {isConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Conectado en tiempo real
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Desconectado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-[11px] text-neutral-300 space-y-1.5">
          <p className="font-bold text-amber-400">💡 ¿Desplegaste Frontend en Vercel y Backend en Render?</p>
          <p>
            Vercel aloja la web estática y <strong>Render aloja el servidor WebSocket (Socket.io)</strong>.
            Ingresa la URL de tu servicio web en Render (Ej: <code className="text-amber-300">https://chantinchanton.onrender.com</code>).
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-300 block font-outfit uppercase">
            URL del Backend Render:
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://tu-app.onrender.com"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {testResult && (
          <div
            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-[11px]">{testResult.message}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestAndSave}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Probando...</span>
              </>
            ) : (
              <span>Guardar y Conectar</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onReconnect();
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:text-white text-neutral-400 font-bold text-xs transition"
          >
            Reconectar
          </button>
        </div>
      </div>
    </div>
  );
};
