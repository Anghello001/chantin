import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Crown, 
  RotateCcw, 
  Download, 
  FileSpreadsheet,
  Check, 
  Home 
} from 'lucide-react';
import { RoomData, Player } from '../types/game';
import { soundFx } from '../utils/audio';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onRestartGame: () => void;
  onLeaveRoom: () => void;
}

export const GameOverScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onRestartGame,
  onLeaveRoom,
}) => {
  const [copiedCsv, setCopiedCsv] = useState(false);
  const isHost = room.hostId === currentPlayerId;

  const rankedPlayers: Player[] = Object.values(room.players).sort((a, b) => b.score - a.score);
  const winner = rankedPlayers[0];

  useEffect(() => {
    soundFx.playCelebration();
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const generateGameCsv = () => {
    const headers = ['Posicion', 'Jugador', 'Avatar', 'Puntaje Total', 'Rondas'];
    const rows = rankedPlayers.map((p, idx) => [
      idx + 1,
      `"${p.nickname}"`,
      p.avatar,
      p.score,
      room.roundHistory.length,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleCopySpreadsheet = () => {
    const csv = generateGameCsv();
    navigator.clipboard.writeText(csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = generateGameCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Chantinchanton_${room.code}_Resultados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-5 flex flex-col gap-4 pb-20">
      {/* Winner Hero Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-amber-400 text-[10px] font-black uppercase tracking-widest">
          <Crown className="w-3.5 h-3.5" />
          <span>¡Gran Campeón!</span>
        </div>

        <div className="w-20 h-20 mx-auto rounded-2xl bg-neutral-950 border border-amber-500/50 flex items-center justify-center text-4xl shadow-md">
          {winner?.avatar || '👑'}
        </div>

        <div>
          <h1 className="text-2xl font-black font-outfit text-white">
            {winner?.nickname}
          </h1>
          <p className="text-lg font-black text-amber-400 font-outfit mt-0.5">
            {winner?.score} Puntos
          </p>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-300 font-outfit">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Posiciones Finales
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySpreadsheet}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-medium text-neutral-300 flex items-center gap-1"
              title="Copiar para Google Sheets"
            >
              {copiedCsv ? <Check className="w-3 h-3 text-emerald-400" /> : <FileSpreadsheet className="w-3 h-3 text-emerald-400" />}
              <span>{copiedCsv ? '¡Copiado!' : 'Sheets'}</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              title="Descargar CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {rankedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                idx === 0
                  ? 'bg-neutral-950 border-amber-500/40 text-white'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-outfit font-black text-xs text-neutral-400 w-4">
                  #{idx + 1}
                </span>
                <span className="text-xl shrink-0">{p.avatar}</span>
                <span className="font-bold text-xs truncate font-outfit">
                  {p.nickname} {p.id === currentPlayerId && '(Tú)'}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-outfit font-black text-sm text-amber-400">
                  {p.score} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {isHost && (
          <button
            onClick={onRestartGame}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-sm uppercase tracking-wider transition active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar Revancha</span>
          </button>
        )}

        <button
          onClick={onLeaveRoom}
          className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold font-outfit text-xs uppercase tracking-wider transition border border-neutral-800 flex items-center justify-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Volver al Menú Principal</span>
        </button>
      </div>
    </div>
  );
};
