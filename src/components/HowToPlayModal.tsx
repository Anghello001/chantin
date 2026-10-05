import React from 'react';
import { X, Trophy, Zap, BookCheck, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl relative text-neutral-100 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-lg font-black text-white font-outfit uppercase">
            Reglas de Chantinchantón
          </h2>
          <p className="text-xs text-neutral-400">
            Stop / Basta / Tutti Frutti en tiempo real
          </p>
        </div>

        <div className="space-y-3 text-xs text-neutral-300">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <h3 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1. Dinámica
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              En cada ronda se sortea una letra al azar. Escribe rápidamente una palabra válida para cada categoría.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <h3 className="font-bold text-white flex items-center gap-1.5 mb-1 text-xs">
              <BookCheck className="w-3.5 h-3.5 text-emerald-400" />
              2. Validador en Memoria RAM
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              El servidor cuenta con un diccionario en memoria RAM que verifica si la palabra existe, ignorando tildes y con tolerancia a errores tipográficos.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
            <h3 className="font-bold text-white flex items-center gap-1.5 mb-2 text-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              3. Puntuación
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 bg-neutral-900 rounded-lg">
                <span className="font-bold text-emerald-400 block font-outfit">100 Pts</span>
                <span className="text-[10px] text-neutral-400">Única</span>
              </div>
              <div className="p-2 bg-neutral-900 rounded-lg">
                <span className="font-bold text-amber-400 block font-outfit">50 Pts</span>
                <span className="text-[10px] text-neutral-400">Repetida</span>
              </div>
              <div className="p-2 bg-neutral-900 rounded-lg">
                <span className="font-bold text-rose-400 block font-outfit">0 Pts</span>
                <span className="text-[10px] text-neutral-400">Vacía / Mala</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-xl transition font-outfit"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
