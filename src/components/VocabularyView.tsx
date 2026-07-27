import React, { useState, useEffect, useMemo } from 'react';
import { WordBreakdown } from '../types';
import { getMyanmarPhonetic } from '../utils/sentenceUtils';
import { pdfVocabulary } from '../data/pdfVocabulary';
import { Volume2, Volume1, Volume, HelpCircle, CheckCircle, Award, RefreshCw, Smile, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { localDB } from '../utils/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface VocabularyViewProps {
  lessonId: number;
  onWordMastered: (word: string) => void;
  masteredWords: string[];
  audioSpeedIndex: number;
  setAudioSpeedIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function VocabularyView({
  lessonId,
  onWordMastered,
  masteredWords,
  audioSpeedIndex,
  setAudioSpeedIndex
}: VocabularyViewProps) {
  const [selectedWord, setSelectedWord] = useState<WordBreakdown | null>(null);

  const liveWords = useLiveQuery(() => localDB.words_and_audio.toArray());

  const words = useMemo(() => {
    if (liveWords && liveWords.length > 0) {
      return liveWords.map(w => ({
        thai: w.thai_text || '',
        english: w.english_text || '',
        myanmar: w.myanmar_text || '',
        phonetic: w.phonetic || '',
        myanmarPhonetic: w.phonetic_mm || undefined,
        partOfSpeech: w.category || 'vocab',
        audioUrl: w.audio_url || undefined,
        pdf_drive_url: w.pdf_drive_url
      })) as WordBreakdown[];
    }
    
    // Fallback
    const saved = localStorage.getItem(`thai_custom_vocab_${lessonId}`);
    let loadedWords = pdfVocabulary[lessonId] || [];
    if (saved) {
      try {
        loadedWords = JSON.parse(saved);
      } catch (e) {
        console.error("Error loading custom vocabulary:", e);
      }
    }
    return loadedWords;
  }, [liveWords, lessonId]);

  useEffect(() => {
    if (words.length > 0) {
      if (!selectedWord || !words.some(w => w.thai === selectedWord.thai)) {
        setSelectedWord(words[0]);
      }
    } else {
      setSelectedWord(null);
    }
  }, [words, selectedWord]);

  
  // Trainer state
  const [studyMode, setStudyMode] = useState<'study' | 'quiz'>('study');
  const [quizQuestions, setQuizQuestions] = useState<{ word: WordBreakdown; options: string[]; answer: string }[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [selectedQuizAns, setSelectedQuizAns] = useState<string | null>(null);
  const [isQuizAnsChecked, setIsQuizAnsChecked] = useState<boolean>(false);
  const [correctQuizCount, setCorrectQuizCount] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Web Speech synthesis or cached offline audio for vocabulary item
  const speakWord = async (text: string) => {
    // Cycle sound speed trigger: 0 (1.0x) -> 1 (0.7x) -> 2 (0.5x)
    const nextIndex = (audioSpeedIndex + 1) % 3;
    setAudioSpeedIndex(nextIndex);

    try {
      const cleanText = text.trim();
      const match = await localDB.words_and_audio
        .where('thai_text').equalsIgnoreCase(cleanText)
        .first();

      if (match && (match.audio_blob || match.audio_url)) {
        const audioUrl = match.audio_blob ? URL.createObjectURL(match.audio_blob) : match.audio_url!;
        const audio = new Audio(audioUrl);
        
        const rates = [1.0, 0.85, 0.7]; // Speed options matching the speeds
        audio.playbackRate = rates[nextIndex];
        
        audio.play().catch(err => {
          console.warn("Audio play failed, falling back to TTS:", err);
          runTTS(text, nextIndex);
        });
        return;
      }
    } catch (e) {
      console.warn("Offline audio check failed in VocabularyView, falling back to TTS:", e);
    }
    runTTS(text, nextIndex);
  };

  const runTTS = (text: string, nextIndex: number) => {
    if (!('speechSynthesis' in window)) return;

    const rates = [0.85, 0.7, 0.5];
    const rate = rates[nextIndex];

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  // Generate vocabulary matching questions
  const startVocabularyQuiz = () => {
    if (words.length === 0) return;
    
    const questionsList = words.map(w => {
      // Pick 3 random distractor meanings from other words in this lesson or general items
      const otherMeanings = words
        .filter(item => item.thai !== w.thai)
        .map(item => item.myanmar);
      
      const shuffledDistractors = [...otherMeanings].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...shuffledDistractors, w.myanmar].sort(() => Math.random() - 0.5);

      return {
        word: w,
        options,
        answer: w.myanmar
      };
    });

    setQuizQuestions(questionsList.sort(() => Math.random() - 0.5));
    setCurrentQuizIdx(0);
    setSelectedQuizAns(null);
    setIsQuizAnsChecked(false);
    setCorrectQuizCount(0);
    setQuizCompleted(false);
    setStudyMode('quiz');
  };

  const handleSelectQuizAns = (opt: string) => {
    if (isQuizAnsChecked) return;
    setSelectedQuizAns(opt);
  };

  const handleCheckQuizAnswer = () => {
    if (selectedQuizAns === quizQuestions[currentQuizIdx].answer) {
      setCorrectQuizCount(correctQuizCount + 1);
    }
    setIsQuizAnsChecked(true);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
      setSelectedQuizAns(null);
      setIsQuizAnsChecked(false);
    } else {
      setQuizCompleted(true);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="vocab-section-view">
      
      {/* Upper Mode Select and Intro Header */}
      <div className="duo-card p-6 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-white bg-brand-purple px-3 py-1 rounded-full border-b-2 border-brand-purple-shadow select-none">
            Lesson Vocabulary • ဝေါဟာရသင်ခန်းစာ
          </span>
          <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark mt-2">
            PDF Core Wordlist • အခြေခံစကားလုံး ၁၀ လုံး
          </h3>
          <p className="text-xs text-brand-muted font-sans font-semibold mt-1">
            Build native vocabulary from official lesson syllabus. Practice listening with speech synthesis.
          </p>
        </div>

        {/* Buttons to shift between Study and Quiz Mode */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStudyMode('study')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center ${
              studyMode === 'study'
                ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
            }`}
          >
            Study Guide • လေ့လာရန်
          </button>
          <button
            onClick={startVocabularyQuiz}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center ${
              studyMode === 'quiz'
                ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
            }`}
          >
            Vocab Trainer • ဉာဏ်စမ်းကစားမည်
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {studyMode === 'study' ? (
          /* STUDY MODE PANEL */
          <motion.div
            key="study"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Word Grid Column (Left/Mid) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="duo-card p-6 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 select-none">
                  <span className="text-[10px] font-sans text-brand-muted uppercase tracking-widest font-black">
                    Syllabus Word List
                  </span>
                  <span className="text-[10px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded-md font-bold">
                    {words.length} items to master
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {words.map((w, idx) => {
                    const isSelected = selectedWord?.thai === w.thai;
                    const isMastered = masteredWords.includes(w.thai);

                    const getPosEmoji = (pos?: string) => {
                      const p = (pos || '').toLowerCase();
                      if (p.includes('noun')) return '📝';
                      if (p.includes('verb')) return '🏃‍♂️';
                      if (p.includes('pronoun')) return '👤';
                      if (p.includes('adjective') || p.includes('adj')) return '✨';
                      if (p.includes('adverb') || p.includes('adv')) return '⚡';
                      if (p.includes('phrase') || p.includes('sentence')) return '🗣️';
                      return '📖';
                    };

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
                      <button
                        key={idx}
                        onClick={() => setSelectedWord(w)}
                        className={`text-left p-3.5 sm:p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 focus:outline-none group ${
                          isSelected
                            ? 'bg-brand-purple/5 border-brand-purple shadow-xs'
                            : isMastered
                            ? 'bg-brand-green-light/25 hover:bg-brand-green-light/45 text-brand-dark border-brand-green/20'
                            : 'bg-white hover:bg-gray-50 text-brand-dark border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Left side Visual POS beautiful pastel badge */}
                          <div className={`w-13 h-13 sm:w-14 sm:h-14 ${pastelClass} rounded-2xl flex items-center justify-center text-2xl shrink-0 select-none transition-transform duration-300 group-hover:scale-105`}>
                            {getPosEmoji(w.partOfSpeech)}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Thai script & green phonetic pronunciation */}
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className={`font-sans font-extrabold text-base sm:text-lg select-all tracking-wide ${isSelected ? 'text-brand-purple' : 'text-[#222]'}`}>
                                {w.thai}
                              </span>
                              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 select-all">
                                ({w.phonetic})
                              </span>
                            </div>

                            {/* Myanmar translation directly below */}
                            <div className="text-xs sm:text-[13.5px] font-sans mt-1 font-bold text-slate-700 leading-tight truncate">
                              {w.myanmar}
                            </div>

                            {w.phonetic && (
                              <div className="text-[10px] font-sans text-slate-400 font-bold mt-1.5">
                                အသံထွက်: <span className="text-slate-500 bg-slate-50 px-1 py-0.5 rounded text-[9px] font-extrabold">{getMyanmarPhonetic(w.phonetic)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Speaker circle icon button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(w.thai);
                          }}
                          className={`w-9.5 h-9.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-brand-purple text-white border-brand-purple'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-brand-purple group-hover:scale-105 shadow-3xs'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Word Breakdown/Parser Detail Panel (Right) */}
            <div className="space-y-6">
              <div className="duo-card p-6 bg-white sticky top-24 border-2 border-gray-100">
                <h4 className="text-xs font-sans text-brand-muted uppercase tracking-widest mb-4 font-black border-b border-gray-100 pb-2">
                  Vocab Parser • စကားလုံးအသေးစိတ်ကြည့်ရှုရန်
                </h4>

                {selectedWord ? (
                  <motion.div
                    key={selectedWord.thai}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <div className="duo-card p-4.5 border-brand-purple/10 bg-brand-purple-light/20 flex justify-between items-center rounded-2xl">
                      <div>
                        <div className="text-3xl font-sans font-black text-brand-purple uppercase">{selectedWord.thai}</div>
                        <div className="text-xs font-mono text-[#58cc02] font-black tracking-wide mt-1">({selectedWord.phonetic})</div>
                        {selectedWord.phonetic && (
                          <div className="text-[11px] font-sans text-emerald-600 font-bold mt-1">အသံထွက်: {getMyanmarPhonetic(selectedWord.phonetic)}</div>
                        )}
                      </div>

                      <button
                        onClick={() => speakWord(selectedWord.thai)}
                        className="w-11 h-11 bg-brand-purple hover:bg-brand-purple-hover text-white rounded-2xl border-b-4 border-brand-purple-shadow flex items-center justify-center transition-all active:scale-95 shadow-sm"
                        title={`Listen (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                      >
                        {audioSpeedIndex === 0 ? (
                          <Volume2 className="w-5 h-5 text-white" />
                        ) : audioSpeedIndex === 1 ? (
                          <Volume1 className="w-5 h-5 text-white" />
                        ) : (
                          <Volume className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="inline-block bg-[#efe6fc] text-brand-purple border border-brand-purple/25 text-[10px] font-sans font-black uppercase px-3 py-1 rounded-full whitespace-nowrap">
                        {selectedWord.partOfSpeech}
                      </div>

                      {masteredWords.includes(selectedWord.thai) && (
                        <div className="inline-block bg-brand-green-light text-brand-green border border-brand-green/20 text-[10px] font-sans font-black uppercase px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 fill-current" />
                          Mastered
                        </div>
                      )}
                    </div>

                    {/* Translations */}
                    <div className="space-y-3.5">
                      <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                        <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">Myanmar Definition • မြန်မာဘာသာပြန်</div>
                        <div className="text-sm font-sans font-black text-brand-dark mt-1 leading-normal">{selectedWord.myanmar}</div>
                      </div>

                      <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                        <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider">English Definition • အင်္ဂလိပ်အနှစ်သာရ</div>
                        <div className="text-xs font-sans font-semibold text-brand-muted mt-1 leading-relaxed">{selectedWord.english}</div>
                      </div>
                    </div>

                    {/* Media Assets */}
                    {(selectedWord.audioUrl || selectedWord.pdf_drive_url) && (
                      <div className="space-y-3.5 mt-4">
                        {selectedWord.audioUrl && (
                          <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                            <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider mb-2">Native Audio Track</div>
                            <audio controls src={selectedWord.audioUrl} className="w-full h-8" />
                          </div>
                        )}
                        {selectedWord.pdf_drive_url && (
                          <div className="duo-card p-4 bg-white border-brand-border shadow-[0_2px_0_0_#efefef]">
                            <div className="text-[10px] uppercase font-sans text-brand-muted font-bold tracking-wider mb-2">Reference PDF</div>
                            <a href={selectedWord.pdf_drive_url} target="_blank" rel="noreferrer" className="text-xs font-sans font-bold text-brand-purple hover:underline flex items-center gap-1">
                              📄 Open Google Drive PDF
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mark as Mastered button */}
                    <button
                      onClick={() => onWordMastered(selectedWord.thai)}
                      className={`w-full py-4 px-4 rounded-2xl font-sans font-extrabold text-xs flex items-center justify-center gap-2 transition-all border-2 border-b-4 ${
                        masteredWords.includes(selectedWord.thai)
                          ? 'bg-[#58cc02] text-white border-[#58cc02] border-b-brand-green-shadow hover:bg-[#61df02]'
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
                      Select any vocabulary card to view full breakdowns, speech accents, and translations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* VOCAB TRAINER MATCHING QUIZ MODE */
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="duo-card max-w-xl mx-auto bg-white overflow-hidden shadow-sm"
          >
            {!quizCompleted ? (
              <div className="p-6 md:p-8">
                {/* Tracker Indicator */}
                <div className="flex justify-between items-center text-xs font-sans mb-6 text-brand-muted">
                  <span className="font-sans font-black uppercase text-[#fff] bg-brand-purple px-2.5 py-1 rounded-full border-b-2 border-brand-purple-shadow">
                    Vocab Trainer • ဝေါဟာရလေ့ကျင့်သူ
                  </span>
                  <span className="font-sans font-black text-brand-purple bg-brand-purple-light px-3 py-1 rounded-full">
                    Question {currentQuizIdx + 1} / {quizQuestions.length}
                  </span>
                </div>

                {/* Pronunciation block */}
                <div className="duo-card bg-brand-purple-light/25 border-brand-purple/20 p-6 text-center mb-6 flex flex-col items-center">
                  <h4 className="text-3xl font-sans font-black text-brand-purple">{quizQuestions[currentQuizIdx].word.thai}</h4>
                  <div className="text-xs font-mono text-[#58cc02] font-black tracking-wide mt-1.5 bg-white/70 px-3 py-0.5 rounded-full select-none">
                    ({quizQuestions[currentQuizIdx].word.phonetic})
                  </div>
                  {quizQuestions[currentQuizIdx].word.phonetic && (
                    <div className="text-[11px] font-sans text-emerald-600 font-bold mt-1.5 bg-white/70 px-3 py-0.5 rounded-full select-none">
                      အသံထွက်: {getMyanmarPhonetic(quizQuestions[currentQuizIdx].word.phonetic)}
                    </div>
                  )}
                  
                  <button
                    onClick={() => speakWord(quizQuestions[currentQuizIdx].word.thai)}
                    className="mt-4 px-4 py-2 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Volume2 className="w-4 h-4 fill-current" />
                    Hear Accent • အသံနားထောင်ပါ
                  </button>
                </div>

                <h3 className="text-md sm:text-base font-sans font-black text-brand-dark mb-4 text-center">
                  Choose the correct translation for the Thai word above:
                </h3>

                {/* Options list */}
                <div className="space-y-2.5 mb-6">
                  {quizQuestions[currentQuizIdx].options.map((opt, oIdx) => {
                    const isSelected = selectedQuizAns === opt;
                    const isCorrect = opt === quizQuestions[currentQuizIdx].answer;
                    const isIncorrect = isSelected && !isCorrect;

                    let optClass = "bg-white border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark";
                    if (isQuizAnsChecked) {
                      if (isCorrect) {
                        optClass = "duo-card-success border-b-brand-green-shadow text-brand-green font-black";
                      } else if (isIncorrect) {
                        optClass = "bg-red-50 border-red-300 border-b-red-500 text-red-600 line-through font-semibold";
                      } else {
                        optClass = "bg-white border-gray-100 text-brand-muted opacity-40";
                      }
                    } else if (isSelected) {
                      optClass = "duo-card-active border-b-brand-purple-shadow text-brand-purple font-black";
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectQuizAns(opt)}
                        className={`w-full text-left p-4 rounded-xl text-xs font-black transition-all flex justify-between items-center ${optClass}`}
                      >
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions footer */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  {!isQuizAnsChecked ? (
                    <button
                      disabled={!selectedQuizAns}
                      onClick={handleCheckQuizAnswer}
                      className={`duo-btn text-xs px-6 py-2.5 ${
                        !selectedQuizAns ? 'duo-btn-disabled' : 'duo-btn-purple'
                      }`}
                    >
                      Verify • စစ်ဆေးမည်
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuizQuestion}
                      className="duo-btn duo-btn-purple text-xs px-6 py-2.5"
                    >
                      Next Question • ဆက်သွားရန်
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* RESULTS DASHBOARD OR END */
              <div className="p-8 text-center bg-white rounded-2xl">
                <div className="w-16 h-16 bg-brand-purple text-white rounded-full flex items-center justify-center mx-auto mb-5 border-b-4 border-brand-purple-shadow">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-sans font-black text-[#3a1a68] uppercase">
                  Trainer Complete! • လေ့ကျင့်မှု ပြီးဆုံးပါပြီ
                </h3>
                <p className="text-xs text-brand-muted font-sans mt-1">
                  You matched {correctQuizCount} out of {quizQuestions.length} vocabulary words accurately.
                </p>

                <div className="my-6 p-4 bg-gray-50 rounded-2xl inline-block">
                  <div className="text-2xl font-sans font-black text-brand-purple">
                    {correctQuizCount === quizQuestions.length ? "Perfect Score! 🌟" : `${correctQuizCount} / ${quizQuestions.length}`}
                  </div>
                  <div className="text-[10px] font-sans font-bold text-brand-muted uppercase tracking-wider mt-1">Vocabulary mastery rate</div>
                </div>

                <div className="flex justify-center gap-3 border-t border-gray-100 pt-5">
                  <button
                    onClick={() => setStudyMode('study')}
                    className="duo-btn duo-btn-white text-xs px-5 py-2"
                  >
                    Back to Study • စာပြန်ဖတ်မည်
                  </button>
                  <button
                    onClick={startVocabularyQuiz}
                    className="duo-btn duo-btn-purple text-xs px-5 py-2"
                  >
                    Retry Trainer • ပြန်ကစားမည်
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
