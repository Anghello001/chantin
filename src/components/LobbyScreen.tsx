import React, { useState } from 'react';
import { 
  Play, 
  LogIn, 
  Sparkles, 
  Timer, 
  Trophy, 
  Gamepad2, 
  Shuffle, 
  BookCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AVATAR_OPTIONS, ALL_PRESET_MODES } from '../constants/gameCategories';
import { GameMode, GameSettings } from '../types/game';

interface Props {
  onCreateRoom: (nickname: string, avatar: string, settings: Partial<GameSettings>) => void;
  onJoinRoom: (roomCode: string, nickname: string, avatar: string) => void;
  onStartSoloPractice: (nickname: string, avatar: string, mode: GameMode) => void;
  initialRoomCode?: string;
}

const RANDOM_NICKNAMES = [
  'ElPanaGuayaco', 'ChullaQuiteño', 'LlamaVeloz', 'EncebolladoFan',
  'ReyDelChantin', 'DonChiripa', 'ChambaMaster', 'PanaPro'
];

export const LobbyScreen: React.FC<Props> = ({
  onCreateRoom,
  onJoinRoom,
  onStartSoloPractice,
  initialRoomCode = '',
}) => {
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('chantin_nick') || RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
  });
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('chantin_avatar') || AVATAR_OPTIONS[0];
  });
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [roundDuration, setRoundDuration] = useState<number>(60);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinError, setJoinError] = useState('');

  const handleRandomName = () => {
    const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(random);
    const randAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setAvatar(randAvatar);
  };

  const saveProfile = (nick: string, av: string) => {
    localStorage.setItem('chantin_nick', nick);
    localStorage.setItem('chantin_avatar', av);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    saveProfile(nickname, avatar);
    onCreateRoom(nickname.trim(), avatar, {
      gameMode: selectedMode,
      roundDuration,
      totalRounds,
      categories: ALL_PRESET_MODES[selectedMode].categories,
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!nickname.trim()) {
      setJoinError('Escribe tu nombre');
      return;
    }
    if (!roomCodeInput.trim() || roomCodeInput.trim().length < 4) {
      setJoinError('Código de 4 letras');
      return;
    }
    saveProfile(nickname, avatar);
    onJoinRoom(roomCodeInput.trim().toUpperCase(), nickname.trim(), avatar);
  };

  const handlePractice = () => {
    if (!nickname.trim()) return;
    saveProfile(nickname, avatar);
    onStartSoloPractice(nickname.trim(), avatar, selectedMode);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
      {/* Hero Badge */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-semibold text-neutral-300 mb-2">
          <BookCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Diccionario RAE en RAM integrado</span>
        </div>
        <h1 className="text-3xl font-black font-outfit tracking-tight text-white">
          CHANTIN<span className="text-amber-400">CHANTÓN</span>
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          El clásico Stop / Basta ecuatoriano en tiempo real
        </p>
      </div>

      {/* Profile Box */}
      <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Tu Jugador
          </label>
          <button
            type="button"
            onClick={handleRandomName}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
          >
            <Shuffle className="w-3 h-3" />
            Aleatorio
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="Tu apodo..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
            {avatar}
          </div>
        </div>

        {/* Avatar Bar (horizontal scrollable) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {AVATAR_OPTIONS.map((av) => (
            <button
              key={av}
              type="button"
              onClick={() => setAvatar(av)}
              className={`w-9 h-9 shrink-0 text-lg rounded-xl flex items-center justify-center transition ${
                avatar === av
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-300'
              }`}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Selector (Crear / Unirse) */}
      <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-2xl flex">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition ${
            activeTab === 'create'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Crear Sala
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-outfit uppercase tracking-wider transition ${
            activeTab === 'join'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Unirse a Sala
        </button>
      </div>

      {/* CREATE ROOM VIEW */}
      {activeTab === 'create' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Game Modes (Compact Vertical Cards) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-1">
              Modo de Juego
            </label>

            {(['classic', 'crazy', 'irl_objects', 'ecuador'] as GameMode[]).map((m) => {
              const info = ALL_PRESET_MODES[m];
              const isSelected = selectedMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMode(m)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'bg-neutral-950 border-neutral-800/80 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{info.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white font-outfit truncate">
                        {info.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {info.subtitle}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber-400 bg-amber-400' : 'border-neutral-700'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick config toggle */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-neutral-400">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  {roundDuration}s
                </span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  {totalRounds} Rondas
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-[11px]">
                <span>{showConfig ? 'Menos' : 'Ajustar'}</span>
                {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showConfig && (
              <div className="mt-3 pt-3 border-t border-neutral-800 space-y-3">
                <div>
                  <span className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Segundos por ronda:
                  </span>
                  <div className="flex gap-1.5">
                    {[30, 45, 60, 90].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRoundDuration(s)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          roundDuration === s
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-neutral-400 mb-1 font-medium">
                    Número de rondas:
                  </span>
                  <div className="flex gap-1.5">
                    {[3, 5, 7, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTotalRounds(r)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                          totalRounds === r
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black font-outfit text-base uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Crear Sala Privada</span>
          </button>
        </div>
      )}

      {/* JOIN ROOM VIEW */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoin} className="space-y-3 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center space-y-2">
            <span className="text-xs text-neutral-400 block">
              Ingresa el código de 4 letras de la sala:
            </span>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={4}
              placeholder="ABCD"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-center text-3xl font-black tracking-widest text-amber-400 font-outfit uppercase focus:outline-none focus:border-amber-400"
            />
            {joinError && (
              <p className="text-xs text-rose-400 font-semibold">{joinError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold font-outfit text-base uppercase tracking-wider transition active:scale-[0.99] flex items-center justify-center gap-2 border border-neutral-700"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar a la Sala</span>
          </button>
        </form>
      )}

      {/* Practice Solo Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handlePractice}
          className="w-full py-2.5 px-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 text-xs font-semibold transition flex items-center justify-center gap-1.5"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Modo Práctica Solo (Offline)</span>
        </button>
      </div>
    </div>
  );
};
