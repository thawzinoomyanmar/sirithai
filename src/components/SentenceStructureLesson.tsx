import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Volume2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface SentenceStructureLessonProps {
  onBack: () => void;
}

// 6 Verbs defined in Page 1
const VERBS = [
  { thai: "กิน", myanmar: "စားသည်", english: "eat", phonetic: "kin" },
  { thai: "ไป", myanmar: "သွားသည်", english: "go", phonetic: "bpai" },
  { thai: "ทำ", myanmar: "လုပ်သည်", english: "do", phonetic: "tham" },
  { thai: "นอน", myanmar: "အိပ်သည်", english: "sleep", phonetic: "nɔ́ɔn" },
  { thai: "ซื้อ", myanmar: "ဝယ်သည်", english: "buy", phonetic: "sʉ́ʉ" },
  { thai: "มา", myanmar: "လာသည်", english: "come", phonetic: "maa" },
];

// Subjects/Pronouns for dropdown builder
const SUBJECTS = [
  { thai: "ฉัน", myanmar: "ကျွန်မ (I - female)", english: "I (fem.)" },
  { thai: "ผม", myanmar: "ကျွန်တော် (I - male)", english: "I (masc.)" },
  { thai: "เรา", myanmar: "ငါတို့ (We)", english: "We" },
  { thai: "คุณ", myanmar: "မင်း (You)", english: "You" },
  { thai: "เขา", myanmar: "သူ (He/She)", english: "He/She" },
];

// 11 modifiers for Page 2
const PART2_ITEMS = [
  { ID: 1, MODIFIER: "จะ", THAI_CLEAN: "จะทำ", PHONETIC: "cà' tham (ကျသမ်)", MYANMAR: "လုပ်မည်", TITLE: "จะทำ" },
  { ID: 2, MODIFIER: "อาจจะ... (ก็)", THAI_CLEAN: "อาจจะทำก็", PHONETIC: "àat cà' tham kɔ̂ (အာတ်ကျသမ်ကော)", MYANMAR: "လုပ်ကောင်းလုပ်မည်", TITLE: "อาจจะทำ(ก็)" },
  { ID: 3, MODIFIER: "กำลังจะ... (อยู่)", THAI_CLEAN: "กำลังจะทำอยู่", PHONETIC: "kam-laŋ cà' tham jùu (ကမ်လန်းကျသမ်ယူ)", MYANMAR: "လုပ်တော့မည်", TITLE: "กำลังจะทำ(อยู่)" },
  { ID: 4, MODIFIER: "ควร จะ... (ก็)", THAI_CLEAN: "ควรจะทำก็", PHONETIC: "khuuan cà' tham kɔ̂ (ခူဝမ်ကျသမ်ကော)", MYANMAR: "လုပ်သင့်သည်", TITLE: "ควร จะทำ(ก็)" },
  { ID: 5, MODIFIER: "ต้อง... (ก็)", THAI_CLEAN: "ต้องทำก็", PHONETIC: "dtɔ̂ŋ tham kɔ̂ (တောင်သမ်ကော)", MYANMAR: "လုပ်ရမည်", TITLE: "ต้อง ทำ(ก็)" },
  { ID: 6, MODIFIER: "อยาก... (ก็)", THAI_CLEAN: "อยากทำก็", PHONETIC: "jàak tham kɔ̂ (ယာတ်သမ်ကော)", MYANMAR: "လုပ်ချင်သည်", TITLE: "อยาก ทำ(ก็)" },
  { ID: 7, MODIFIER: "อย่า...", THAI_CLEAN: "อย่าทำ", PHONETIC: "jàa tham (ယာသမ်)", MYANMAR: "မလုပ်နှင့်", TITLE: "อย่า ทำ" },
  { ID: 8, MODIFIER: "ไม่ ต้อง...", THAI_CLEAN: "ไม่ต้องทำ", PHONETIC: "mâj dtɔ̂ŋ tham (မိုင်တောင်သမ်)", MYANMAR: "မလုပ်ရ", TITLE: "ไม่ ต้อง" },
  { ID: 9, MODIFIER: "ไม่ควร ... ... (ก็)", THAI_CLEAN: "ไม่ควรทำก็", PHONETIC: "mâj khuuan tham kɔ̂ (မိုင်ခူဝမ်သမ်ကော)", MYANMAR: "မလုပ်သင့်", TITLE: "ไม่ควร ... ทำ(ก็)" },
  { ID: 10, MODIFIER: "ไม่ต้อง ... ... (ก็)", THAI_CLEAN: "ไม่ต้องทำก็", PHONETIC: "mâj dtɔ̂ŋ tham kɔ̂ (မိုင်တောင်သမ်ကော)", MYANMAR: "မလုပ်ရ", TITLE: "ไม่ต้อง ... ทำ(ก็)" },
  { ID: 11, MODIFIER: "ไม่เอา ... ... (ก็)", THAI_CLEAN: "ไม่เอาทำก็", PHONETIC: "mâj aw tham kɔ̂ (မိုင်အောင်းသမ်ကော)", MYANMAR: "မလုပ်ချင်", TITLE: "ไม่เอา ... ทำ(ก็)" }
];

