import React, { useState, useMemo, useEffect } from 'react';
import { DialogueLine, WordBreakdown } from '../types';
import { getMyanmarPhonetic } from '../utils/sentenceUtils';
import { Play, Volume2, Volume1, Volume, HelpCircle, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SentenceViewProps {
  sentences: DialogueLine[];
  onWordMastered: (word: string) => void;
  masteredWords: string[];
  audioSpeedIndex: number;
  setAudioSpeedIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function SentenceView({
  sentences = [],
  onWordMastered,
  masteredWords,
  audioSpeedIndex,
  setAudioSpeedIndex
}: SentenceViewProps) {
  const [selectedWord, setSelectedWord] = useState<WordBreakdown | null>(null);
  const [activeSpeechLine, setActiveSpeechLine] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const sentencesPerPage = 4;

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Use Web Speech API for Pronunciation of Thai sentences or words
  const speakThai = (text: string, index?: number) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech not supported in this browser. Please use Chrome/Safari/Firefox.");
      return;
    }

    // Cycle the shared speed index: 0 -> 1 -> 2 -> 0
    const nextIndex = (audioSpeedIndex + 1) % 3;
    setAudioSpeedIndex(nextIndex);

    const rates = [0.85, 0.7, 0.5];
    const rate = rates[nextIndex];

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = rate;

    if (index !== undefined) {
      setActiveSpeechLine(index);
      utterance.onend = () => setActiveSpeechLine(null);
    }

    window.speechSynthesis.speak(utterance);
  };

  // Filter sentences by search query (across Thai, English, or Myanmar text)
  const filteredSentences = useMemo(() => {
    if (!searchQuery.trim()) return sentences;
    const query = searchQuery.toLowerCase().trim();
    return sentences.filter(line => 
      line.thai.toLowerCase().includes(query) ||
      line.phonetic.toLowerCase().includes(query) ||
      line.english.toLowerCase().includes(query) ||
      line.myanmar.toLowerCase().includes(query)
    );
  }, [sentences, searchQuery]);

  const totalPages = Math.ceil(filteredSentences.length / sentencesPerPage);
  const paginatedSentences = useMemo(() => {
    const startIndex = (currentPage - 1) * sentencesPerPage;
    return filteredSentences.slice(startIndex, startIndex + sentencesPerPage);
  }, [filteredSentences, currentPage, sentencesPerPage]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sentences Cards List (Left/Mid Column) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search, Filter & Intro Bar */}
        <div className="duo-card p-5 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-black text-brand-dark text-lg flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-purple rounded-full shrink-0" />
                Lesson Sentences • သင်ခန်းစာဝါကျများ
              </h3>
              <p className="text-xs text-brand-muted mt-1 font-sans font-medium">
                Practice full sentence patterns using the lesson's vocabulary. Tap words for analysis.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sentences • ရှาဖွေပါ..."
                className="w-full pl-9 pr-4 py-2 text-xs font-sans font-extrabold bg-gray-50 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Sentences Container */}
        <div className="space-y-5">
          {paginatedSentences.length > 0 ? (
            paginatedSentences.map((line, idx) => {
              const globalIdx = (currentPage - 1) * sentencesPerPage + idx;
              // Extract clean vocabulary words used in this sentence
              const cleanWords = (line.words || []).filter(w => {
                const eng = w.english.toLowerCase();
                const mya = w.myanmar;
                return !(
                  eng.includes("(name)") || 
                  mya.includes("(အမည်)") || 
                  eng === "john" || 
                  w.thai === "จอห์น" || 
                  w.thai === "ปรีชา" || 
                  w.thai === "สมศักดิ์" || 
                  w.thai === "นงนุช"
                );
              });

              return (
                <div
                  key={globalIdx}
                  id={`sentence-card-${globalIdx}`}
                  className="duo-card p-6 bg-white border-2 border-brand-border shadow-xs hover:border-brand-purple/20 transition-all duration-200"
                >
                  {/* Card Header Tag */}
                  <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-brand-purple-light text-brand-purple rounded-full text-[10px] font-black tracking-wide uppercase shadow-2xs border border-brand-purple/10">
                        Sentence {globalIdx + 1} • ဝါကျ - {globalIdx + 1}
                      </span>
                    </div>

                    {/* Compact Vocab Dropdown for this sentence */}
                    {cleanWords.length > 0 && (
                      <div className="relative">
                        <label htmlFor={`vocab-select-${globalIdx}`} className="sr-only">Vocabulary in sentence</label>
                        <select
                          id={`vocab-select-${globalIdx}`}
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const found = cleanWords.find(w => w.thai === val);
                              if (found) setSelectedWord(found);
                            }
                          }}
                          className="bg-white border border-gray-200 text-brand-dark text-[10px] rounded-lg font-black font-sans px-2 py-1 outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] shadow-3xs hover:border-brand-purple/40 hover:bg-white transition-colors"
                        >
                          <option value="">Vocabulary Words</option>
                          {cleanWords.map((w, wIdx) => (
                            <option key={wIdx} value={w.thai}>
                              {w.thai} = {w.myanmar}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Thai Full Sentence */}
                  <div className="text-[23px] font-sans font-black text-brand-dark mb-4 tracking-wide leading-relaxed select-all">
                    {line.thai}
                  </div>

                  {/* Word-by-Word Interactivity (Duolingo Style Word Chips) */}
                  <div className="flex flex-wrap gap-2 items-center mb-4 pb-2 border-b border-dashed border-brand-border">
                    {cleanWords.map((wordObj, wordIdx) => {
                      const isMastered = masteredWords.includes(wordObj.thai);
                      const isSelected = selectedWord?.thai === wordObj.thai;

                      return (
                        <motion.button
                          key={wordIdx}
                          onClick={() => setSelectedWord(wordObj)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-sans font-extrabold transition-all border-2 border-b-4 ${
                            isSelected
                              ? 'bg-brand-purple text-white border-brand-purple border-b-brand-purple-shadow'
                              : isMastered
                              ? 'bg-brand-green-light text-brand-green border-brand-green/30 border-b-brand-green-shadow/30 hover:bg-brand-green-light/85'
                              : 'bg-white text-brand-dark border-[#e5e5e5] border-b-[#d5d5d5] hover:bg-gray-50'
                          }`}
                          whileTap={{ scale: 0.95 }}
                          title={`${wordObj.phonetic} - ${wordObj.myanmar}`}
                        >
                          {wordObj.thai}
                        </motion.button>
                      );
                    })}

                    {/* Sentence Level Speech Pronunciation with variable rates */}
                    <button
                      onClick={() => speakThai(line.thai, globalIdx)}
                      className={`px-3 h-9 rounded-2xl border-2 border-b-4 flex items-center justify-center gap-1.5 transition-all ${
                        activeSpeechLine === globalIdx
                          ? 'bg-brand-purple text-white border-brand-purple border-b-brand-purple-shadow animate-bounce'
                          : 'bg-white text-brand-purple border-brand-purple/20 border-b-brand-purple/40 hover:bg-brand-purple-light'
                      }`}
                      title={`Pronounce entire sentence (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                    >
                      {audioSpeedIndex === 0 ? (
                        <>
                          <Volume2 className="w-4 h-4 fill-current animate-pulse-slow" />
                          <span className={`text-[9px] font-sans font-black px-1.5 py-0.5 rounded-md leading-none select-none ${
                            activeSpeechLine === globalIdx ? 'bg-white/20 text-white' : 'bg-brand-purple-light text-brand-purple'
                          }`}>1.0x</span>
                        </>
                      ) : audioSpeedIndex === 1 ? (
                        <>
                          <Volume1 className="w-4 h-4 fill-current text-indigo-500 animate-pulse-slow" />
                          <span className={`text-[9px] font-sans font-black px-1.5 py-0.5 rounded-md leading-none select-none ${
                            activeSpeechLine === globalIdx ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'
                          }`}>0.7x</span>
                        </>
                      ) : (
                        <>
                          <Volume className="w-4 h-4 fill-current text-orange-500 animate-pulse-slow" />
                          <span className={`text-[9px] font-sans font-black px-1.5 py-0.5 rounded-md leading-none select-none ${
                            activeSpeechLine === globalIdx ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-500'
                          }`}>0.5x</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Translations & Breakdown Fields */}
                  <div className="space-y-2 mt-2">
                    {/* Pronunciation Transcript */}
                    <div className="text-xs font-mono text-brand-purple border-l-2 border-brand-purple/40 pl-3 font-semibold tracking-wide">
                      {line.phonetic}
                    </div>

                    {/* Burmese translation */}
                    <div className="text-sm text-brand-dark font-sans font-bold leading-relaxed">
                      {line.myanmar}
                    </div>

                    {/* English translation */}
                    <div className="text-xs text-brand-muted font-sans font-medium">
                      {line.english}
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="duo-card p-12 bg-white text-center text-brand-muted">
              <Search className="w-12 h-12 text-brand-purple/25 mx-auto mb-3" />
              <p className="font-sans font-black text-brand-dark text-base">No sentences found</p>
              <p className="text-xs text-brand-muted font-sans font-medium mt-1">
                Try modifying your query to search for grammatical features, words, or translations.
              </p>
            </div>
          )}
        </div>

        {/* Sentence List Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white px-6 py-4 rounded-2xl border-2 border-brand-border shadow-xs select-none">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-black tracking-wider transition-all cursor-pointer border border-gray-100 ${
                currentPage === 1
                  ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400'
                  : 'bg-white hover:bg-gray-50 text-brand-purple active:translate-y-0.5 shadow-3xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full text-xs font-sans font-black flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'bg-gray-150 text-brand-dark hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-black tracking-wider transition-all cursor-pointer border border-gray-100 ${
                currentPage === totalPages
                  ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400'
                  : 'bg-white hover:bg-gray-50 text-brand-purple active:translate-y-0.5 shadow-3xs'
              }`}
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Vocabulary breakout details card (Right Column) - Hidden on mobile, persistent on desktop */}
      <div className="hidden lg:block bg-transparent">
        <div className="duo-card p-6 bg-white sticky top-20">
          <h4 className="text-xs font-sans text-brand-muted uppercase tracking-widest mb-4 font-extrabold border-b border-brand-border pb-2">
            Constituent Parser • စကားလုံးခွဲခြမ်းစိတ်ဖြာချက်
          </h4>

          {selectedWord ? (
            <motion.div
              key={selectedWord.thai}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Thai Word Title */}
              <div className="duo-card p-5 border-brand-purple/20 bg-brand-purple-light/20 flex justify-between items-center">
                <div>
                  <div className="text-3xl font-sans font-black text-brand-purple select-all">{selectedWord.thai}</div>
                  <div className="text-xs font-mono text-[#58cc02] font-black tracking-wide mt-1">({selectedWord.phonetic})</div>
                  {selectedWord.phonetic && (
                    <div className="text-[11px] font-sans text-emerald-600 font-bold mt-1">အသံထွက်: {getMyanmarPhonetic(selectedWord.phonetic)}</div>
                  )}
                </div>
                <button
                  onClick={() => speakThai(selectedWord.thai)}
                  className="px-3 h-11 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-2xl border-b-4 border-brand-purple-shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm"
                  title={`Speak this word (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                >
                  {audioSpeedIndex === 0 ? (
                    <>
                      <Volume2 className="w-5 h-5 fill-current text-white" />
                      <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">1.0x</span>
                    </>
                  ) : audioSpeedIndex === 1 ? (
                    <>
                      <Volume1 className="w-5 h-5 fill-current text-white" />
                      <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">0.7x</span>
                    </>
                  ) : (
                    <>
                      <Volume className="w-5 h-5 fill-current text-white" />
                      <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">0.5x</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tag / Part of Speech */}
              <div className="inline-block bg-[#efe6fc] text-brand-purple border border-brand-purple/20 text-[10px] font-sans font-black uppercase px-3 py-1 rounded-full">
                {selectedWord.partOfSpeech}
              </div>

              {/* Definitions */}
              <div className="space-y-3">
                <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                  <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">Myanmar Translation • မြန်မာပြန်အဓိပ္ပာယ်</div>
                  <div className="text-sm font-sans font-black text-brand-dark mt-1">{selectedWord.myanmar}</div>
                </div>

                <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                  <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">English Meaning • အင်္ဂလိပ်ပြန်</div>
                  <div className="text-xs font-sans font-medium text-brand-muted mt-1 leading-normal">{selectedWord.english}</div>
                </div>
              </div>

              {/* Master Word Trigger */}
              <button
                onClick={() => onWordMastered(selectedWord.thai)}
                className={`w-full py-4.5 px-4 rounded-2xl font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all border-2 border-b-4 ${
                  masteredWords.includes(selectedWord.thai)
                    ? 'bg-[#58cc02] hover:bg-[#61df02] text-white border-[#58cc02] border-b-brand-green-shadow'
                    : 'bg-white border-[#e5e5e5] border-b-[#ccc] text-brand-purple hover:bg-gray-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${masteredWords.includes(selectedWord.thai) ? 'fill-current text-white' : 'text-brand-muted'}`} />
                {masteredWords.includes(selectedWord.thai)
                  ? 'Mastered! • နှုတ်တိုက်ရပြီးဖြစ်သည်'
                  : 'Mark as Mastered • မှတ်သားရန်'}
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-brand-muted">
              <HelpCircle className="w-12 h-12 text-[#9333ea]/30 mb-3 animate-bounce" />
              <p className="text-xs font-sans max-w-[200px] leading-relaxed text-brand-muted font-medium">
                Click any word in a sentence card to view its meaning, parts of speech, and Burmese translation.
              </p>
              <p className="text-[10px] text-brand-purple mt-3.5 font-bold uppercase tracking-widest bg-brand-purple-light px-3 py-1 rounded-full">
                နှိပ်ပြီး လေ့လာပါ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sliding Bottom Sheet - Rendered with backdrop overlay and interactive close controls */}
      <AnimatePresence>
        {selectedWord && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWord(null)}
              className="absolute inset-0 bg-brand-dark/50"
            />
            
            {/* Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl p-6 overflow-y-auto border-t border-brand-purple/10 z-10"
            >
              {/* Drag Indicator Bar */}
              <div 
                className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full mb-5 cursor-pointer hover:bg-gray-300" 
                onClick={() => setSelectedWord(null)} 
              />
              
              {/* Drawer Title Block */}
              <div className="flex justify-between items-center mb-4 border-b border-brand-border pb-3">
                <span className="text-[10px] font-sans text-brand-purple uppercase tracking-widest font-black">
                  Constituent Parser • စကားလုံးခွဲခြမ်းစိတ်ဖြาချက်
                </span>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-sans font-black text-sm text-brand-muted hover:bg-gray-200 hover:text-brand-dark transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {/* Main Word Information */}
              <div className="space-y-4">
                <div className="p-4.5 border border-brand-purple/10 bg-brand-purple-light/20 flex justify-between items-center rounded-2xl">
                  <div>
                    <div className="text-2xl font-sans font-black text-brand-purple select-all">{selectedWord.thai}</div>
                    <div className="text-xs font-mono text-[#58cc02] font-black tracking-wide mt-1">({selectedWord.phonetic})</div>
                    {selectedWord.phonetic && (
                      <div className="text-[11px] font-sans text-emerald-600 font-bold mt-1">အသံထွက်: {getMyanmarPhonetic(selectedWord.phonetic)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => speakThai(selectedWord.thai)}
                    className="px-3 h-12 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-2xl border-b-4 border-brand-purple-shadow flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
                    title={`Speak this word (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                  >
                    {audioSpeedIndex === 0 ? (
                      <>
                        <Volume2 className="w-5 h-5 fill-current text-white" />
                        <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">1.0x</span>
                      </>
                    ) : audioSpeedIndex === 1 ? (
                      <>
                        <Volume1 className="w-5 h-5 fill-current text-white" />
                        <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">0.7x</span>
                      </>
                    ) : (
                      <>
                        <Volume className="w-5 h-5 fill-current text-white" />
                        <span className="text-[10px] font-sans font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md select-none leading-none">0.5x</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="inline-block bg-[#efe6fc] text-brand-purple border border-brand-purple/20 text-[10px] font-sans font-black uppercase px-3 py-1 rounded-full">
                  {selectedWord.partOfSpeech}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                    <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">Myanmar Translation • မြန်မာပြန်အဓိပ္ပာယ်</div>
                    <div className="text-sm font-sans font-black text-brand-dark mt-1">{selectedWord.myanmar}</div>
                  </div>

                  <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                    <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">English Meaning • အင်္ဂလိပ်ပြန်</div>
                    <div className="text-xs font-sans font-medium text-brand-muted mt-1 leading-normal">{selectedWord.english}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onWordMastered(selectedWord.thai);
                  }}
                  className={`w-full py-4 px-4 rounded-2xl font-sans font-bold text-xs flex items-center justify-center gap-2 transition-all border-2 border-b-4 ${
                    masteredWords.includes(selectedWord.thai)
                      ? 'bg-[#58cc02] text-white border-[#58cc02] border-b-brand-green-shadow'
                      : 'bg-white border-[#e5e5e5] border-b-[#ccc] text-brand-purple'
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${masteredWords.includes(selectedWord.thai) ? 'fill-current text-white' : 'text-brand-muted'}`} />
                  {masteredWords.includes(selectedWord.thai)
                    ? 'Mastered! • နှုတ်တိုက်ရပြီးဖြစ်သည်'
                    : 'Mark as Mastered • \}မှတ်သားရန်'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
