import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Search, Book, Sparkles, BookOpen, FileText } from 'lucide-react';
import { VocabCategory, VocabItem } from '../types';
import { useVocabCategories, useVocabItems } from '../hooks/useApiData';
import { localDB } from '../utils/db';
import { VocabCard } from './VocabCard';
import { playGlobalAudio, speakGlobalText } from '../utils/audioManager';
import { useLanguage } from '../utils/LanguageContext';

const renderCategoryIcon = (icon?: string, sizeClass: string = "w-4 h-4") => {
  if (!icon) return <BookOpen className={`${sizeClass} shrink-0`} />;
  if (icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')) {
    return <img src={icon} alt="Category Icon" className={`${sizeClass} object-contain rounded shrink-0`} />;
  }
  const clean = icon.trim().toLowerCase();
  if (clean === 'bookopen' || clean === 'book' || clean === 'filetext' || /^[a-z0-9_-]+$/.test(clean)) {
    return <BookOpen className={`${sizeClass} shrink-0`} />;
  }
  return <span className="text-sm shrink-0 leading-none">{icon}</span>;
};

interface VocabPageProps {
  onClose: () => void;
}

export const VocabPage: React.FC<VocabPageProps> = ({ onClose }) => {
  const { language, t } = useLanguage();
  const { categories: apiCategories, isLoading } = useVocabCategories();

  const [categories, setCategories] = useState<VocabCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (Array.isArray(apiCategories) && apiCategories.length > 0) {
      setCategories(apiCategories);
      setSelectedCategoryId(prev => (!prev || !apiCategories.some((c: any) => c.id === prev || c.name === prev)) ? apiCategories[0].id : prev);
    }
  }, [apiCategories]);

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('thai_vocab_book_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCategories(parsed);
          if (parsed.length > 0) {
            setSelectedCategoryId(prev => (!prev || !parsed.some((c: any) => c.id === prev || c.name === prev)) ? parsed[0].id : prev);
          }
        } catch (e) {
          console.error("Error parsing saved vocab book categories in VocabPage:", e);
        }
      }
    };
    window.addEventListener('thai_vocab_book_categories_updated', handleUpdate);
    return () => {
      window.removeEventListener('thai_vocab_book_categories_updated', handleUpdate);
    };
  }, []);

  const { items: categoryItems } = useVocabItems(selectedCategoryId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const currentCategory = categories.find(c => c.id === selectedCategoryId || c.name === selectedCategoryId) || categories[0] || { id: '', name: '', icon: '', items: [] };

  const rawItems = categoryItems.length > 0 ? categoryItems : (currentCategory.items || []);
  const seenVocab = new Set<string>();
  const uniqueItems = (rawItems || []).filter(item => {
    const key = (item.thai || item.english || String(item.id || '')).trim().toLowerCase();
    if (!key || seenVocab.has(key)) return false;
    seenVocab.add(key);
    return true;
  });

  // Search across items
  const filteredItems = uniqueItems.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.thai || '').toLowerCase().includes(q) ||
      (item.phonetic || '').toLowerCase().includes(q) ||
      (item.phoneticMm || '').toLowerCase().includes(q) ||
      (item.english || '').toLowerCase().includes(q) ||
      (item.myanmar || '').toLowerCase().includes(q)
    );
  });

  const handleSpeak = async (text: string) => {
    try {
      const cleanText = text.trim();
      const match = await localDB.words_and_audio
        .where('thai_text').equalsIgnoreCase(cleanText)
        .first();

      if (match && (match.audio_blob || match.audio_url)) {
        setPlayingWord(text);
        const audioUrl = match.audio_blob ? URL.createObjectURL(match.audio_blob) : match.audio_url!;
        const audio = playGlobalAudio(audioUrl);
        if (audio) {
          audio.onended = () => setPlayingWord(null);
          audio.onerror = () => setPlayingWord(null);
        } else {
          setPlayingWord(null);
        }
        return;
      }
    } catch (e) {
      console.warn("Offline audio check failed in VocabPage, falling back to TTS:", e);
    }
    runTTS(text);
  };

  const runTTS = (text: string) => {
    setPlayingWord(text);
    speakGlobalText(text, 'th-TH', 0.85);
    setTimeout(() => setPlayingWord(null), 1200);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl w-full min-h-[70vh] flex items-center justify-center border-2 border-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin"></div>
          <p className="text-sm font-sans font-bold text-brand-muted">{t('vocabulary.loading')}</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-3xl w-full min-h-[70vh] flex items-center justify-center border-2 border-slate-100">
        <div className="text-center p-6">
          <div className="text-4xl mb-2">📭</div>
          <h3 className="font-sans font-black text-brand-dark mb-2">{t('common.no_data')}</h3>
          <p className="text-xs text-brand-muted font-bold max-w-sm">{t('vocabulary.empty_help')}</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold">{t('common.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="bg-white border-2 border-slate-100 rounded-3xl w-full min-h-[70vh] flex flex-col overflow-hidden shadow-xs hover:border-slate-250 transition-all duration-300"
    >
      {/* Top action header */}
      <div className="p-4 sm:p-5 border-b border-rose-100/40 flex items-center justify-between bg-slate-50/50 shrink-0 gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-brand-purple/5 text-slate-700 hover:text-brand-purple border-2 border-slate-200 hover:border-brand-purple/30 rounded-2xl transition-all duration-200 cursor-pointer font-sans font-black text-xs sm:text-sm uppercase tracking-wider shadow-3xs hover:shadow-2xs active:scale-95 shrink-0"
            title={t('common.back')}
          >
            <ArrowLeft className="w-4 h-4 text-brand-purple stroke-[3]" />
            <span>{t('common.back')}</span>
          </button>
          
          <div className="text-left min-w-0 flex-1">
            <h3 className="font-sans font-black text-slate-800 text-sm sm:text-lg tracking-tight leading-snug flex items-center gap-2">
              <span className="p-1.5 bg-brand-purple/10 rounded-xl inline-flex text-black shrink-0">
                <Book className="w-5 h-5 mr-3 text-black stroke-2" strokeWidth={2} />
              </span>
              <span className="truncate">{t('vocabulary.heading')}</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold font-sans mt-0.5 ml-0.5 truncate">
              {t('vocabulary.subtitle')} • <span className="text-brand-purple">{t('common.categories', { count: categories.length })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="px-4 py-3 sm:px-5 border-b border-slate-100 bg-white flex items-center gap-2.5 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('vocabulary.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs sm:text-sm font-semibold focus:outline-none focus:border-brand-purple focus:bg-white transition-all text-brand-dark"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-brand-purple hover:text-brand-dark"
            >
              {t('common.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Grid view containing layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Horizontal scroll category container for Mobile & Tablet view (hidden on desktop) */}
        <div className="block md:hidden px-4 py-3 bg-white border-b border-slate-100 select-none">
          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin select-none snap-x check-scrollbar">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId || cat.name === selectedCategoryId;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => {
                    setSelectedCategoryId(cat.id || cat.name);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold leading-normal transition-all shrink-0 cursor-pointer snap-start flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-purple text-white shadow-3xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {renderCategoryIcon(cat.icon, "w-4 h-4")}
                  <span>{language === 'my' ? ((cat as any).nameMm || (cat as any).name_mm || cat.name) : cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Vertical Panel on desktop (hidden on mobile) */}
        <div className="hidden md:flex md:w-[230px] md:flex-col border-r border-slate-100 bg-slate-50/20 md:overflow-y-auto p-2 gap-1.5 shrink-0">
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId || cat.name === selectedCategoryId;
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => {
                  setSelectedCategoryId(cat.id || cat.name);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full text-left ${
                  isSelected
                    ? 'bg-brand-purple text-white border-r-4 border-brand-purple-shadow shadow-xs'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-slate-100'
                }`}
              >
                {renderCategoryIcon(cat.icon, "w-4 h-4")}
                <span>{language === 'my' ? ((cat as any).nameMm || (cat as any).name_mm || cat.name) : cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic List Container Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/10">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item, idx) => {
                const isSpeaking = playingWord === item.thai;
                const pastelColors = [
                  'bg-[#EFEFFA] text-[#6366F1]',
                  'bg-[#FFF5E6] text-[#F97316]',
                  'bg-[#E6F7F0] text-[#10B981]',
                  'bg-[#FFF0F2] text-[#F43F5E]',
                  'bg-[#EEF2FF] text-[#4F46E5]',
                  'bg-[#F0FDF4] text-[#16A34A]',
                  'bg-[#ECFDFC] text-[#0D9488]',
                  'bg-[#FAF5FF] text-[#9333EA]',
                  'bg-[#FFFBEB] text-[#D97706]',
                  'bg-[#F8FAFC] text-[#64748B]',
                ];
                const pastelClass = pastelColors[idx % pastelColors.length];

                return (
                  <VocabCard
                    key={idx}
                    item={item}
                    onSpeak={handleSpeak}
                    isSpeaking={isSpeaking}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <h4 className="font-sans font-black text-slate-700">{t('vocabulary.no_results')}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-bold">
                {t('vocabulary.search_help')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar overlay */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-[10px] font-sans font-bold text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          💡 {t('vocabulary.copy_hint')}
        </span>
        <span className="text-brand-purple font-extrabold uppercase bg-brand-purple/5 px-2 py-0.5 rounded">
          {t('vocabulary.offline_ready')}
        </span>
      </div>
    </motion.div>
  );
};
