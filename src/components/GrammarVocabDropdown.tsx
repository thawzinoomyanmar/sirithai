import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { WordBreakdown, Lesson } from '../types';

// 1. Core Vocabulary Extraction & Matching Algorithm
const getVocabForSentence = (sentence: string, dictionary: WordBreakdown[]): WordBreakdown[] => {
  if (!sentence) return [];
  
  const matched: { word: WordBreakdown; index: number }[] = [];
  
  dictionary.forEach(vocab => {
    if (vocab.thai && vocab.thai.length >= 1 && sentence.includes(vocab.thai)) {
      let idx = sentence.indexOf(vocab.thai);
      while (idx !== -1) {
        matched.push({ word: vocab, index: idx });
        idx = sentence.indexOf(vocab.thai, idx + 1);
      }
    }
  });

  // Sort matched entries by their starting position in the sentence
  matched.sort((a, b) => {
    if (a.index !== b.index) {
      return a.index - b.index;
    }
    return b.word.thai.length - a.word.thai.length;
  });

  // Unique the matched words so we display clean singular entries
  const seen = new Set<string>();
  const result: WordBreakdown[] = [];
  
  matched.forEach(item => {
    if (!seen.has(item.word.thai)) {
      seen.add(item.word.thai);
      result.push(item.word);
    }
  });

  return result;
};

// 2. Fallbacks & Core Grammatical Helper Words Dictionary
const grammarWordDatabase: WordBreakdown[] = [
  { thai: "ผม", phonetic: "phǒm", english: "I (male)", myanmar: "ကျွန်တော်", partOfSpeech: "pronoun" },
  { thai: "คุณ", phonetic: "khun", english: "you", myanmar: "သင်", partOfSpeech: "pronoun" },
  { thai: "รัก", phonetic: "rák", english: "love", myanmar: "ချစ်သည်", partOfSpeech: "verb" },
  { thai: "ชอบ", phonetic: "chɔ̂ɔp", english: "like", myanmar: "ကြိုက်သည်", partOfSpeech: "verb" },
  { thai: "เรียน", phonetic: "riian", english: "study", myanmar: "လေ့လာသည်", partOfSpeech: "verb" },
  { thai: "ภาษาไทย", phonetic: "phaa-šaa-thai", english: "Thai language", myanmar: "ထိုင်းစာ", partOfSpeech: "noun" },
  { thai: "ไป", phonetic: "bpai", english: "go", myanmar: "သွားသည်", partOfSpeech: "verb" },
  { thai: "มา", phonetic: "maa", english: "come", myanmar: "လာသည်", partOfSpeech: "verb" },
  { thai: "กิน", phonetic: "kin", english: "eat", myanmar: "စားသည်", partOfSpeech: "verb" },
  { thai: "รถ", phonetic: "rót", english: "car", myanmar: "ကား", partOfSpeech: "noun" },
  { thai: "สอง", phonetic: "šɔ̌ɔŋ", english: "two", myanmar: "နှစ်", partOfSpeech: "number" },
  { thai: "สาม", phonetic: "sǎam", english: "three", myanmar: "သုံး", partOfSpeech: "number" },
  { thai: "คน", phonetic: "khon", english: "person", myanmar: "လူ", partOfSpeech: "noun" },
  { thai: "เด็ก", phonetic: "dèk", english: "child", myanmar: "ကလေး", partOfSpeech: "noun" },
  { thai: "ผู้ชาย", phonetic: "phûu-chaaj", english: "man", myanmar: "ယောကျာ်း", partOfSpeech: "noun" },
  { thai: "ผู้หญิง", phonetic: "phûu-jǐŋ", english: "woman", myanmar: "မိန်းမ", partOfSpeech: "noun" },
  { thai: "ของ", phonetic: "khɔ̌ɔŋ", english: "belonging to / of", myanmar: "၏ / ရဲ့", partOfSpeech: "preposition" },
  { thai: "ฉัน", phonetic: "chǎn", english: "I (female)", myanmar: "ကျွန်မ", partOfSpeech: "pronoun" },
  { thai: "ปากกา", phonetic: "bpaak-kaa", english: "pen", myanmar: "ကလောင်တံ", partOfSpeech: "noun" },
  { thai: "หนู", phonetic: "nǔu", english: "child / tiny / I", myanmar: "ကလေး", partOfSpeech: "pronoun" },
  { thai: "จะ", phonetic: "ca", english: "will / shall", myanmar: "မည်", partOfSpeech: "auxiliary" },
  { thai: "ไหน", phonetic: "nǎi", english: "where", myanmar: "ဘယ်", partOfSpeech: "pronoun" },
  { thai: "ยัง", phonetic: "jaŋ", english: "still", myanmar: "သေးသည်", partOfSpeech: "adverb" },
  { thai: "ไม่", phonetic: "mâj", english: "not / no", myanmar: "မ", partOfSpeech: "adverb" },
  { thai: "เสร็จ", phonetic: "sèt", english: "finish", myanmar: "ပြီးသည်", partOfSpeech: "verb" },
  { thai: "วิ่ง", phonetic: "wîŋ", english: "run", myanmar: "ပြေးသည်", partOfSpeech: "verb" },
  { thai: "เร็ว", phonetic: "rew", english: "fast", myanmar: "မြန်မြန်", partOfSpeech: "adjective" },
  { thai: "ทำ", phonetic: "tham", english: "do / make", myanmar: "လုပ်သည်", partOfSpeech: "verb" },
  { thai: "ง่าย", phonetic: "ŋâaj", english: "easy", myanmar: "လွယ်ကူသည်", partOfSpeech: "adjective" }
];

