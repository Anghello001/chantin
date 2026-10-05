import React from 'react';
import { ChatMessage } from '../types/game';

interface Props {
  messages: ChatMessage[];
}

export const ShoutToastOverlay: React.FC<Props> = ({ messages }) => {
  const now = Date.now();
  // Filter only very recent shouts from the last 1.4 seconds
  const recentShouts = messages
    .filter(m => m.isShout && now - m.timestamp < 1400)
    .slice(-1); // Display only the single latest interaction to avoid stacking

  if (recentShouts.length === 0) return null;

  const msg = recentShouts[0];

  return (
    <div className="fixed top-14 left-4 right-4 max-w-md mx-auto z-50 flex flex-col items-center pointer-events-none">
      <div
        key={msg.id}
        className="w-full bg-neutral-900/95 text-white p-2.5 rounded-2xl shadow-2xl border border-amber-500/50 backdrop-blur-md transition-all duration-300 transform scale-100 opacity-100 flex items-center gap-2.5 animate-bounce-short"
      >
        <span className="text-2xl shrink-0 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
          {msg.senderAvatar || '📢'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider block text-amber-400">
              {msg.senderName}
            </span>
            <span className="text-[9px] text-neutral-400 font-bold uppercase">
              Reacción
            </span>
          </div>
          <p className="text-xs font-black leading-tight truncate text-white">
            {msg.text}
          </p>
        </div>
      </div>
    </div>
  );
};
