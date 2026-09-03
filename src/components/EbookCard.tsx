import React, { useState, useEffect } from 'react';
import { StoreItem } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface EbookCardProps {
  item: StoreItem;
  currentUser: string | null;
  onUnlock: (item: StoreItem) => void;
  onEnterBook: (item: StoreItem) => void; // Keeping this just in case they want to enter the book too, but we will add the download button
}

export const EbookCard: React.FC<EbookCardProps> = React.memo(({ item, currentUser, onUnlock, onEnterBook }) => {
  const { language, t } = useLanguage();
  const [accessStatus, setAccessStatus] = useState<'locked' | 'pending' | 'approved'>('locked');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const isFree = item.price === 0;

  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      if (isFree) {
        if (isMounted) {
          setAccessStatus('approved');
          setIsLoading(false);
        }
        return;
      }

      if (!currentUser) {
        if (isMounted) {
          setAccessStatus('locked');
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/user/access?username=${encodeURIComponent(currentUser)}&itemId=${encodeURIComponent(item.id)}`);
        const data: any = await res.json();
        
        if (isMounted) {
          const nextStatus = (data.success && data.status) ? data.status : 'locked';
          setAccessStatus(prev => prev === nextStatus ? prev : nextStatus);
        }
      } catch (err) {
        console.error('Failed to fetch user access:', err);
        if (isMounted) setAccessStatus('locked');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAccess();
    
    // Poll every 5 seconds to get real-time unlock updates
    const interval = setInterval(() => {
      checkAccess();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser, item.id, isFree]);

  const getBookStyles = (id: string, nameStr: string) => {
    if (id === 'free-writing') {
      return {
        gradient: "from-purple-700 via-indigo-850 to-indigo-950",
        borderLeft: "border-purple-900",
        accentText: "text-purple-250",
        titleColor: "text-yellow-405",
        topLabel: "ALPHABET SHEETS",
        titleText: "LETTER WRITING",
        subText: "PRACTICE EXERCISES",
        emoji: "✍️",
        emojiLabel: "STROKE GUIDELINES",
        author: "STUDY WORKSHEET",
        status: "FREE PRACTICE BOOK"
      };
    }
    if (id === 'sayar-son-jai-blue-book') {
      return {
        gradient: "from-blue-600 via-[#1c3a70] to-[#0b1b3a]",
        borderLeft: "border-brand-purple-shadow",
        accentText: "text-blue-150",
        titleColor: "text-yellow-250",
        topLabel: "BASIC THAI GUIDE",
        titleText: "BLUE BOOK",
        subText: "SAYAR SON JAI",
        emoji: "📘",
        emojiLabel: "AUDIO INSIDE",
        author: "BESTSELLER textbook",
        status: "PREMIUM AUDIO BOOK"
      };
    }

    const rawWords = nameStr.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ').filter(Boolean);
    const word1 = rawWords[0] || "THAI";
    const word2 = rawWords.slice(1, 3).join(' ') || "STUDY MANUAL";
    return {
      gradient: "from-violet-700 via-brand-purple to-indigo-950",
      borderLeft: "border-purple-900",
      accentText: "text-purple-200",
      titleColor: "text-yellow-250",
      topLabel: "LIBRARY CATALOG",
      titleText: word1.substring(0, 15),
      subText: word2.substring(0, 20),
      emoji: "📘",
      emojiLabel: "EBOOK REFERENCE",
      author: "ONLINE RESOURCE",
      status: "PREMIUM STUDY"
    };
  };

  const bookStyle = getBookStyles(item.id, item.name);

  const handleDownload = () => {
    if (item.googleDriveLink) {
      window.open(item.googleDriveLink, '_blank');
    } else if (item.pdfDownloadUrl) {
      window.open(item.pdfDownloadUrl, '_blank');
    } else {
      alert(language === 'my' ? 'ဒေါင်းလုဒ်လင့်ခ် မရရှိသေးပါ။ အကူအညီဌာနကို ဆက်သွယ်ပါ။' : 'The download link is not available. Please contact support.');
    }
  };

  return (
    <div className="duo-card p-5 sm:p-6 bg-white border-2 border-slate-150 rounded-2xl flex flex-col md:flex-row gap-5 hover:shadow-md transition-all duration-200 animate-fade-in relative overflow-hidden text-left">
      {/* Rich physical cover render widget */}
      <div className={`w-[120px] sm:w-[130px] mx-auto md:mx-0 aspect-[1/1.414] bg-gradient-to-tr ${bookStyle.gradient} rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] active:scale-95 shrink-0 relative flex flex-col justify-between p-4 text-white border-l-4 ${bookStyle.borderLeft} border-r border-t border-b border-white/10 select-none overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-black/20 shadow-inner" />
        
        <div className="space-y-1 text-center pl-1 pt-1">
          <span className={`block text-[6.5px] sm:text-[7.5px] font-black tracking-widest ${bookStyle.accentText} uppercase leading-none`}>
            {bookStyle.topLabel}
          </span>
          <div className="h-[2px] bg-yellow-400 w-1/2 mx-auto mt-1 rounded" />
          <h4 className={`font-sans font-black text-[10px] sm:text-xs leading-tight ${bookStyle.titleColor} drop-shadow mt-1`}>
            {bookStyle.titleText}
          </h4>
          <p className={`text-[7.5px] sm:text-[8px] tracking-wide font-sans font-extrabold ${bookStyle.accentText} uppercase opacity-90 leading-tight`}>
            {bookStyle.subText}
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center pl-2 py-1.5 space-y-1">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex flex-col items-center justify-center">
            <span className="text-sm text-white">{bookStyle.emoji}</span>
          </div>
          <span className="text-[6.5px] font-bold text-yellow-105 tracking-wider uppercase text-center leading-tight">
            {bookStyle.emojiLabel}
          </span>
        </div>

        <div className="space-y-0.5 text-center pl-1">
          <div className="h-[1px] bg-slate-100/20 w-3/4 mx-auto rounded" />
          <p className="text-[7px] sm:text-[8px] font-bold text-white/95 tracking-tight uppercase">
            {bookStyle.author}
          </p>
          <p className="text-[6.5px] text-yellow-400 font-extrabold tracking-wider uppercase leading-none">
            {bookStyle.status}
          </p>
        </div>
      </div>

      {/* Detail fields */}
      <div className="flex-1 flex flex-col justify-between text-left font-sans">
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border select-none ${
                isFree
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isFree ? t('resources.free_pdf') : t('resources.premium_companion')}
              </span>
            </div>
            <h3 className="font-sans font-black text-sm sm:text-base text-slate-800 leading-snug">
              {language === 'my' ? (item.nameMm || item.name) : item.name}
            </h3>
            <p className={`text-xs font-extrabold text-brand-purple mt-0.5 ${language === 'my' ? 'hidden' : ''}`}>
              {item.nameMm}
            </p>
          </div>

          <div className="text-xs text-brand-muted space-y-1 my-1 leading-relaxed text-left">
            <p className="font-semibold">{language === 'my' ? (item.descriptionMm || item.description) : item.description}</p>
            {language === 'en' && item.descriptionMm && (
              <p className="text-[11px] text-slate-500 italic">{item.descriptionMm}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 mt-4 border-t border-slate-100">
          <div className="text-left select-none">
            <span className="text-[7.5px] text-brand-muted block font-black uppercase tracking-wider leading-none">{t('resources.pricing')}</span>
            <span className={`text-xs sm:text-sm font-sans font-black block mt-0.5 ${isFree ? 'text-emerald-600' : 'text-brand-purple'}`}>
              {isFree ? t('common.free') : `${item.price.toLocaleString()} MMK`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <div className="px-3 py-2 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-sans font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (isFree || accessStatus === 'approved') {
                      onEnterBook(item);
                    } else {
                      onUnlock(item);
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-purple to-[#7a42c4] hover:brightness-105 text-white rounded-2xl text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all active:scale-95 border-b-4 border-brand-purple-shadow flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {isFree || accessStatus === 'approved' ? `📖 ${t('ebooks.enter_book')}` : `🔒 ${t('ebooks.unlock')}`}
                </button>

                {(isFree || accessStatus === 'approved') && (item.googleDriveLink || item.pdfDownloadUrl) && (
                  <button
                    onClick={handleDownload}
                    className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-2xl text-xs font-sans font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    title={t('common.download')}
                  >
                    📥 PDF
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