interface GrammarVocabDropdownProps {
  sentence: string;
  allLessons?: Lesson[];
}

export const GrammarVocabDropdown: React.FC<GrammarVocabDropdownProps> = ({ sentence, allLessons }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Compile Master Dictionary on-demand
  const masterDict = React.useMemo(() => {
    const dictionaryMap = new Map<string, WordBreakdown>();
    
    // Add words from local storage if available (previously from pdfVocabulary)
    const saved = localStorage.getItem('thai_pdf_vocabulary');
    if (saved) {
      try {
        const activePdfVocabulary = JSON.parse(saved);
        Object.values(activePdfVocabulary).forEach(words => {
          (words as WordBreakdown[]).forEach(w => {
            if (w.thai) dictionaryMap.set(w.thai, w);
          });
        });
      } catch (e) {}
    }
    
    // Add words from lessons dialogue if available
    if (allLessons) {
      allLessons.forEach(l => {
        if (l.dialogue) {
          l.dialogue.forEach(d => {
            if (d.words) {
              d.words.forEach(w => {
                if (w.thai) dictionaryMap.set(w.thai, w);
              });
            }
          });
        }
      });
    }

    // Add high-frequency static fallbacks
    grammarWordDatabase.forEach(w => {
      if (!dictionaryMap.has(w.thai)) {
        dictionaryMap.set(w.thai, w);
      }
    });

    return Array.from(dictionaryMap.values());
  }, [allLessons]);

  const words = React.useMemo(() => {
    return getVocabForSentence(sentence, masterDict);
  }, [sentence, masterDict]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (words.length === 0) return null;

  // Clean english text helper to keep it short & simple
  const cleanEnglish = (text: string) => {
    const firstPart = text.split('/')[0].split('(')[0].split(';')[0].trim();
    return firstPart || text;
  };

  return (
    <div className="relative inline-block z-10" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-1.5 py-1 h-6 rounded-md border font-sans font-black text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
          isOpen
            ? 'bg-brand-purple border-brand-purple text-white shadow-xs'
            : 'bg-[#fbfaff] hover:bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
        }`}
      >
        <BookOpen className="w-2.5 h-2.5" />
        <span>Vocab</span>
        {isOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 max-w-[280px] min-w-[160px] bg-white border border-brand-purple/15 rounded-lg shadow-md z-[60] p-2 text-left text-brand-dark animate-fade-in divide-y divide-gray-50">
          {words.map((w, idx) => (
            <div key={idx} className="py-1 px-1.5 first:pt-0 last:pb-0 hover:bg-gray-50 rounded-sm">
              <span className="font-sans font-black text-xs text-brand-purple">
                {cleanEnglish(w.english)}
              </span>
              <span className="mx-1 text-gray-400 font-bold text-[10px]">=</span>
              <span className="font-sans font-extrabold text-[12px] text-brand-dark">
                {w.thai}
              </span>
              <span className="ml-1 font-mono text-[9.5px] font-black text-[#1a7f37]">
                ({w.phonetic || w.thai})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