const PAGE4_MAPPINGS = [
  { ID: 1, THAI: "จะทำ", MYANMAR: "လုပ်မည်", PHONETIC: "cà' tham" },
  { ID: 2, THAI: "อาจจะทำ(ก็)", MYANMAR: "လုပ်ကောင်းလုပ်မည်", PHONETIC: "àat cà' tham kɔ̂" },
  { ID: 3, THAI: "กำลังจะทำ(อยู่)", MYANMAR: "လုပ်တော့မည်", PHONETIC: "kam-laŋ cà' tham jùu" },
  { ID: 4, THAI: "ควร จะทำ(ก็)", MYANMAR: "လုပ်သင့်သည်", PHONETIC: "khuuan cà' tham kɔ̂" },
  { ID: 5, THAI: "ต้อง ทำ(ก็)", MYANMAR: "လုပ်ရမည်", PHONETIC: "dtɔ̂ŋ tham kɔ̂" },
  { ID: 6, THAI: "อยาก ทำ(ก็)", MYANMAR: "လုပ်ချင်သည်", PHONETIC: "jàak tham kɔ̂" },
  { ID: 7, THAI: "อย่า ทำ", MYANMAR: "မလုပ်နှင့်", PHONETIC: "jàa tham" },
  { ID: 8, THAI: "ไม่ ต้อง", MYANMAR: "မလုပ်ရ", PHONETIC: "mâj dtɔ̂ŋ" },
  { ID: 9, THAI: "ไม่ควร ... ทำ(ก็)", MYANMAR: "မလုပ်သင့်", PHONETIC: "mâj khuuan tham kɔ̂" },
  { ID: 10, THAI: "ไม่ต้อง ... ทำ(ก็)", MYANMAR: "မလုပ်ရ", PHONETIC: "mâj dtɔ̂ŋ tham kɔ̂" },
  { ID: 11, THAI: "ไม่เอา ... ทำ(ก็)", MYANMAR: "မလုပ်ချင်", PHONETIC: "mâj aw tham kɔ̂" }
];

