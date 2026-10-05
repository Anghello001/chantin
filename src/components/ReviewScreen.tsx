import React from 'react';
import { 
  Trophy, 
  ShieldCheck,
  BookCheck,
  ThumbsUp,
  ThumbsDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Gavel
} from 'lucide-react';
import { RoomData, Player, Category } from '../types/game';
import { soundFx } from '../utils/audio';
import { wordStartsWithLetter } from '../utils/dictionary';
import { QuickShoutBar } from './QuickShoutBar';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onUpdateScore: (targetPlayerId: string, categoryId: string, points: number, status: string, notes?: string) => void;
  onCastVote: (targetPlayerId: string, categoryId: string, voteType: 'up' | 'down') => void;
  onApproveReviews: () => void;
  onSendShout: (text: string, type: string) => void;
}

export const ReviewScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onUpdateScore,
  onCastVote,
  onApproveReviews,
  onSendShout,
}) => {
  const isHost = room.hostId === currentPlayerId;
  const categories = room.settings.categories;
  const players: Player[] = Object.values(room.players);
  const currentLetter = room.currentLetter;
  const peerVotes = room.peerVotes || {};

  const handlePointChange = (targetPlayerId: string, categoryId: string, points: number, status: string) => {
    soundFx.playScoreVote(points);
    onUpdateScore(targetPlayerId, categoryId, points, status);
  };

  const handleVote = (targetPlayerId: string, categoryId: string, voteType: 'up' | 'down') => {
    soundFx.playTick();
    onCastVote(targetPlayerId, categoryId, voteType);
  };

  const calculatePlayerRoundSum = (player: Player): number => {
    let sum = 0;
    for (const cat of categories) {
      sum += player.roundScoreDetails?.[cat.id]?.points || 0;
    }
    return sum;
  };

  // Find all words that need room consensus (words not in standard dictionary or in creative categories)
  const pendingOrUnregisteredWords: {
    player: Player;
    category: Category;
    word: string;
    scoreInfo: { points: number; notes?: string; status: string };
    voteEntry: { upvotes: string[]; downvotes: string[] };
    isApproved: boolean;
  }[] = [];

  for (const p of players) {
    for (const cat of categories) {
      const rawWord = (p.currentRoundAnswers?.[cat.id] || '').trim();
      if (!rawWord || !wordStartsWithLetter(rawWord, currentLetter)) continue;

      const scoreInfo = p.roundScoreDetails?.[cat.id] || { points: 0, status: 'invalid', notes: '' };
      const voteKey = `${p.id}_${cat.id}`;
      const voteEntry = peerVotes[voteKey] || { upvotes: [], downvotes: [] };
      const hasUpvotes = voteEntry.upvotes.length > voteEntry.downvotes.length;

      // If it has notes mentioning "no registrado" or "no encontrada" or "Votación" or points are 0 or creative mode
      const isUnregisteredOrSubjective = 
        scoreInfo.notes?.includes('no registr') || 
        scoreInfo.notes?.includes('No encontrad') || 
        scoreInfo.notes?.includes('Requiere') || 
        scoreInfo.notes?.includes('Votación') ||
        scoreInfo.notes?.includes('Rechazad') ||
        scoreInfo.notes?.includes('Aprobada por la sala') ||
        cat.validationType === 'subjective' ||
        room.settings.gameMode !== 'classic';

      if (isUnregisteredOrSubjective) {
        pendingOrUnregisteredWords.push({
          player: p,
          category: cat,
          word: rawWord,
          scoreInfo,
          voteEntry,
          isApproved: scoreInfo.points > 0,
        });
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4 pb-28">
      {/* Top Review Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 border-2 border-amber-500/70 flex items-center justify-center font-outfit text-2xl font-black text-amber-400 shrink-0 shadow-inner">
            {currentLetter}
          </div>
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Revisión • Ronda {room.currentRound}/{room.settings.totalRounds}
            </div>
            <div className="text-sm font-black text-white font-outfit">
              Votación de Palabras con <span className="text-amber-400">"{currentLetter}"</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-neutral-400 block font-medium">
            Filtro Humano
          </span>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
            <Users className="w-3.5 h-3.5" /> Vota 👍 o 👎
          </span>
        </div>
      </div>

      {/* Partial Score Bar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1 font-outfit">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Puntaje de la Ronda en Vivo</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {players.map((p) => {
            const sum = calculatePlayerRoundSum(p);
            return (
              <div
                key={p.id}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                  p.id === currentPlayerId
                    ? 'bg-neutral-950 border-amber-500/50 text-white'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{p.avatar}</span>
                  <span className="truncate font-bold">{p.nickname}</span>
                </div>
                <span className="font-outfit font-black text-amber-400 shrink-0 text-sm">
                  +{sum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: TRIBUNAL DE PALABRAS NO REGISTRADAS / EN DUDA */}
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Gavel className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase font-outfit tracking-wide">
                Tribunal de Palabras No Registradas
              </h3>
              <p className="text-[10px] text-neutral-400">
                Vota a favor si conoces la palabra para darle los puntos al jugador
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black font-outfit px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {pendingOrUnregisteredWords.length} en duda
          </span>
        </div>

        {pendingOrUnregisteredWords.length === 0 ? (
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center text-xs text-emerald-400 flex items-center justify-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Todas las palabras fueron verificadas automáticamente en el diccionario!</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingOrUnregisteredWords.map((item, idx) => {
              const hasMyUp = item.voteEntry.upvotes.includes(currentPlayerId);
              const hasMyDown = item.voteEntry.downvotes.includes(currentPlayerId);
              const isMyAnswer = item.player.id === currentPlayerId;
              const points = item.scoreInfo.points;

              return (
                <div
                  key={`${item.player.id}_${item.category.id}_${idx}`}
                  className={`p-3 rounded-xl bg-neutral-950 border transition ${
                    points > 0
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-amber-500/30 bg-neutral-950'
                  }`}
                >
                  {/* Autor y Categoría */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{item.player.avatar}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-white truncate block font-outfit">
                          {item.player.nickname} {isMyAnswer && '(Tú)'}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                          <span>{item.category.icon}</span>
                          <span>{item.category.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Estado actual de puntos */}
                    <div className="text-right">
                      <span
                        className={`text-xs font-black font-outfit px-2.5 py-1 rounded-lg border inline-block ${
                          points > 0
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {points > 0 ? `+${points} pts (Válida)` : '0 pts (En duda)'}
                      </span>
                    </div>
                  </div>

                  {/* Palabra escrita */}
                  <div className="bg-neutral-900/90 px-3 py-2 rounded-xl text-sm font-black uppercase font-outfit text-white tracking-wider mb-2.5 flex items-center justify-between border border-neutral-800">
                    <span className="text-amber-300 font-extrabold">{item.word}</span>
                    <span className="text-[10px] font-medium text-neutral-400">
                      {item.scoreInfo.notes || 'Sujeta a votación de la sala'}
                    </span>
                  </div>

                  {/* Controles de Votación del Tribunal */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
                    <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-2">
                      <span className="text-emerald-400">{item.voteEntry.upvotes.length} 👍</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-rose-400">{item.voteEntry.downvotes.length} 👎</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isMyAnswer}
                        onClick={() => handleVote(item.player.id, item.category.id, 'up')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-outfit flex items-center gap-1.5 transition ${
                          hasMyUp
                            ? 'bg-emerald-500 text-neutral-950 shadow-md scale-105'
                            : 'bg-neutral-900 text-neutral-300 hover:text-emerald-400 border border-neutral-800'
                        } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                        title={isMyAnswer ? 'No puedes votar tu propia palabra' : 'Votar que SÍ es válida'}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Aceptar 👍</span>
                      </button>

                      <button
                        type="button"
                        disabled={isMyAnswer}
                        onClick={() => handleVote(item.player.id, item.category.id, 'down')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-outfit flex items-center gap-1.5 transition ${
                          hasMyDown
                            ? 'bg-rose-600 text-white shadow-md scale-105'
                            : 'bg-neutral-900 text-neutral-300 hover:text-rose-400 border border-neutral-800'
                        } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                        title={isMyAnswer ? 'No puedes votar tu propia palabra' : 'Votar que NO es válida'}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Rechazar 👎</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: DESGLOSE COMPLETO POR CATEGORÍAS */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 font-outfit">
          Desglose Completo de la Ronda
        </div>

        {categories.map((cat) => {
          return (
            <div
              key={cat.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white font-outfit uppercase">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 flex items-center gap-1">
                  {cat.validationType === 'subjective' || room.settings.gameMode !== 'classic' ? (
                    <>
                      <Users className="w-3 h-3 text-amber-400" /> Votación Sala
                    </>
                  ) : (
                    <>
                      <BookCheck className="w-3 h-3 text-emerald-400" /> Diccionario RAM
                    </>
                  )}
                </span>
              </div>

              {/* Player Answers */}
              <div className="space-y-2">
                {players.map((player) => {
                  const answer = (player.currentRoundAnswers?.[cat.id] || '').trim();
                  const scoreInfo = player.roundScoreDetails?.[cat.id] || { points: 0, status: 'invalid' };
                  const currentPts = scoreInfo.points;
                  const voteKey = `${player.id}_${cat.id}`;
                  const voteEntry = peerVotes[voteKey] || { upvotes: [], downvotes: [] };
                  const hasMyUp = voteEntry.upvotes.includes(currentPlayerId);
                  const hasMyDown = voteEntry.downvotes.includes(currentPlayerId);
                  const isMyAnswer = player.id === currentPlayerId;

                  return (
                    <div
                      key={player.id}
                      className={`p-2.5 rounded-xl bg-neutral-950 border transition ${
                        currentPts > 0
                          ? 'border-neutral-800'
                          : 'border-neutral-800/80 opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span>{player.avatar}</span>
                          <span className="font-bold text-neutral-200 truncate font-outfit">
                            {player.nickname} {isMyAnswer && '(Tú)'}
                          </span>
                        </div>

                        {/* Points Tag */}
                        <span
                          className={`text-[11px] font-black font-outfit px-2 py-0.5 rounded-lg border ${
                            currentPts === 100
                              ? 'bg-neutral-900 text-emerald-400 border-emerald-500/30'
                              : currentPts === 50
                              ? 'bg-neutral-900 text-amber-400 border-amber-500/30'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}
                        >
                          +{currentPts} pts
                        </span>
                      </div>

                      {/* Word Display */}
                      <div className="bg-neutral-900 px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-outfit text-white tracking-wide mb-2 flex items-center justify-between">
                        <span>{answer || <span className="text-neutral-500 italic font-normal">(Vacío)</span>}</span>
                        {scoreInfo.notes && (
                          <span className="text-[9px] text-neutral-400 font-normal truncate max-w-[160px]">
                            {scoreInfo.notes}
                          </span>
                        )}
                      </div>

                      {/* Voting Controls */}
                      {answer ? (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-900">
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {voteEntry.upvotes.length} 👍 • {voteEntry.downvotes.length} 👎
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isMyAnswer}
                              onClick={() => handleVote(player.id, cat.id, 'up')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                                hasMyUp
                                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                                  : 'bg-neutral-900 text-neutral-300 hover:text-emerald-400 border border-neutral-800'
                              } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                              title={isMyAnswer ? 'No puedes votar tu propia respuesta' : 'Votar Aceptar'}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Aceptar</span>
                            </button>

                            <button
                              type="button"
                              disabled={isMyAnswer}
                              onClick={() => handleVote(player.id, cat.id, 'down')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                                hasMyDown
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-neutral-900 text-neutral-300 hover:text-rose-400 border border-neutral-800'
                              } ${isMyAnswer ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                              title={isMyAnswer ? 'No puedes votar tu propia respuesta' : 'Votar Rechazar'}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>

      {/* Sticky Bottom Host Approval Button */}
      <div className="fixed bottom-3 left-4 right-4 max-w-md mx-auto z-40">
        {isHost ? (
          <button
            onClick={onApproveReviews}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-sm uppercase tracking-wider transition active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Aprobar Puntuaciones y Continuar</span>
          </button>
        ) : (
          <div className="py-3 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-semibold text-center">
            Vota con Aceptar 👍 o Rechazar 👎. El anfitrión cerrará la ronda.
          </div>
        )}
      </div>
    </div>
  );
};
