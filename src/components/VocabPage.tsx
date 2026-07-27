import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Search, Book, Sparkles } from 'lucide-react';
import { VOCAB_DATA, VocabCategory, VocabItem } from '../data/vocab';
import { localDB } from '../utils/db';

interface VocabPageProps {
  onClose: () => void;
}

export const VocabPage: React.FC<VocabPageProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<VocabCategory[]>(() => {
    const saved = localStorage.getItem('thai_vocab_book_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved vocab book categories in VocabPage:", e);
      }
    }
    return VOCAB_DATA;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('thai_vocab_book_categories');
      if (saved) {
        try {
          setCategories(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved vocab book categories in VocabPage:", e);
        }
      } else {
        setCategories(VOCAB_DATA);
      }
    };
    window.addEventListener('thai_vocab_book_categories_updated', handleUpdate);
    return () => {
      window.removeEventListener('thai_vocab_book_categories_updated', handleUpdate);
    };
  }, []);

  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(() => {
    const saved = localStorage.getItem('thai_vocab_book_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed[0].name;
        }
      } catch (e) {}
    }
    return VOCAB_DATA[0].name;
  });
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const currentCategory = categories.find(c => c.name === selectedCategoryName) || categories[0] || { name: '', icon: '', items: [] };

  // Watch for dynamic category deletion from admin selection side
  useEffect(() => {
    if (categories.length > 0 && !categories.some(c => c.name === selectedCategoryName)) {
      setSelectedCategoryName(categories[0].name);
    }
  }, [categories, selectedCategoryName]);

  // Search across either the selected category or all of them
  const filteredItems = (currentCategory.items || []).filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.thai.toLowerCase().includes(q) ||
      item.phonetic.toLowerCase().includes(q) ||
      item.phoneticMm.toLowerCase().includes(q) ||
      item.english.toLowerCase().includes(q) ||
      item.myanmar.toLowerCase().includes(q)
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
        const audio = new Audio(audioUrl);
        
        audio.onended = () => setPlayingWord(null);
        audio.onerror = () => setPlayingWord(null);
        
        audio.play().catch(err => {
          console.warn("Audio play failed, falling back to TTS:", err);
          // Fall back to TTS if audio playback fails
          runTTS(text);
        });
        return;
      }
    } catch (e) {
      console.warn("Offline audio check failed in VocabPage, falling back to TTS:", e);
    }
    runTTS(text);
  };

  const runTTS = (text: string) => {

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.85; // slightly slower for better learning
      
      utterance.onstart = () => setPlayingWord(text);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback blink animation
      setPlayingWord(text);
      setTimeout(() => setPlayingWord(null), 800);
    }
  };

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
            title="Back to Course pathways"
          >
            <ArrowLeft className="w-4 h-4 text-brand-purple stroke-[3]" />
            <span>Back</span>
          </button>
          
          <div className="text-left min-w-0 flex-1">
            <h3 className="font-sans font-black text-slate-800 text-sm sm:text-lg tracking-tight leading-snug flex items-center gap-2">
              <span className="p-1.5 bg-brand-purple/10 rounded-xl inline-flex text-brand-purple shrink-0">
                <Book className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="truncate">Classroom Vocabulary Book</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold font-sans mt-0.5 ml-0.5 truncate">
              ဝေါဟာရစကားလုံးပေါင်းစုံ လေ့လာခန်း • <span className="text-brand-purple">{categories.length} Categories</span>
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
            placeholder="Search words by Thai, English, Myanmar, spelling..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs sm:text-sm font-semibold focus:outline-none focus:border-brand-purple focus:bg-white transition-all text-brand-dark"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-brand-purple hover:text-brand-dark"
            >
              CLEAR
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
              const isSelected = cat.name === selectedCategoryName;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategoryName(cat.name);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold leading-normal transition-all shrink-0 cursor-pointer snap-start flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-purple text-white shadow-3xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span> 
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Vertical Panel on desktop (hidden on mobile) */}
        <div className="hidden md:flex md:w-[230px] md:flex-col border-r border-slate-100 bg-slate-50/20 md:overflow-y-auto p-2 gap-1.5 shrink-0">
          {categories.map((cat) => {
            const isSelected = cat.name === selectedCategoryName;
            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategoryName(cat.name);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-sans text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full text-left ${
                  isSelected
                    ? 'bg-brand-purple text-white border-r-4 border-brand-purple-shadow shadow-xs'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
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
                  <div
                    key={idx}
                    className={`p-3.5 sm:p-4 bg-white rounded-3xl border transition-all flex items-center justify-between gap-4 relative overflow-hidden group ${
                      isSpeaking 
                        ? 'border-brand-purple shadow-xs bg-brand-purple/5' 
                        : 'border-slate-100 hover:border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Left side Visual Illustration beautiful pastel badge */}
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 ${pastelClass} rounded-2xl flex items-center justify-center text-3xl shrink-0 select-none transition-transform duration-300 group-hover:scale-105`}>
                        {item.illustration}
                      </div>

                      <div className="flex-1 min-w-0 text-left space-y-1 sm:space-y-1.5">
                        {/* Thai Writing & green pronunciation spelling */}
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-sans font-extrabold text-lg sm:text-[19px] text-[#222] select-all tracking-wide">
                            {item.thai}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-600 select-all">
                            ({item.phonetic})
                          </span>
                        </div>

                        {/* Myanmar Definition below the Thai word */}
                        <div className="font-sans font-bold text-[13.5px] sm:text-[15px] text-slate-750 leading-tight select-all">
                          {item.myanmar}
                        </div>

                        {/* Secondary info breakdown */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px] text-slate-400 select-all font-sans font-bold">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-extrabold text-[9px]">
                            {item.phoneticMm}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">
                            {item.english}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side tidy speaker button */}
                    <button
                      onClick={() => handleSpeak(item.thai)}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                        isSpeaking
                          ? 'bg-brand-purple text-white border-brand-purple shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-brand-purple border-slate-200 hover:border-brand-purple/25 shadow-3xs group-hover:scale-105'
                      }`}
                      title="Listen Pronunciation"
                    >
                      <Volume2 className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isSpeaking ? 'animate-pulse text-white' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <h4 className="font-sans font-black text-slate-700">No results found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-bold">
                Try searching with simpler terms or browse some other vocabulary categories in the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar overlay */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-[10px] font-sans font-bold text-slate-400 select-none">
        <span className="flex items-center gap-1.5">
          💡 <span className="text-indigo-500">UX Hint:</span> Double-click any Thai text inside cards to highlight and copy!
        </span>
        <span className="text-brand-purple font-extrabold uppercase bg-brand-purple/5 px-2 py-0.5 rounded">
          Classroom Vocabulary is fully offline-ready
        </span>
      </div>
    </motion.div>
  );
};
