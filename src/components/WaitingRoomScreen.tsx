import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Crown, 
  Play, 
  Users, 
  Sliders, 
  MessageSquare, 
  Send,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { RoomData, Player, GameSettings, GameMode } from '../types/game';
import { ALL_PRESET_MODES } from '../constants/gameCategories';
import { QuickShoutBar } from './QuickShoutBar';

interface Props {
  room: RoomData;
  currentPlayerId: string;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onSendShout: (text: string, type: string) => void;
  onSendChat: (text: string) => void;
  onLeaveRoom: () => void;
}

export const WaitingRoomScreen: React.FC<Props> = ({
  room,
  currentPlayerId,
  onStartGame,
  onUpdateSettings,
  onSendShout,
  onSendChat,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showSettingsEdit, setShowSettingsEdit] = useState(false);

  const isHost = room.hostId === currentPlayerId;
  const playersList: Player[] = Object.values(room.players);
  const currentModeInfo = ALL_PRESET_MODES[room.settings.gameMode] || ALL_PRESET_MODES.classic;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
      {/* Top Code Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Código de Sala
          </span>
          <div className="text-2xl font-black font-outfit text-amber-400 tracking-wider">
            {room.code}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition border border-neutral-700"
            title="Salir"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Players List (Vertical Cards) */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 font-outfit">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Jugadores Conectados ({playersList.length})
          </span>
          <span className="text-[11px] text-neutral-400">
            {isHost ? '👑 Eres el Anfitrión' : 'Esperando...'}
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {playersList.map((player) => (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                player.id === currentPlayerId
                  ? 'bg-neutral-950 border-amber-500/50'
                  : 'bg-neutral-950/60 border-neutral-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">{player.avatar}</span>
                <span className="font-bold text-xs text-white truncate font-outfit">
                  {player.nickname}
                </span>
                {player.id === currentPlayerId && (
                  <span className="text-[9px] bg-amber-500 text-neutral-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                    Tú
                  </span>
                )}
              </div>

              {player.isHost && (
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mode & Category Summary */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentModeInfo.icon}</span>
            <div>
              <div className="font-bold text-xs text-white font-outfit">
                {currentModeInfo.title}
              </div>
              <div className="text-[10px] text-neutral-400">
                {room.settings.roundDuration}s por ronda • {room.settings.totalRounds} rondas
              </div>
            </div>
          </div>

          {isHost && (
            <button
              type="button"
              onClick={() => setShowSettingsEdit(!showSettingsEdit)}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:text-white"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Host Edit Drawer */}
        {showSettingsEdit && isHost && (
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block mb-1">
                Cambiar Modo:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['classic', 'crazy', 'irl_objects', 'ecuador'] as GameMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onUpdateSettings({ gameMode: m })}
                    className={`p-2 rounded-lg text-left text-xs font-bold border ${
                      room.settings.gameMode === m
                        ? 'bg-neutral-800 text-amber-400 border-amber-500/50'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <span>{ALL_PRESET_MODES[m].title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block mb-1">Tiempo:</span>
                <div className="flex gap-1">
                  {[30, 60, 90].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onUpdateSettings({ roundDuration: s })}
                      className={`flex-1 py-1 rounded text-xs font-bold ${
                        room.settings.roundDuration === s
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block mb-1">Rondas:</span>
                <div className="flex gap-1">
                  {[3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onUpdateSettings({ totalRounds: r })}
                      className={`flex-1 py-1 rounded text-xs font-bold ${
                        room.settings.totalRounds === r
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Chips */}
        <div className="flex flex-wrap gap-1.5">
          {room.settings.categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300"
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Quick Shouts Bar */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2">
        <QuickShoutBar onSendShout={onSendShout} />
      </div>

      {/* In-Room Chat (Mobile compact) */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 flex flex-col min-h-[140px]">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-neutral-400" />
          Chat
        </span>

        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-24 pr-1 text-[11px] mb-2">
          {room.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-1.5 rounded-lg ${
                msg.senderId === 'system'
                  ? 'bg-neutral-950/60 text-neutral-400 italic text-[10px]'
                  : 'bg-neutral-950 text-neutral-200'
              }`}
            >
              {msg.senderId !== 'system' && (
                <span className="font-bold text-amber-400 mr-1">
                  {msg.senderName}:
                </span>
              )}
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChatMessage} className="flex gap-1.5">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={80}
            placeholder="Mensaje..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-neutral-800 text-neutral-200 hover:text-white"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Big Action: Start Game */}
      <div className="sticky bottom-3 pt-1">
        {isHost ? (
          <button
            onClick={onStartGame}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-base uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Partida</span>
          </button>
        ) : (
          <div className="py-3 px-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Esperando que el anfitrión inicie...</span>
          </div>
        )}
      </div>
    </div>
  );
};
