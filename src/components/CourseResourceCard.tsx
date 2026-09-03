import React from 'react';
import { useLanguage } from '../utils/LanguageContext';

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
  const { language, t } = useLanguage();
  const localizedName = language === 'my' ? (res.nameMm || res.name) : res.name;
  const localizedDescription = language === 'my'
    ? (res.descriptionMm || res.description)
    : (res.description || res.descriptionMm);

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
            {isFree ? t('resources.free_pdf') : t('resources.premium_companion')}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-sans font-black text-sm text-[#3c3c3c] leading-tight text-left">
            {localizedName}
          </h4>
          {language === 'en' && res.nameMm && (
            <p className="text-[11px] font-sans font-bold text-[#5a3194] text-left">
              {res.nameMm}
            </p>
          )}
          <p className="text-[11px] text-brand-muted font-sans font-medium leading-relaxed pt-1 text-left">
            {localizedDescription || t('resources.default_description', { course: courseName })}
          </p>
          {language === 'en' && res.descriptionMm && (
            <p className="text-[10.5px] text-slate-500 font-sans font-medium leading-relaxed text-left">
              {res.descriptionMm}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-[#fafafc] -mx-6 -mb-6 p-4 rounded-b-2xl">
        <div className="text-left font-sans select-none">
          <span className="text-[8px] text-brand-muted block font-extrabold uppercase leading-none">{t('resources.pricing')}</span>
          <span className="text-[11.5px] font-black text-brand-purple block mt-0.5">
            {isFree ? t('common.free') : `${res.priceAmount.toLocaleString()} MMK`}
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
                📖 {t('resources.study_interactive')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDownload(res)}
              className="px-3.5 py-2 bg-gradient-to-r from-[#00875a] to-[#00a36c] hover:brightness-105 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#006644] flex items-center gap-1.5 shrink-0"
            >
              🎴 {t('common.open_download')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPurchase(res)}
            className="px-3.5 py-2 bg-gradient-to-r from-brand-purple to-purple-700 hover:brightness-105 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-purple-900 flex items-center gap-1.5 shrink-0"
          >
            🔒 {t('resources.unlock')}
          </button>
        )}
      </div>
    </div>
  );
});
