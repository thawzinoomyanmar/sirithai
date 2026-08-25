import React from 'react';
import { Volume2, BookOpen } from 'lucide-react';

export interface VocabCardItem {
  id?: string | number;
  thai: string;
  phonetic: string;
  myanmar: string;
  english?: string;
  phoneticMm?: string;
  illustration?: string;
  image_url?: string;
}

interface VocabCardProps {
  item: VocabCardItem;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const VocabCard: React.FC<VocabCardProps> = ({ item, onSpeak, isSpeaking }) => {
  return (
    <div
      className={`p-3.5 sm:p-4 bg-white rounded-3xl border transition-all flex items-center justify-between gap-4 relative overflow-hidden group ${
        isSpeaking 
          ? 'border-brand-purple shadow-xs bg-brand-purple/5' 
          : 'border-slate-100 hover:border-slate-200 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Lightweight SVG Icon / Emoji Container */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border border-slate-100 select-none">
          {item.illustration && !item.illustration.startsWith('http') && !item.illustration.startsWith('data:') && !item.illustration.startsWith('/') ? (
            <span className="text-2xl sm:text-3xl">{item.illustration}</span>
          ) : (
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-gray-700 stroke-2" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left space-y-1 sm:space-y-1.5">
          {/* Thai Writing & green pronunciation spelling */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-sans font-extrabold text-lg sm:text-[19px] text-[#222] select-all tracking-wide">
              {item.thai}
            </span>
            {item.phonetic && (
              <span className="text-xs sm:text-sm font-bold text-emerald-600 select-all">
                ({item.phonetic})
              </span>
            )}
          </div>

          {/* Myanmar Definition below the Thai word */}
          <div className="font-sans font-bold text-[13.5px] sm:text-[15px] text-slate-750 leading-tight select-all">
            {item.myanmar}
          </div>

          {/* Secondary info breakdown */}
          {(item.phoneticMm || item.english) && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px] text-slate-400 select-all font-sans font-bold">
              {item.phoneticMm && (
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-extrabold text-[9px]">
                  {item.phoneticMm}
                </span>
              )}
              {item.phoneticMm && item.english && <span>•</span>}
              {item.english && (
                <span className="text-slate-500">
                  {item.english}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side speaker button */}
      {onSpeak && (
        <button
          onClick={() => onSpeak(item.thai)}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
            isSpeaking
              ? 'bg-brand-purple text-white border-brand-purple shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-brand-purple border-slate-200 hover:border-brand-purple/25 shadow-3xs group-hover:scale-105'
          }`}
          title="Listen Pronunciation"
        >
          <Volume2 className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isSpeaking ? 'animate-pulse text-white' : ''}`} />
        </button>
      )}
    </div>
  );
};
