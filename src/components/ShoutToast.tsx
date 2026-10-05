import React from 'react';
import { ChatMessage } from '../types/game';

interface Props {
  messages: ChatMessage[];
}

export const ShoutToastOverlay: React.FC<Props> = ({ messages }) => {
  const now = Date.now();
  const recentShouts = messages
    .filter(m => m.isShout && now - m.timestamp < 4000)
    .slice(-2);

  if (recentShouts.length === 0) return null;

  return (
    <div className="fixed top-14 left-4 right-4 max-w-md mx-auto z-50 flex flex-col gap-1.5 pointer-events-none">
      {recentShouts.map(msg => (
        <div
          key={msg.id}
          className="bg-neutral-900/95 text-white p-2.5 rounded-xl shadow-xl border border-neutral-700 backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-200 flex items-center gap-2.5"
        >
          <span className="text-xl shrink-0 p-1 bg-neutral-950 rounded-lg">{msg.senderAvatar || '📢'}</span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-400">
              {msg.senderName} dice:
            </span>
            <p className="text-xs font-bold leading-tight truncate text-neutral-100">
              {msg.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
