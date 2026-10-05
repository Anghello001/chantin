import React from 'react';
import { ECUADOR_QUICK_SHOUTS } from '../constants/gameCategories';
import { Sparkles } from 'lucide-react';

interface Props {
  onSendShout: (text: string, type: string) => void;
  disabled?: boolean;
}

export const QuickShoutBar: React.FC<Props> = ({ onSendShout, disabled }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none">
      <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 mr-0.5">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Gritos:</span>
      </div>
      {ECUADOR_QUICK_SHOUTS.map((shout, idx) => (
        <button
          key={idx}
          disabled={disabled}
          onClick={() => onSendShout(shout.text, shout.type)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white transition shadow-sm disabled:opacity-50"
        >
          <span>{shout.icon}</span>
          <span>{shout.text}</span>
        </button>
      ))}
    </div>
  );
};
