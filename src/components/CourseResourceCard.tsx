import React from 'react';

interface CourseResourceCardProps {
  res: any;
  courseName: string;
  isFree: boolean;
  itemOwned: boolean;
  onStudyInteractive: (res: any) => void;
  onDownload: (res: any) => void;
  onPurchase: (res: any) => void;
}

export const CourseResourceCard: React.FC<CourseResourceCardProps> = React.memo(({
  res,
  courseName,
  isFree,
  itemOwned,
  onStudyInteractive,
  onDownload,
  onPurchase
}) => {
  return (
    <div className="duo-card p-6 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-200 border-2 border-slate-100 text-left">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-2xl select-none">
            📕
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border select-none ${
            isFree 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isFree ? "FREE PDF" : "PREMIUM COMPANION"}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-sans font-black text-sm text-[#3c3c3c] leading-tight text-left">
            {res.name}
          </h4>
          {res.nameMm && (
            <p className="text-[11px] font-sans font-bold text-[#5a3194] text-left">
              {res.nameMm}
            </p>
          )}
          <p className="text-[11px] text-brand-muted font-sans font-medium leading-relaxed pt-1 text-left">
            Study worksheets and practice guidelines specifically designed for the {courseName}.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-[#fafafc] -mx-6 -mb-6 p-4 rounded-b-2xl">
        <div className="text-left font-sans select-none">
          <span className="text-[8px] text-brand-muted block font-extrabold uppercase leading-none">PRICING RATE</span>
          <span className="text-[11.5px] font-black text-brand-purple block mt-0.5">
            {isFree ? "FREE" : `${res.priceAmount.toLocaleString()} MMK`}
          </span>
        </div>

        {itemOwned ? (
          <div className="flex gap-2 shrink-0">
            {(res.vocabEntries?.length > 0 || res.sentenceEntries?.length > 0 || res.dialogueEntries?.length > 0 || res.conversationEntries?.length > 0) && (
              <button
                type="button"
                onClick={() => onStudyInteractive(res)}
                className="px-3 py-2 bg-[#5a3194] hover:bg-[#4a267a] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#3e1c6b] flex items-center gap-1 shrink-0"
              >
                📖 Study Interactive
              </button>
            )}
            <button
              type="button"
              onClick={() => onDownload(res)}
              className="px-3.5 py-2 bg-gradient-to-r from-[#00875a] to-[#00a36c] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#006644] flex items-center gap-1 shrink-0"
            >
              📥 Open / Download
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPurchase(res)}
            className="px-4 py-2 bg-brand-purple text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-brand-purple-shadow flex items-center gap-1 shrink-0"
          >
            🔒 Unlock Access
          </button>
        )}
      </div>
    </div>
  );
});