export default function SentenceStructureLesson({ onBack }: SentenceStructureLessonProps) {
  // Page State
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);

  // Sentence builder state
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedGrammar, setSelectedGrammar] = useState("จะ");
  const [selectedVerb, setSelectedVerb] = useState(VERBS[1]); // Default Verb is "ไป" (go) as [ฉัน] [จะ] [ไป]
  
  // Page 2 State
  const [selectedPart2Item, setSelectedPart2Item] = useState(PART2_ITEMS[0]);

  // Page 4 State
  const [selectedPage4Idx, setSelectedPage4Idx] = useState<number>(0);

  const [activeSpeechWord, setActiveSpeechWord] = useState<string | null>(null);

  // Pronounce function for Thai text
  const speakThaiText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("TTS not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.85; // Natural slow educational rate

    setActiveSpeechWord(text);
    utterance.onend = () => setActiveSpeechWord(null);
    window.speechSynthesis.speak(utterance);
  };

  // Get Myanmar translation of compiled Subject + จะ + Verb / Modifier
  const getCompiledBurmese = () => {
    const s = selectedSubject.thai;

    // Pronouns prefix
    let subjMm = "ကျွန်မ";
    if (s === "ผม") subjMm = "ကျွန်တော်";
    if (s === "เรา") subjMm = "ငါတို့";
    if (s === "คุณ") subjMm = "မင်း";
    if (s === "เขา") subjMm = "သူ";

    if (currentPage === 1) {
      const v = selectedVerb.thai;
      // Verbs Future markers
      let verbMm = "သွားမယ်။";
      if (v === "กิน") verbMm = "စားမယ်။";
      if (v === "ทำ") verbMm = "လုပ်မယ်။";
      if (v === "นอน") verbMm = "အိပ်မယ်။";
      if (v === "ซื้อ") verbMm = "ဝယ်မယ်။";
      if (v === "มา") verbMm = "လာမယ်။";

      return `${subjMm} ${verbMm}`;
    } else if (currentPage === 2) {
      const v = selectedVerb.thai;
      // Verbs Continuous markers (နေသည်)
      let verbMm = "သွားနေသည်။";
      if (v === "กิน") verbMm = "စားနေသည်။";
      if (v === "ทำ") verbMm = "လုပ်နေသည်။";
      if (v === "นอน") verbMm = "အိပ်နေသည်။";
      if (v === "ซื้อ") verbMm = "ဝယ်နေသည်။";
      if (v === "มา") verbMm = "လာနေသည်။";

      return `${subjMm} ${verbMm}`;
    } else {
      // For page 3: selectedPart2Item.MYANMAR contains the translation of the action "လုပ်..."
      return `${subjMm} ${selectedPart2Item.MYANMAR}`;
    }
  };

  return (
    <div id="grammar-lesson-device-wrapper" className="flex justify-center items-center py-6 px-4 bg-[#f8fafc]/30 min-h-[calc(100vh-140px)]">
      {/* Outer Smartphone Mockup Shell Container */}
      <div 
        id="phone-mockup-frame" 
        className="w-full max-w-[430px] bg-white rounded-[50px] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col relative aspect-[9/19.5]"
      >
        {/* Phone Notch/Speaker Header Accent */}
        <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 flex justify-center items-end pb-1.5 z-50">
          <div className="w-28 h-4.5 bg-slate-900 rounded-b-xl flex items-center justify-between px-4">
            <span className="text-[10px] font-semibold text-white/90">9:41</span>
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <div className="flex gap-0.5 items-end h-2">
                <span className="w-0.5 h-1 bg-white/95 rounded-3xs" />
                <span className="w-0.5 h-1.5 bg-white/95 rounded-3xs" />
                <span className="w-0.5 h-2 bg-white/95 rounded-3xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Header bar inside App */}
        <header id="phone-app-header" className="pt-10 pb-4 px-6 border-b border-gray-100 flex items-center justify-between bg-white z-40">
          <button 
            id="btn-structure-back"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer group active:scale-95"
            aria-label="Back to previous menu"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <h1 className="text-lg font-sans font-black text-slate-800 tracking-tight text-center flex-1 pr-10">
            โครงสร้างประโยค
          </h1>
        </header>

        {/* Scrollable Lesson Body Frame */}
        <main id="phone-app-body" className="flex-1 overflow-y-auto p-5 space-y-6 pb-20 select-none scrollbar-none bg-[#fafbfc]">
          
          {/* 1. Large Top Grammar Focus Card */}
          {currentPage === 1 ? (
            <div 
              id="top-grammar-focus-card"
              className="bg-[#f0f9eb] border border-[#e1f3d8] rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#e1f3d8]/40 rounded-full translate-x-4 -translate-y-4" />
              
              <h2 className="text-5xl font-sans font-black text-[#67c23a] tracking-tight mb-2">
                จะ
              </h2>
              <p className="text-sm font-sans font-extrabold text-[#6ac043]/90 mb-1">
                จะ (will)
              </p>
              <p className="text-lg font-sans font-black text-emerald-800 leading-tight">
                မယ့် / လိမ့်မယ်။
              </p>
            </div>
          ) : currentPage === 2 ? (
            <div 
              id="top-grammar-focus-card-page2"
              className="bg-[#fdf6ec] border border-[#f5dab1] rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#f5dab1]/40 rounded-full translate-x-4 -translate-y-4" />
              
              <h2 className="text-5xl font-sans font-black text-[#e6a23c] tracking-tight mb-2">
                กำลัง
              </h2>
              <p className="text-sm font-sans font-extrabold text-[#e6a23c]/90 mb-1">
                กำลัง (is/are -ing)
              </p>
              <p className="text-lg font-sans font-black text-amber-800 leading-tight">
                နေသည်။
              </p>
            </div>
          ) : currentPage === 3 ? (
            <div 
              id="top-grammar-focus-card-page3"
              className="bg-[#f4f2fc] border border-[#e8e4f9] rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#e8e4f9]/40 rounded-full translate-x-4 -translate-y-4" />
              
              <h2 className="text-5xl font-sans font-black text-[#583092] tracking-tight mb-2">
                ทำ
              </h2>
              <p className="text-sm font-sans font-extrabold text-[#7c3aed]/90 mb-1">
                ทำ (to do / make)
              </p>
              <p className="text-lg font-sans font-black text-violet-800 leading-tight">
                လုပ်သည်။
              </p>
            </div>
          ) : (
            <div 
              id="top-grammar-focus-card-page4"
              className="bg-[#ecf5ff] border border-[#d9ecff] rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#d9ecff]/40 rounded-full translate-x-4 -translate-y-4" />
              
              <h2 className="text-4xl font-sans font-black text-[#409eff] tracking-tight mb-2">
                ผังประโยค
              </h2>
              <p className="text-sm font-sans font-extrabold text-[#409eff]/90 mb-1">
                Sentence Mapping (ทำ = လုပ်)
              </p>
              <p className="text-lg font-sans font-black text-blue-800 leading-tight">
                สลับประโยค • စကားလုံးချိတ်ဆက်ပုံ
              </p>
            </div>
          )}

          {/* 2. Visual Sentence-Construction Diagram */}
          <section id="sentence-tree-diagram" className="space-y-3">
            <h3 className="text-xs uppercase font-sans text-slate-400 font-black tracking-widest text-center">
              Sentence Mapping • စကားလုံးချိတ်ဆက်ပုံ
            </h3>
            
            {/* The SVG & Flex Diagram Box */}
            <div className="relative flex items-center justify-between gap-1 py-7 px-2 border-2 border-slate-100/60 rounded-3xl bg-white shadow-3xs overflow-visible">
              
              {currentPage === 1 ? (
                <>
                  {/* Left Column container with [จะ] square & '+' block */}
                  <div className="flex flex-col items-center justify-center z-10 pl-2">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        whileTap={{ scale: 0.92 }}
                        onClick={() => speakThaiText("จะ")}
                        className={`w-14 h-14 bg-[#f8fcf5] border-2 border-[#e1f3d8] rounded-2xl flex flex-col items-center justify-center shadow-2xs cursor-pointer transition-all ${
                          activeSpeechWord === "จะ" ? 'ring-4 ring-green-100 border-green-400 bg-green-50' : 'hover:bg-[#f0f9eb]'
                        }`}
                      >
                        <span className="text-lg font-sans font-black text-[#5dae34]">จะ</span>
                      </motion.div>
                      <span className="text-lg font-mono font-black text-slate-300 select-none">+</span>
                    </div>
                  </div>

                  {/* Center Connective SVG S-Curves with motion drawing */}
                  <div className="absolute inset-y-0 left-[82px] right-[230px] pointer-events-none z-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {[8.33, 25, 41.67, 58.33, 75, 91.67].map((yEnd, idx) => (
                        <motion.path
                          key={idx}
                          d={`M 0 50 C 40 50, 60 ${yEnd}, 100 ${yEnd}`}
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0.8 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Right Column with Horizontal Vocabulary verb cards */}
                  <div className="flex flex-col gap-2 z-10 w-[215px]">
                    {VERBS.map((v, idx) => {
                      const combinedPhrase = `จะ${v.thai}`;
                      const isSpeaking = activeSpeechWord === combinedPhrase;
                      
                      return (
                        <motion.div 
                          key={idx}
                          whileHover={{ x: 2 }}
                          className={`h-11 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-3xs transition-all ${
                            isSpeaking ? 'ring-2 ring-emerald-400/30 border-emerald-350 bg-[#fbfefb]' : ''
                          }`}
                        >
                          {/* Thai Word */}
                          <span className="text-sm font-sans font-black text-slate-705">
                            {v.thai}
                          </span>
                          
                          {/* Myanmar translation */}
                          <span className="text-xs font-sans text-slate-400 font-extrabold truncate max-w-[100px] text-center">
                            {v.myanmar}
                          </span>

                          {/* Mini Speaker circle button */}
                          <button
                            onClick={() => speakThaiText(combinedPhrase)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 group active:scale-90 cursor-pointer ${
                              isSpeaking ? 'bg-emerald-100 border-emerald-300 text-emerald-700 animate-pulse' : 'text-slate-500'
                            }`}
                            title={`Listen combined pattern "จะ${v.thai}"`}
                          >
                            <Volume2 className={`w-3.5 h-3.5 transition-transform ${isSpeaking ? 'scale-110 text-emerald-700' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : currentPage === 2 ? (
                <>
                  {/* Left Column container with [กำลัง] square & '+' block */}
                  <div className="flex flex-col items-center justify-center z-10 pl-2">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        whileTap={{ scale: 0.92 }}
                        onClick={() => speakThaiText("กำลัง")}
                        className={`w-14 h-14 bg-[#fefbf6] border-2 border-[#f5dab1] rounded-2xl flex flex-col items-center justify-center shadow-2xs cursor-pointer transition-all ${
                          activeSpeechWord === "กำลัง" ? 'ring-4 ring-amber-100 border-amber-450 bg-amber-50' : 'hover:bg-[#fdf6ec]'
                        }`}
                      >
                        <span className="text-sm font-sans font-black text-[#e6a23c]">กำลัง</span>
                      </motion.div>
                      <span className="text-lg font-mono font-black text-slate-300 select-none">+</span>
                    </div>
                  </div>

                  {/* Center Connective SVG S-Curves with motion drawing */}
                  <div className="absolute inset-y-0 left-[82px] right-[230px] pointer-events-none z-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {[8.33, 25, 41.67, 58.33, 75, 91.67].map((yEnd, idx) => (
                        <motion.path
                          key={idx}
                          d={`M 0 50 C 40 50, 60 ${yEnd}, 100 ${yEnd}`}
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          initial={{ pathLength: 0, opacity: 0.8 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Right Column with Horizontal Vocabulary verb cards for Continuous Tense */}
                  <div className="flex flex-col gap-2 z-10 w-[215px]">
                    {VERBS.map((v, idx) => {
                      const combinedPhrase = `กำลัง${v.thai}`;
                      const isSpeaking = activeSpeechWord === combinedPhrase;
                      
                      // Continuous translation in Myanmar (e.g. စားနေသည်)
                      let continuousMm = "သွားနေသည်။";
                      if (v.thai === "กิน") continuousMm = "စားနေသည်။";
                      if (v.thai === "ทำ") continuousMm = "လုပ်နေသည်။";
                      if (v.thai === "นอน") continuousMm = "အိပ်နေသည်။";
                      if (v.thai === "ซื้อ") continuousMm = "ဝယ်နေသည်။";
                      if (v.thai === "มา") continuousMm = "လာနေသည်။";

                      return (
                        <motion.div 
                          key={idx}
                          whileHover={{ x: 2 }}
                          className={`h-11 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-3xs transition-all ${
                            isSpeaking ? 'ring-2 ring-amber-400/30 border-amber-350 bg-[#fffdfa]' : ''
                          }`}
                        >
                          {/* Thai Word */}
                          <span className="text-sm font-sans font-black text-slate-705">
                            {v.thai}
                          </span>
                          
                          {/* Myanmar translation */}
                          <span className="text-xs font-sans text-amber-700 font-extrabold truncate max-w-[100px] text-center">
                            {continuousMm}
                          </span>

                          {/* Mini Speaker circle button */}
                          <button
                            onClick={() => speakThaiText(combinedPhrase)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-200 group active:scale-90 cursor-pointer ${
                              isSpeaking ? 'bg-amber-100 border-amber-300 text-amber-700 animate-pulse' : 'text-slate-500'
                            }`}
                            title={`Listen combined pattern "กำลัง${v.thai}"`}
                          >
                            <Volume2 className={`w-3.5 h-3.5 transition-transform ${isSpeaking ? 'scale-110 text-amber-700' : 'text-slate-400 group-hover:text-amber-600'}`} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : currentPage === 3 ? (
                <>
                  {/* Left Column with Horizontal Vocabulary modifier cards (11 items) */}
                  <div className="flex flex-col gap-1.5 z-10 w-[215px]">
                    {PART2_ITEMS.map((item, idx) => {
                      const phrase = item.THAI_CLEAN;
                      const isSpeaking = activeSpeechWord === phrase;
                      const isSelected = selectedPart2Item.ID === item.ID;
                      
                      // Extracting the pure modifier part to display cleanly
                      const modifierText = item.TITLE.replace("ทำ", "").replace(" ทํา", "").trim() || "ทำ";
                      
                      return (
                        <motion.div 
                          key={idx}
                          whileHover={{ x: 2 }}
                          onClick={() => {
                            speakThaiText(phrase);
                            setSelectedPart2Item(item);
                          }}
                          className={`h-[35px] bg-white border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-3xs cursor-pointer transition-all ${
                            isSpeaking 
                              ? 'ring-2 ring-violet-300 bg-violet-50/40 border-violet-350' 
                              : isSelected
                                ? 'border-violet-500 bg-violet-50/10 ring-1 ring-violet-100'
                                : 'border-slate-100 hover:border-slate-250'
                          }`}
                        >
                          {/* Thai Word with modifier arrow style */}
                          <span className="text-[11.5px] font-sans font-black text-slate-805 truncate flex items-center gap-1">
                            <span className={isSelected ? "text-violet-600" : "text-slate-700"}>{modifierText}</span>
                            <span className="text-violet-300 font-normal">➔</span>
                            <span className="text-violet-400 font-bold text-[10px]">ทำ</span>
                          </span>
                          
                          {/* Myanmar translation */}
                          <span className="text-[10px] font-sans text-brand-dark font-extrabold truncate max-w-[85px] text-center">
                            {item.MYANMAR}
                          </span>

                          {/* Mini Speaker circle button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakThaiText(phrase);
                              setSelectedPart2Item(item);
                            }}
                            className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all bg-slate-50 border border-slate-100 hover:bg-violet-50 hover:border-violet-200 group active:scale-90 cursor-pointer ${
                              isSpeaking ? 'bg-violet-100 border-violet-300 text-violet-750 animate-pulse' : 'text-slate-500'
                            }`}
                            title={`Listen "${phrase}"`}
                          >
                            <Volume2 className="w-3 h-3 text-slate-400 group-hover:text-[#7c3aed]" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Center Connective SVG S-Curves with dynamic glowing active path */}
                  <div className="absolute inset-y-0 left-[215px] right-[82px] pointer-events-none z-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {[4.5, 13.6, 22.7, 31.8, 40.9, 50, 59.1, 68.2, 77.3, 86.4, 95.5].map((yStart, idx) => {
                        const item = PART2_ITEMS[idx];
                        const isSelected = selectedPart2Item.ID === item.ID;
                        return (
                          <g key={idx}>
                            {/* Glowing active path outline */}
                            {isSelected && (
                              <motion.path
                                d={`M 0 ${yStart} C 40 ${yStart}, 60 50, 100 50`}
                                fill="none"
                                stroke="#c084fc"
                                strokeWidth="6"
                                strokeLinecap="round"
                                opacity="0.35"
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              />
                            )}
                            {/* Main path line */}
                            <motion.path
                              d={`M 0 ${yStart} C 40 ${yStart}, 60 50, 100 50`}
                              fill="none"
                              stroke={isSelected ? "#7c3aed" : "#e2e8f0"}
                              strokeWidth={isSelected ? "3" : "1.8"}
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right Column container with [ทำ] square & '+' block */}
                  <div className="flex flex-col items-center justify-center z-10 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-black text-slate-300 select-none">+</span>
                      <motion.div 
                        whileTap={{ scale: 0.92 }}
                        onClick={() => speakThaiText("ทำ")}
                        className={`w-14 h-14 bg-[#faf2fc] border-2 border-[#e8e4f9] rounded-2xl flex flex-col items-center justify-center shadow-2xs cursor-pointer transition-all ${
                          activeSpeechWord === "ทำ" ? 'ring-4 ring-violet-100 border-violet-400 bg-violet-50' : 'hover:bg-[#f4f2fc]'
                        }`}
                        title="Ending word: ทำ (လုပ်)"
                      >
                        <span className="text-lg font-sans font-black text-[#7c3aed] leading-none">ทำ</span>
                        <span className="text-[10px] font-sans font-black text-violet-750 leading-none mt-1">လုပ်</span>
                      </motion.div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Page 4: Direct Arrow Mapping Diagram from Thai to Myanmar */}
                  {/* Left Column with Horizontal Thai phrase cards (11 items) */}
                  <div className="flex flex-col gap-1.5 z-10 w-[150px]">
                    {PAGE4_MAPPINGS.map((item, idx) => {
                      const isSelected = selectedPage4Idx === idx;
                      const isSpeaking = activeSpeechWord === item.THAI;
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02, x: 2 }}
                          onClick={() => {
                            setSelectedPage4Idx(idx);
                            speakThaiText(item.THAI);
                          }}
                          className={`h-[35px] bg-white border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-3xs cursor-pointer transition-all ${
                            isSpeaking
                              ? 'ring-2 ring-blue-300 bg-blue-50/40 border-blue-350'
                              : isSelected
                                ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-100'
                                : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <span className={`text-[11px] font-sans font-black truncate ${
                            isSelected ? "text-blue-600" : "text-slate-700"
                          }`}>
                            {item.THAI}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Center Connective SVG S-Curves (Parallel rows connecting Left cards to Right cards) */}
                  <div className="absolute inset-y-0 left-[150px] right-[150px] pointer-events-none z-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {[4.5, 13.6, 22.7, 31.8, 40.9, 50, 59.1, 68.2, 77.3, 86.4, 95.5].map((yVal, idx) => {
                        const isSelected = selectedPage4Idx === idx;
                        return (
                          <g key={idx}>
                            {/* Glowing active path outline */}
                            {isSelected && (
                              <motion.path
                                d={`M 0 ${yVal} L 100 ${yVal}`}
                                fill="none"
                                stroke="#93c5fd"
                                strokeWidth="5"
                                strokeLinecap="round"
                                opacity="0.35"
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              />
                            )}
                            {/* Main path line */}
                            <motion.path
                              d={`M 0 ${yVal} L 100 ${yVal}`}
                              fill="none"
                              stroke={isSelected ? "#3b82f6" : "#e2e8f0"}
                              strokeWidth={isSelected ? "2.5" : "1.5"}
                              strokeLinecap="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                            {/* Center Arrow Marker */}
                            {isSelected && (
                              <path
                                d={`M 48 ${yVal - 2} L 52 ${yVal} L 48 ${yVal + 2}`}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right Column with Horizontal Myanmar phrase cards (11 items) */}
                  <div className="flex flex-col gap-1.5 z-10 w-[150px]">
                    {PAGE4_MAPPINGS.map((item, idx) => {
                      const isSelected = selectedPage4Idx === idx;
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02, x: -2 }}
                          onClick={() => {
                            setSelectedPage4Idx(idx);
                            speakThaiText(item.THAI);
                          }}
                          className={`h-[35px] bg-white border rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 shadow-3xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/10 ring-1 ring-blue-100'
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <span className={`text-[10px] font-sans font-extrabold truncate w-full text-center ${
                            isSelected ? "text-blue-800" : "text-slate-600"
                          }`}>
                            {item.MYANMAR}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2 px-1 select-none">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : 'text-[#6366F1] hover:bg-[#6366F1]/5'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as 1 | 2 | 3 | 4)}
                    className={`w-6.5 h-6.5 rounded-full text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#6366F1] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
                disabled={currentPage === 4}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  currentPage === 4
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : 'text-[#6366F1] hover:bg-[#6366F1]/5'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* 3. Dropdown-based Interactive Sentence-Builder Canvas */}
          {currentPage !== 4 ? (
            <section id="sentence-builder-block" className="space-y-3">
              <div className="bg-[#f3f1fc] border border-[#e6e2f9] rounded-3xl p-5 shadow-3xs flex flex-col gap-4">
                
                {/* Title inside lavender section */}
                <h4 className="text-sm font-sans font-black text-[#583092] tracking-tight">
                  {currentPage === 1 ? "สร้างประโยคของคุณ" : currentPage === 2 ? "สร้างประโยค (กำลัง + Verb)" : "สร้างประโยค (ทำ = လုပ်)"}
                </h4>

                {/* Row of Dropdowns */}
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Dropdown 1: Subject Selector */}
                  <div id="builder-sel-subj" className="relative group">
                    <label htmlFor="subject-input" className="sr-only">Choose Subject</label>
                    <select
                      id="subject-input"
                      value={selectedSubject.thai}
                      onChange={(e) => {
                        const found = SUBJECTS.find(s => s.thai === e.target.value);
                        if (found) setSelectedSubject(found);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[12px] font-sans font-black text-slate-705 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-300 transition-colors"
                    >
                      {SUBJECTS.map((s, idx) => (
                        <option key={idx} value={s.thai} className="font-extrabold">
                          {s.thai}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                  </div>

                  {currentPage === 1 ? (
                    <>
                      {/* Dropdown 2: Grammar Word Selector (Locked to 'จะ') */}
                      <div id="builder-sel-gram" className="relative">
                        <label htmlFor="grammar-word-select" className="sr-only">Grammar Future Auxiliary Word "จะ"</label>
                        <select
                          id="grammar-word-select"
                          value={selectedGrammar}
                          onChange={(e) => setSelectedGrammar(e.target.value)}
                          className="w-full bg-emerald-50/60 border border-emerald-200 rounded-xl py-2 px-1.5 text-[12px] font-sans font-black text-emerald-700 shadow-2xs outline-none appearance-none cursor-not-allowed text-center"
                          disabled
                        >
                          <option value="จะ">จะ</option>
                        </select>
                      </div>

                      {/* Dropdown 3: Verb Selector */}
                      <div id="builder-sel-verb" className="relative group">
                        <label htmlFor="verb-input" className="sr-only">Choose Verb</label>
                        <select
                          id="verb-input"
                          value={selectedVerb.thai}
                          onChange={(e) => {
                            const found = VERBS.find(v => v.thai === e.target.value);
                            if (found) setSelectedVerb(found);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[12px] font-sans font-black text-slate-705 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-300 transition-colors"
                        >
                          {VERBS.map((v, idx) => (
                            <option key={idx} value={v.thai} className="font-extrabold">
                              {v.thai}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                      </div>
                    </>
                  ) : currentPage === 2 ? (
                    <>
                      {/* Dropdown 2: Grammar Word Selector (Locked to 'กำลัง') */}
                      <div id="builder-sel-gram-p2" className="relative">
                        <label htmlFor="grammar-word-select-p2" className="sr-only">Grammar Continuous Auxiliary Word "กำลัง"</label>
                        <select
                          id="grammar-word-select-p2"
                          value="กำลัง"
                          className="w-full bg-amber-50/60 border border-amber-200 rounded-xl py-2 px-1.5 text-[12px] font-sans font-black text-amber-700 shadow-2xs outline-none appearance-none cursor-not-allowed text-center"
                          disabled
                        >
                          <option value="กำลัง">กำลัง</option>
                        </select>
                      </div>

                      {/* Dropdown 3: Verb Selector */}
                      <div id="builder-sel-verb-p2" className="relative group">
                        <label htmlFor="verb-input-p2" className="sr-only">Choose Verb</label>
                        <select
                          id="verb-input-p2"
                          value={selectedVerb.thai}
                          onChange={(e) => {
                            const found = VERBS.find(v => v.thai === e.target.value);
                            if (found) setSelectedVerb(found);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[12px] font-sans font-black text-slate-705 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-300 transition-colors"
                        >
                          {VERBS.map((v, idx) => (
                            <option key={idx} value={v.thai} className="font-extrabold">
                              {v.thai}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Dropdown 2: Modifier Selector */}
                      <div id="builder-sel-mod-p3" className="relative group col-span-2">
                        <label htmlFor="modifier-select" className="sr-only">Choose Modifier</label>
                        <select
                          id="modifier-select"
                          value={selectedPart2Item.ID}
                          onChange={(e) => {
                            const found = PART2_ITEMS.find(item => item.ID === parseInt(e.target.value));
                            if (found) setSelectedPart2Item(found);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-1.5 pr-6 text-[11px] font-sans font-black text-slate-705 shadow-2xs outline-none cursor-pointer appearance-none hover:border-violet-300 transition-colors"
                        >
                          {PART2_ITEMS.map((item, idx) => (
                            <option key={idx} value={item.ID} className="font-extrabold">
                              {item.TITLE} ({item.MYANMAR})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600" />
                      </div>
                    </>
                  )}

                </div>

                {/* Compiled Dynamic Sentence Card */}
                <div className="bg-white rounded-2xl p-4.5 border border-purple-100 flex items-center justify-between shadow-xs mt-1 transition-all">
                  <div className="space-y-1 flex-1 pr-4">
                    {/* Thai Generated compound text */}
                    <div className="text-[21px] font-sans font-black text-slate-800 tracking-wide select-all leading-snug">
                      {currentPage === 1 ? (
                        <>{selectedSubject.thai}{selectedGrammar}{selectedVerb.thai}</>
                      ) : currentPage === 2 ? (
                        <>{selectedSubject.thai}กำลัง{selectedVerb.thai}</>
                      ) : (
                        <>{selectedSubject.thai}{selectedPart2Item.THAI_CLEAN}</>
                      )}
                    </div>
                    {/* Myanmar generated transliteration phrase */}
                    <div className="text-sm font-sans font-bold text-slate-600 leading-normal">
                      {getCompiledBurmese()}
                    </div>
                  </div>

                  {/* Circular audio playback speaker button */}
                  <button
                    onClick={() => {
                      const phraseToSpeak = currentPage === 1 
                        ? `${selectedSubject.thai}${selectedGrammar}${selectedVerb.thai}`
                        : currentPage === 2
                          ? `${selectedSubject.thai}กำลัง${selectedVerb.thai}`
                          : `${selectedSubject.thai}{selectedPart2Item.THAI_CLEAN}`;
                      speakThaiText(phraseToSpeak);
                    }}
                    className={`w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-violet-50 hover:border-violet-300 cursor-pointer group transition-all active:scale-90 ${
                      activeSpeechWord === (currentPage === 1 
                        ? `${selectedSubject.thai}${selectedGrammar}${selectedVerb.thai}`
                        : currentPage === 2
                          ? `${selectedSubject.thai}กำลัง${selectedVerb.thai}`
                          : `${selectedSubject.thai}${selectedPart2Item.THAI_CLEAN}`) 
                        ? 'bg-violet-100 text-violet-700 border-violet-400' 
                        : 'text-slate-500'
                    }`}
                    title="Play constructed sentence"
                  >
                    <Volume2 className="w-4.5 h-4.5 text-slate-400 group-hover:text-violet-600 transition-transform group-hover:scale-105" />
                  </button>
                </div>

                {/* Bottom control row containing the Prominent Purple Gradient Listen/Pronounce Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      const phraseToSpeak = currentPage === 1 
                        ? `${selectedSubject.thai}${selectedGrammar}${selectedVerb.thai}`
                        : currentPage === 2
                          ? `${selectedSubject.thai}กำลัง${selectedVerb.thai}`
                          : `${selectedSubject.thai}${selectedPart2Item.THAI_CLEAN}`;
                      speakThaiText(phraseToSpeak);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-[#7c3aed] hover:from-violet-700 hover:to-[#6d28d9] text-white rounded-full font-sans font-black text-xs tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer uppercase transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-purple-200 active:scale-95"
                    id="btn-listen-action"
                  >
                    <Volume2 className="w-4 h-4 fill-current text-white animate-pulse" />
                    <span>ฟังเสียง</span>
                  </button>
                </div>

              </div>
            </section>
          ) : (
            <section id="sentence-mapping-focused-block" className="space-y-3">
              <div className="bg-[#eef6ff] border border-[#d9ebff] rounded-3xl p-5 shadow-3xs flex flex-col gap-4">
                
                {/* Title inside blue section */}
                <h4 className="text-sm font-sans font-black text-blue-800 tracking-tight">
                  รายละเอียดสลับประโยค • Mapping Details
                </h4>

                {/* Selected Item Focus Row */}
                <div className="bg-white rounded-2xl p-4.5 border border-blue-100 flex items-center justify-between shadow-xs transition-all">
                  <div className="space-y-1 flex-1 pr-4">
                    {/* Thai clean word */}
                    <div className="text-[22px] font-sans font-black text-slate-800 tracking-wide select-all leading-snug">
                      {PAGE4_MAPPINGS[selectedPage4Idx].THAI}
                    </div>
                    {/* Myanmar translation */}
                    <div className="text-sm font-sans font-extrabold text-blue-800 leading-normal">
                      {PAGE4_MAPPINGS[selectedPage4Idx].MYANMAR}
                    </div>
                    {/* Phonetic key */}
                    <div className="text-[10px] font-mono text-slate-400 font-bold leading-normal uppercase">
                      Phonetic: {PAGE4_MAPPINGS[selectedPage4Idx].PHONETIC}
                    </div>
                  </div>

                  {/* Circular speaker */}
                  <button
                    onClick={() => speakThaiText(PAGE4_MAPPINGS[selectedPage4Idx].THAI)}
                    className={`w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 cursor-pointer group transition-all active:scale-90 ${
                      activeSpeechWord === PAGE4_MAPPINGS[selectedPage4Idx].THAI
                        ? 'bg-blue-100 text-blue-700 border-blue-400'
                        : 'text-slate-500'
                    }`}
                    title="Play sentence"
                  >
                    <Volume2 className="w-4.5 h-4.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:scale-105" />
                  </button>
                </div>

                {/* Listen button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => speakThaiText(PAGE4_MAPPINGS[selectedPage4Idx].THAI)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full font-sans font-black text-xs tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer uppercase transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-blue-100 active:scale-95"
                    id="btn-listen-action-p4"
                  >
                    <Volume2 className="w-4 h-4 fill-current text-white animate-pulse" />
                    <span>ฟังเสียง</span>
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* User Guide Tip Footer */}
          <p className="text-[10px] text-center text-slate-400 font-sans font-bold leading-normal pt-2 px-4">
            {currentPage === 1 
              ? 'Study sentence combinations using subjects and verbs in future tense! Click "ฟังเสียง" for complete reading exercises.'
              : currentPage === 2
                ? 'Study continuous actions using the prefix "กำลัง". Click "ฟังเสียง" to listen!'
                : currentPage === 3
                  ? 'Study sentence modifiers for the ending word "ทำ" (to do). Tap any item to view its mapping and listen to audio pronunciation!'
                  : 'Study direct sentence mappings of "ทำ = လုပ်". Tap any pair to view its connection and listen to audio pronunciation!'}
          </p>

        </main>

        {/* Outer Phone Home Indicator Accent */}
        <div className="absolute bottom-1 inset-x-0 h-5 flex justify-center items-center pointer-events-none z-50">
          <div className="w-28 h-1 bg-slate-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
