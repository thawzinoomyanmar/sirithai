import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useUser, useAuth, useSession } from '@clerk/react';
import { useSignUp, useSignIn } from '@clerk/react/legacy';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ProgressState, Lesson, WordBreakdown, DialogueLine, GrammarNote, QuizQuestion, RegisteredUser, PurchaseOrder, Course, StoreItem, EBookVocabEntry, EBookSentenceEntry, EBookDialogueEntry, EBookConversationEntry, GrammarChapter, OrientationArticle, VocabCategory, VocabItem } from './types';
import ProgressCard from './components/ProgressCard';
import SentenceView from './components/SentenceView';
import VocabularyView from './components/VocabularyView';
import QuizView from './components/QuizView';
import AlphabetGuide from './components/AlphabetGuide';
import { VocabPage } from './components/VocabPage';
import { TextbookReader } from './components/TextbookReader';
import { GrammarVocabDropdown } from './components/GrammarVocabDropdown';
import SentenceStructureLesson from './components/SentenceStructureLesson';
import { CheckoutGateway } from './components/CheckoutGateway';
import { OrderDetailModal } from './components/OrderDetailModal';
import { EbookCard } from './components/EbookCard';
import { LessonItem } from './components/LessonItem';
import { AdminTableRow } from './components/AdminTableRow';
import { CourseResourceCard } from './components/CourseResourceCard';
import { PeacockLogo } from './components/PeacockLogo';
import { SplashScreen } from './components/SplashScreen';
import { useLanguage } from './utils/LanguageContext';
import SyncDashboard from './components/SyncDashboard';
import { initAutoSync, syncCloudflareD1ToUserOfflineStorage, addSyncLog, loginUser, registerNewUser } from './utils/syncEngine';
import { localDB } from './utils/db';
import { getAuthValue, setAuthValue, removeAuthValue, getAuthValueSync } from './utils/authStorage';
import { fetchLessonDetail } from './hooks/useApiData';
import { playGlobalAudio, speakGlobalText, stopGlobalAudio } from './utils/audioManager';
import { createWebAudioPlayer, type WebAudioPlayer } from './utils/webAudioPlayer';
import { openResourceInNewTab } from './utils/resourceLinks';
import { sessionCachedFetch } from './utils/apiCache';
import { AudioEbookPlayer } from './components/AudioEbookPlayer';
import { AdminContentManager } from './components/AdminContentManager';
import { AdminDataEntryDashboard } from './components/AdminDataEntryDashboard';
import { LoadingOverlay } from './components/LoadingOverlay';

const dedupeListByContent = (list: any[]) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  return list.filter(item => {
    const content = (item?.thai || item?.text_thai || item?.textThai || item?.title || item?.english || item?.name || '').trim().toLowerCase();
    const key = content || (item?.id ? String(item.id) : '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const formatGrammarExtMap = (rawList: any[]) => {
  const map: Record<string | number, any> = {};
  if (!Array.isArray(rawList)) return map;

  for (const item of rawList) {
    const chNum = Number(item.chapter_number || item.chapterNumber || 1);
    let parsed = item.examples;
    if (!parsed && item.examples_json) {
      try {
        parsed = typeof item.examples_json === 'string' ? JSON.parse(item.examples_json) : item.examples_json;
      } catch (e) {
        parsed = [];
      }
    }

    let vocab: any[] = [];
    let sentences: any[] = [];
    let dialogue: any[] = [];
    let conversation: any[] = [];
    let examplesList: any[] = [];

    if (Array.isArray(parsed)) {
      vocab = parsed;
      examplesList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      vocab = parsed.vocab || [];
      sentences = parsed.qa || parsed.sentences || [];
      dialogue = parsed.dialogue || [];
      conversation = parsed.conversation || [];
      examplesList = parsed.examples || [];
    }

    const ruleItem = {
      id: item.id || chNum,
      chapterNumber: chNum,
      chapter_number: chNum,
      title: item.title || item.titleEnglish || item.title_english || `Chapter ${chNum}`,
      title_myanmar: item.title_myanmar || item.titleMyanmar || item.title_mm || '',
      explanation: item.explanation || '',
      explanation_myanmar: item.explanation_myanmar || '',
      vocab,
      sentences,
      qa: sentences,
      dialogue,
      conversation,
      examples: examplesList,
      examples_json: item.examples_json
    };

    if (!map[chNum]) {
      map[chNum] = {
        id: item.id || chNum,
        chapterNumber: chNum,
        chapter_number: chNum,
        title: item.title || `Chapter ${chNum}`,
        title_myanmar: item.title_myanmar || '',
        explanation: item.explanation || '',
        explanation_myanmar: item.explanation_myanmar || '',
        vocab: [],
        sentences: [],
        qa: [],
        dialogue: [],
        conversation: [],
        examples: [],
        grammarList: []
      };
    }

    map[chNum].grammarList.push(ruleItem);

    if (vocab.length > 0) map[chNum].vocab.push(...vocab);
    if (sentences.length > 0) {
      map[chNum].sentences.push(...sentences);
      map[chNum].qa.push(...sentences);
    }
    if (dialogue.length > 0) map[chNum].dialogue.push(...dialogue);
    if (conversation.length > 0) map[chNum].conversation.push(...conversation);
    if (examplesList.length > 0) map[chNum].examples.push(...examplesList);

    map[chNum].vocab = dedupeListByContent(map[chNum].vocab);
    map[chNum].sentences = dedupeListByContent(map[chNum].sentences);
    map[chNum].qa = dedupeListByContent(map[chNum].qa);
    map[chNum].dialogue = dedupeListByContent(map[chNum].dialogue);
    map[chNum].conversation = dedupeListByContent(map[chNum].conversation);
    map[chNum].examples = dedupeListByContent(map[chNum].examples);

    map[String(chNum)] = map[chNum];
    map[`chapter-${chNum}`] = map[chNum];
    if (item.id) map[item.id] = map[chNum];
  }
  return map;
};

const getGrammarExtDataForChapter = (chapterId: any, titleEnglish?: string, titleMyanmar?: string, customMap?: any, allLessons?: any[]) => {
  let numId = Number(chapterId);
  if (isNaN(numId) && typeof chapterId === 'string') {
    const match = chapterId.match(/\d+/);
    if (match) numId = parseInt(match[0], 10);
  }
  if (isNaN(numId) || numId < 1) numId = 1;

  let map = customMap || (window as any).__grammarExtMap;
  if (!map) {
    try {
      const raw = localStorage.getItem('thai_grammar_ext_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          map = formatGrammarExtMap(parsed);
          localStorage.setItem('thai_grammar_ext_data', JSON.stringify(map));
          (window as any).__grammarExtMap = map;
        } else if (parsed && typeof parsed === 'object') {
          map = parsed;
          (window as any).__grammarExtMap = map;
        }
      }
    } catch {}
  }

  let data = map ? (map[chapterId] || map[numId] || map[String(numId)] || map[`chapter-${chapterId}`]) : null;

  const fallbackLessons = allLessons || (window as any).__lessons || [];
  const matchedLesson = fallbackLessons.find((l: any) => l?.id === numId || l?.id === chapterId || String(l?.id) === String(chapterId));

  // 1. Vocab list
  let rawVocab = (data && Array.isArray(data.vocab) && data.vocab.length > 0) ? [...data.vocab] : [];
  if (rawVocab.length === 0 && matchedLesson && Array.isArray(matchedLesson.vocab) && matchedLesson.vocab.length > 0) {
    rawVocab = [...matchedLesson.vocab];
  }
  if (rawVocab.length === 0 && data && Array.isArray(data.grammarList)) {
    for (const rule of data.grammarList) {
      if (Array.isArray(rule.examples) && rule.examples.length > 0) {
        rawVocab.push(...rule.examples);
      }
    }
  }
  const vocab = dedupeListByContent(rawVocab);

  // 2. Grammar list
  let rawGrammarList = (data && Array.isArray(data.grammarList) && data.grammarList.length > 0) ? [...data.grammarList] : [];
  if (rawGrammarList.length === 0 && matchedLesson && Array.isArray(matchedLesson.grammarNotes) && matchedLesson.grammarNotes.length > 0) {
    rawGrammarList = [...matchedLesson.grammarNotes];
  }
  const grammarList = dedupeListByContent(rawGrammarList);

  // 3. Dialogue list
  let rawDialogueList = (data && Array.isArray(data.dialogueList) && data.dialogueList.length > 0) ? [...data.dialogueList] : [];
  if (rawDialogueList.length === 0 && data && Array.isArray(data.dialogue) && data.dialogue.length > 0) {
    rawDialogueList = [...data.dialogue];
  }
  if (rawDialogueList.length === 0 && matchedLesson && Array.isArray(matchedLesson.dialogue) && matchedLesson.dialogue.length > 0) {
    rawDialogueList = [...matchedLesson.dialogue];
  }

  const dialogueList = rawDialogueList.filter((item: any, index: number, self: any[]) =>
    index === self.findIndex((t: any) => {
      const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
      const tThai = t?.text_thai || t?.textThai || t?.thai || '';
      return (
        (t.id && item.id && String(t.id) === String(item.id)) ||
        (tThai && itemThai && tThai === itemThai)
      );
    })
  );

  // 4. Conversation list
  let rawConversationList = (data && Array.isArray(data.conversationList) && data.conversationList.length > 0) ? [...data.conversationList] : [];
  if (rawConversationList.length === 0 && data && Array.isArray(data.conversation) && data.conversation.length > 0) {
    rawConversationList = [...data.conversation];
  }
  if (rawConversationList.length === 0 && matchedLesson && Array.isArray(matchedLesson.conversation) && matchedLesson.conversation.length > 0) {
    rawConversationList = [...matchedLesson.conversation];
  }

  const conversationList = rawConversationList.filter((turn: any, index: number, self: any[]) =>
    index === self.findIndex((t: any) => {
      const turnThai = turn?.text_thai || turn?.textThai || turn?.thai || '';
      const tThai = t?.text_thai || t?.textThai || t?.thai || '';
      return (
        (t.id && turn.id && String(t.id) === String(turn.id)) ||
        (tThai && turnThai && tThai === turnThai)
      );
    })
  );

  return {
    id: numId,
    title: data?.title || titleEnglish || matchedLesson?.titleEnglish || `Chapter ${numId}`,
    title_myanmar: data?.title_myanmar || titleMyanmar || matchedLesson?.titleMyanmar || '',
    explanation: data?.explanation || matchedLesson?.description || '',
    explanation_myanmar: data?.explanation_myanmar || matchedLesson?.descriptionMyanmar || '',
    vocab,
    sentences: data?.sentences || matchedLesson?.sentences || [],
    qa: data?.qa || matchedLesson?.qa || [],
    dialogue: dialogueList,
    conversation: conversationList,
    examples: data?.examples || [],
    grammarList,
    dialogueList,
    conversationList
  };
};
import { 
  BookOpen, 
  Award, 
  Palette,
  MapPin, 
  Volume2, 
  Volume1,
  Volume,
  FileText, 
  HelpCircle, 
  CheckCircle,
  WifiOff, 
  Search, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  User, 
  UserPlus,
  Star,
  Check,
  Lock,
  Unlock,
  Shield,
  Trash2,
  Plus,
  Archive,
  X,
  Pencil,
  TrendingUp,
  Activity,
  Users,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  Upload,
  Download,
  CheckSquare,
  ShoppingBag,
  CreditCard,
  GripVertical,
  Megaphone,
  AlertTriangle,
  Headphones,
  SkipBack,
  SkipForward,
  Pause,
  Play,
  Mail,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isSingleSentenceEnglish, getMyanmarPhonetic } from './utils/sentenceUtils';
import { autoFillWord } from './utils/dictionary';

const adjustHexBrightness = (hex: string, percent: number): string => {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return hex;
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  if (percent > 0) {
    // Tint (mix with white) -> approach 255
    const factor = percent / 100;
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
  } else {
    // Shade (mix with black) -> approach 0
    const factor = 1 + (percent / 100); // e.g. percent=-15 -> factor=0.85
    r = Math.round(r * factor);
    g = Math.round(g * factor);
    b = Math.round(b * factor);
  }

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
};

export function sortLessonsNaturally<T extends { id?: string | number; title?: string; titleThai?: string; titleEnglish?: string; title_thai?: string; title_english?: string }>(lessons: T[]): T[] {
  if (!Array.isArray(lessons)) return [];
  return [...lessons].sort((a, b) => {
    const aIdNum = Number(a.id);
    const bIdNum = Number(b.id);
    if (!isNaN(aIdNum) && !isNaN(bIdNum) && String(a.id ?? '').trim() !== '' && String(b.id ?? '').trim() !== '') {
      return aIdNum - bIdNum;
    }
    const aMatch = String(a.id ?? '').match(/\d+/);
    const bMatch = String(b.id ?? '').match(/\d+/);
    if (aMatch && bMatch && String(a.id ?? '').toLowerCase().replace(/\d+/, '') === String(b.id ?? '').toLowerCase().replace(/\d+/, '')) {
      return parseInt(aMatch[0], 10) - parseInt(bMatch[0], 10);
    }
    const aTitle = String(a.titleEnglish || a.title_english || a.title || a.titleThai || a.title_thai || a.id || '');
    const bTitle = String(b.titleEnglish || b.title_english || b.title || b.titleThai || b.title_thai || b.id || '');
    return aTitle.localeCompare(bTitle, undefined, { numeric: true, sensitivity: 'base' });
  });
}





const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    username: "ko_nay_min",
    password: "password123",
    role: "student",
    xp: 1250,
    dateJoined: "2026-05-12",
    fullName: "Ko Nay Min",
    phone: "09-771234567",
    email: "naymin@gmail.com"
  },
  {
    username: "ma_khine",
    password: "password123",
    role: "student",
    xp: 840,
    dateJoined: "2026-05-20",
    fullName: "Ma Khine",
    phone: "09-445890123",
    email: "makhineoo@viber-me.com"
  },
  {
    username: "phyo_wai",
    password: "password123",
    role: "student",
    xp: 950,
    dateJoined: "2026-06-01",
    fullName: "Phyo Wai",
    phone: "09-987654321",
    email: "phyowai@gmail.com"
  },
  {
    username: "admin",
    password: "adminpassword",
    role: "admin",
    xp: 5000,
    dateJoined: "2026-01-01",
    fullName: "System Admin",
    phone: "09-111222333",
    email: "admin@sirithai.com"
  }
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  {
    id: "premium-book",
    name: "Advanced Thai-Myanmar Grammar Manual (Printed E-Book)",
    nameMm: "အဆင့်မြင့် ထိုင်း-မြန်မာ သဒ္ဒါလက်စွဲ စာအုပ် (အီးဘုခ်)",
    type: "e-book" as const,
    description: "Deep dive into 45 complex Sentence structures, silent consonants rules, and tone system markers with local audio tracks link.",
    descriptionMm: "ရှုပ်ထွေးသော ဝါကျတည်ဆောက်ပုံ ၄၅ မျိုး၊ အသံထွက် ခြွင်းချက်ပုံစံများနှင့် အသံနိမ့်မြင့်များ အသေးစိတ်ရှင်းလင်းချက်။",
    price: 15000,
    currency: "MMK" as const,
    popular: true,
    pdfFileName: "Advanced_Grammar_Manual.pdf",
    pdfDownloadUrl: "https://drive.google.com/open?id=demo_advanced_grammar",
    googleDriveLink: "https://drive.google.com/open?id=demo_advanced_grammar",
    vocabEntries: [
      { word: "ภาษาไทย", pronunciation: "pʰaː-saː tʰaj", translation: "ထိုင်းဘာသာစကား", meaning: "Thai language" },
      { word: "ไวยากรณ์", pronunciation: "waj-ja-kɔːn", translation: "သဒ္ဒါ (Grammar)", meaning: "Grammar rules and sentence structure" },
      { word: "หนังสือ", pronunciation: "naŋ-sɯ̌ː", translation: "စာအုပ်", meaning: "Book or manual" },
      { word: "เรียน", pronunciation: "riaːn", translation: "သင်ယူသည်", meaning: "To learn or study" }
    ],
    sentenceEntries: [
      { sentence: "ฉันกำลังเรียนไวยากรณ์ภาษาไทย", transcription: "tɕʰan kʰam-laŋ riaːn waj-ja-kɔːn pʰaː-saː tʰaj", translation: "ကျွန်တော်/ကျွန်မ ထိုင်းသဒ္ဒါကို လေ့လာနေပါသည်။" },
      { sentence: "หนังสือเล่มนี้ดีมากสำหรับการฝึก", transcription: "naŋ-sɯ̌ː lêm níː diː mâːk sǎm-ráp kaːn fʉ̀k", translation: "ဤစာအုပ်သည် လေ့ကျင့်ရန်အတွက် အလွန်ကောင်းမွန်ပါသည်။" }
    ],
    dialogueEntries: [
      { speaker: "Kru Jane", text: "สวัสดีค่ะ วันนี้เราจะเรียนไวยากรณ์ขั้นสูง", transcription: "sa-wat-di kha, wan-ni rao cha rian wai-ya-kon khan sung", translation: "မင်္ဂလာပါရှင်၊ ဒီနေ့ ကျွန်မတို့ အဆင့်မြင့်သဒ္ဒါကို လေ့လာကြပါမယ်။" },
      { speaker: "Student", text: "สวัสดีครับครู ผมพร้อมเรียนแล้วครับ", transcription: "sa-wat-di khrap khru, phom phrom rian laeo khrap", translation: "မင်္ဂလာပါဆရာမ၊ ကျွန်တော် လေ့လာဖို့ အဆင်သင့်ပါပဲခင်ဗျာ။" }
    ],
    conversationEntries: [
      { title: "Advanced Grammar Study Guidelines", content: "การเรียนไวยากรณ์ภาษาไทยต้องเข้าใจโครงสร้างประโยคและการใช้คำเชื่อมอย่างถูกต้อง เพื่อให้สามารถสื่อสารได้อย่างเป็นธรรมชาติ", transcription: "kan rian wai-ya-kon phasa Thai tong khao-chai khrong-sang pra-yok lae kan chai kham-chueam iang thuk-tong", translation: "ထိုင်းဘာသာစကားသဒ္ဒါကို လေ့လာရာတွင် သဘာဝကျကျ ဆက်သွယ်ပြောဆိုနိုင်ရန် ဝါကျတည်ဆောက်ပုံနှင့် စကားဆက်များ သုံးစွဲပုံကို မှန်ကန်စွာ နားလည်ရပါမည်။" }
    ]
  },
  {
    id: "res-basic-grammar",
    name: "Complete Thai Tones & Grammar Pocket Guide (Download)",
    nameMm: "ထိုင်းအသံမြှင့်စနစ်နှင့် အဓိကသဒ္ဒါစည်းမျဉ်း အိတ်ဆောင်လက်စွဲ (ဒေါင်းလုဒ်)",
    type: "e-book" as const,
    description: "Study key Thai tonal patterns, syllable structure secrets, and core grammatical particles with easy-to-follow worksheets.",
    descriptionMm: "ထိုင်းအသံမြှင့်စနစ်နှင့် အဓိကသဒ္ဒါစည်းမျဉ်းများ အိတ်ဆောင်လက်စွဲ စာအုပ်။",
    price: 4500,
    currency: "MMK" as const,
    popular: true,
    pdfFileName: "Complete_Thai_Tones_Grammar_Pocket_Guide.pdf",
    pdfDownloadUrl: "https://drive.google.com/open?id=demo_thai_tones",
    googleDriveLink: "https://drive.google.com/open?id=demo_thai_tones",
    vocabEntries: [
      { word: "วรรณยุกต์", pronunciation: "wan-na-júk", translation: "အသံနိမ့်မြင့်သင်္ကေတ (Tones)", meaning: "Tone marks in Thai language" },
      { word: "เสียง", pronunciation: "sǐaŋ", translation: "အသံ", meaning: "Sound or tone" },
      { word: "พยัญชนะ", pronunciation: "pʰa-jan-tɕʰa-ná", translation: "ဗျည်း", meaning: "Consonants" },
      { word: "สระ", pronunciation: "sa-rà", translation: "သရ", meaning: "Vowels" }
    ],
    sentenceEntries: [
      { sentence: "ภาษาไทยมีห้าเสียง", transcription: "pʰaː-saː tʰaj miː hâː sǐaŋ", translation: "ထိုင်းဘာသာစကားတွင် အသံ (၅) မျိုးရှိသည်။" },
      { sentence: "การฝึกออกเสียงวรรณยุกต์สำคัญมาก", transcription: "kaːn fʉ̀k ɔ̀ːk sǐaŋ wan-na-júk sǎm-kʰan mâːk", translation: "အသံနိမ့်မြင့်ထွက်ခြင်းကို လေ့ကျင့်ရန် အလွန်အရေးကြီးပါသည်။" }
    ],
    dialogueEntries: [
      { speaker: "Kru Jane", text: "เสียงวรรณยุกต์ภาษาไทยยากไหมคะ", transcription: "siang wan-na-yuk phasa Thai yak mai kha", translation: "ထိုင်းအသံနိမ့်မြင့်စနစ်က ခက်ခဲပါသလားရှင်။" },
      { speaker: "Student", text: "ยากเล็กน้อยครับ แต่สนุกดี", transcription: "yak lek-noi khrap, tae sa-nuk di", translation: "နည်းနည်းတော့ ခက်ပေမယ့် ပျော်စရာကောင်းပါတယ်ခင်ဗျာ။" }
    ],
    conversationEntries: [
      { title: "Thai Tone System Foundations", content: "ระบบเสียงวรรณยุกต์ของภาษาไทยประกอบด้วย 5 เสียงหลัก คือ เสียงสามัญ เอก โท ตรี และจัตวา ซึ่งทำให้ความหมายของคำเปลี่ยนไปได้", transcription: "ra-bop siang wan-na-yuk khong phasa Thai pra-kop duai ha siang lak khrue siang sa-man, ek, tho, tri, chat-ta-wa", translation: "ထိုင်းဘာသာစကား၏ အသံနိမ့်မြင့်စနစ်တွင် အခြေခံအသံ (၅) မျိုး (စမန်၊ အိတ်၊ ထိုး၊ တြီး၊ ကျတ်တဝါ) ရှိပြီး အသံထွက်ပြောင်းလဲပါက အဓိပ္ပာယ်ပြောင်းလဲသွားနိုင်သည်။" }
    ]
  },
  {
    id: "tutoring-zoom",
    name: "1-on-1 Practice Speaking Session with Kru Jane (1 Hour Zoom)",
    nameMm: "ဆရာမ Kru Jane နှင့် တစ်ဦးချင်း ၁ နာရီ စကားပြောလေ့ကျင့်ခန်း",
    type: "tutoring" as const,
    description: "Get real-time feedback on your tone mastery, vocabulary fluency, and everyday conversational pronunciation tips from an experienced Thai speaker native speaker tutor.",
    descriptionMm: "ထိုင်းစကားပြော လုံးဝကျွမ်းကျင်စေရန် ဇူးမ် (Zoom) ဖြင့် ၁ နာရီကြာ တိုက်ရိုက်တစ်ဦးချင်း အသံထွက်ပြင်ဆင်သင်ကြားပေးခြင်း။",
    price: 45000,
    currency: "MMK" as const
  },
  {
    id: "course-cert",
    name: "Official Certification of Thai Basic Course Mastery",
    nameMm: "ထိုင်းအခြေခံသင်ရိုး ပြီးဆုံးကြောင်း တရားဝင် အောင်လက်မှတ်",
    type: "certificate" as const,
    description: "Redeem your learning performance with a verified downloadable digital certificate. (Requires 1,000 XP minimum to apply!)",
    descriptionMm: "ရမှတ် XP ၁၀၀၀ ပြည့်ပါက လျှောက်ထားနိုင်သည့် စနစ်တကျလေ့လာအောင်မြင်ကြောင်း QR ပါရှိသော အောင်လက်မှတ်။",
    price: 1000,
    currency: "XP" as const
  },
  {
    id: "vip-vip",
    name: "VIP Lifetime Premium Study Access Card (All Lessons Support)",
    nameMm: "VIP တစ်သက်တာ ပရီမီယံ အဖွဲ့ဝင်ကတ်",
    type: "vip-package" as const,
    description: "Unlock offline access support, all dynamic system dialogue modules, customized direct testing tools, and early-bird textbook additions forever.",
    descriptionMm: "အော့ဖ်လိုင်းလေ့လာခွင့်များ၊ စကားစမြည်ပြောဆိုမှု အထူးခန်းများ၊ နောက်ဆက်တွဲ သင်ပုန်းများ အားလုံးအား တစ်သက်တာ သုံးစွဲခွင့်။",
    price: 80000,
    currency: "MMK" as const,
    popular: true
  }
];

export const PREMIUM_COURSES = [
  {
    id: "course-basic",
    name: "Complete Thai Foundational Mastery Course",
    nameMm: "ထိုင်းစကားပြောနှင့် စာရေးစာဖတ် အခြေခံအထူးတန်းသင်တန်း",
    priceAmount: 35000,
    currency: "MMK" as const,
    duration: "6 Weeks (Self-paced Interactive Training)",
    description: "Perfect for complete beginners. Cover Thai phonetic consonants, low/mid/high class letters, compound vowels, and tone rules with native audio worksheets and direct conversational practices.",
    descriptionMm: "ထိုင်းအက္ခရာ လုံးချင်းအသံထွက်များ၊ သရတွဲများနှင့် အသံနိမ့်မြင့်သင်္ကေတစည်းမျဉ်းများကို တစ်သက်တာ ဗီဒီယို သင်ခန်းစာများ စနစ်တကျ သင်ယူလေ့လာနိုင်မည့် အခြေခံအထူးတန်း။",
    instructor: "Kru Jane (Experienced Native Tutor)",
    includes: ["20 HD Video Lessons", "Downloadable Exercise Workbook", "Private QA Forum Access"]
  },
  {
    id: "course-business",
    name: "Advanced Business Thai Speaking & Letters Course",
    nameMm: "အလုပ်အကိုင်နှင့် စီးပွားရေးသုံး အဆင့်မြင့် ထိုင်းစကားပြောသင်တန်း",
    priceAmount: 65000,
    currency: "MMK" as const,
    duration: "8 Weeks (Structured Learning Tracks)",
    description: "Best for career professionals, translators, and cross-border business seekers. Master professional business email drafts, complex negotiation terms, formal speech patterns, and custom terminology.",
    descriptionMm: "စီးပွားရေးညှိနှိုင်းမှုများ၊ ရုံးသုံးစာပေးစာယူများ၊ အင်တာဗျူးပုံစံများနှင့် လုပ်ငန်းခွင်သုံး စကားပြောအဆင့်မြင့်စကားလုံးများကို ကျွမ်းကျင်စွာ ပြောဆိုရေးသားနိုင်ရန် အထူးသင်ရိုး။",
    instructor: "Kru Jane & Sayar Thura",
    includes: ["35 Advanced Masterclass Videos", "Professional Letter Templates", "Certificate of Completion"]
  },
  {
    id: "course-consonants-quick",
    name: "Intensive Thai Consonants & Tones Quick-Crash Course",
    nameMm: "ထိုင်းဗျည်း ၄၄ လုံးနှင့် အသံတန်ဖိုး အမြန်လေ့လာရေးသင်တန်း",
    priceAmount: 15000,
    currency: "MMK" as const,
    duration: "2 Weeks (High-Intensity Crash Practice)",
    description: "An intensive training track designed exclusively to master the 44 consonants, 32 vowels, and their complex tone combinations within days using active audio visual memory techniques.",
    descriptionMm: "ဉာဏ်ရည်မြှင့်နည်းစနစ်များ သုံးစွဲ၍ အသံထွက် အခက်အခဲအရှိဆုံး ထိုင်းဗျည်းစု၊ သရစုများနှင့် အသံဖလှယ်နည်းစနစ်များကို အချိန်တိုအတွင်း ပိုင်နိုင်စေမည့် အမြန်လေ့လာရေးတန်း။",
    instructor: "Sayar Thura (Senior Thai Linguist)",
    includes: ["10 Interactive Sprint Videos", "Consonant Tone Memory Map", "Consonants Audio Quizzes"]
  }
];

const INITIAL_PROGRESS: ProgressState = {
  completedLessons: [],
  masteredWords: [],
  totalXp: 0,
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  quizHighScores: {}
};

export function StaticAdminGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const saveDynamicDataToD1 = async (key: string, data: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Static-Admin': 'true'
  };

  try {
    if (key === 'courses' && Array.isArray(data)) {
      console.log(`Syncing ${data.length} courses to relational D1...`);
      for (const course of data) {
        await sessionCachedFetch('/api/insert-course', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: course.id,
            name: course.name,
            description: course.description || ""
          })
        });
      }
    } else if (key === 'lessons' && Array.isArray(data)) {
      console.log(`Syncing ${data.length} lessons to relational D1...`);
      for (const lesson of data) {
        await sessionCachedFetch('/api/insert-lesson', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: lesson.id || null,
            course_id: lesson.courseId || "course-basic",
            title_thai: lesson.titleThai || lesson.title || "",
            title_phonetic: lesson.titlePhonetic || "",
            title_english: lesson.titleEnglish || "",
            title_myanmar: lesson.titleMyanmar || lesson.titleMm || "",
            dialogue: lesson.dialogue || [],
            grammar: lesson.grammar || [],
            quizzes: lesson.quizzes || []
          })
        });
      }
    } else if (key === 'grammar_chapters' && Array.isArray(data)) {
      console.log(`Syncing ${data.length} grammar chapters to relational D1...`);
      for (const chapter of data) {
        await sessionCachedFetch('/api/insert-grammar', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            chapter_number: chapter.chapterNumber || chapter.id,
            title_english: chapter.titleEnglish || "",
            title_myanmar: chapter.titleMyanmar || chapter.titleMm || ""
          })
        });
      }
    } else if (key === 'vocab_categories' && Array.isArray(data)) {
      console.log(`Syncing vocabulary categories items to relational D1...`);
      for (const cat of data) {
        // Sync category metadata first
        await sessionCachedFetch('/api/vocab-categories', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: cat.id || cat.name,
            name: cat.name,
            name_myanmar: cat.nameMyanmar || cat.name,
            description: cat.description || '',
            icon: cat.icon || 'BookOpen',
            cover_color: cat.coverColor || 'purple'
          })
        }).catch(err => console.warn("Failed to sync category metadata:", err));

        if (!cat.items || !Array.isArray(cat.items)) continue;
        for (const item of cat.items) {
          await sessionCachedFetch('/api/d1-admin-deploy', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              thai_text: item.thai || item.thai_text || item.thaiText || "",
              thai: item.thai || item.thai_text || item.thaiText || "",
              english_text: item.english || item.english_text || item.englishText || "",
              english: item.english || item.english_text || item.englishText || "",
              myanmar_text: item.myanmar || item.myanmar_text || item.myanmarText || item.mm || "",
              myanmar: item.myanmar || item.myanmar_text || item.myanmarText || item.mm || "",
              phonetic: item.phonetic || "",
              phonetic_mm: item.phoneticMm || item.phonetic_mm || "",
              category: cat.name || "general",
              audio_url: item.audio_url || item.url || null,
              pdf_drive_url: item.pdf_drive_url || null,
              illustration: item.illustration || item.cat_ill || null
            })
          });
        }
      }
    } else {
      // Fallback/Legacy saving to app_data
      const response = await sessionCachedFetch('/api/d1-app-data-deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key,
          value: JSON.stringify(data)
        })
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn(`Failed to save dynamic data '${key}' to D1:`, response.status, text);
      }
    }
  } catch (err) {
    console.warn(`Network error saving dynamic data '${key}' to D1:`, err);
  }
};

function CustomSignUp() {
  const { signUp, isLoaded: isSignUpLoaded, setActive } = useSignUp();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      navigate('/', { replace: true });
    }
  }, [isAuthLoaded, isSignedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (isSignedIn) {
      navigate('/', { replace: true });
      return;
    }

    setErrorMsg("");
    setIsLoading(true);
    const cleanEmail = emailAddress.trim().toLowerCase();
    const userName = fullNameInput.trim() || cleanEmail.split('@')[0] || 'Student';
    const userPhone = phoneInput.trim() || undefined;

    if (isSignUpLoaded && signUp) {
      try {
        const result = await signUp.create({ emailAddress: cleanEmail, password });
        if (result.status === 'complete' && result.createdSessionId) {
          const userId = (result as any).createdUserId || `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, fullName: userName, email: cleanEmail, phone: userPhone, role: 'student', xp: 0 })
          }).catch(err => console.error('[User Sync Error]:', err));

          await setActive({ session: result.createdSessionId });
          window.location.href = '/';
          return;
        }
      } catch (err: any) {
        console.warn("Clerk sign-up notice:", err);
        const errorCode = err.errors?.[0]?.code;
        if (errorCode === 'session_exists' || err.message?.includes('already exists')) {
          window.location.href = '/';
          return;
        }
      }
    }

    if (cleanEmail && password.length >= 4) {
      const userId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem('thai_user_logged_in', 'true');
      localStorage.setItem('thai_current_user', userName);
      localStorage.setItem('thai_current_user_email', cleanEmail);

      console.log("Attempting to sync user profile data to D1:", userName, cleanEmail);
      try {
        const res = await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, fullName: userName, email: cleanEmail, phone: userPhone, role: 'student', xp: 0 })
        });
        if (res.ok) {
          const syncRes = await res.json().catch(() => ({}));
          console.log("✅ User profile saved to D1 successfully:", syncRes);
          window.dispatchEvent(new CustomEvent('sirithai_user_synced'));
        } else {
          const errText = await res.text().catch(() => '');
          console.warn("User sync response note:", res.status, errText);
        }
      } catch (err) {
        console.error('[User Sync Network Error]:', err);
      }

      window.location.href = '/';
    } else {
      setErrorMsg("Please enter a valid email and password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100 relative">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/';
          }}
          className="text-xs font-sans font-bold text-brand-purple hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 select-none z-20"
        >
          ← Back to Home
        </button>
        <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400">Sign Up</span>
      </div>
      <div className="flex flex-col items-center mb-6">
        <img src="/icon-192.png" alt="Siri Thai Logo" className="w-16 h-16 rounded-2xl shadow-md mb-3 object-cover" />
        <h2 className="text-2xl font-black font-sans text-brand-dark text-center tracking-tight">Create Account</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Full Name</label>
          <input 
            type="text" 
            value={fullNameInput} 
            onChange={(e) => setFullNameInput(e.target.value)} 
            placeholder="e.g. Mg Mg or Aung Aung"
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Phone Number (Optional)</label>
          <input 
            type="tel" 
            value={phoneInput} 
            onChange={(e) => setPhoneInput(e.target.value)} 
            placeholder="e.g. 09-771234567"
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Email Address</label>
          <input 
            type="email" 
            value={emailAddress} 
            onChange={(e) => setEmailAddress(e.target.value)} 
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
            required 
          />
        </div>
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
            required 
          />
        </div>
        {errorMsg && <p className="text-red-500 text-xs font-semibold leading-tight">{errorMsg}</p>}
        <button type="submit" disabled={isLoading} className="w-full duo-btn duo-btn-purple text-sm font-black py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      <div className="mt-6 text-center text-xs font-semibold text-brand-muted">
        Already have an account? <Link to="/sign-in" className="text-brand-purple hover:underline">Log in</Link>
      </div>
    </div>
  );
}

function CustomSignIn() {
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      navigate('/', { replace: true });
    }
  }, [isAuthLoaded, isSignedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg("");
    setIsLoading(true);
    const cleanEmail = emailAddress.trim().toLowerCase();

    // Admin backdoor
    if (cleanEmail === 'admin@sirithai.com' && password === 'admin123123') {
      localStorage.setItem('admin_session_active', 'true');
      localStorage.setItem('thai_user_logged_in', 'true');
      localStorage.setItem('thai_current_user', 'Admin');
      localStorage.setItem('thai_user_is_admin', 'true');
      window.location.href = '/admin/dashboard';
      return;
    }

    if (isSignInLoaded && signIn) {
      try {
        const result = await signIn.create({ identifier: cleanEmail, password });
        if (result.status === 'complete' && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          window.location.href = '/';
          return;
        }
      } catch (err: any) {
        console.warn("Clerk sign-in notice:", err);
        const errorCode = err.errors?.[0]?.code;
        if (errorCode === 'session_exists' || err.message?.includes('already exists')) {
          window.location.href = '/';
          return;
        }
      }
    }

    if (cleanEmail && password.length >= 4) {
      const userName = cleanEmail.split('@')[0] || 'Student';
      const userId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem('thai_user_logged_in', 'true');
      localStorage.setItem('thai_current_user', userName);
      localStorage.setItem('thai_current_user_email', cleanEmail);

      console.log("Attempting to sync user:", cleanEmail);
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, fullName: userName, email: cleanEmail, role: 'student' })
      }).catch(err => console.error('[User Sync Error]:', err));

      window.location.href = '/';
    } else {
      setErrorMsg("Please enter a valid email and password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100 relative">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/';
          }}
          className="text-xs font-sans font-bold text-brand-purple hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 select-none z-20"
        >
          ← Back to Home
        </button>
        <span className="text-[10px] font-sans font-black uppercase tracking-wider text-slate-400">Log In</span>
      </div>
      <div className="flex flex-col items-center mb-6">
        <img src="/icon-192.png" alt="Siri Thai Logo" className="w-16 h-16 rounded-2xl shadow-md mb-3 object-cover" />
        <h2 className="text-2xl font-black font-sans text-brand-dark text-center tracking-tight">Welcome Back</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1.5">Email Address</label>
          <input 
            type="email" 
            value={emailAddress} 
            onChange={(e) => setEmailAddress(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
            required 
          />
        </div>
        <div>
          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1.5">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all font-sans text-sm" 
            required 
          />
        </div>
        {errorMsg && <p className="text-red-500 text-xs font-semibold leading-tight">{errorMsg}</p>}
        <button type="submit" disabled={isLoading} className="w-full duo-btn duo-btn-purple text-sm font-black py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? 'Loading...' : 'Log In'}
        </button>
      </form>
      <div className="mt-6 text-center text-xs font-semibold text-brand-muted">
        Don't have an account? <Link to="/sign-up" className="text-brand-purple hover:underline">Sign up</Link>
      </div>
    </div>
  );
}

const EBOOK_AUDIO_DATA = [
  {
    id: 'ebook-1',
    title: 'Basic Thai Alphabet Workbook',
    subtitle: 'ထိုင်းအခြေခံအက္ခရာ သင်ပုန်းကြီး လက်စွဲ',
    author: 'KRU JANE',
    color: 'blue',
    iconType: 'abcd',
    trackCountLabel: '2 Spoken Track(s)',
    tracks: [
      {
        id: 't1-1',
        trackNumber: '01',
        title: 'Consonant Classes & High/Low Tones',
        subtitle: 'အက္ခရာအုပ်စုများနှင့် အသံနိမ့်မြင့်စနစ်',
        duration: '04:30',
        durationSec: 270,
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        phrases: [
          { id: 'p1', thai: 'ก ไก่', phonetic: 'ko kai', myanmar: 'က ကလေး' },
          { id: 'p2', thai: 'ข ไข่', phonetic: 'kho khai', myanmar: 'ခ ဥ' },
          { id: 'p3', thai: 'ค ควาย', phonetic: 'kho khwai', myanmar: 'ဂ ကျွဲ' },
        ]
      },
      {
        id: 't1-2',
        trackNumber: '02',
        title: 'Compound Vowels Practice',
        subtitle: 'သရတွဲ ပေါင်းစပ်လေ့ကျင့်မှု',
        duration: '05:15',
        durationSec: 315,
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        phrases: [
          { id: 'p4', thai: 'สระ อา', phonetic: 'sara a', myanmar: 'အာ သရ' },
          { id: 'p5', thai: 'สระ อี', phonetic: 'sara i', myanmar: 'အီ သရ' },
        ]
      }
    ]
  },
  {
    id: 'ebook-2',
    title: 'Basic Thai Grammar Pocketbook',
    subtitle: 'ထိုင်းစကားပြော အခြေခံသဒ္ဒါ အိတ်ဆောင်စာအုပ်',
    author: 'SAYAR THURA',
    color: 'purple',
    iconType: 'book',
    trackCountLabel: '2 Spoken Track(s)',
    tracks: [
      {
        id: 't2-1',
        trackNumber: '01',
        title: 'Essential Verbs & Daily Sentences',
        subtitle: 'မရှိမဖြစ် ကြိယာများနှင့် နေ့စဉ်သုံးဝါကျများ',
        duration: '05:40',
        durationSec: 340,
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        phrases: [
          { id: 'p6', thai: 'กินข้าว', phonetic: 'kin khao', myanmar: 'ထမင်းစားသည်' },
          { id: 'p7', thai: 'ไปไหน', phonetic: 'pai nai', myanmar: 'ဘယ်သွားမလဲ' },
        ]
      },
      {
        id: 't2-2',
        trackNumber: '02',
        title: 'Questions & Polite Particles',
        subtitle: 'အမေးဝါကျများနှင့် ယဉ်ကျေးသောစကားလုံးများ',
        duration: '06:05',
        durationSec: 365,
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        phrases: [
          { id: 'p8', thai: 'สบายดีไหม', phonetic: 'sabai di mai', myanmar: 'နေကောင်းရဲ့လား' },
          { id: 'p9', thai: 'ขอบคุณครับ', phonetic: 'khop khun khrap', myanmar: 'ကျေးဇူးတင်ပါတယ်' },
        ]
      }
    ]
  },
  {
    id: 'ebook-3',
    title: 'Business Thai Email Templates',
    subtitle: 'ရုံးသုံးထိုင်းအီးမေးလ်ရေးသားနည်း လက်စွဲ',
    author: 'KRU JANE',
    color: 'amber',
    iconType: 'email',
    trackCountLabel: '1 Spoken Track(s)',
    tracks: [
      {
        id: 't3-1',
        trackNumber: '01',
        title: 'Formal Inquiries & Client Communication',
        subtitle: 'အလုပ်အကိုင်စုံစမ်းမေးမြန်းခြင်းနှင့် ဆက်သွယ်ရေး',
        duration: '06:10',
        durationSec: 370,
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
        phrases: [
          { id: 'p10', thai: 'ติดต่อสอบถาม', phonetic: 'tit-to son-tham', myanmar: 'ဆက်သွယ်စုံစမ်းရန်' },
          { id: 'p11', thai: 'เรียน คุณลูกค้า', phonetic: 'rian khun luk-kha', myanmar: 'လေးစားအပ်ပါသော အဝယ်တော်လူကြီးမင်း' },
          { id: 'p12', thai: 'ขอแสดงความนับถือ', phonetic: 'kho sa-daeng khwam nap-thue', myanmar: 'လေးစားစွာဖြင့်' },
        ]
      }
    ]
  }
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { session } = useSession();
  const { signOut, isLoaded: isAuthLoaded } = useAuth();

  const syncedUserIdRef = useRef<string | null>(null);

  const [grammarExtMap, setGrammarExtMap] = useState<Record<string | number, any>>(() => {
    try {
      const saved = localStorage.getItem('thai_grammar_ext_data');
      if (saved) return JSON.parse(saved);
    } catch {}
    return (window as any).__grammarExtMap || {};
  });

  const [hasLoadedD1Data, setHasLoadedD1Data] = useState(false);
  const hasLoadedD1DataRef = useRef(false);

  useEffect(() => {
    sessionCachedFetch('/api/grammar')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.data)) {
          const map = formatGrammarExtMap(data.data);
          localStorage.setItem('thai_grammar_ext_data', JSON.stringify(map));
          (window as any).__grammarExtMap = map;
          setGrammarExtMap(map);

          const uniqueChapterNumbers = Array.from(new Set(data.data.map((item: any) => item.chapter_number || item.chapterNumber || 1))).sort((a, b) => Number(a) - Number(b));
          if (uniqueChapterNumbers.length > 0) {
            const chaptersList = uniqueChapterNumbers.map((chNum) => {
              const chapterData = (map as any)[chNum as number] || {};
              return {
                id: chNum,
                titleEnglish: chapterData.title || `Chapter ${chNum}`,
                titleMyanmar: chapterData.title_myanmar || '',
                rules: chapterData.grammarList || []
              };
            });
            setGrammarChapters(chaptersList);
            localStorage.setItem('thai_grammar_chapters_curriculum_list', JSON.stringify(chaptersList));
          }
        }
      })
      .catch(err => console.warn("Notice: Initial grammar_ext fetch:", err));

    sessionCachedFetch('/api/dialogue')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.data)) {
          setGrammarExtMap(prev => {
            const updated = { ...prev };
            const chapterGroupMap = new Map<number, any[]>();
            for (const item of data.data) {
              const chNum = Number(item.chapter_number || item.chapterNumber || 1);
              if (!chapterGroupMap.has(chNum)) chapterGroupMap.set(chNum, []);
              chapterGroupMap.get(chNum)!.push(item);
            }

            for (const [chNumStr, items] of chapterGroupMap.entries()) {
              const chNum = Number(chNumStr);
              // Safe unique filter by ID or text_thai fallback
              const uniqueItems = items.filter((item: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => {
                  const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
                  const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                  return (
                    (t.id && item.id && String(t.id) === String(item.id)) ||
                    (tThai && itemThai && tThai === itemThai)
                  );
                })
              );

              const existingChapter = updated[chNum] || {
                id: chNum,
                chapterNumber: chNum,
                chapter_number: chNum,
                title: `Chapter ${chNum}`,
                vocab: [],
                sentences: [],
                qa: [],
                dialogue: [],
                conversation: [],
                examples: [],
                grammarList: [],
                dialogueList: [],
                conversationList: []
              };

              // Merge without destroying existing fields (title, vocab, grammarList)
              updated[chNum] = {
                ...existingChapter,
                dialogueList: uniqueItems
              };
              updated[String(chNum)] = updated[chNum];
              updated[`chapter-${chNum}`] = updated[chNum];
            }

            localStorage.setItem('thai_grammar_ext_data', JSON.stringify(updated));
            (window as any).__grammarExtMap = updated;
            return updated;
          });
        }
      })
      .catch(err => console.warn("Notice: Initial dialogue fetch:", err));

    sessionCachedFetch('/api/conversation')
      .then(res => res.json())
      .then((data: any) => {
        if (data.success && Array.isArray(data.data)) {
          setGrammarExtMap(prev => {
            const updated = { ...prev };
            const chapterGroupMap = new Map<number, any[]>();
            for (const item of data.data) {
              const chNum = Number(item.chapter_number || item.chapterNumber || 1);
              if (!chapterGroupMap.has(chNum)) chapterGroupMap.set(chNum, []);
              chapterGroupMap.get(chNum)!.push(item);
            }

            for (const [chNumStr, items] of chapterGroupMap.entries()) {
              const chNum = Number(chNumStr);
              const uniqueItems = items.filter((item: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => {
                  const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
                  const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                  return (
                    (t.id && item.id && String(t.id) === String(item.id)) ||
                    (tThai && itemThai && tThai === itemThai)
                  );
                })
              );

              const existingChapter = updated[chNum] || {
                id: chNum,
                chapterNumber: chNum,
                chapter_number: chNum,
                title: `Chapter ${chNum}`,
                vocab: [],
                sentences: [],
                qa: [],
                dialogue: [],
                conversation: [],
                examples: [],
                grammarList: [],
                dialogueList: [],
                conversationList: []
              };

              // Merge without destroying existing fields
              updated[chNum] = {
                ...existingChapter,
                conversationList: uniqueItems
              };
              updated[String(chNum)] = updated[chNum];
              updated[`chapter-${chNum}`] = updated[chNum];
            }

            localStorage.setItem('thai_grammar_ext_data', JSON.stringify(updated));
            (window as any).__grammarExtMap = updated;
            return updated;
          });
        }
      })
      .catch(err => console.warn("Notice: Initial conversation fetch:", err));
  }, []);

  // Registered user profiles fetched live from D1 users_profile table
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem('thai_registered_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isSyncingD1Users, setIsSyncingD1Users] = useState<boolean>(false);
  const [d1UsersError, setD1UsersError] = useState<string | null>(null);

  const fetchD1Users = useCallback(async (isQuiet = false, isCancelledRef?: { current: boolean }) => {
    if (!isQuiet) {
      setIsSyncingD1Users(true);
    }
    setD1UsersError(null);
    try {
      const res = await fetch(`/api/admin/users?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok || !contentType.includes('application/json')) {
        let errMsg = `HTTP Error ${res.status}: ${res.statusText || 'Server Error'}`;
        if (contentType.includes('text/html')) {
          errMsg = `Backend returned HTML fallback instead of JSON (${res.status}). Check server routing and proxy.`;
        } else {
          try {
            const txt = await res.text();
            if (txt) errMsg = txt;
          } catch {}
        }
        throw new Error(errMsg);
      }

      const fetchedResult: any = await res.json();
      if (fetchedResult.success === false) {
        throw new Error(fetchedResult.error || 'Failed to fetch user profiles from database');
      }

      const rawUsersList = Array.isArray(fetchedResult?.data) 
        ? fetchedResult.data 
        : (Array.isArray(fetchedResult) ? fetchedResult : []);
      
      const mappedUsers = rawUsersList
        .filter((u: any) => u && typeof u === 'object')
        .map((u: any) => {
          const rawDate = u?.created_at || u?.dateJoined;
          let dateJoined = 'N/A';
          if (rawDate) {
            try {
              dateJoined = String(rawDate).split(' ')[0].split('T')[0];
            } catch (e) {
              dateJoined = String(rawDate);
            }
          }
          return {
            username: String(u?.id || u?.username || u?.email || 'user_unknown'),
            password: '— (Clerk Auth)',
            role: u?.role === 'admin' ? 'admin' : 'student',
            xp: Number(u?.xp || 0),
            dateJoined,
            fullName: String(u?.full_name || u?.fullName || u?.id || u?.username || 'Student'),
            phone: u?.phone ? String(u.phone) : '',
            email: String(u?.email || '')
          };
        });

      if (!isCancelledRef?.current) {
        if (mappedUsers.length > 0) {
          setRegisteredUsers(mappedUsers);
          try {
            localStorage.setItem('thai_registered_users_list', JSON.stringify(mappedUsers));
          } catch {}
        }
        setD1UsersError(null);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (!isCancelledRef?.current) {
        console.error("[Admin User List] Failed to fetch D1 users:", err);
        setD1UsersError(err?.message || 'Error fetching live user profiles');
      }
    } finally {
      if (!isQuiet && !isCancelledRef?.current) {
        setIsSyncingD1Users(false);
      }
    }
  }, []);

  // Instant Client-Side Sync when user becomes fully signed in via Clerk
  useEffect(() => {
    if (isUserLoaded && session && user && user.id && syncedUserIdRef.current !== user.id) {
      syncedUserIdRef.current = user.id; // Prevent infinite loop

      const syncUserProfile = async () => {
        const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '';
        const userFullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || userEmail.split('@')[0] || 'Student';

        console.log("1. Clerk User Data:", { id: user.id, email: user.primaryEmailAddress?.emailAddress || userEmail });

        try {
          const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: user.id,
              fullName: userFullName,
              email: userEmail,
              avatarUrl: user.imageUrl || null
            })
          });

          console.log("2. Fetch Response Status:", res.status);

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error("3. Sync Error Response:", errText);
            syncedUserIdRef.current = null; // reset so it can retry
            throw new Error(`HTTP ${res.status}: ${errText}`);
          }
          const syncData = await res.json().catch(() => ({}));
          console.log('[User Sync] Profile successfully synced to D1:', syncData);
          fetchD1Users(true); // Quiet background fetch to refresh list
        } catch (err: any) {
          console.error('[User Sync] Failed to sync profile to D1:', err?.message || err);
          syncedUserIdRef.current = null;
        }
      };
      syncUserProfile();
    }
  }, [user, session, isUserLoaded, fetchD1Users]);

  // Real-time 3-second quiet polling for Admin Directory & focus revalidation
  useEffect(() => {
    // Initial quiet fetch
    fetchD1Users(true);

    // Poll every 3 seconds quietly without triggering loading spinner
    const intervalId = setInterval(() => {
      fetchD1Users(true);
    }, 3000);

    // Revalidate quietly when tab gains focus
    const handleFocus = () => {
      fetchD1Users(true);
    };
    window.addEventListener('focus', handleFocus);

    // Listen for custom user sync events
    const handleCustomSync = () => {
      fetchD1Users(true);
    };
    window.addEventListener('sirithai_user_synced', handleCustomSync);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sirithai_user_synced', handleCustomSync);
    };
  }, [fetchD1Users]);

  const forceSync = async () => {
    const samplePayload = {
      id: user?.id || "test_sync_123",
      email: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "testsync@gmail.com",
      full_name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "Test Sync User",
      fullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "Test Sync User"
    };

    console.log("1. Clerk User Data (Force Sync):", samplePayload);

    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(samplePayload)
      });

      console.log("2. Fetch Response Status:", response.status);

      if (response.ok) {
        alert("Sync Success!");
        fetchD1Users(true);
      } else {
        const errorText = await response.text();
        console.error("3. Sync Error Response:", errorText);
        alert("Sync Error: " + errorText);
      }
    } catch (err: any) {
      console.error("Force Sync Network Error:", err);
      alert("Sync Error: " + (err?.message || String(err)));
    }
  };

  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    initAutoSync();
    const controller = new AbortController();

    const fetchDynamicDataAndSync = async () => {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      
      // Dedicated public API fetch for user lessons with required logging
      console.log("Fetching user lessons...");
      try {
        const lessonsRes = await sessionCachedFetch(`${apiBase}/api/lessons`, { signal: controller.signal });
        if (lessonsRes.ok) {
          const lessonsData: any = await lessonsRes.json();
          console.log("User lessons received:", lessonsData);
          if (lessonsData && lessonsData.success && Array.isArray(lessonsData.data) && lessonsData.data.length > 0) {
            const sorted = sortLessonsNaturally(lessonsData.data as Lesson[]);
            setLessons(sorted);
            localStorage.setItem('thai_lessons_curriculum', JSON.stringify(sorted));
          }
        } else {
          const errText = await lessonsRes.text().catch(() => '');
          console.error("Error fetching user lessons:", `HTTP ${lessonsRes.status}: ${lessonsRes.statusText || errText}`);
        }
      } catch (fetchErr: any) {
        if (fetchErr?.name !== 'AbortError') {
          console.error("Error fetching user lessons:", fetchErr?.message || fetchErr);
        }
      }

      // Dedicated public API fetch for user courses with required logging
      console.log("Fetching user courses...");
      try {
        const coursesRes = await sessionCachedFetch(`${apiBase}/api/courses`, { signal: controller.signal });
        if (coursesRes.ok) {
          const coursesData: any = await coursesRes.json();
          console.log("Fetched Data (Courses):", coursesData);
          if (coursesData && coursesData.success && Array.isArray(coursesData.data) && coursesData.data.length > 0) {
            setCourses(coursesData.data);
            localStorage.setItem('thai_courses_curriculum', JSON.stringify(coursesData.data));
          }
        } else {
          const errText = await coursesRes.text().catch(() => '');
          console.error("Error fetching user courses:", `HTTP ${coursesRes.status}: ${coursesRes.statusText || errText}`);
        }
      } catch (coursesErr: any) {
        if (coursesErr?.name !== 'AbortError') {
          console.error("Error fetching user courses:", coursesErr?.message || coursesErr);
        }
      }

      try {
        console.log("⚡ Fetching all dynamic datasets from Cloudflare D1...");
        const response = await sessionCachedFetch(`${apiBase}/api/dynamic-data`, { signal: controller.signal });
        if (response.ok) {
          const result: any = await response.json();
          if (result.success && result.data) {
            const { 
              lessons: d1Lessons, 
              grammar_chapters: d1Grammar, 
              orientation: d1Orientation, 
              vocab_categories: d1Vocab,
              courses: d1Courses,
              pdf_vocabulary: d1PdfVocab,
              grammar_ext: d1GrammarExt,
              dialogue: d1Dialogue,
              conversation: d1Conversation,
              store_items: d1StoreItems
            } = result.data;
            
            if (d1Lessons && Array.isArray(d1Lessons) && d1Lessons.length > 0) {
              const sorted = sortLessonsNaturally(d1Lessons);
              setLessons(sorted);
              localStorage.setItem('thai_lessons_curriculum', JSON.stringify(sorted));
            }
            if (d1Grammar && Array.isArray(d1Grammar) && d1Grammar.length > 0) {
              setGrammarChapters(d1Grammar);
              localStorage.setItem('thai_grammar_chapters_curriculum_list', JSON.stringify(d1Grammar));
            }
            if (d1Orientation && Array.isArray(d1Orientation) && d1Orientation.length > 0) {
              setOrientationData(d1Orientation);
              localStorage.setItem('thai_orientation_articles_list', JSON.stringify(d1Orientation));
            }
            if (d1Vocab && Array.isArray(d1Vocab) && d1Vocab.length > 0) {
              setVocabBookCategories(d1Vocab);
              localStorage.setItem('thai_vocab_book_categories', JSON.stringify(d1Vocab));
            }
            if (d1Courses && Array.isArray(d1Courses) && d1Courses.length > 0) {
              setCourses(d1Courses);
              localStorage.setItem('thai_courses_curriculum', JSON.stringify(d1Courses));
            }
            if (d1StoreItems && Array.isArray(d1StoreItems) && d1StoreItems.length > 0) {
              setStoreItems(d1StoreItems);
              localStorage.setItem('thai_store_items_list', JSON.stringify(d1StoreItems));
            }
            if (d1PdfVocab) {
              localStorage.setItem('thai_pdf_vocabulary', JSON.stringify(d1PdfVocab));
              window.dispatchEvent(new Event('thai_pdf_vocabulary_updated'));
            }
            if (d1GrammarExt || d1Dialogue || d1Conversation) {
              const rawExt = Array.isArray(d1GrammarExt) ? d1GrammarExt : [];
              const rawDiag = Array.isArray(d1Dialogue) ? d1Dialogue : [];
              const rawConv = Array.isArray(d1Conversation) ? d1Conversation : [];
              const map = formatGrammarExtMap(rawExt);

              if (rawDiag.length > 0) {
                const chapterDiagMap = new Map<number, any[]>();
                for (const item of rawDiag) {
                  const chNum = Number(item.chapter_number || item.chapterNumber || 1);
                  if (!chapterDiagMap.has(chNum)) chapterDiagMap.set(chNum, []);
                  chapterDiagMap.get(chNum)!.push(item);
                }
                for (const [chNum, items] of chapterDiagMap.entries()) {
                  const uniqueDiag = items.filter((item: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => {
                      const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
                      const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                      return (
                        (t.id && item.id && String(t.id) === String(item.id)) ||
                        (tThai && itemThai && tThai === itemThai)
                      );
                    })
                  );

                  const existingChapter = map[chNum] || {
                    id: chNum,
                    chapterNumber: chNum,
                    chapter_number: chNum,
                    title: `Chapter ${chNum}`,
                    vocab: [],
                    sentences: [],
                    qa: [],
                    dialogue: [],
                    conversation: [],
                    examples: [],
                    grammarList: [],
                    dialogueList: [],
                    conversationList: []
                  };

                  map[chNum] = {
                    ...existingChapter,
                    dialogueList: uniqueDiag
                  };
                  map[String(chNum)] = map[chNum];
                  map[`chapter-${chNum}`] = map[chNum];
                }
              }

              if (rawConv.length > 0) {
                const chapterConvMap = new Map<number, any[]>();
                for (const item of rawConv) {
                  const chNum = Number(item.chapter_number || item.chapterNumber || 1);
                  if (!chapterConvMap.has(chNum)) chapterConvMap.set(chNum, []);
                  chapterConvMap.get(chNum)!.push(item);
                }
                for (const [chNum, items] of chapterConvMap.entries()) {
                  const uniqueConv = items.filter((item: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => {
                      const turnThai = item?.text_thai || item?.textThai || item?.thai || '';
                      const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                      return (
                        (t.id && item.id && String(t.id) === String(item.id)) ||
                        (tThai && turnThai && tThai === turnThai)
                      );
                    })
                  );

                  const existingChapter = map[chNum] || {
                    id: chNum,
                    chapterNumber: chNum,
                    chapter_number: chNum,
                    title: `Chapter ${chNum}`,
                    vocab: [],
                    sentences: [],
                    qa: [],
                    dialogue: [],
                    conversation: [],
                    examples: [],
                    grammarList: [],
                    dialogueList: [],
                    conversationList: []
                  };

                  map[chNum] = {
                    ...existingChapter,
                    conversationList: uniqueConv
                  };
                  map[String(chNum)] = map[chNum];
                  map[`chapter-${chNum}`] = map[chNum];
                }
              }

              localStorage.setItem('thai_grammar_ext_data', JSON.stringify(map));
              (window as any).__grammarExtMap = map;
              setGrammarExtMap(map);
              window.dispatchEvent(new Event('thai_grammar_ext_updated'));

              if (rawExt.length > 0) {
                const uniqueChapterNumbers = Array.from(new Set(rawExt.map((item: any) => item.chapter_number || item.chapterNumber || 1))).sort((a: any, b: any) => Number(a) - Number(b));
                const chaptersList = uniqueChapterNumbers.map((chNum) => {
                  const chapterData = map[chNum] || {};
                  return {
                    id: chNum,
                    titleEnglish: chapterData.title || `Chapter ${chNum}`,
                    titleMyanmar: chapterData.title_myanmar || '',
                    rules: chapterData.grammarList || []
                  };
                });
                setGrammarChapters(chaptersList);
                localStorage.setItem('thai_grammar_chapters_curriculum_list', JSON.stringify(chaptersList));
              }
            }
            console.log("✅ Successfully synced Cloudflare D1 dynamic data to local state.");
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error("Failed to fetch dynamic D1 app data:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setHasLoadedD1Data(true);
        }
      }

      try {
        await syncCloudflareD1ToUserOfflineStorage();
        addSyncLog('sync', 'App initialized and offline databases ready.', 'success');
      } catch (err) {
        console.error("Initial words/audio offline sync failed:", err);
      }
    };

    fetchDynamicDataAndSync();

    return () => {
      controller.abort();
    };
  }, []);

  const [lessons, setLessonsState] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('thai_lessons_curriculum');
    if (saved) {
      try {
        return sortLessonsNaturally(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved lessons:", e);
      }
    }
    return [];
  });

  const setLessons = (val: Lesson[] | ((prev: Lesson[]) => Lesson[])) => {
    setLessonsState(prev => {
      const rawNext = typeof val === 'function' ? (val as Function)(prev) : val;
      const next = sortLessonsNaturally(rawNext);
      setTimeout(() => {
        localStorage.setItem('thai_lessons_curriculum', JSON.stringify(next));
      }, 0);
      return next;
    });
  };

  const [grammarChapters, setGrammarChapters] = useState<GrammarChapter[]>(() => {
    const saved = localStorage.getItem('thai_grammar_chapters_curriculum_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved grammar chapters:", e);
      }
    }
    return [];
  });

  const [orientationData, setOrientationData] = useState<OrientationArticle[]>(() => {
    const saved = localStorage.getItem('thai_orientation_articles_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved orientation articles:", e);
      }
    }
    return [];
  });

  const [courses, setCoursesState] = useState<Course[]>(() => {
    const saved = localStorage.getItem('thai_courses_curriculum');
    if (saved) {
      try {
        return JSON.parse(saved) as Course[];
      } catch (e) {
        console.error("Error parsing saved courses:", e);
      }
    }
    return [];
  });

  const setCourses = (val: Course[] | ((prev: Course[]) => Course[])) => {
    setCoursesState(prev => {
      const next = typeof val === 'function' ? (val as Function)(prev) : val;
      setTimeout(() => {
        localStorage.setItem('thai_courses_curriculum', JSON.stringify(next));
      }, 0);
      return next;
    });
  };

  // Course management edit form states
  const [adminSelectedCourseId, setAdminSelectedCourseId] = useState<string>('course-basic');
  const [courseFormName, setCourseFormName] = useState<string>('');
  const [courseFormNameMm, setCourseFormNameMm] = useState<string>('');
  const [courseFormPrice, setCourseFormPrice] = useState<number>(35000);
  const [courseFormDuration, setCourseFormDuration] = useState<string>('');
  const [courseFormDescription, setCourseFormDescription] = useState<string>('');
  const [courseFormDescriptionMm, setCourseFormDescriptionMm] = useState<string>('');
  const [courseFormInstructor, setCourseFormInstructor] = useState<string>('');
  const [courseIsNew, setCourseIsNew] = useState<boolean>(false);
  const [courseNewIdStr, setCourseNewIdStr] = useState<string>('');

  // Course resource form state
  const [resourceFormName, setResourceFormName] = useState<string>('');
  const [resourceFormNameMm, setResourceFormNameMm] = useState<string>('');
  const [resourceFormUrl, setResourceFormUrl] = useState<string>('');
  const [resourceFormPrice, setResourceFormPrice] = useState<number>(0);
  const [resourceFormType, setResourceFormType] = useState<'free' | 'premium'>('free');
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  // EBook Entries Form States
  const [resourceVocabEntries, setResourceVocabEntries] = useState<EBookVocabEntry[]>([]);
  const [resourceSentenceEntries, setResourceSentenceEntries] = useState<EBookSentenceEntry[]>([]);
  const [resourceDialogueEntries, setResourceDialogueEntries] = useState<EBookDialogueEntry[]>([]);
  const [resourceConversationEntries, setResourceConversationEntries] = useState<EBookConversationEntry[]>([]);
  const [activeReadingResource, setActiveReadingResource] = useState<any | null>(null);
  const [studentReadingTab, setStudentReadingTab] = useState<'vocab' | 'sentence' | 'dialogue' | 'conversation'>('vocab');

  // Current sub-tab inside eBook resource editor
  const [resourceSubTab, setResourceSubTab] = useState<'vocab' | 'sentence' | 'dialogue' | 'conversation'>('vocab');

  // Input states for single eBook items
  const [vocabEntryWord, setVocabEntryWord] = useState<string>('');
  const [vocabEntryPron, setVocabEntryPron] = useState<string>('');
  const [vocabEntryTrans, setVocabEntryTrans] = useState<string>('');
  const [vocabEntryMeaning, setVocabEntryMeaning] = useState<string>('');

  const [sentenceEntryText, setSentenceEntryText] = useState<string>('');
  const [sentenceEntryPron, setSentenceEntryPron] = useState<string>('');
  const [sentenceEntryTrans, setSentenceEntryTrans] = useState<string>('');

  const [dialogueEntrySpeaker, setDialogueEntrySpeaker] = useState<string>('');
  const [dialogueEntryText, setDialogueEntryText] = useState<string>('');
  const [dialogueEntryPron, setDialogueEntryPron] = useState<string>('');
  const [dialogueEntryTrans, setDialogueEntryTrans] = useState<string>('');

  const [conversationEntryTitle, setConversationEntryTitle] = useState<string>('');
  const [conversationEntryContent, setConversationEntryContent] = useState<string>('');
  const [conversationEntryPron, setConversationEntryPron] = useState<string>('');
  const [conversationEntryTrans, setConversationEntryTrans] = useState<string>('');

  // Course filter for filtering lessons inside admin curriculum editor
  const [adminCurriculumCourseFilter, setAdminCurriculumCourseFilter] = useState<string>('all');

  useEffect(() => {
    const activeC = courses.find(c => c.id === adminSelectedCourseId);
    if (activeC && !courseIsNew) {
      setCourseFormName(activeC.name);
      setCourseFormNameMm(activeC.nameMm);
      setCourseFormPrice(activeC.priceAmount);
      setCourseFormDuration(activeC.duration);
      setCourseFormDescription(activeC.description);
      setCourseFormDescriptionMm(activeC.descriptionMm);
      setCourseFormInstructor(activeC.instructor);
    }
  }, [adminSelectedCourseId, courses, courseIsNew]);

  const [adminSelectedLessonId, setAdminSelectedLessonId] = useState<number | null>(null);
  const [adminSelectedVocabCategory, setAdminSelectedVocabCategory] = useState<string | null>(null);
  const [curriculumToast, setCurriculumToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showCurriculumToast = (type: 'success' | 'error', message: string) => {
    setCurriculumToast({ type, message });
    setTimeout(() => {
      setCurriculumToast(null);
    }, 4000);
  };

  const [vocabBookCategories, setVocabBookCategories] = useState<VocabCategory[]>(() => {
    const saved = localStorage.getItem('thai_vocab_book_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved vocab book categories:", e);
      }
    }
    return [];
  });

  const handleSaveVocabBookCategories = (updatedCats: VocabCategory[]) => {
    setVocabBookCategories(updatedCats);
    localStorage.setItem('thai_vocab_book_categories', JSON.stringify(updatedCats));
    window.dispatchEvent(new Event('thai_vocab_book_categories_updated'));
    saveDynamicDataToD1('vocab_categories', updatedCats);
  };
  
  // Dedicated vocab category item editing states
  const [editingCatItemIndex, setEditingCatItemIndex] = useState<number | null>(null);
  const [editingCatItemThai, setEditingCatItemThai] = useState<string>('');
  const [editingCatItemPhonetic, setEditingCatItemPhonetic] = useState<string>('');
  const [editingCatItemPhoneticMm, setEditingCatItemPhoneticMm] = useState<string>('');
  const [editingCatItemEnglish, setEditingCatItemEnglish] = useState<string>('');
  const [editingCatItemMyanmar, setEditingCatItemMyanmar] = useState<string>('');
  const [editingCatItemIllustration, setEditingCatItemIllustration] = useState<string>('');
  const [editingCatItemUrl, setEditingCatItemUrl] = useState<string>('');

  const [adminEditTab, setAdminEditTab] = useState<'metadata' | 'vocabulary' | 'dialogue' | 'grammar' | 'quiz'>('metadata');
  const [adminCategory, setAdminCategory] = useState<'students' | 'curriculum'>('students');
  const [adminHubTab, setAdminHubTab] = useState<'orders' | 'accounts' | 'cms' | 'courses' | 'lessons' | 'store' | 'orientation' | 'grammar' | 'brand'>('orders');

  const [adminSelectedOrientId, setAdminSelectedOrientId] = useState<string>('better-thai');
  const [adminSelectedGrammarChId, setAdminSelectedGrammarChId] = useState<number>(1);

  const [orientEditArticle, setOrientEditArticle] = useState<OrientationArticle | null>(null);
  const [grammarEditChapter, setGrammarEditChapter] = useState<GrammarChapter | null>(null);

  useEffect(() => {
    const article = orientationData.find(a => a.id === adminSelectedOrientId);
    if (article) {
      setOrientEditArticle(JSON.parse(JSON.stringify(article)));
    } else {
      setOrientEditArticle(null);
    }
  }, [adminSelectedOrientId, orientationData]);

  useEffect(() => {
    const chapter = grammarChapters.find(c => c.id === adminSelectedGrammarChId);
    if (chapter) {
      setGrammarEditChapter(JSON.parse(JSON.stringify(chapter)));
    } else {
      setGrammarEditChapter(null);
    }
  }, [adminSelectedGrammarChId, grammarChapters]);

  const updateOrientField = (field: string, val: any) => {
    if (!orientEditArticle) return;
    setOrientEditArticle({ ...orientEditArticle, [field]: val });
  };

  const updateOrientSectionHeading = (sIdx: number, valEn: string, valMm: string) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        return { ...sec, headingEnglish: valEn, headingMyanmar: valMm };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const addOrientSection = () => {
    if (!orientEditArticle) return;
    const nextSections = [
      ...orientEditArticle.sections,
      {
        headingEnglish: "New Section",
        headingMyanmar: "အပိုင်းသစ်",
        paragraphs: [{ en: "", mm: "" }],
        highlights: []
      }
    ];
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const deleteOrientSection = (sIdx: number) => {
    if (!orientEditArticle) return;
    if (confirm("Are you sure you want to delete this entire section, including all its paragraphs and highlights?")) {
      const nextSections = orientEditArticle.sections.filter((_, i) => i !== sIdx);
      setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
    }
  };

  const updateOrientParagraph = (sIdx: number, pIdx: number, field: 'en' | 'mm', val: string) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        const nextParas = sec.paragraphs.map((p, j) => {
          if (j === pIdx) {
            return { ...p, [field]: val };
          }
          return p;
        });
        return { ...sec, paragraphs: nextParas };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const addOrientParagraph = (sIdx: number) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        return { ...sec, paragraphs: [...sec.paragraphs, { en: "", mm: "" }] };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const deleteOrientParagraph = (sIdx: number, pIdx: number) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        return { ...sec, paragraphs: sec.paragraphs.filter((_, j) => j !== pIdx) };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const updateOrientHighlight = (sIdx: number, hIdx: number, field: string, val: string) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        const nextHighlights = sec.highlights.map((h, j) => {
          if (j === hIdx) {
            return { ...h, [field]: val };
          }
          return h;
        });
        return { ...sec, highlights: nextHighlights };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const addOrientHighlight = (sIdx: number) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        return {
          ...sec,
          highlights: [
            ...sec.highlights,
            { termThai: "", termPhonetic: "", meaningEnglish: "", meaningMyanmar: "" }
          ]
        };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const deleteOrientHighlight = (sIdx: number, hIdx: number) => {
    if (!orientEditArticle) return;
    const nextSections = orientEditArticle.sections.map((sec, i) => {
      if (i === sIdx) {
        return { ...sec, highlights: sec.highlights.filter((_, j) => j !== hIdx) };
      }
      return sec;
    });
    setOrientEditArticle({ ...orientEditArticle, sections: nextSections });
  };

  const handleSaveOrientation = () => {
    if (!orientEditArticle) return;
    const nextList = orientationData.map(a => a.id === orientEditArticle.id ? orientEditArticle : a);
    setOrientationData(nextList);
    localStorage.setItem('thai_orientation_articles_list', JSON.stringify(nextList));
    addSystemLog('admin', `Updated orientation article content: "${orientEditArticle.titleEnglish}"`);
    alert("Orientation article content updated successfully!");
    saveDynamicDataToD1('orientation', nextList);
  };

  const updateGrammarChField = (field: string, val: any) => {
    if (!grammarEditChapter) return;
    setGrammarEditChapter({ ...grammarEditChapter, [field]: val });
  };

  const updateGrammarRuleField = (rIdx: number, field: string, val: any) => {
    if (!grammarEditChapter) return;
    const nextRules = grammarEditChapter.rules.map((rule, i) => {
      if (i === rIdx) {
        return { ...rule, [field]: val };
      }
      return rule;
    });
    setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
  };

  const addGrammarRule = () => {
    if (!grammarEditChapter) return;
    const nextRules = [
      ...grammarEditChapter.rules,
      {
        title: "New Rule",
        titleMyanmar: "စည်းမျဉ်းသစ်",
        explanation: "Rule explanation",
        explanationMyanmar: "စည်းမျဉ်း ရှင်းလင်းချက်",
        examples: []
      }
    ];
    setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
  };

  const deleteGrammarRule = (rIdx: number) => {
    if (!grammarEditChapter) return;
    if (confirm("Are you sure you want to delete this rule?")) {
      const nextRules = grammarEditChapter.rules.filter((_, i) => i !== rIdx);
      setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
    }
  };

  const updateGrammarExampleField = (rIdx: number, eIdx: number, field: string, val: any) => {
    if (!grammarEditChapter) return;
    const nextRules = grammarEditChapter.rules.map((rule, i) => {
      if (i === rIdx) {
        const nextExamples = rule.examples.map((ex, j) => {
          if (j === eIdx) {
            return { ...ex, [field]: val };
          }
          return ex;
        });
        return { ...rule, examples: nextExamples };
      }
      return rule;
    });
    setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
  };

  const addGrammarExample = (rIdx: number) => {
    if (!grammarEditChapter) return;
    const nextRules = grammarEditChapter.rules.map((rule, i) => {
      if (i === rIdx) {
        return {
          ...rule,
          examples: [
            ...rule.examples,
            { thai: "", phonetic: "", english: "", myanmar: "" }
          ]
        };
      }
      return rule;
    });
    setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
  };

  const deleteGrammarExample = (rIdx: number, eIdx: number) => {
    if (!grammarEditChapter) return;
    const nextRules = grammarEditChapter.rules.map((rule, i) => {
      if (i === rIdx) {
        return { ...rule, examples: rule.examples.filter((_, j) => j !== eIdx) };
      }
      return rule;
    });
    setGrammarEditChapter({ ...grammarEditChapter, rules: nextRules });
  };

  const handleSaveGrammarChapter = () => {
    if (!grammarEditChapter) return;
    const nextList = grammarChapters.map(c => c.id === grammarEditChapter.id ? grammarEditChapter : c);
    setGrammarChapters(nextList);
    localStorage.setItem('thai_grammar_chapters_curriculum_list', JSON.stringify(nextList));
    addSystemLog('admin', `Updated grammar handbook chapter details: Chapter ${grammarEditChapter.chapterNumber} - "${grammarEditChapter.titleEnglish}"`);
    alert("Grammar handbook chapter content updated successfully!");
    saveDynamicDataToD1('grammar_chapters', nextList);
  };
  const [editingVocabIndex, setEditingVocabIndex] = useState<number | null>(null);
  const [editingVocabThai, setEditingVocabThai] = useState<string>('');
  const [editingVocabPhonetic, setEditingVocabPhonetic] = useState<string>('');
  const [editingVocabEnglish, setEditingVocabEnglish] = useState<string>('');
  const [editingVocabMyanmar, setEditingVocabMyanmar] = useState<string>('');
  const [editingVocabMyanmarPhonetic, setEditingVocabMyanmarPhonetic] = useState<string>('');
  const [editingVocabPos, setEditingVocabPos] = useState<string>('');

  // Admin New Account Creator State
  const [adminNewUserUsername, setAdminNewUserUsername] = useState<string>('');
  const [adminNewUserPassword, setAdminNewUserPassword] = useState<string>('');
  const [adminNewUserRole, setAdminNewUserRole] = useState<'student' | 'admin'>('student');

  // CSV Import Hub State
  const [csvImportType, setCsvImportType] = useState<'vocabulary' | 'dialogue' | 'grammar' | 'quiz' | 'lessons'>('vocabulary');
  const [csvImportTargetLesson, setCsvImportTargetLesson] = useState<number | 'all'>('all');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedData, setCsvParsedData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [isCsvImportExpanded, setIsCsvImportExpanded] = useState<boolean>(false);
  const [isCsvDragOver, setIsCsvDragOver] = useState<boolean>(false);

  // Dedicated syllabus-level bulk lesson import state
  const [syllabusCsvFile, setSyllabusCsvFile] = useState<File | null>(null);
  const [syllabusCsvFileName, setSyllabusCsvFileName] = useState<string>('');
  const [syllabusCsvParsedData, setSyllabusCsvParsedData] = useState<any[]>([]);
  const [syllabusCsvErrors, setSyllabusCsvErrors] = useState<string[]>([]);
  const [isSyllabusCsvDragOver, setIsSyllabusCsvDragOver] = useState<boolean>(false);
  const [isSyllabusImportExpanded, setIsSyllabusImportExpanded] = useState<boolean>(false);

  // Checkout and Store purchase form state
  const [selectedStoreItem, setSelectedStoreItem] = useState<any | null>(null);
  const [checkoutPhone, setCheckoutPhone] = useState<string>('');
  const [checkoutName, setCheckoutName] = useState<string>('');
  const [checkoutNetwork, setCheckoutNetwork] = useState<string>('KBZPay');

  // Vocab book state
  const [showVocabPage, setShowVocabPage] = useState<boolean>(false);

  // Interactive Course Store and Secure Payment Gateway Simulation states
  const [isCourseStoreExpanded, setIsCourseStoreExpanded] = useState<boolean>(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState<boolean>(false);
  const [gatewayCourse, setGatewayCourse] = useState<any | null>(null);
  const [gatewayPaymentMethod, setGatewayPaymentMethod] = useState<'kbzpay' | 'wavepay' | 'cbpay' | 'ayabank' | 'truemoney' | 'promptpay'>('kbzpay');
  const [gatewayPhone, setGatewayPhone] = useState<string>('');
  const [gatewayStep, setGatewayStep] = useState<number>(1); // 1 = input contact/order, 2 = select method & complete gateway step, 3 = dynamic qr/otp confirmation, 4 = complete success
  const [gatewayProcessing, setGatewayProcessing] = useState<boolean>(false);
  const [gatewayOtp, setGatewayOtp] = useState<string>('');
  const [gatewayTimer, setGatewayTimer] = useState<number>(180); // 3 minutes Countdown timer for dynamic QR codes
  const [gatewayEmail, setGatewayEmail] = useState<string>('');

  // Drag and drop states for admin sorting
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<'lessons' | 'vocab' | 'dialogue' | 'grammar' | 'quiz' | null>(null);
  const [dragOverTargetIndex, setDragOverTargetIndex] = useState<number | null>(null);
  const [isDragReorderExpanded, setIsDragReorderExpanded] = useState<boolean>(false);

  const handleDragStart = (e: React.DragEvent, index: number, type: 'lessons' | 'vocab' | 'dialogue' | 'grammar' | 'quiz') => {
    setDraggedItemIndex(index);
    setDraggedItemType(type);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === index) return;
    setDragOverTargetIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDraggedItemType(null);
    setDragOverTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, type: 'lessons' | 'vocab' | 'dialogue' | 'grammar' | 'quiz') => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemType !== type) return;
    if (draggedItemIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    if (type === 'lessons') {
      const updated = [...lessons];
      const [movedItem] = updated.splice(draggedItemIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      setLessons(updated);
      addSystemLog('admin', 'Reordered lessons list via drag-and-drop');
    } else if (type === 'vocab') {
      if (adminSelectedLessonId) {
        const currentVocab = getCustomVocabList(adminSelectedLessonId);
        const updated = [...currentVocab];
        const [movedItem] = updated.splice(draggedItemIndex, 1);
        updated.splice(targetIndex, 0, movedItem);
        handleSaveVocabList(adminSelectedLessonId, updated);
        addSystemLog('admin', `Reordered vocabulary words list in Lesson ${adminSelectedLessonId}`);
      }
    } else if (type === 'dialogue') {
      if (adminSelectedLessonId) {
        const selectedLesson = lessons.find(l => l.id === adminSelectedLessonId);
        if (selectedLesson) {
          const updated = [...(selectedLesson.dialogue || [])];
          const [movedItem] = updated.splice(draggedItemIndex, 1);
          updated.splice(targetIndex, 0, movedItem);
          handleSaveDialogue(adminSelectedLessonId, updated);
          addSystemLog('admin', `Reordered sentences/dialogue list in Lesson ${adminSelectedLessonId}`);
        }
      }
    } else if (type === 'grammar') {
      if (adminSelectedLessonId) {
        const selectedLesson = lessons.find(l => l.id === adminSelectedLessonId);
        if (selectedLesson) {
          const updated = [...(selectedLesson.grammarNotes || [])];
          const [movedItem] = updated.splice(draggedItemIndex, 1);
          updated.splice(targetIndex, 0, movedItem);
          handleSaveGrammarNotes(adminSelectedLessonId, updated);
          addSystemLog('admin', `Reordered grammar notes list in Lesson ${adminSelectedLessonId}`);
        }
      }
    } else if (type === 'quiz') {
      if (adminSelectedLessonId) {
        const selectedLesson = lessons.find(l => l.id === adminSelectedLessonId);
        if (selectedLesson) {
          const updated = [...(selectedLesson.quiz || [])];
          const [movedItem] = updated.splice(draggedItemIndex, 1);
          updated.splice(targetIndex, 0, movedItem);
          handleSaveQuizzes(adminSelectedLessonId, updated);
          addSystemLog('admin', `Reordered interactive quizzes list in Lesson ${adminSelectedLessonId}`);
        }
      }
    }

    handleDragEnd();
  };

  useEffect(() => {
    let interval: any;
    if (isGatewayOpen && gatewayStep === 3 && gatewayTimer > 0) {
      interval = setInterval(() => {
        setGatewayTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGatewayOpen, gatewayStep]);

  // Local storage synchronization (keeps local reactive UI state cached)
  useEffect(() => {
    localStorage.setItem('thai_lessons_curriculum', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('thai_courses_curriculum', JSON.stringify(courses));
  }, [courses]);

  // Decoupled remote hydration hooks using static dependency array
  useEffect(() => {
    if (hasLoadedD1Data) {
      saveDynamicDataToD1('lessons', lessons);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedD1Data) {
      saveDynamicDataToD1('courses', courses);
    }
  }, []);

  useEffect(() => {
    setEditingVocabIndex(null);
  }, [adminSelectedLessonId, adminEditTab]);

  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [activeLessonId, setActiveLessonId] = useState<number | string | null>(null);

  useEffect(() => {
    if (adminSelectedLessonId) {
      fetchLessonDetail(adminSelectedLessonId).then(detailed => {
        if (detailed) {
          setLessons(prev => prev.map(l => String(l.id) === String(adminSelectedLessonId) ? { ...l, ...detailed } : l));
        }
      });
    }
  }, [adminSelectedLessonId]);

  const handleLessonClick = useCallback(async (lessonId: string) => {
    startTransition(() => {
      setActiveLessonId(lessonId);
      setActiveTab('vocabulary');
      setCurrentGrammarPageIndex(0);
    });
    const detailed = await fetchLessonDetail(lessonId);
    if (detailed) {
      setLessons(prev => prev.map(l => String(l.id) === String(lessonId) ? { ...l, ...detailed } : l));
    }
  }, []);

  const handleCourseTabChange = useCallback((courseId: string) => {
    startTransition(() => {
      setSelectedCourseTab(courseId);
      setDashboardTab('lessons');
    });
  }, []);


  const [activeTab, setActiveTab] = useState<'vocabulary' | 'sentence' | 'grammar' | 'quiz'>('vocabulary');
  const [vocabSearch, setVocabSearch] = useState<string>('');
  const [onlyShowUnmastered, setOnlyShowUnmastered] = useState<boolean>(false);
  const [isOnline, setIsRecordingOnline] = useState<boolean>(navigator.onLine);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dashboardTab, setDashboardTab] = useState<'lessons' | 'orientation' | 'handbook' | 'alphabet' | 'notebook' | 'profile' | 'admin'>(() => {
    if (location.pathname === '/admin/dashboard') {
      return 'admin';
    }
    return 'lessons';
  });

  // Synchronize dashboard tab with the URL path
  useEffect(() => {
    const syncRouteWithTab = () => {
      const path = location.pathname;
      if (path === '/admin/dashboard') {
        setDashboardTab('admin');
      } else if (dashboardTab === 'admin') {
        window.history.replaceState(null, '', '/admin/dashboard');
      }
    };

    syncRouteWithTab();

    const handlePopState = () => {
      syncRouteWithTab();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When dashboardTab changes, update path
  useEffect(() => {
    if (dashboardTab === 'admin') {
      if (location.pathname !== '/admin/dashboard') {
        window.history.pushState(null, '', '/admin/dashboard');
      }
    } else {
      if (location.pathname === '/admin/dashboard') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [dashboardTab]);

  const [unlockedCourses, setUnlockedCourses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('thai_unlocked_courses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleUnlockCourse = (courseId: string) => {
    setUnlockedCourses(prev => {
      if (prev.includes(courseId)) return prev;
      const updated = [...prev, courseId];
      localStorage.setItem('thai_unlocked_courses', JSON.stringify(updated));
      return updated;
    });
    addSystemLog(currentUser || 'student', `Unlocked course group "${courseId}" successfully.`);
  };

  const isCourseAlreadyPurchased = (courseId: string, courseName?: string, priceAmount?: number): boolean => {
    if (unlockedCourses.includes(courseId)) return true;
    if (currentUser) {
      const userLower = currentUser.toLowerCase();
      return orders.some(o => 
        (o.username?.toLowerCase() === userLower) &&
        (o.status === 'completed' || o.status === 'approved' || o.status === 'pending') &&
        (
          o.itemName.toLowerCase().includes(courseId.toLowerCase()) || 
          (courseName && o.itemName.toLowerCase().includes(courseName.toLowerCase())) ||
          (priceAmount && o.priceAmount === priceAmount)
        )
      );
    }
    return false;
  };

  const [selectedCourseTab, setSelectedCourseTab] = useState<string>('course-basic');
  const [courseSubTab, setCourseSubTab] = useState<'lessons' | 'resources'>('lessons');
  const [activeChapterId, setActiveChapterId] = useState<number | null>(1);
  const [activeOrientationId, setActiveOrientationId] = useState<string>('better-thai');
  const [mobileChapterDetailActive, setMobileChapterDetailActive] = useState<boolean>(false);
  const [currentGrammarPageIndex, setCurrentGrammarPageIndex] = useState<number>(0);
  const [currentGrammarExamplePage, setCurrentGrammarExamplePage] = useState<number>(0);

  useEffect(() => {
    setCurrentGrammarExamplePage(0);
  }, [currentGrammarPageIndex]);

  useEffect(() => {
    setCurrentGrammarPageIndex(0);
    setCurrentGrammarExamplePage(0);
  }, [activeLessonId]);

  const [currentHandbookExamplePage, setCurrentHandbookExamplePage] = useState<number>(0);
  const [expandedChapterRuleIndex, setExpandedChapterRuleIndex] = useState<number>(0);
  const [lessonSubPageIndex, setLessonSubPageIndex] = useState<number>(0);
  const [handbookSubPageIndex, setHandbookSubPageIndex] = useState<number>(0);

  useEffect(() => {
    setCurrentHandbookExamplePage(0);
  }, [expandedChapterRuleIndex, handbookSubPageIndex, activeChapterId]);

  useEffect(() => {
    if (activeChapterId != null) {
      const chNum = Number(activeChapterId) || 1;
      sessionCachedFetch(`/api/chapter-details?chapterNumber=${chNum}`)
        .then(res => res.json())
        .then((data: any) => {
          if (data.success) {
            setGrammarExtMap(prev => {
              const updated = { ...prev };
              if (!updated[chNum]) {
                updated[chNum] = {
                  id: chNum,
                  chapterNumber: chNum,
                  chapter_number: chNum,
                  title: `Chapter ${chNum}`,
                  vocab: [],
                  sentences: [],
                  qa: [],
                  dialogue: [],
                  conversation: [],
                  examples: [],
                  grammarList: [],
                  dialogueList: [],
                  conversationList: []
                };
              }

              if (Array.isArray(data.dialogues) && data.dialogues.length > 0) {
                const uniqueDiag = data.dialogues.filter((item: any, index: number, self: any[]) =>
                  index === self.findIndex((t: any) => {
                    const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
                    const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                    return (
                      (t.id && item.id && String(t.id) === String(item.id)) ||
                      (tThai && itemThai && tThai === itemThai)
                    );
                  })
                );
                updated[chNum].dialogueList = uniqueDiag;
              }
              if (Array.isArray(data.conversations) && data.conversations.length > 0) {
                const uniqueConv = data.conversations.filter((item: any, index: number, self: any[]) =>
                  index === self.findIndex((t: any) => {
                    const turnThai = item?.text_thai || item?.textThai || item?.thai || '';
                    const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                    return (
                      (t.id && item.id && String(t.id) === String(item.id)) ||
                      (tThai && turnThai && tThai === turnThai)
                    );
                  })
                );
                updated[chNum].conversationList = uniqueConv;
              }

              updated[String(chNum)] = updated[chNum];
              updated[`chapter-${chNum}`] = updated[chNum];
              localStorage.setItem('thai_grammar_ext_data', JSON.stringify(updated));
              (window as any).__grammarExtMap = updated;
              return updated;
            });
          }
        })
        .catch(err => console.warn("Notice: chapter-details fetch:", err));
    }
  }, [activeChapterId]);
  const [activeHandbookSubTab, setActiveHandbookSubTab] = useState<'vocab' | 'grammar' | 'dialogue' | 'conversation'>('vocab');
  const [expandedGrammarSection, setExpandedGrammarSection] = useState<'vocab' | 'sentence' | 'qa' | 'conversation' | null>(null);
  const [exampleModeForRules, setExampleModeForRules] = useState<{[key: string]: 'standard' | 'more' | 'formal' | 'casual'}>({});
  const [audioSpeedIndex, setAudioSpeedIndex] = useState<number>(0); // 0: Normal, 1: Slow, 2: Much Slower

  const [selectedAudioEbookId, setSelectedAudioEbookId] = useState<string>('ebook-3');
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string>('t3-1');
  const [isAudioPlayerPlaying, setIsAudioPlayerPlaying] = useState<boolean>(false);
  const [audioPlayerCurrentTime, setAudioPlayerCurrentTime] = useState<number>(0);
  const [audioPlayerDuration, setAudioPlayerDuration] = useState<number>(370);
  const [audioPlayerSpeed, setAudioPlayerSpeed] = useState<number>(1);
  const [audioPhraseSearch, setAudioPhraseSearch] = useState<string>('');
  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);

  useEffect(() => () => {
    audioPlayerRef.current?.destroy();
    audioPlayerRef.current = null;
  }, []);

  const [brandColor, setBrandColor] = useState<string>(() => {
    return localStorage.getItem('thai_brand_color') || '#8234ea';
  });
  const [brandLogoText, setBrandLogoText] = useState<string>(() => {
    return localStorage.getItem('thai_brand_logo_text') || 'TH';
  });
  const [brandLogoImg, setBrandLogoImg] = useState<string>(() => {
    return localStorage.getItem('thai_brand_logo_img') || '';
  });
  const [brandName, setBrandName] = useState<string>(() => {
    const saved = localStorage.getItem('thai_brand_name');
    if (!saved || saved === 'Thai Language Tutor') {
      return 'SIRI Thai Language';
    }
    return saved;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-purple', brandColor);
    
    const hoverColor = adjustHexBrightness(brandColor, 10);
    const shadowColor = adjustHexBrightness(brandColor, -15);
    const lightColor = adjustHexBrightness(brandColor, 95);
    const subtleColor = adjustHexBrightness(brandColor, 90);
    const deepColor = adjustHexBrightness(brandColor, -75);
    
    root.style.setProperty('--color-brand-purple-hover', hoverColor);
    root.style.setProperty('--color-brand-purple-shadow', shadowColor);
    root.style.setProperty('--color-brand-purple-light', lightColor);
    root.style.setProperty('--color-brand-purple-subtle', subtleColor);
    root.style.setProperty('--color-brand-purple-deep', deepColor);
    
    localStorage.setItem('thai_brand_color', brandColor);
  }, [brandColor]);

  useEffect(() => {
    localStorage.setItem('thai_brand_logo_text', brandLogoText);
  }, [brandLogoText]);

  useEffect(() => {
    localStorage.setItem('thai_brand_logo_img', brandLogoImg);
  }, [brandLogoImg]);

  useEffect(() => {
    localStorage.setItem('thai_brand_name', brandName);
  }, [brandName]);

  // User engagement tracking state
  const [clickCount, setClickCount] = useState<number>(0);
  const [timeOnPage, setTimeOnPage] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return getAuthValueSync('thai_user_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return getAuthValueSync('thai_current_user') || null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return getAuthValueSync('thai_user_is_admin') === 'true';
  });

  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [isPurchasedCoursesLoading, setIsPurchasedCoursesLoading] = useState<boolean>(false);

  const fetchPurchasedCourses = useCallback(async () => {
      const activeUserId = user?.id || currentUser;
      if (!activeUserId || isAdmin) {
        setPurchasedCourses([]);
        return;
      }

      setIsPurchasedCoursesLoading(true);
      try {
        const res = await sessionCachedFetch(`/api/user-courses?userId=${encodeURIComponent(activeUserId)}`);
        if (res.ok) {
          const json: any = await res.json().catch(() => ({}));
          if (json.success && Array.isArray(json.data)) {
            setPurchasedCourses(json.data);
          } else {
            setPurchasedCourses([]);
          }
        }
      } catch (e) {
        console.error('[Purchased Courses Fetch Error]:', e);
      } finally {
        setIsPurchasedCoursesLoading(false);
      }
  }, [user?.id, currentUser, isAdmin]);

  useEffect(() => {
    fetchPurchasedCourses();

    if ((!user?.id && !currentUser) || isAdmin) return;
    const interval = window.setInterval(fetchPurchasedCourses, 5000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchPurchasedCourses();
    };
    window.addEventListener('focus', fetchPurchasedCourses);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', fetchPurchasedCourses);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [fetchPurchasedCourses, user?.id, currentUser, isAdmin, isUserLoaded]);

  // Dynamically load auth session from local storage on mount and listen to changes
  useEffect(() => {
    const checkSession = async () => {
      const loggedIn = await getAuthValue('thai_user_logged_in');
      const user = await getAuthValue('thai_current_user');
      const admin = await getAuthValue('thai_user_is_admin');
      if (loggedIn === 'true') {
        setIsLoggedIn(true);
        setCurrentUser(user || 'Student');
        setIsAdmin(admin === 'true');
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };

    checkSession();

    // Custom event listener for syncEngine triggers
    const handleAuthStateChange = async () => {
      const loggedIn = await getAuthValue('thai_user_logged_in');
      const user = await getAuthValue('thai_current_user');
      const admin = await getAuthValue('thai_user_is_admin');
      if (loggedIn === 'true') {
        setIsLoggedIn(true);
        setCurrentUser(user || 'Student');
        setIsAdmin(admin === 'true');
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setIsAdmin(false);
      }
    };

    window.addEventListener('sirithai_auth_state_changed', handleAuthStateChange);
    window.addEventListener('sirithai_auth_cleared', handleAuthStateChange);

    return () => {
      window.removeEventListener('sirithai_auth_state_changed', handleAuthStateChange);
      window.removeEventListener('sirithai_auth_cleared', handleAuthStateChange);
    };
  }, []);

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [hasDismissedPromo, setHasDismissedPromo] = useState<boolean>(() => {
    return sessionStorage.getItem('thai_has_dismissed_promo') === 'true';
  });

  const [authTab, setAuthTab] = useState<'student-signup' | 'student-login' | 'admin'>('student-signup');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [activeEbookId, setActiveEbookId] = useState<string | null>(null);
  const [activeEbookLessonId, setActiveEbookLessonId] = useState<number>(1);
  const [authError, setAuthError] = useState<string>('');
  const [authNotice, setAuthNotice] = useState<string>('');
  const [isAuthModalCoursePurchaseExpanded, setIsAuthModalCoursePurchaseExpanded] = useState<boolean>(false);

  // Clerk Custom Sign Up state variables
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpFirstName, setSignUpFirstName] = useState<string>('');
  const [signUpLastName, setSignUpLastName] = useState<string>('');

  // Clerk Custom Sign In state variables
  const [signInEmail, setSignInEmail] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');

  // Sync Clerk user state to App states safely
  useEffect(() => {
    if (isUserLoaded) {
      try {
        if (user) {
          setIsLoggedIn(true);
          const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Student';
          setCurrentUser(name);
          
          const email = user.primaryEmailAddress?.emailAddress || '';
          const isAdminUser = email === 'admin@sirithai.com' || email.startsWith('admin') || user.publicMetadata?.role === 'admin';
          setIsAdmin(isAdminUser);
          
          try {
            setAuthValue('thai_user_logged_in', 'true');
            setAuthValue('thai_current_user', name);
            setAuthValue('thai_user_is_admin', isAdminUser ? 'true' : 'false');
          } catch (storageErr) {
            console.warn('[Clerk Auth Sync Warning] Local storage sync non-fatal warning:', storageErr);
          }
          
          // Auto-close auth modal on successful login
          setShowAuthModal(false);
        } else {
          // Check if user is logged in via local auth storage
          let isLocallyLoggedIn = false;
          try {
            isLocallyLoggedIn = getAuthValueSync('thai_user_logged_in') === 'true';
          } catch (e) {
            console.warn('[Clerk Auth Sync Warning] Auth value read failure:', e);
          }

          if (!isLocallyLoggedIn) {
            setIsLoggedIn(false);
            setCurrentUser(null);
            setIsAdmin(false);
            
            try {
              removeAuthValue('thai_user_logged_in');
              removeAuthValue('thai_current_user');
              removeAuthValue('thai_user_is_admin');
            } catch (e) {
              console.warn('[Clerk Auth Sync Warning] Auth clear failure:', e);
            }
          }
        }
      } catch (err: any) {
        console.error('[Clerk Session Sync Error]', err);
      }
    }
  }, [user, isUserLoaded]);

  // Custom Words Notebook state variables
  const [customWords, setCustomWords] = useState<(WordBreakdown & { author?: string })[]>(() => {
    const saved = localStorage.getItem('thai_custom_words_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        thai: "พรุ่งนี้",
        phonetic: "phrûŋ-níi",
        english: "Tomorrow",
        myanmar: "မနက်ဖြန်",
        partOfSpeech: "Noun",
        notes: "Example: พรุ่งนี้เจอกัน (phrûŋ-níi cəə-kan) - See you tomorrow!",
        author: "Root"
      },
      {
        thai: "ขอบคุณมาก",
        phonetic: "khɔ̀ɔp-khun mâak",
        english: "Thank you very much",
        myanmar: "အများကြီးကျေးဇူးတင်ပါတယ်",
        partOfSpeech: "Phrase",
        notes: "Polite final particle 'ครับ/ค่ะ' (khráp/khâ) can be appended.",
        author: "Root"
      },
      {
        thai: "สบายดีไหม",
        phonetic: "sà-baaj-dii mǎj",
        english: "How are you?",
        myanmar: "နေကောင်းလား",
        partOfSpeech: "Phrase",
        notes: "Standard friendly greeting in Thai and Myanmar translations.",
        author: "Root"
      }
    ];
  });
  const [customWordSearch, setCustomWordSearch] = useState<string>('');
  const [newWordThai, setNewWordThai] = useState<string>('');
  const [newWordPhonetic, setNewWordPhonetic] = useState<string>('');
  const [newWordEnglish, setNewWordEnglish] = useState<string>('');
  const [newWordMyanmar, setNewWordMyanmar] = useState<string>('');
  const [newWordMyanmarPhonetic, setNewWordMyanmarPhonetic] = useState<string>('');
  const [newWordPos, setNewWordPos] = useState<string>('Noun');
  const [newWordNotes, setNewWordNotes] = useState<string>('');
  const [newWordAudioUrl, setNewWordAudioUrl] = useState<string>('');
  const [newWordPdfDriveUrl, setNewWordPdfDriveUrl] = useState<string>('');
  const [notebookError, setNotebookError] = useState<string>('');
  const [notebookSuccess, setNotebookSuccess] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Editing state
  const [editingWordThai, setEditingWordThai] = useState<string | null>(null);
  const [editWordPhonetic, setEditWordPhonetic] = useState<string>('');
  const [editWordEnglish, setEditWordEnglish] = useState<string>('');
  const [editWordMyanmar, setEditWordMyanmar] = useState<string>('');
  const [editWordMyanmarPhonetic, setEditWordMyanmarPhonetic] = useState<string>('');
  const [editWordPos, setEditWordPos] = useState<string>('Noun');
  const [editWordNotes, setEditWordNotes] = useState<string>('');

  // Admin announcement input
  const [activeBroadcastInput, setActiveBroadcastInput] = useState<string>(() => {
    return localStorage.getItem('thai_active_broadcast') || 'မင်္ဂလာပါ! အခြေခံ ထိုင်းသဒ္ဒါနှင့် ဝေါဟာရများကို စနစ်တကျ သင်ယူလေ့လာနိုင်ပါသည်။ (Welcome! Study Thai grammar & vocabulary systematically.)';
  });

  // Admin Broadcast Message Option
  const [activeBroadcast, setActiveBroadcast] = useState<string>(() => {
    return localStorage.getItem('thai_active_broadcast') || 'မင်္ဂလာပါ! အခြေခံ ထိုင်းသဒ္ဒါနှင့် ဝေါဟာရများကို စနစ်တကျ သင်ယူလေ့လာနိုင်ပါသည်။ (Welcome! Study Thai grammar & vocabulary systematically.)';
  });

  // Simple Notification banner dismiss
  const [showBroadcastBanner, setShowBroadcastBanner] = useState<boolean>(true);

  useEffect(() => {
    const isCancelledRef = { current: false };
    fetchD1Users(true, isCancelledRef);

    const handleUserSynced = () => {
      if (!isCancelledRef.current) {
        fetchD1Users(true, isCancelledRef);
      }
    };
    window.addEventListener('sirithai_user_synced', handleUserSynced);

    return () => {
      isCancelledRef.current = true;
      window.removeEventListener('sirithai_user_synced', handleUserSynced);
    };
  }, [adminHubTab]);

  // Global Sync Trigger for User Profile to D1 (triggers only when logged in user changes)
  useEffect(() => {
    if (currentUser) {
      const userProfile = registeredUsers.find(u => (u?.username || '').toLowerCase() === (currentUser || '').toLowerCase());
      if (userProfile && userProfile.username) {
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userProfile.username,
            full_name: userProfile.fullName || userProfile.username,
            email: userProfile.email || `${userProfile.username}@mock-student.com`,
            avatar_url: userProfile.avatar_url || '',
            role: userProfile.role
          })
        }).catch(err => console.warn('User profile sync failed:', err));
      }
    }
  }, [currentUser]);


  // Purchase orders list state
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('thai_user_orders_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "ORD-99321",
        username: "ko_nay_min",
        itemName: "🗣️ 1-on-1 Practice Speaking Session with Kru Jane (1 Hour Zoom)",
        itemType: "tutoring",
        priceAmount: 45000,
        currency: "MMK",
        status: "completed",
        orderDate: "2026-06-10",
        studentPhone: "09-771234567",
        studentEmail: "konaymin@gmail.com",
        adminNotes: "Session scheduled with Kru Jane. Zoom link dispatched to student mail/viber pipeline."
      },
      {
        id: "ORD-99322",
        username: "ma_khine",
        itemName: "📕 Advanced Thai-Myanmar Grammar Manual (Printed E-Book)",
        itemType: "e-book",
        priceAmount: 25000,
        currency: "MMK",
        status: "pending",
        orderDate: "2026-06-13",
        studentPhone: "09-445890123",
        studentEmail: "makhineoo@viber-me.com",
        evidenceImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='500' viewBox='0 0 300 500'><rect width='300' height='500' fill='%230056B3'/><rect x='15' y='15' width='270' height='470' rx='20' fill='white'/><circle cx='150' cy='80' r='30' fill='%2328A745'/><path d='M140 80 l7 7 l13 -13' fill='none' stroke='white' stroke-width='4'/><text x='150' y='135' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2328A745' text-anchor='middle'>KPay Verification</text><text x='150' y='160' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23333333' text-anchor='middle'>- 25,000 MMK</text><line x1='30' y1='185' x2='270' y2='185' stroke='%23EEEEEE' stroke-width='2'/><text x='35' y='210' font-family='sans-serif' font-size='11' fill='%23777777'>Transaction ID</text><text x='265' y='210' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>TXN7784013920</text><text x='35' y='245' font-family='sans-serif' font-size='11' fill='%23777777'>Sender</text><text x='265' y='245' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>Ma Khine</text><text x='35' y='280' font-family='sans-serif' font-size='11' fill='%23777777'>Recipient</text><text x='265' y='280' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>Kru Jane Thai School</text><text x='35' y='315' font-family='sans-serif' font-size='11' fill='%23777777'>Date &amp; Time</text><text x='265' y='315' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>2026-06-13 14:15</text><line x1='30' y1='345' x2='270' y2='345' stroke='%23EEEEEE' stroke-width='2'/><rect x='30' y='370' width='240' height='70' rx='10' fill='%23F8F9FA'/><text x='150' y='398' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23666666' text-anchor='middle'>Payment Channel: KBZPay Myanmar</text><text x='150' y='418' font-family='sans-serif' font-size='10' fill='%23999999' text-anchor='middle'>Reference: KBZ-PRINT-THAI</text></svg>"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('thai_user_orders_list', JSON.stringify(orders));
  }, [orders]);

  // Study store items state for sale
  const [storeItems, setStoreItems] = useState<StoreItem[]>(() => {
    const saved = localStorage.getItem('thai_store_items_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoreItem[];
        return parsed.filter(item => {
          if (item.type === 'e-book') {
            return item.id === 'premium-book' || item.id === 'res-basic-grammar';
          }
          return true;
        });
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_STORE_ITEMS;
  });

  const [resourceCatalog, setResourceCatalog] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

    sessionCachedFetch(`${apiBase}/api/resources`, { signal: controller.signal })
      .then(async response => {
        const payload: any = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || `Resources request failed (${response.status})`);
        }
        setResourceCatalog(Array.isArray(payload.data) ? payload.data : []);
      })
      .catch(error => {
        if (error?.name !== 'AbortError') console.error('Unable to load D1 resources:', error);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem('thai_store_items_list', JSON.stringify(storeItems));
  }, [storeItems]);

  // Admin Store / E-Book editor states
  const [adminSelectedStoreId, setAdminSelectedStoreId] = useState<string>('premium-book');
  const [storeFormName, setStoreFormName] = useState<string>('');
  const [storeFormNameMm, setStoreFormNameMm] = useState<string>('');
  const [storeFormType, setStoreFormType] = useState<'e-book' | 'tutoring' | 'certificate' | 'vip-package'>('e-book');
  const [storeFormDescription, setStoreFormDescription] = useState<string>('');
  const [storeFormDescriptionMm, setStoreFormDescriptionMm] = useState<string>('');
  const [storeFormPrice, setStoreFormPrice] = useState<number>(25000);
  const [storeFormCurrency, setStoreFormCurrency] = useState<'MMK' | 'XP'>('MMK');
  const [storeFormPopular, setStoreFormPopular] = useState<boolean>(false);
  const [storeIsNew, setStoreIsNew] = useState<boolean>(false);
  const [storeNewIdStr, setStoreNewIdStr] = useState<string>('');
  const [storeFormCourseId, setStoreFormCourseId] = useState<string>('');
  const [storeFormPdfFileName, setStoreFormPdfFileName] = useState<string>('');
  const [storeFormPdfDownloadUrl, setStoreFormPdfDownloadUrl] = useState<string>('');

  // Admin Lesson Entry Form state variables (Direct D1 Database insertion)
  const [adminLessonCourseId, setAdminLessonCourseId] = useState<string>('course-basic');
  const [adminLessonId, setAdminLessonId] = useState<string>('');
  const [adminLessonTitleThai, setAdminLessonTitleThai] = useState<string>('');
  const [adminLessonTitlePhonetic, setAdminLessonTitlePhonetic] = useState<string>('');
  const [adminLessonTitleEnglish, setAdminLessonTitleEnglish] = useState<string>('');
  const [adminLessonTitleMyanmar, setAdminLessonTitleMyanmar] = useState<string>('');
  const [adminLessonDescription, setAdminLessonDescription] = useState<string>('');
  const [isPublishingLessonD1, setIsPublishingLessonD1] = useState<boolean>(false);

  useEffect(() => {
    const activeItem = storeItems.find(item => item.id === adminSelectedStoreId);
    if (activeItem && !storeIsNew) {
      setStoreFormName(activeItem.name);
      setStoreFormNameMm(activeItem.nameMm);
      setStoreFormType(activeItem.type);
      setStoreFormDescription(activeItem.description || '');
      setStoreFormDescriptionMm(activeItem.descriptionMm || '');
      setStoreFormPrice(activeItem.price);
      setStoreFormCurrency(activeItem.currency);
      setStoreFormPopular(!!activeItem.popular);
      setStoreFormCourseId(activeItem.courseId || '');
      setStoreFormPdfFileName(activeItem.pdfFileName || '');
      setStoreFormPdfDownloadUrl(activeItem.pdfDownloadUrl || '');
    }
  }, [adminSelectedStoreId, storeItems, storeIsNew]);

  useEffect(() => {
    if (isLoggedIn && currentUser && !isAdmin) {
      const parentUser = registeredUsers.find(u => (u?.username || '').toLowerCase() === currentUser.toLowerCase());
      if (parentUser) {
        setCheckoutName(parentUser.fullName || parentUser.username || '');
        setGatewayPhone(parentUser.phone || '');
        setGatewayEmail(parentUser.email || '');
      }
    }
  }, [currentUser, isLoggedIn, isAdmin, registeredUsers]);

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<PurchaseOrder | null>(null);

  // D1 Orders Sync & CRUD state
  const [isSyncingD1Orders, setIsSyncingD1Orders] = useState<boolean>(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState<boolean>(false);
  const [newOrderUsername, setNewOrderUsername] = useState<string>('');
  const [newOrderItemName, setNewOrderItemName] = useState<string>('');
  const [newOrderItemType, setNewOrderItemType] = useState<'e-book' | 'tutoring' | 'vip-package' | 'certificate' | 'course'>('e-book');
  const [newOrderPrice, setNewOrderPrice] = useState<number>(25000);
  const [newOrderCurrency, setNewOrderCurrency] = useState<'MMK' | 'THB' | 'XP'>('MMK');
  const [newOrderStatus, setNewOrderStatus] = useState<'pending' | 'completed' | 'cancelled'>('pending');
  const [newOrderPhone, setNewOrderPhone] = useState<string>('');
  const [newOrderEmail, setNewOrderEmail] = useState<string>('');
  const [newOrderNotes, setNewOrderNotes] = useState<string>('');

  const fetchOrdersFromD1 = useCallback(async () => {
    setIsSyncingD1Orders(true);
    try {
      const isAdminUser = localStorage.getItem('thai_user_is_admin') === 'true' || isAdmin;
      const activeUserId = user?.id || currentUser;
      if (!isAdminUser && !activeUserId) return;
      const endpoint = isAdminUser
        ? '/api/admin/transactions'
        : `/api/orders?userId=${encodeURIComponent(activeUserId!)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data: any = await res.json();
        const rawList = data.data || data.orders || [];
        if (Array.isArray(rawList)) {
          const mapped: PurchaseOrder[] = rawList.map((t: any) => ({
            id: t.id,
            courseId: t.course_id || t.courseId || undefined,
            username: t.student_full_name || t.user_id || t.username || 'Student',
            itemName: t.course_name || t.item_name || t.itemName || 'Thai Language Course',
            itemType: t.item_type || t.itemType || 'course',
            priceAmount: Number(t.amount || t.price_amount || t.priceAmount || 0),
            currency: t.currency || 'MMK',
            status: t.status || 'pending',
            orderDate: t.created_at ? String(t.created_at).split(' ')[0].split('T')[0] : (t.orderDate || new Date().toISOString().split('T')[0]),
            studentPhone: t.student_phone || t.studentPhone || '',
            studentEmail: t.student_profile_email || t.student_email || t.studentEmail || '',
            evidenceImage: t.slip_image || t.evidenceImage || t.transaction_proof_url || '',
            adminNotes: t.admin_notes || t.adminNotes || ''
          }));
          setOrders(mapped);
        }
      }
    } catch (err) {
      console.warn('[D1 Transactions/Orders Sync Note]', err);
    } finally {
      setIsSyncingD1Orders(false);
    }
  }, [isAdmin, user?.id, currentUser]);

  useEffect(() => {
    fetchOrdersFromD1();

    const activeUserId = user?.id || currentUser;
    const interval = window.setInterval(() => {
      const shouldRefreshAdmin = isAdmin && location.pathname === '/admin/dashboard' && adminHubTab === 'orders';
      const shouldRefreshStudent = !isAdmin && Boolean(activeUserId);
      if (shouldRefreshAdmin || shouldRefreshStudent) {
        fetchOrdersFromD1();
      }
    }, 5000);

    const refreshOnFocus = () => fetchOrdersFromD1();
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [adminHubTab, currentUser, user?.id, isAdmin, fetchOrdersFromD1]);

  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderUsername.trim() || !newOrderItemName.trim()) {
      alert('Please fill in student username and package description.');
      return;
    }

    const newOrder: PurchaseOrder = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      username: newOrderUsername.trim(),
      itemName: newOrderItemName.trim(),
      itemType: newOrderItemType,
      priceAmount: Number(newOrderPrice) || 0,
      currency: newOrderCurrency,
      status: newOrderStatus,
      orderDate: new Date().toISOString().split('T')[0],
      studentPhone: newOrderPhone.trim() || undefined,
      studentEmail: newOrderEmail.trim() || undefined,
      adminNotes: newOrderNotes.trim() || undefined,
    };

    setOrders(prev => [newOrder, ...prev]);
    addSystemLog('admin', `Created new purchase order ${newOrder.id} for "${newOrder.username}"`);

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify(newOrder),
      });
    } catch (apiErr) {
      console.warn("Create order D1 API error:", apiErr);
    }

    setNewOrderUsername('');
    setNewOrderItemName('');
    setNewOrderPrice(25000);
    setNewOrderPhone('');
    setNewOrderEmail('');
    setNewOrderNotes('');
    setShowCreateOrderModal(false);
  };

  const handleAdminApproveOrder = useCallback(async (orderId: string, itemName: string, username: string, courseId?: string) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'approved' } : o));
    addSystemLog('admin', `Approved purchase of "${itemName}" by "${username}"`);
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ transactionId: orderId, id: orderId, status: 'approved', courseId })
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success) throw new Error(payload.error || 'API failed');
      fetchOrdersFromD1();
    } catch (err) {
      console.warn("Approve order D1 error, rolling back:", err);
      setOrders(previousOrders);
      alert('Failed to approve on server. Change rolled back.');
    }
  }, [orders, fetchOrdersFromD1]);

  const handleStudyInteractive = useCallback((res: any) => {
    setActiveReadingResource(res);
  }, []);

  const handleDownloadResource = useCallback((res: any) => {
    window.open(res.downloadUrl, '_blank');
    addSystemLog(currentUser || 'student', `Downloaded PDF companion resource: "${res.name}"`);
  }, [currentUser]);

  const openEnrollmentPortal = useCallback((courseData: {
    title?: string;
    name?: string;
    price?: string | number;
    priceAmount?: number;
    type?: string;
    itemType?: string;
    id?: string;
    description?: string;
  }) => {
    const isAuth = isLoggedIn || !!user || getAuthValueSync('thai_user_logged_in') === 'true' || !!localStorage.getItem('userToken') || !!localStorage.getItem('thai_user_logged_in');

    if (!isAuth) {
      alert('Please login to enroll in premium courses.');
      navigate('/sign-in');
      return false;
    }

    const rawTitle = courseData.title || courseData.name || "Advanced Business Thai Speaking";
    const rawPriceStr = String(courseData.price ?? courseData.priceAmount ?? '35000');
    const cleanPriceNum = typeof courseData.price === 'number'
      ? courseData.price
      : typeof courseData.priceAmount === 'number'
      ? courseData.priceAmount
      : parseInt(rawPriceStr.replace(/[^0-9]/g, '') || '35000', 10);

    const requestedItemType = String(courseData.itemType || courseData.type || 'e-book').toLowerCase();
    const normalizedItemType = requestedItemType === 'course' || requestedItemType === 'premium course'
      ? 'course'
      : ['tutoring', 'vip-package', 'certificate'].includes(requestedItemType)
        ? requestedItemType
        : 'e-book';

    const checkoutProduct = {
      id: courseData.id || `item_${Date.now()}`,
      name: rawTitle,
      nameMm: (courseData as any).nameMm || '',
      priceAmount: cleanPriceNum,
      currency: 'MMK' as const,
      itemType: normalizedItemType,
      duration: courseData.type || "PREMIUM RESOURCE",
      description: courseData.description || `Direct premium supplementary asset for ${rawTitle}`,
      descriptionMm: (courseData as any).descriptionMm || '',
      instructor: (courseData as any).instructor || "Kru Jane & Sayar Thura",
      includes: ["Permanent direct access", "Interactive study materials", "Full workbook & exercises"]
    };

    setGatewayCourse(checkoutProduct as any);
    setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
    setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
    setGatewayStep(1);
    setGatewayPaymentMethod('kbzpay');
    setGatewayOtp('');
    setGatewayTimer(180);
    setIsGatewayOpen(true);
    return true;
  }, [isLoggedIn, user, navigate, progress.masteredWords.length, currentUser]);

  const handlePurchaseResource = useCallback((res: any, courseName: string, courseInstructor?: string) => {
    openEnrollmentPortal({
      id: res.id,
      title: res.name,
      name: res.name,
      price: res.priceAmount || 15000,
      type: "PREMIUM RESOURCE",
      description: `Direct premium supplementary eBook for ${courseName}`,
      instructor: courseInstructor
    });
  }, [openEnrollmentPortal]);

  const handleAdminRejectOrder = useCallback(async (orderId: string) => {
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
    addSystemLog('admin', `Denied and Cancelled order "${orderId}"`);
    try {
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
        body: JSON.stringify({ transactionId: orderId, id: orderId, status: 'rejected' })
      });
      if (!res.ok) throw new Error('API failed');
      fetchOrdersFromD1();
    } catch (err) {
      console.warn("Reject order D1 error, rolling back:", err);
      setOrders(previousOrders);
      alert('Failed to reject on server. Change rolled back.');
    }
  }, [orders, fetchOrdersFromD1]);

  const handleDeleteOrder = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete purchase order ${orderId}?`)) {
      return;
    }

    setOrders(prev => prev.filter(o => o.id !== orderId));
    addSystemLog('admin', `Deleted purchase order ${orderId}`);

    try {
      await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: { 'X-Static-Admin': 'true' },
      });
    } catch (apiErr) {
      console.warn("Delete order D1 API error:", apiErr);
    }
  };

  // Dynamic system logs shown on the admin panel
  const [systemLogs, setSystemLogs] = useState<{ id: string; user: string; action: string; time: string }[]>(() => {
    return [
      { id: "log-1", user: "ko_nay_min", action: "Completed Lesson 4 Quiz (+150 XP)", time: "10 mins ago" },
      { id: "log-2", user: "ma_khine", action: "Mastered word 'สวัสดี' (+10 XP)", time: "24 mins ago" },
      { id: "log-3", user: "phyo_wai", action: "Passed Grammar Chapter 1 test", time: "1 hour ago" },
      { id: "log-4", user: "Anonymous", action: "Switched pronunciation speed to SLOW", time: "2 hours ago" },
    ];
  });



  // Load progress dynamically from localStorage and API
  const loadLatestProgress = useCallback(() => {
    const saved = localStorage.getItem('userProgress') || localStorage.getItem('thai_mm_progress_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        const lastActive = parsed.lastActiveDate;
        let currentStreak = parsed.streak || 1;

        if (lastActive && lastActive !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (lastActive === yesterday) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        }

        const loaded: ProgressState = {
          completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
          masteredWords: Array.isArray(parsed.masteredWords) ? parsed.masteredWords : [],
          totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : (typeof parsed.xp === 'number' ? parsed.xp : 0),
          streak: currentStreak,
          lastActiveDate: today,
          quizHighScores: parsed.quizHighScores || {}
        };

        setProgress(loaded);
      } catch (e) {
        console.error("Error reading saved progress", e);
      }
    }
  }, []);

  useEffect(() => {
    loadLatestProgress();

    const handleProgressChange = () => loadLatestProgress();
    window.addEventListener('progressUpdated', handleProgressChange);
    window.addEventListener('userProgressUpdated', handleProgressChange);
    window.addEventListener('thai_progress_updated', handleProgressChange);
    window.addEventListener('storage', handleProgressChange);

    return () => {
      window.removeEventListener('progressUpdated', handleProgressChange);
      window.removeEventListener('userProgressUpdated', handleProgressChange);
      window.removeEventListener('thai_progress_updated', handleProgressChange);
      window.removeEventListener('storage', handleProgressChange);
    };
  }, [loadLatestProgress]);

  // Helper to generate a genuine educational PDF guide on the fly and trigger file download
  const triggerPdfDownload = (fileName: string, title: string, description: string, languageHighlights: { thai: string, pronunciation: string, myanmar: string }[]) => {
    const itemsText = languageHighlights.map((hl, idx) => {
      return `${idx + 1}. ${hl.thai} [${hl.pronunciation}] - ${hl.myanmar}`;
    }).join("\n");

    const pdfContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.275 841.889] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 850 >>
stream
BT
/F1 16 Tf
50 780 Td
(${title}) Tj
/F2 10 Tf
0 -25 Td
(Kru Jane & Sayar Thura Thai Language Academy) Tj
0 -15 Td
(E-Book Reference Companion Guide) Tj
0 -30 Td
(About: ${description}) Tj
0 -30 Td
/F1 12 Tf
(ESSENTIAL PHRASES & VOCABULARY HIGHLIGHTS:) Tj
/F2 10 Tf
0 -20 Td
${itemsText.split('\n').map(line => `(${line}) Tj\n0 -15 Td`).join('\n')}
0 -30 Td
(Downloaded officially via classroom portal.) Tj
0 -15 Td
(Unlock Advanced levels to master Business negotiations, contracts & full speaking guides.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000120 00000 n 
0000000273 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
1100
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addSystemLog(currentUser || "Student", `Downloaded free study textbook: "${title}"`);
  };

  // Save progress changes and dispatch events for instant UI reactivity
  const saveProgress = (newState: ProgressState) => {
    setProgress(newState);
    localStorage.setItem('thai_mm_progress_v1', JSON.stringify(newState));
    localStorage.setItem('userProgress', JSON.stringify(newState));

    if (isLoggedIn && currentUser && !isAdmin) {
      // Sync XP dynamically in the registered user list
      setRegisteredUsers((prev) => {
        const nextList = prev.map((u) => 
          (u?.username || '').toLowerCase() === (currentUser || '').toLowerCase() 
            ? { ...u, xp: newState.totalXp } 
            : u
        );
        localStorage.setItem('thai_registered_users_list', JSON.stringify(nextList));
        return nextList;
      });

      // Post progress update to Cloudflare D1 API asynchronously
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser,
          progressData: newState
        })
      }).catch(err => console.warn('D1 progress sync notice:', err));
    }

    // Dispatch custom events to immediately notify Profile UI and other components
    window.dispatchEvent(new Event('progressUpdated'));
    window.dispatchEvent(new Event('userProgressUpdated'));
    window.dispatchEvent(new CustomEvent('thai_progress_updated', { detail: newState }));
  };


  // User log-in and sign-up handlers
  const handleAdminLogin = async (usernameStr: string, passwordStr: string): Promise<boolean> => {
    const cleanUser = usernameStr.trim();
    const cleanPassword = passwordStr.trim();

    if (!cleanUser) {
      alert("Please enter a username or email address.");
      return false;
    }
    if (cleanPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

    // 1. Check hardcoded master admin local developer fallback
    if (cleanUser.toLowerCase() === 'admin' && cleanPassword === 'admin@4238') {
      setIsLoggedIn(true);
      setCurrentUser('admin');
      setIsAdmin(true);
      await setAuthValue('thai_user_logged_in', 'true');
      await setAuthValue('thai_current_user', 'admin');
      await setAuthValue('thai_user_is_admin', 'true');
      setShowAuthModal(false);
      setDashboardTab('admin'); // Navigate to administrator dashboard directly
      addSystemLog('admin', 'Logged into Administrator Console (Master)');
      return true;
    }

    // 2. Otherwise authenticate via Local/D1 API Auth
    const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@sirithai.local`;
    const res = await loginUser(email, cleanPassword);
    if (res.success && res.user) {
      const emailVal = res.user.email || '';
      const name = res.user.user_metadata?.full_name || res.user.user_metadata?.username || emailVal.split('@')[0];
      
      setIsLoggedIn(true);
      setCurrentUser(name);
      
      const isAdm = res.user.user_metadata?.role === 'admin' || emailVal === 'admin@sirithai.com' || emailVal.startsWith('admin');
      setIsAdmin(isAdm);
      
      await setAuthValue('thai_user_logged_in', 'true');
      await setAuthValue('thai_current_user', name);
      await setAuthValue('thai_user_is_admin', isAdm ? 'true' : 'false');
      
      setShowAuthModal(false);
      
      if (isAdm) {
        setDashboardTab('admin');
        addSystemLog(name, 'Admin logged into console');
      } else {
        setDashboardTab('lessons');
        addSystemLog(name, `Student logged in dynamically.`);
      }
      return true;
    } else {
      setAuthError(res.message || 'Incorrect credentials.');
      return false;
    }
  };

  const handleStandardSignUp = async (usernameStr: string, passwordStr?: string): Promise<boolean> => {
    const cleanUser = usernameStr.trim();
    const cleanPassword = (passwordStr || '').trim();
    
    if (!cleanUser) {
      alert("Username/Email cannot be blank.");
      return false;
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

    const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@sirithai.local`;
    
    // Register using Local/D1 API Auth helper
    const res = await registerNewUser(email, cleanPassword, cleanUser);
    if (res.success) {
      setIsLoggedIn(true);
      setCurrentUser(cleanUser);
      setIsAdmin(false);
      
      await setAuthValue('thai_user_logged_in', 'true');
      await setAuthValue('thai_current_user', cleanUser);
      await setAuthValue('thai_user_is_admin', 'false');
      
      setShowAuthModal(false);
      
      addSystemLog(cleanUser, `Newly registered as Student and synchronized progress (+${progress.totalXp} XP)`);
      return true;
    } else {
      alert(`Registration failed: ${res.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleSignOut = async () => {
    const prevUser = currentUser || 'User';
    if (user) {
      await signOut();
    }
    
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsAdmin(false);
    localStorage.removeItem('admin_session_active');
    await removeAuthValue('thai_user_logged_in');
    await removeAuthValue('thai_current_user');
    await removeAuthValue('thai_user_is_admin');
    
    if (dashboardTab === 'admin') {
      setDashboardTab('lessons');
    }
    addSystemLog(prevUser, "Safely signed out from server session");
  };

  const addSystemLog = (user: string, action: string) => {
    const newLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000000),
      user,
      action,
      time: 'Just now'
    };
    setSystemLogs((prev) => [newLog, ...prev.slice(0, 15)]);
  };

  const getCustomVocabList = (lessonId: number): WordBreakdown[] => {
    const saved = localStorage.getItem(`thai_custom_vocab_${lessonId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  };

  const saveCurriculumToD1 = async (table: string, payload: any): Promise<boolean> => {
    try {
      const res = await sessionCachedFetch(`/api/api-curriculum?table=${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Static-Admin': 'true',
          'Authorization': 'Bearer admin-local-session'
        },
        body: JSON.stringify(payload)
      });
      const data: any = await res.json();
      if (res.ok && data.success) {
        showCurriculumToast('success', data.message || `Saved ${table} to Cloudflare D1 database successfully!`);
        return true;
      } else {
        showCurriculumToast('error', data.error || data.details || `Failed to save ${table} to D1 database.`);
        return false;
      }
    } catch (err: any) {
      console.error(`D1 CRUD error for ${table}:`, err);
      showCurriculumToast('error', `D1 Database connection error: ${err.message || String(err)}`);
      return false;
    }
  };

  const handleSaveLessonMetadata = async (lessonId: number) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    const payload = {
      id: lesson.id,
      course_id: lesson.courseId || 'course-basic',
      title_thai: lesson.titleThai || '',
      title_phonetic: lesson.titlePhonetic || '',
      title_myanmar_phonetic: lesson.titleMyanmarPhonetic || '',
      title_english: lesson.titleEnglish || '',
      title_myanmar: lesson.titleMyanmar || '',
      dialogue: lesson.dialogue || [],
      grammar: lesson.grammarNotes || [],
      quizzes: lesson.quiz || []
    };

    addSystemLog('admin', `Saving Lesson ${lessonId} metadata to Cloudflare D1`);
    await saveCurriculumToD1('lessons', payload);
  };

  const handleSaveVocabList = (lessonId: number, updatedVocab: WordBreakdown[]) => {
    localStorage.setItem(`thai_custom_vocab_${lessonId}`, JSON.stringify(updatedVocab));
    window.dispatchEvent(new Event('thai_vocab_updated'));
    addSystemLog('admin', `Updated dynamic Vocabulary database of Lesson ${lessonId}`);
    saveCurriculumToD1('vocab', { lesson_id: lessonId, vocab: updatedVocab });
  };

  const updateLessonField = (lessonId: number, field: keyof Lesson, value: any) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return { ...l, [field]: value };
      }
      return l;
    }));
    addSystemLog('admin', `Updated ${field} for Lesson ${lessonId}`);
  };

  const handleSaveDialogue = (lessonId: number, updatedDialogue: DialogueLine[]) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return { ...l, dialogue: updatedDialogue };
      }
      return l;
    }));
    addSystemLog('admin', `Saved Dialogue context configuration for Lesson ${lessonId}`);
    saveCurriculumToD1('dialogue', { lesson_id: lessonId, dialogue: updatedDialogue });
  };

  const handleSaveGrammarNotes = (lessonId: number, updatedGrammar: GrammarNote[]) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return { ...l, grammarNotes: updatedGrammar };
      }
      return l;
    }));
    addSystemLog('admin', `Saved Grammar context rules for Lesson ${lessonId}`);
    saveCurriculumToD1('grammar', { lesson_id: lessonId, grammar: updatedGrammar });
  };

  const handleSaveQuizzes = (lessonId: number, updatedQuizzes: QuizQuestion[]) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return { ...l, quiz: updatedQuizzes };
      }
      return l;
    }));
    addSystemLog('admin', `Saved interactive Quizzes context for Lesson ${lessonId}`);
    saveCurriculumToD1('quizzes', { lesson_id: lessonId, quizzes: updatedQuizzes });
  };

  // --- CSV Import Engine & Utilities ---
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        result.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      result.push(row);
    }
    return result.filter(r => r.length > 0 && r.some(cell => cell !== ''));
  };

  const downloadCsvTemplate = (type: string) => {
    let headers = '';
    let sample = '';
    let filename = '';

    if (type === 'vocabulary') {
      headers = 'thai,phonetic,english,myanmar,partOfSpeech,notes\n';
      sample = 'ข้าว,khaaw,rice,ထမင်း,noun,basic food item\nน้ำ,naam,water,ရေ,noun,essential fluid\n';
      filename = 'thai_vocabulary_template.csv';
    } else if (type === 'dialogue') {
      headers = 'speaker,thai,phonetic,english,myanmar,words\n';
      sample = 'A,สบายดีไหม,sa-baai-dee mai,How are you?,နေကောင်းလား,"สบายดี|sa-baai-dee|fine|နေကောင်းတယ်|verb ; ไหม|mai|question marker|လား|particle"\nB,สบายดีครับ,sa-baai-dee khráp,I am fine thank you.,နေကောင်းပါတယ်ခင်ဗျာ,"สบายดี|sa-baai-dee|fine|နေကောင်းတယ်|verb ; ครับ|khráp|polite male|ခင်ဗျာ|particle"\n';
      filename = 'thai_dialogue_template.csv';
    } else if (type === 'grammar') {
      headers = 'title,titleMyanmar,explanation,explanationMyanmar,examples\n';
      sample = 'Using polite particle "khrap",အမျိုးသားယဉ်ကျေးမှုစကား,Add "khrap" at the end of statements for polite male speech,အမျိုးသားများအတွက် ယဉ်ကျေးစွာပြောဆိုရန် ဝါကျအဆုံးတွင် "khrap" ထည့်ပါ,"สวัสดีครับ|sa-wat-dee khráp|Hello (male)|မင်္ဂလာပါခင်ဗျာ ; ขอบคุณครับ|khòop-khun khráp|Thank you (male)|ကျေးဇူးတင်ပါတယ်ခင်ဗျာ"\n';
      filename = 'thai_grammar_template.csv';
    } else if (type === 'quiz') {
      headers = 'type,prompt,promptThai,options,correctAnswer,explanation,explanationMyanmar\n';
      sample = 'translate-thai-to-mm,What does "สวัสดี" mean?,สวัสดี,နေကောင်းလား|မင်္ဂလာပါ|ကျေးဇူးတင်ပါတယ်|သွားတော့မယ်,မင်္ဂလာပါ,Standard greeting context,Sawatdee သည် ထိုင်းနှုတ်ဆက်စကား မင်္ဂလာပါ ဖြစ်သည်။\n';
      filename = 'thai_quiz_template.csv';
    } else if (type === 'lessons') {
      headers = 'id,titleThai,titlePhonetic,titleEnglish,titleMyanmar,titleMyanmarPhonetic,descriptionEnglish,descriptionMyanmar\n';
      sample = '51,บทเรียนทดสอบ,Bot-riian thot-sɔɔp,Advanced Testing Lesson,စမ်းသပ်သင်ခန်းစာ,စမ်း-သပ်-သင်-ခန်း-စာ,An advanced lesson imported via Excel/CSV system,Excel/CSV စနစ်မှ တစ်ဆင့် ထည့်သွင်းထားသော သင်ခန်းစာဖြစ်သည်။\n';
      filename = 'thai_lessons_metadata_template.csv';
    }

    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadOrdersAsJSON = (filteredOrders: PurchaseOrder[], customFileName?: string) => {
    try {
      const dataStr = JSON.stringify(filteredOrders, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', customFileName || `${currentUser || 'my'}_orders_ledger.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addSystemLog(currentUser || 'User', `Successfully downloaded orders ledger as JSON file: ${customFileName || 'default'}`);
    } catch (e) {
      alert('Failed to generate JSON download.');
    }
  };

  const downloadOrdersAsCSV = (filteredOrders: PurchaseOrder[], customFileName?: string) => {
    try {
      const headers = ['Order ID', 'Item Name', 'Item Type', 'Price Amount', 'Currency', 'Status', 'Date Placed', 'Contact Phone', 'Contact Email', 'Admin Notes', 'Student Username', 'Payment Image Attached'];
      const escapeCSVCell = (val: string | number | undefined) => {
        if (val === undefined || val === null) return '""';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      const rows = filteredOrders.map(o => [
        escapeCSVCell(o.id),
        escapeCSVCell(o.itemName),
        escapeCSVCell(o.itemType),
        escapeCSVCell(o.priceAmount),
        escapeCSVCell(o.currency),
        escapeCSVCell(o.status),
        escapeCSVCell(o.orderDate),
        escapeCSVCell(o.studentPhone),
        escapeCSVCell(o.studentEmail),
        escapeCSVCell(o.adminNotes),
        escapeCSVCell(o.username),
        o.evidenceImage ? '"Yes"' : '"No"'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', customFileName || `${currentUser || 'my'}_orders_ledger.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addSystemLog(currentUser || 'User', `Successfully downloaded purchase ledger as CSV file: ${customFileName || 'default'}`);
    } catch (e) {
      alert('Failed to generate CSV download.');
    }
  };

  const handleSyllabusCsvFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSyllabusCsvFile(file);
    }
  };

  const processSyllabusCsvFile = (file: File) => {
    setSyllabusCsvFile(file);
    setSyllabusCsvFileName(file.name);
    setSyllabusCsvErrors([]);
    setSyllabusCsvParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setSyllabusCsvErrors(['Empty file or unable to read file contents.']);
        return;
      }
      parseAndValidateSyllabusCsv(text);
    };
    reader.onerror = () => {
      setSyllabusCsvErrors(['Error reading file.']);
    };
    reader.readAsText(file);
  };

  const parseAndValidateSyllabusCsv = (text: string) => {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setSyllabusCsvErrors(['Invalid CSV format. File must contain at least a header row and one data row.']);
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    const parsed: any[] = [];
    const errors: string[] = [];

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const getVal = (headerName: string): string => {
        const colIdx = headers.indexOf(headerName.toLowerCase().trim());
        return colIdx !== -1 && row[colIdx] !== undefined ? row[colIdx].trim() : '';
      };

      const idVal = getVal('id');
      const titleThai = getVal('titleThai');
      const titlePhonetic = getVal('titlePhonetic');
      const titleEnglish = getVal('titleEnglish');
      const titleMyanmar = getVal('titleMyanmar');
      const titleMyanmarPhonetic = getVal('titleMyanmarPhonetic') || getVal('myanPhonetic');
      const descriptionEnglish = getVal('descriptionEnglish');
      const descriptionMyanmar = getVal('descriptionMyanmar');

      if (!idVal) errors.push(`Row ${rowNum}: Lesson 'id' (number) is required.`);
      if (!titleEnglish) errors.push(`Row ${rowNum}: Lesson 'titleEnglish' is required.`);

      const parsedId = Number(idVal);
      if (isNaN(parsedId)) {
        errors.push(`Row ${rowNum}: Lesson ID must be a valid number.`);
      }

      parsed.push({
        id: parsedId,
        titleThai: titleThai || "บทเรียนใหม่",
        titlePhonetic: titlePhonetic || "Bot-riian mai",
        titleEnglish,
        titleMyanmar: titleMyanmar || titleEnglish,
        titleMyanmarPhonetic: titleMyanmarPhonetic || undefined,
        descriptionEnglish: descriptionEnglish || "",
        descriptionMyanmar: descriptionMyanmar || "",
        dialogue: [],
        grammarNotes: [],
        quiz: []
      });
    });

    setSyllabusCsvParsedData(parsed);
    setSyllabusCsvErrors(errors);
  };

  const submitSyllabusCsvImport = () => {
    if (syllabusCsvParsedData.length === 0) {
      alert("No valid lesson rows found to import. Please check columns and formatting.");
      return;
    }
    if (syllabusCsvErrors.length > 0) {
      const proceed = window.confirm(`There are ${syllabusCsvErrors.length} errors/warnings found in your CSV data. Would you like to proceed anyway, skipping corrupted records?`);
      if (!proceed) return;
    }

    const updatedLessons = [...lessons];
    let addedCount = 0;
    let updatedCount = 0;

    syllabusCsvParsedData.forEach((importedLesson: Lesson) => {
      const existingIdx = updatedLessons.findIndex(l => l.id === importedLesson.id);
      if (existingIdx !== -1) {
        updatedLessons[existingIdx] = {
          ...updatedLessons[existingIdx],
          titleThai: importedLesson.titleThai,
          titlePhonetic: importedLesson.titlePhonetic,
          titleEnglish: importedLesson.titleEnglish,
          titleMyanmar: importedLesson.titleMyanmar,
          titleMyanmarPhonetic: importedLesson.titleMyanmarPhonetic,
          descriptionEnglish: importedLesson.descriptionEnglish,
          descriptionMyanmar: importedLesson.descriptionMyanmar
        };
        updatedCount++;
      } else {
        updatedLessons.push(importedLesson);
        addedCount++;
      }
    });

    updatedLessons.sort((a, b) => a.id - b.id);
    setLessons(updatedLessons);
    localStorage.setItem('thai_lessons_curriculum', JSON.stringify(updatedLessons));
    addSystemLog('admin', `Syllabus upload: Imported ${addedCount} new lessons and updated ${updatedCount} existing lessons.`);
    alert(`Curriculum syllabus imported/updated successfully!\n- Added: ${addedCount} lesson(s)\n- Updated: ${updatedCount} lesson(s)`);

    setSyllabusCsvFile(null);
    setSyllabusCsvParsedData([]);
    setSyllabusCsvErrors([]);
    setSyllabusCsvFileName('');
    setIsSyllabusImportExpanded(false);
  };

  const handleCsvFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCsvFile(file);
    }
  };

  const processCsvFile = (file: File) => {
    setCsvFile(file);
    setCsvFileName(file.name);
    setCsvErrors([]);
    setCsvParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvErrors(['Empty file or unable to read file contents.']);
        return;
      }
      parseAndValidateCsv(text, csvImportType);
    };
    reader.onerror = () => {
      setCsvErrors(['Error reading file.']);
    };
    reader.readAsText(file);
  };

  const parseAndValidateCsv = (text: string, type: 'vocabulary' | 'dialogue' | 'grammar' | 'quiz' | 'lessons') => {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setCsvErrors(['Invalid CSV format. File must contain at least a header row and one data row.']);
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);
    const parsed: any[] = [];
    const errors: string[] = [];

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const getVal = (headerName: string): string => {
        const colIdx = headers.indexOf(headerName.toLowerCase().trim());
        return colIdx !== -1 && row[colIdx] !== undefined ? row[colIdx].trim() : '';
      };

      if (type === 'vocabulary') {
        const thai = getVal('thai');
        const phonetic = getVal('phonetic');
        const english = getVal('english');
        const myanmar = getVal('myanmar');
        const partOfSpeech = getVal('partOfSpeech') || 'noun';
        const notes = getVal('notes');

        if (!thai) errors.push(`Row ${rowNum}: 'thai' column value is required.`);
        if (!english) errors.push(`Row ${rowNum}: 'english' meaning column is required.`);
        if (!myanmar) errors.push(`Row ${rowNum}: 'myanmar' translation is required.`);

        parsed.push({
          thai,
          phonetic: phonetic || thai,
          english,
          myanmar,
          partOfSpeech,
          notes: notes || undefined
        });
      } else if (type === 'dialogue') {
        const speaker = getVal('speaker') || 'A';
        const thai = getVal('thai');
        const phonetic = getVal('phonetic');
        const english = getVal('english');
        const myanmar = getVal('myanmar');
        const wordsStr = getVal('words');

        if (!thai) errors.push(`Row ${rowNum}: 'thai' transcription is required.`);
        if (!english) errors.push(`Row ${rowNum}: 'english' meaning is required.`);
        if (!myanmar) errors.push(`Row ${rowNum}: 'myanmar' translation is required.`);

        const words: WordBreakdown[] = [];
        if (wordsStr) {
          const parts = wordsStr.split(';').map(p => p.trim()).filter(Boolean);
          parts.forEach(part => {
            const fields = part.split('|').map(f => f.trim());
            if (fields.length >= 4) {
              words.push({
                thai: fields[0],
                phonetic: fields[1] || fields[0],
                english: fields[2],
                myanmar: fields[3],
                partOfSpeech: fields[4] || 'noun'
              });
            }
          });
        }

        if (words.length === 0) {
          words.push({
            thai: thai,
            phonetic: phonetic || thai,
            english: english,
            myanmar: myanmar,
            partOfSpeech: 'phrase'
          });
        }

        parsed.push({
          speaker,
          thai,
          phonetic: phonetic || thai,
          english,
          myanmar,
          words
        });
      } else if (type === 'grammar') {
        const title = getVal('title');
        const titleMyanmar = getVal('titleMyanmar') || title;
        const explanation = getVal('explanation');
        const explanationMyanmar = getVal('explanationMyanmar') || explanation;
        const examplesStr = getVal('examples');

        if (!title) errors.push(`Row ${rowNum}: Grammar 'title' column is required.`);
        if (!explanation) errors.push(`Row ${rowNum}: Grammar 'explanation' is required.`);

        const examples: any[] = [];
        if (examplesStr) {
          const parts = examplesStr.split(';').map(p => p.trim()).filter(Boolean);
          parts.forEach(part => {
            const fields = part.split('|').map(f => f.trim());
            if (fields.length >= 4) {
              examples.push({
                thai: fields[0],
                phonetic: fields[1] || fields[0],
                english: fields[2],
                myanmar: fields[3]
              });
            }
          });
        }

        parsed.push({
          title,
          titleMyanmar,
          explanation,
          explanationMyanmar,
          examples
        });
      } else if (type === 'quiz') {
        const quizType = getVal('type') || 'translate-thai-to-mm';
        const prompt = getVal('prompt');
        const promptThai = getVal('promptThai');
        const optionsStr = getVal('options');
        const correctAnswer = getVal('correctAnswer');
        const explanation = getVal('explanation');
        const explanationMyanmar = getVal('explanationMyanmar');

        if (!prompt) errors.push(`Row ${rowNum}: Quiz 'prompt' is required.`);
        if (!optionsStr) errors.push(`Row ${rowNum}: Quiz 'options' options separated by "|" are required.`);
        if (!correctAnswer) errors.push(`Row ${rowNum}: Quiz 'correctAnswer' option is required.`);

        const options = optionsStr.split('|').map(o => o.trim()).filter(Boolean);
        if (options.length < 2) {
          errors.push(`Row ${rowNum}: Options must contain at least 2 distinct options separated by "|".`);
        }
        if (options.length > 0 && !options.includes(correctAnswer)) {
          errors.push(`Row ${rowNum}: Correct answer ("${correctAnswer}") is missing from the options list (${options.join(', ')}).`);
        }

        parsed.push({
          id: `quiz-imported-${Date.now()}-${idx}`,
          type: quizType,
          prompt,
          promptThai: promptThai || undefined,
          options,
          correctAnswer,
          explanation: explanation || undefined,
          explanationMyanmar: explanationMyanmar || undefined
        });
      } else if (type === 'lessons') {
        const idVal = getVal('id');
        const titleThai = getVal('titleThai');
        const titlePhonetic = getVal('titlePhonetic');
        const titleEnglish = getVal('titleEnglish');
        const titleMyanmar = getVal('titleMyanmar');
        const titleMyanmarPhonetic = getVal('titleMyanmarPhonetic') || getVal('myanPhonetic');
        const descriptionEnglish = getVal('descriptionEnglish');
        const descriptionMyanmar = getVal('descriptionMyanmar');

        if (!idVal) errors.push(`Row ${rowNum}: Lesson 'id' (number) is required.`);
        if (!titleEnglish) errors.push(`Row ${rowNum}: Lesson 'titleEnglish' is required.`);

        const parsedId = Number(idVal);
        if (isNaN(parsedId)) {
          errors.push(`Row ${rowNum}: Lesson ID must be a valid number.`);
        }

        parsed.push({
          id: parsedId,
          titleThai: titleThai || "บทเรียนใหม่",
          titlePhonetic: titlePhonetic || "Bot-riian mai",
          titleEnglish,
          titleMyanmar: titleMyanmar || titleEnglish,
          titleMyanmarPhonetic: titleMyanmarPhonetic || undefined,
          descriptionEnglish: descriptionEnglish || "",
          descriptionMyanmar: descriptionMyanmar || "",
          dialogue: [],
          grammarNotes: [],
          quiz: []
        });
      }
    });

    setCsvParsedData(parsed);
    setCsvErrors(errors);
  };

  const submitCsvImport = () => {
    if (csvParsedData.length === 0) {
      alert("No valid data rows found to import. Please check columns and formatting.");
      return;
    }
    if (csvErrors.length > 0) {
      const proceed = window.confirm(`There are ${csvErrors.length} errors/warnings found in your CSV data. Would you like to proceed anyway, skipping corrupted records?`);
      if (!proceed) return;
    }

    const updatedLessons = [...lessons];

    if (csvImportType === 'lessons') {
      let addedCount = 0;
      let updatedCount = 0;

      csvParsedData.forEach((importedLesson: Lesson) => {
        const existingIdx = updatedLessons.findIndex(l => l.id === importedLesson.id);
        if (existingIdx !== -1) {
          updatedLessons[existingIdx] = {
            ...updatedLessons[existingIdx],
            titleThai: importedLesson.titleThai,
            titlePhonetic: importedLesson.titlePhonetic,
            titleEnglish: importedLesson.titleEnglish,
            titleMyanmar: importedLesson.titleMyanmar,
            titleMyanmarPhonetic: importedLesson.titleMyanmarPhonetic,
            descriptionEnglish: importedLesson.descriptionEnglish,
            descriptionMyanmar: importedLesson.descriptionMyanmar
          };
          updatedCount++;
        } else {
          updatedLessons.push(importedLesson);
          addedCount++;
        }
      });

      updatedLessons.sort((a, b) => a.id - b.id);
      setLessons(updatedLessons);
      addSystemLog('admin', `Imported ${addedCount} new lessons and updated ${updatedCount} lessons from CSV file.`);
      alert(`Lesson Curriculum sync successful!\n- New Lessons Added: ${addedCount}\n- Lessons Metadata Updated: ${updatedCount}`);
    } else {
      const activeLessonTarget = csvImportTargetLesson === 'all' 
        ? adminSelectedLessonId 
        : Number(csvImportTargetLesson);

      if (!activeLessonTarget) {
        alert("Please select a target Lesson in the database first.");
        return;
      }

      const lessonIdx = updatedLessons.findIndex(l => l.id === activeLessonTarget);
      if (lessonIdx === -1) {
        alert(`Target Lesson ID ${activeLessonTarget} does not exist.`);
        return;
      }

      const targetLesson = updatedLessons[lessonIdx];

      if (csvImportType === 'vocabulary') {
        const currentVocab = getCustomVocabList(activeLessonTarget) || [];
        const mergedVocab = [...currentVocab, ...csvParsedData];
        handleSaveVocabList(activeLessonTarget, mergedVocab);
        addSystemLog('admin', `Imported ${csvParsedData.length} vocabulary terms to Lesson ${activeLessonTarget} via CSV upload.`);
        alert(`Success! Imported ${csvParsedData.length} vocabulary items into Lesson ${activeLessonTarget}.`);
      } else if (csvImportType === 'dialogue') {
        const currentDialogue = targetLesson.dialogue || [];
        const updatedDialogue = [...currentDialogue, ...csvParsedData];
        handleSaveDialogue(activeLessonTarget, updatedDialogue);
        addSystemLog('admin', `Imported ${csvParsedData.length} dialogue lines to Lesson ${activeLessonTarget} via CSV upload.`);
        alert(`Success! Imported ${csvParsedData.length} sentence entries into Lesson ${activeLessonTarget}.`);
      } else if (csvImportType === 'grammar') {
        const currentNotes = targetLesson.grammarNotes || [];
        const updatedNotes = [...currentNotes, ...csvParsedData];
        handleSaveGrammarNotes(activeLessonTarget, updatedNotes);
        addSystemLog('admin', `Imported ${csvParsedData.length} grammar points to Lesson ${activeLessonTarget} via CSV upload.`);
        alert(`Success! Imported ${csvParsedData.length} grammar nodes into Lesson ${activeLessonTarget}.`);
      } else if (csvImportType === 'quiz') {
        const currentQuizzes = targetLesson.quiz || [];
        const updatedQuizzes = [...currentQuizzes, ...csvParsedData];
        handleSaveQuizzes(activeLessonTarget, updatedQuizzes);
        addSystemLog('admin', `Imported ${csvParsedData.length} interactive quizzes to Lesson ${activeLessonTarget} via CSV upload.`);
        alert(`Success! Imported ${csvParsedData.length} quiz questions into Lesson ${activeLessonTarget}.`);
      }
    }

    setCsvFile(null);
    setCsvParsedData([]);
    setCsvErrors([]);
    setCsvFileName('');
    setIsCsvImportExpanded(false);
    window.dispatchEvent(new Event('thai_vocab_updated'));
  };

  // Dismiss auto promotion modal
  const handleDismissPromo = () => {
    setHasDismissedPromo(true);
    sessionStorage.setItem('thai_has_dismissed_promo', 'true');
    setShowAuthModal(false);
    setAuthNotice('');
    setAuthError('');
  };

  // Compile all words from all lessons for the master dictionary grid
  const allMasterVocab: WordBreakdown[] = Object.values(
    lessons.reduce((acc: { [key: string]: WordBreakdown }, lesson) => {
      (lesson.dialogue || []).forEach((line) => {
        (line.words || []).forEach((word) => {
          if (word && word.thai && !acc[word.thai]) {
            acc[word.thai] = word;
          }
        });
      });
      return acc;
    }, {})
  );

  const filteredVocab = allMasterVocab.filter((word) => {
    const matchesSearch = 
      word.thai.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      word.phonetic.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      word.english.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      word.myanmar.includes(vocabSearch);

    const matchesMasteredFilter = onlyShowUnmastered 
      ? !progress.masteredWords.includes(word.thai)
      : true;

    return matchesSearch && matchesMasteredFilter;
  });

  const handleToggleMasteredWord = (thaiWord: string) => {
    let updated: string[];
    if (progress.masteredWords.includes(thaiWord)) {
      updated = progress.masteredWords.filter((w) => w !== thaiWord);
    } else {
      updated = [...progress.masteredWords, thaiWord];
    }
    const newState = {
      ...progress,
      masteredWords: updated,
      totalXp: progress.totalXp + (updated.includes(thaiWord) ? 10 : -10) // +10 XP for mastering a word!
    };
    saveProgress(newState);
  };

  const handleLessonCompleted = (lessonId: number | string) => {
    const numId = typeof lessonId === 'number' ? lessonId : (parseInt(String(lessonId).replace(/\D/g, '') || '0', 10) || lessonId);
    const isAlreadyDone = progress.completedLessons.some((id: any) => String(id) === String(lessonId) || String(id) === String(numId));

    if (!isAlreadyDone) {
      const newState: ProgressState = {
        ...progress,
        completedLessons: [...progress.completedLessons, numId as number],
        totalXp: progress.totalXp + 150
      };
      saveProgress(newState);
    }
  };

  const handleQuizFinished = (lessonId: number, scorePercentage: number, xpGained: number) => {
    const prevScore = progress.quizHighScores[lessonId] || 0;
    const newHighScores = {
      ...progress.quizHighScores,
      [lessonId]: Math.max(prevScore, scorePercentage)
    };

    const newState = {
      ...progress,
      quizHighScores: newHighScores,
      totalXp: progress.totalXp + xpGained
    };

    saveProgress(newState);
    if (scorePercentage >= 80) {
      handleLessonCompleted(lessonId);
    }
  };

  const handleSentenceAssembled = (xpGained: number) => {
    const newState = {
      ...progress,
      totalXp: progress.totalXp + xpGained
    };
    saveProgress(newState);
  };

  const speakText = async (text: string) => {
    const nextIndex = (audioSpeedIndex + 1) % 3;
    setAudioSpeedIndex(nextIndex);
    try {
      const match = await localDB.words_and_audio
        .where('thai_text').equalsIgnoreCase(text)
        .or('thai_text').equalsIgnoreCase(text.trim())
        .first();

      if (match && (match.audio_blob || match.audio_url)) {
        const audioUrl = match.audio_blob ? URL.createObjectURL(match.audio_blob) : match.audio_url!;
        const audio = playGlobalAudio(audioUrl);
        if (audio) {
          const rates = [1.0, 0.85, 0.7];
          audio.playbackRate = rates[nextIndex];
        }
        return;
      }
    } catch (e) {
      console.warn("Offline audio check failed, falling back to TTS:", e);
    }
    runTTS(text, nextIndex);
  };

  const runTTS = (text: string, nextIndex: number) => {
    const rates = [0.85, 0.7, 0.5];
    const rate = rates[nextIndex];
    speakGlobalText(text, 'th-TH', rate);
  };

  const getAdditionalPhrases = (chapterId: number, ruleIdx: number, mode: 'standard' | 'more' | 'formal' | 'casual'): { thai: string; phonetic: string; english: string; myanmar: string }[] => {
    // Custom premium data for Chapter 10 Tenses, which is the user's specific highlighted scenario
    if (chapterId === 10) {
      if (ruleIdx === 0) { // Tense Inferred from Context
        if (mode === 'more') {
          return [
            { thai: "พรุ่งนี้ตอนเช้าฉันจะไปตลาด", phonetic: "phrûŋ-níi tɔɔn cháaw chǎn ca paj tà-làat", english: "Tomorrow morning I will go to the market.", myanmar: "မနက်ဖြန်မနက် ကျွန်မ ဈေးသွားပါလိမ့်မယ်။" },
            { thai: "เมื่อวานนี้พวกเขาไม่ได้เรียน", phonetic: "mʉ̂a-waan-níi phûak-khǎw mâj dâaj rian", english: "Yesterday they did not study.", myanmar: "မနေ့က သူတို့ စาမသင်ခဲ့ကြပါဘူး။" }
          ];
        }
        if (mode === 'formal') {
          return [
            { thai: "คู่สัญญาจะส่งรายงานในวันพรุ่งนี้ครับ", phonetic: "khûu-sǎn-jaa ca sòŋ raaj-ŋaan naj wan phrûŋ-níi khráp", english: "The contracting party will deliver the report tomorrow.", myanmar: "စာချုပ်ချုပ်ဆိုသူဘက်မှ အစီရင်ခံစာကို မနက်ဖြันတွင် တင်ပြပါလိမ့်မည်ခင်ဗျာ။" },
            { thai: "เมื่อวานนี้กระผมได้พบผู้กำกับแล้วครับ", phonetic: "mʉ̂a-waan-níi kra-phǒm dâaj phóp phûu-kam-kàp lɛ́ɛw khráp", english: "Yesterday I already met the superintendent.", myanmar: "မနေ့က ကျွန်တော် ရဲမှူးကြီးနှင့် တွေ့ဆုံပြီးပါပြီခင်ဗျာ။" }
          ];
        }
        if (mode === 'casual') {
          return [
            { thai: "เมื่อวานไปกินส้มตำกันสะใจมากเลย", phonetic: "mʉ̂a-waan paj kin sôm-tam kan sà-caj mâak ləəj", english: "Yesterday we went and had papaya salad together, it was super satisfying!", myanmar: "မနေ့က သွားစားတဲ့ သင်္ဘောသီးထောင်းကတော့ တကယ့်ကို အကြိုက်တွေ့စရာပဲဟ။" },
            { thai: "พรุ่งนี้เดี๋ยวเจอกันหน้าสถานีนะ", phonetic: "phrûŋ-níi dǐaw cəə kan nâa sà-thǎa-nii ná", english: "I will see you tomorrow in front of the station, alright?", myanmar: "မနက်ဖြန် ဘူတာရုံရှေ့မှာ ဆုံကြမယ်နော်။" }
          ];
        }
      }

      if (ruleIdx === 1) { // Present Continuous with กำลัง
        if (mode === 'more') {
          return [
            { thai: "พวกเรากำลังสนทนาภาษาไทยบทที่สิบ", phonetic: "phûak-raw kam-laŋ sǒn-tha-naa phaašaa thaj bòt thîi sìp", english: "We are currently conversing in Lesson 10 Thai.", myanmar: "ကျွန်တော်တို့ လက်ရှိ ထိုင်းဘာသာစကား သင်ခန်းစာ ၁၀ ကို အပြန်အလှန်ပြောဆိုနေကြသည်။" },
            { thai: "นักเรียนกำลังเขียนคำศัพท์", phonetic: "nák-rian kam-laŋ khǐan kham-sàp", english: "The student is writing down vocabulary.", myanmar: "ကျောင်းသားသည် ဝေါဟာရစကားလုံးများကို လိုက်လံရေးမှတ်နေသည်။" }
          ];
        }
        if (mode === 'formal') {
          return [
            { thai: "ท่านประธานกำลังพิจารณารายละเอียดงานอยู่ครับ", phonetic: "thâan pra-thaan kam-laŋ phí-caa-rá-naa raaj-la-ìat ŋaan jùu khráp", english: "The chairman is currently evaluating the work details.", myanmar: "ဥက္ကဋ္ဌမင်းသည် လက်ရှိ လုပ်ငန်းအသေးစိတ်အချက်အလက်များကို သုံးသပ်နေပါသည်ခင်ဗျာ။" }
          ];
        }
        if (mode === 'casual') {
          return [
            { thai: "กำลังยุ่งอยู่ เดี๋ยวโทรกลับนะ", phonetic: "kam-laŋ jûŋ jùu dǐaw thoo klàp ná", english: "I'm busy right now, calling you back later!", myanmar: "အခု အလုပ်ရှုပ်နေလို့၊ ခဏနေမှ ဖုန်းပြန်ခေါ်မယ်နော်။" }
          ];
        }
      }

      if (ruleIdx === 2) { // Perfective aspect with แล้ว
        if (mode === 'more') {
          return [
            { thai: "พัสดุเดินทางมาถึงแล้ว", phonetic: "phát-sà-dù dthəən-thaary maa thʉ̌ŋ lɛ́ɛw", english: "The parcel has arrived already.", myanmar: "ချောထုပ် ရောက်ရှိလာခဲ့ပြီးပါပြီ။" },
            { thai: "ผู้ใหญ่บ้านพูดจบแล้ว", phonetic: "phûu-jàj-bâan phûut còp lɛ́ɛw", english: "The village chief has finished speaking already.", myanmar: "သူကြီး စကားပြောလို့ ပြီးသွားပြီ။" }
          ];
        }
        if (mode === 'formal') {
          return [
            { thai: "เอกสารฉบับนี้ได้รับอนุมัติเรียบร้อยแล้วครับ", phonetic: "èek-ka-sǎan chà-bàp níi dâaj-ráp a-nú-mát rîap-rɔ́ɔj lɛ́ɛw khráp", english: "This document has already been fully approved.", myanmar: "ဤစာရွက်စာတမ်းအား အတည်ပြုချက် ရရှိပြီးပါပြီခင်ဗျာ။" }
          ];
        }
        if (mode === 'casual') {
          return [
            { thai: "กินอิ่มแปล้แล้ว", phonetic: "kin ìm plɛ́ɛ lɛ́ɛw", english: "Extremely full already!", myanmar: "ဗိုက်ကောင်းကောင်းကြီး တင်းသွားပြီဟေ့။" }
          ];
        }
      }
    }

    // Generic realistic expansions for other chapters based on Chapter IDs
    return [
      {
        thai: "เราเรียนเรื่องนี้เสร็จแล้ว",
        phonetic: "raw rian rʉ̂aŋ níi sèt lɛ́ɛw",
        english: `[${mode.toUpperCase()}] We have finished learning this topic.`,
        myanmar: `[${mode.toUpperCase()}] ကျွန်တော်တို့ ဤသဒ္ဒါခေါင်းစဉ်ကို လေ့လာပြီးပါပြီ။`
      },
      {
        thai: "โปรดฟังครูอีกครั้งหนึ่ง",
        phonetic: "pròot faŋ khruu ìik khráŋ nʉ̀ŋ",
        english: "Please listen to the teacher once more.",
        myanmar: "ဆရာ့အသံကို နောက်တစ်ကြိမ် ဂရုတစိုက်နားထောင်ပေးပါ။"
      }
    ];
  };

  const getSubPageContent = (
    type: 'handbook' | 'lesson',
    parentId: number,
    topicIdx: number,
    pageIdx: number,
    original: { title: string; titleMyanmar: string; explanation: string; explanationMyanmar: string; examples: any[] }
  ): {
    title: string;
    titleMyanmar: string;
    explanation: string;
    explanationMyanmar: string;
    examples: { thai: string; phonetic: string; english: string; myanmar: string }[];
  } => {
    // Page 1 is always the original content
    if (pageIdx === 0) {
      return {
        title: original.title,
        titleMyanmar: original.titleMyanmar,
        explanation: original.explanation,
        explanationMyanmar: original.explanationMyanmar,
        examples: original.examples || []
      };
    }

    // Normalized parent ID based on category type
    const queryId = parentId;

    if (pageIdx === 1) {
      if (queryId === 10) { // Chapter 10 or Lesson 10: Tenses
        if (topicIdx === 2) { // Perfective aspect with แล้ว
          return {
            title: "Perfective Aspect: The Complete State of แล้ว",
            titleMyanmar: "'แล้ว' (lɛ́ɛw) ဖြင့် ပြီးမြောက်သွားသောအခြေအနေမှန်ကို ပြသခြင်း",
            explanation: "The particle 'แล้ว' (lɛ́ɛw) signifies that an action or transition has finished. When talking about states (like being full or grown up), 'lɛ́ɛw' means the state has successfully changed.",
            explanationMyanmar: "'แล้ว' သည် လုပ်ဆောင်ချက်တစ်ခု ပြီးဆုံးအကောင်အထည်ဖော်ပြီးကြောင်း သို့မဟုတ် ဗိုက်ပြည့်ခြင်း၊ ကြီးပြင်းခြင်း စသည့် အခြေအနေတစ်ခု ပြောင်းလဲပြီးမြောက်ကြောင်း ပြသသည်။",
            examples: [
              { thai: "ผมกินอาหารเย็นเสร็จเรียบร้อยแล้ว", phonetic: "phǒm kin aa-hǎan jen sèt rîap-rɔ́ɔj lɛ́ɛw", english: "I have already finished having dinner completely.", myanmar: "ကျွန်တော် ညစာ စားသုံးလို့ လုံးဝပြီးသွားပါပြီ။" },
              { thai: "ลูกสาวของเขาโตเป็นผู้ใหญ่แล้ว", phonetic: "lûuk-sǎaw khɔ̌ɔŋ khǎw too bpen phûu-jàj lɛ́ɛw", english: "His daughter has already grown up into an adult.", myanmar: "သူ့ရဲ့ သမီးဟာ လူကြီးတစ်ယောက်အဖြစ် ကြီးပြင်းသွားခဲ့ပါပြီ။" }
            ]
          };
        }
      }

      // Default fallback Page 2
      return {
        title: `${original.title}: Deep Context Analysis`,
        titleMyanmar: `${original.titleMyanmar} • အတွင်းကျကျ စနစ်တကျ လေ့လာခြင်း`,
        explanation: "Core Thai structures emphasize syntactic purity. To master this topic fully, study how polite final particles and context clues adjust the tone from formal administration to everyday street interactions.",
        explanationMyanmar: "ဤသဒ္ဒါအကြောင်းရင်းကို နားလည်ရန် ယဉ်ကျေးသော နောက်ဆက်စကားလုံးများနှင့် ဝါကျ၏ အသုံးအနှုန်း ကွာခြားမှုများကို လိုက်လျောညီထွေစွာ အသုံးချတတ်ရန် အထူးလိုအပ်သည်။",
        examples: [
          { thai: "พวกเราเข้าใจบทเรียนนี้เป็นอย่างดี", phonetic: "phûak-raw khâw-caaj bòt-rian níi bpen jàaŋ dii", english: "We understand this lesson very well.", myanmar: "ကျွန်တော်တို့ ဤသင်ခန်းစာကို ကောင်းမွန်စွာ နားလည်သဘောပေါက်ပါသည်။" },
          { thai: "คุณมีคำถามเพิ่มเติมไหมครับ", phonetic: "khun mii kham-thǎam phə̂əm-toom mǎj khráp", english: "Do you have any additional questions?", myanmar: "လူကြီးมင်းအနေဖြင့် နောက်ထပ် မေးမြန်းလိုသည့် မေးခွန်းများ ရှိပါသလားခင်ဗျา။" }
        ]
      };
    }

    if (pageIdx === 2) {
      // PAGE 3: Conversational Scenarios and Dialogues
      if (queryId === 10) { // Chapter 10 or Lesson 10: Tenses
        if (topicIdx === 0) { // Tense Inferred from Context
          return {
            title: "Tense Inferred from Context: Real Conversation Scenario",
            titleMyanmar: "အချိန်ကာလညွှန်းချက်များဖြင့် လက်တွေ့စကားပြောဆိုမှုပြခန်း",
            explanation: "Study this real-world exchange where time flows smoothly. Notice how the temporal context carries over between speakers without verbs shifting forms.",
            explanationMyanmar: "ကြิယာများ ပုံစံပြောင်းလဲခြင်းမရှိဘဲ စကားပြောသူနှစ်ဦးအကြား အတိတ်နှင့် အနာဂတ်ကာလများ ပြောင်းလဲပုံကို ဤလက်တွေ့စကားပြောခန်းတွင် လေ့လာပါ။",
            examples: [
              { thai: "เมื่อวานนี้คุณไปเที่ยวที่ไหนมาครับ", phonetic: "mʉ̂a-waan-níi khun paj thîaw thîi-nǎj maa khráp", english: "Where did you go travel yesterday?", myanmar: "မနေ့က လူကြီးมင်း ဘယ်ကို လည်ပတ်သွားခဲ့ပါသလဲခင်ဗျา။" },
              { thai: "เมื่อวานไปเที่ยวทะเลกับเพื่อนสนุกมากค่ะ", phonetic: "mʉ̂a-waan paj thîaw thá-lee kàp phʉ̂an sà-nùk mâak khâ", english: "Yesterday I went to the beach with friends, it was so fun!", myanmar: "မနေ့က သူငယ်ချင်းတွေနဲ့အတူ ပင်လယ်ကမ်းခြေကို သွားလည်ခဲ့တာ အရမ်းပျော်စရာကောင်းခဲ့ပါတယ်ရှင့်။" }
            ]
          };
        }
        if (topicIdx === 1) { // Progressives with กำลัง
          return {
            title: "Present Continuous: Conversation Practice Drill",
            titleMyanmar: "လက်ရှိပြုလုပ်ဆဲအခြေအနေများအတွက် စကားပြောလေ့ကျင့်ခန်း",
            explanation: "Practice using 'kamlang... jùu' in common questions and instant responses to show real-time dynamic events.",
            explanationMyanmar: "'กำลัง... อยู่' ကို အသုံးပြုပြီး လက်ရှိဖြစ်ပျက်နေသည့် အခြေအနေများကို အပြန်အလှัน စုံစမ်းဖြေကြားရန် လေ့ကျင့်ခန်း ဖြစ်သည်။",
            examples: [
              { thai: "แม่กำลังทำกับข้าวอยู่ในครัวหรือเปล่า", phonetic: "mɛ̂ɛ kam-laŋ tham kàp-khâaw jùu naj khrua rʉ̌ʉ bplàaw", english: "Is Mom currently cooking in the kitchen?", myanmar: "အမေက အခု မီးဖိုချောင်ထဲမှာ ဟင်းချက်နေဆဲဖြစ်ပါသလားဟင်။" },
              { thai: "ใช่ค่ะ คุณแม่กำลังเตรียมต้มยำกุ้งอยู่", phonetic: "châj khâ khun-mɛ̂ɛ kam-laŋ triam tôm-jam-kûŋ jùu", english: "Yes, she is currently preparing Tom Yum shrimp soup.", myanmar: "ဟုတ်ပါတယ်ရှင့်၊ အမေက တုံယမ်းပုစွန်ဟင်းချက်ဖို့ ပြင်ဆင်နေဆဲဖြစ်ပါတယ်ရှင့်။" }
            ]
          };
        }
        if (topicIdx === 2) { // Perfective aspect with แล้ว
          return {
            title: "Perfective Aspect: Completed Action Dialogues",
            titleMyanmar: "ပြီးမြောက်သွားသောအခြေအနေများအတွက် ဆွေးနွေးစကားပြောခန်း",
            explanation: "Observe how 'lɛ́ɛw' triggers transition states, showing that action is finished fully.",
            explanationMyanmar: "'แล้ว' (ပြီးပြီ) ကို သုံး၍ လုပ်ငန်းဆောင်တာများ အောင်မြင်စွာ ပြီးဆုံးကြောင်း ပြောကြားပုံကို လေ့လာပါ။",
            examples: [
              { thai: "คุณเขียนรายงานส่งอาจารย์หรือยังครับ", phonetic: "khun khǐan raaj-ŋaan sòŋ aa-caan rʉ̌ʉ jaŋ khráp", english: "Have you written and submitted the report yet?", myanmar: "လူကြီးမင်း ဆရာ့ထံ အစီရင်ခံစာ ရေးသားတင်ပြပြီးပြီလားခင်ဗျา။" },
              { thai: "ฉันเขียนเสร็จเรียบร้อยแล้วค่ะ", phonetic: "chǎn khǐan sèt rîap-rɔ́ɔj lɛ́ɛw khâ", english: "I have already finished writing it completely.", myanmar: "ကျွန်မ အားလုံး ရေးသားပြီးမြောက်သွားခဲ့ပါပြီရှင့်။" }
            ]
          };
        }
      }

      if (queryId === 1) { // Verbs (To work)
        return {
          title: "Verbs (To Work) Practical Usage Practice",
          titleMyanmar: "အလုပ်လုပ်ခြင်းဆိုင်ရာ ကြิယာအသုံးအနှုန်းများ လက်တွေ့လေ့ကျင့်ခန်း",
          explanation: "Master the structure of expressing regular work routine, direction ('go to work'), and negation ('don't work') in everyday Thai context.",
          explanationMyanmar: "နေ့စဉ်သုံး ထိုင်းစကားတွင် ပုံမှန်အလုပ်လုပ်ခြင်း၊ အလုပ်သွားခြင်းနှင့် အလုပ်မလုပ်ခြင်းတို့ကို ဝါကျဖွဲ့စည်းပုံနှင့်တကွ ကျွမ်းကျင်စွာ လေ့ကျင့်ပါ။",
          examples: [
            { thai: "ผมทำงานทุกวันและไปทำงานแต่เช้าครับ", phonetic: "phǒm tham-ngaan thúk wan lɛ́ bpai tham-ngaan dtɛ̀ɛ cháaw khráp", english: "I work every day and go to work early.", myanmar: "ကျွန်တော် နေ့တိုင်း အလုပ်လုပ်ပြီး မနက်စောစော အလုပ်သွားပါတယ်။" },
            { thai: "วันนี้ผมมีงานเยอะมากแต่ผมไม่เหนื่อยครับ", phonetic: "wan-níi phǒm mii ngaan júaj mâak dtɛ̀ɛ phǒm mâj nʉ̀aj khráp", english: "Today I have a lot of work but I am not tired.", myanmar: "ဒီနေ့ ကျွန်တော့်မှာ အလုပ်တွေ အများကြီးရှိပေမဲ့ မပင်ပန်းပါဘူးခင်ဗျา။" }
          ]
        };
      }

      // Default fallback Page 3
      return {
        title: `${original.title}: Conversational Scenarios`,
        titleMyanmar: `${original.titleMyanmar} • အပြန်အလှัน စကားပြောခန်း`,
        explanation: "Engage with this final page dialogue containing high-contrast phrases that fully reinforce the grammatical lessons from Page 1 and Page 2.",
        explanationMyanmar: "ဤသင်ခန်းစာ၏ သဒ္ဒါအချက်အလက်အားလုံးကို စုစည်းပြီး အလွတ်ပြောဆိုနိုင်ရန် စကားပြောပုံစံ သရုပ်ပြကွက် ဖြစ်သည်။",
        examples: [
          { thai: "เข้าใจแล้วครับ มีประโยชน์มากเลย", phonetic: "khâw-caaj lɛ́ɛw khráp mii pra-jòot mâak ləəj", english: "I understand now! This is extremely useful.", myanmar: "နားလည်သဘောပေါက်သွားပါပြီခင်ဗျา၊ အရမ်းပဲ အကျိုးရှိပါတယ်။" },
          { thai: "ขอให้สนุกกับการเรียนรู้นะคะ", phonetic: "khɔ̌ɔ hâj sà-nùk kàp kaan-rian-rúu ná khâ", english: "We hope you enjoy your learning journey!", myanmar: "လေ့လာသင်ယူခြင်းလမ်းခရီးတွင် ပျော်ရွှင်ပါစေရှင့်။" }
        ]
      };
    }

    return {
      title: original.title,
      titleMyanmar: original.titleMyanmar,
      explanation: original.explanation,
      explanationMyanmar: original.explanationMyanmar,
      examples: original.examples || []
    };
  };

  const handleResetAllProgress = () => {
    setProgress(INITIAL_PROGRESS);
    localStorage.removeItem('thai_mm_progress_v1');
  };

  const handleTabClick = (tab: 'lessons' | 'notebook' | 'courses' | 'profile' | 'admin') => {
    setShowVocabPage(false);
    setActiveEbookId(null);
    setActiveReadingResource(null);
    if (tab === 'lessons') {
      if (dashboardTab === 'lessons' && activeLessonId !== null) {
        setActiveLessonId(null);
      } else {
        setDashboardTab('lessons');
      }
    } else if (tab === 'notebook') {
      setDashboardTab('notebook');
      setActiveLessonId(null);
    } else if (tab === 'profile') {
      setDashboardTab('profile');
      setActiveLessonId(null);
    } else if (tab === 'admin') {
      setDashboardTab('admin');
      setActiveLessonId(null);
    } else if (tab === 'courses') {
      setActiveLessonId(null);
      if (!['orientation', 'handbook', 'alphabet'].includes(dashboardTab)) {
        setDashboardTab('orientation');
      }
    }
  };

  if (!isAuthLoaded || !isUserLoaded) {
    return <SplashScreen message="Loading Thai Language Learning System..." />;
  }

  const isLessonsActive = dashboardTab === 'lessons';
  const isNotebookActive = dashboardTab === 'notebook';
  const isProfileActive = dashboardTab === 'profile';
  const isAdminActive = dashboardTab === 'admin';
  const isCoursesActive = ['orientation', 'handbook', 'alphabet'].includes(dashboardTab);

  const isCourseUnlocked = (courseId: string) => {
    if (courseId === 'course-basic' || isAdmin || unlockedCourses.includes(courseId)) return true;

    const normalizedCourseId = courseId.toLowerCase();
    const hasEnrollment = purchasedCourses.some(course =>
      [course?.id, course?.course_id, course?.access_course_id]
        .filter(Boolean)
        .some(id => String(id).toLowerCase() === normalizedCourseId)
    );
    if (hasEnrollment) return true;

    const validUserIds = [user?.id, currentUser].filter(Boolean).map(id => String(id).toLowerCase());
    const courseName = courses.find(course => course.id.toLowerCase() === normalizedCourseId)?.name?.toLowerCase();
    return orders.some(order => {
      const status = String(order?.status || '').toLowerCase();
      const belongsToUser = validUserIds.includes(String(order?.username || '').toLowerCase());
      const matchesCourse = String(order?.courseId || '').toLowerCase() === normalizedCourseId ||
        String(order?.itemName || '').toLowerCase().includes(normalizedCourseId) ||
        Boolean(courseName && String(order?.itemName || '').toLowerCase().includes(courseName));
      return belongsToUser && ['approved', 'completed', 'active'].includes(status) && matchesCourse;
    });
  };

  const DEFAULT_COURSES: Course[] = [
    {
      id: "course-basic",
      name: "Complete Thai Foundational Mastery Course",
      nameMm: "ထိုင်းစကားပြောနှင့် စာရေးစာဖတ် အခြေခံအထူးတန်းသင်တန်း",
      priceAmount: 35000,
      currency: "MMK",
      duration: "6 Weeks",
      description: "Perfect for complete beginners. Cover Thai phonetic consonants, low/mid/high class letters, compound vowels, and tone rules.",
      descriptionMm: "ထိုင်းအက္ခရာ လုံးချင်းအသံထွက်များ၊ သရတွဲများနှင့် အသံနိမ့်မြင့်သင်္ကေတစည်းမျဉ်းများကို စနစ်တကျ သင်ယူလေ့လာနိုင်မည့် အခြေခံအထူးတန်း။",
      instructor: "Kru Jane",
      resources: []
    },
    {
      id: "course-business",
      name: "Advanced Business Thai Speaking & Letters Course",
      nameMm: "အလုပ်အကိုင်နှင့် စီးပွားရေးသုံး အဆင့်မြင့် ထိုင်းစကားပြောသင်တန်း",
      priceAmount: 35000,
      currency: "MMK",
      duration: "8 Weeks",
      description: "Best for career professionals, translators, and cross-border business seekers.",
      descriptionMm: "စီးပွားရေးညှိနှိုင်းမှုများ၊ ရုံးသုံးစာပေးစာယူများ၊ အင်တာဗျူးပုံစံများနှင့် လုပ်ငန်းခွင်သုံး စကားပြောအဆင့်မြင့်စကားလုံးများ။",
      instructor: "Kru Jane & Sayar Thura",
      resources: []
    },
    {
      id: "course-workspace",
      name: "Workspace & Professional Thai Learning Course",
      nameMm: "လုပ်ငန်းခွင်သုံး ထိုင်းစကားပြောနှင့် လက်တွေ့အသုံးချသင်တန်း",
      priceAmount: 45000,
      currency: "MMK",
      duration: "6 Weeks",
      description: "Master workplace communication, technical operations terminology, and factory shift dialogues.",
      descriptionMm: "ထိုင်းနိုင်ငံအတွင်း အလုပ်လုပ်ကိုင်နေသူများ၊ စက်ရုံ/အလုပ်ရုံတန်းများ၊ ရုံးဝန်ထမ်းများနှင့် အရောင်းကိုယ်စားလှယ်များအတွက် လက်တွေ့လုပ်ငန်းခွင်သုံး။",
      instructor: "Kru Jane & Sayar Thura",
      resources: []
    }
  ];

  const getSortedCourses = () => {
    const list = (courses && Array.isArray(courses) && courses.length > 0) ? courses : DEFAULT_COURSES;
    const hasPremiumUnlocked = list.some(c => c?.id !== 'course-basic' && isCourseUnlocked(c?.id || ''));
    if (hasPremiumUnlocked) {
      return [...list].sort((a, b) => {
        const aUnlocked = a?.id !== 'course-basic' && isCourseUnlocked(a?.id || '');
        const bUnlocked = b?.id !== 'course-basic' && isCourseUnlocked(b?.id || '');
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        if (a?.id === 'course-basic' && b?.id !== 'course-basic') return 1;
        if (a?.id !== 'course-basic' && b?.id === 'course-basic') return -1;
        return 0;
      });
    } else {
      return [...list].sort((a, b) => {
        if (a?.id === 'course-basic' && b?.id !== 'course-basic') return -1;
        if (a?.id !== 'course-basic' && b?.id === 'course-basic') return 1;
        return 0;
      });
    }
  };

  useEffect(() => {
    const sorted = getSortedCourses();
    if (sorted.length === 0) return;

    // Resource is a virtual navigation tab, not a row in `courses`. Preserve
    // both that explicit selection and any still-valid course selection when
    // background course/order hydration refreshes these dependencies.
    setSelectedCourseTab(currentSelection => {
      if (currentSelection === 'resources') return currentSelection;
      if (sorted.some(course => course.id === currentSelection)) return currentSelection;
      return sorted[0].id;
    });
  }, [currentUser, orders, courses, purchasedCourses]);

  const isStoreItemUnlocked = (itemId: string, itemPrice: number) => {
    if (itemPrice === 0) return true;
    if (currentUser === 'admin' || (currentUser && registeredUsers.find(u => u.username === currentUser)?.role === 'admin')) {
      return true;
    }
    const normalizedItemId = itemId.trim().toLowerCase();
    const validUserIds = [user?.id, currentUser]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    return orders.some(order => {
      const belongsToUser = validUserIds.includes(String(order.username || '').toLowerCase());
      const approved = ['approved', 'completed', 'active'].includes(String(order.status || '').toLowerCase());
      const matchesItem = String(order.courseId || '').toLowerCase() === normalizedItemId ||
        String(order.id || '').toLowerCase() === normalizedItemId ||
        String(order.itemName || '').toLowerCase().includes(normalizedItemId);
      return belongsToUser && approved && matchesItem;
    });
  };

  const speakThai = async (thaiText: string) => {
    try {
      const match = await localDB.words_and_audio
        .where('thai_text').equalsIgnoreCase(thaiText)
        .or('thai_text').equalsIgnoreCase(thaiText.trim())
        .first();

      if (match && (match.audio_blob || match.audio_url)) {
        const audioUrl = match.audio_blob ? URL.createObjectURL(match.audio_blob) : match.audio_url!;
        playGlobalAudio(audioUrl);
        return;
      }
    } catch (e) {
      console.warn("Offline audio check failed, falling back to TTS:", e);
    }
    runThaiTTS(thaiText);
  };

  const runThaiTTS = (thaiText: string) => {
    const cleanedText = thaiText.replace(/\s*ครับ\/ค่ะ\s*/g, ' ครับ')
                                .replace(/\s*ครับ\s*/g, ' ครับ')
                                .replace(/\s*ค่ะ\s*/g, '  ค่ะ');
    speakGlobalText(cleanedText, 'th-TH', 0.85);
  };

  const activeCourse = courses.find(c => c.id === selectedCourseTab);
  let courseLessons = activeCourse 
    ? lessons.filter(l => (l.courseId || 'course-basic') === activeCourse.id)
    : lessons;
  if (courseLessons.length === 0 && lessons.length > 0) {
    courseLessons = lessons;
  }
  courseLessons = sortLessonsNaturally(courseLessons);

  const lessonsPerPage = 6;
  const totalLessons = courseLessons.length;
  const totalPages = Math.max(1, Math.ceil(totalLessons / lessonsPerPage));
  const paginatedLessons = courseLessons.slice(
    (currentPage - 1) * lessonsPerPage,
    currentPage * lessonsPerPage
  );

  const activeLesson = lessons.find((l) => l.id === activeLessonId);

  // Use the course-filtered lessons for calculating prev/next lessons so that you stay within the selected course!
  const activeLessonIndex = activeLesson ? courseLessons.findIndex(l => l.id === activeLesson.id) : -1;
  const prevLesson = activeLessonIndex > 0 ? courseLessons[activeLessonIndex - 1] : null;
  const nextLesson = activeLessonIndex >= 0 && activeLessonIndex < courseLessons.length - 1 ? courseLessons[activeLessonIndex + 1] : null;

  if (location.pathname === '/sign-up') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <CustomSignUp />
      </div>
    );
  }

  if (location.pathname === '/sign-in') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <CustomSignIn />
      </div>
    );
  }

  return (
    <div
      className="h-screen h-[100dvh] bg-brand-light text-brand-dark flex flex-col font-sans overflow-hidden"
      aria-busy={!hasLoadedD1Data}
    >
      <LoadingOverlay
        isVisible={!hasLoadedD1Data}
        message="Loading curriculum & learning resources…"
      />
      
      {/* Responsive app header: compact identity/actions on mobile, full navigation on desktop. */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shrink-0 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-14 py-2 lg:min-h-16 lg:py-3 flex flex-row lg:items-center justify-between gap-3 lg:gap-4">
            
            {/* Left: Brand Logo & Title + Mobile Actions Row */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-[#05081c] rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 select-none relative overflow-hidden group">
                  {brandLogoImg ? (
                    <img 
                      src={brandLogoImg} 
                      alt={brandName} 
                      className="w-full h-full object-cover object-center relative z-10 rounded-xl" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <PeacockLogo className="w-full h-full relative z-10" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <h1 className="text-[12.5px] sm:text-[14px] font-sans font-black text-slate-800 tracking-tight leading-none uppercase select-none">
                    {brandName}
                  </h1>
                  <p className="hidden sm:block text-[9.5px] text-brand-purple font-sans font-black tracking-wide mt-1 select-none">
                    {t('app.tagline')}
                  </p>
                </div>
              </div>

              {/* Mobile Right Authenticated controls / Sign In (hidden on lg and above) */}
              <div className="flex lg:hidden items-center gap-2">
                {/* Language Switcher */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
                  className="h-8 px-2 bg-slate-100 hover:bg-slate-250 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer text-slate-700 flex items-center justify-center gap-1 shadow-3xs"
                  title={t('app.switch_language')}
                  aria-label={t('app.switch_language')}
                >
                  <span className="text-[10px]">🌐</span>
                  <span className="font-sans font-black text-[8px] uppercase tracking-wider">
                    {language === 'en' ? 'မြန်မာ' : 'EN'}
                  </span>
                </button>
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => handleTabClick(isAdmin ? 'admin' : 'profile')}
                    className={`h-9 min-w-9 px-2.5 rounded-xl border flex items-center justify-center gap-1.5 shadow-3xs transition-colors ${
                      isAdminActive || isProfileActive
                        ? 'border-brand-purple bg-brand-purple text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-violet-200 hover:text-brand-purple'
                    }`}
                    aria-label={isAdmin ? 'Open administrator dashboard' : 'Open profile'}
                    aria-current={isAdminActive || isProfileActive ? 'page' : undefined}
                  >
                    {isAdmin ? <Shield className="w-4 h-4 shrink-0" /> : <User className="w-4 h-4 shrink-0" />}
                    <span className="hidden min-[430px]:inline max-w-20 truncate text-[9px] font-black uppercase">{currentUser}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAuthTab('student-login');
                        setAuthError('');
                        navigate('/sign-in');
                      }}
                      className="h-9 px-3 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl border-b-2 border-brand-purple-shadow flex items-center gap-1.5 font-sans font-black text-[9.5px] transition-transform active:translate-y-0.5 cursor-pointer uppercase tracking-wider select-none shrink-0 shadow-xs min-h-[36px]"
                    >
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {t('auth.sign_in')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Simplified 4 Pill Navigation Tabs (Strictly BASIC, ADVANCE, RESOURCES, EBOOKS) */}
            <div className="relative w-full lg:w-auto overflow-hidden shrink-0 hidden lg:flex justify-center">
              <nav className="flex items-center border border-slate-700/80 rounded-full p-1 bg-white shadow-2xs max-w-full overflow-x-auto scrollbar-none gap-1 shrink-0">
                {[
                  {
                    id: 'basic',
                    label: t('navbar.basic_course'),
                    icon: '⭐',
                    isActive: selectedCourseTab === 'course-basic' && dashboardTab === 'lessons',
                    onClick: () => {
                      setSelectedCourseTab('course-basic');
                      setDashboardTab('lessons');
                      setActiveLessonId(null);
                      setCurrentPage(1);
                    }
                  },
                  {
                    id: 'advance',
                    label: t('navbar.advanced_course'),
                    icon: '💎',
                    isActive: selectedCourseTab === 'course-business' && dashboardTab === 'lessons',
                    onClick: () => {
                      setSelectedCourseTab('course-business');
                      setDashboardTab('lessons');
                      setActiveLessonId(null);
                      setCurrentPage(1);
                    }
                  },
                  {
                    id: 'resources',
                    label: t('navbar.resources'),
                    icon: '📚',
                    isActive: selectedCourseTab === 'resources' && dashboardTab === 'lessons',
                    onClick: () => {
                      setSelectedCourseTab('resources');
                      setDashboardTab('lessons');
                      setActiveLessonId(null);
                      setCurrentPage(1);
                    }
                  },
                  {
                    id: 'ebooks',
                    label: t('navbar.ebooks'),
                    icon: '📕',
                    isActive: dashboardTab === 'handbook',
                    onClick: () => {
                      setDashboardTab('handbook');
                    }
                  },
                  {
                    id: 'notebook',
                    label: t('navbar.notebook'),
                    icon: '📝',
                    isActive: dashboardTab === 'notebook',
                    onClick: () => {
                      handleTabClick('notebook');
                    }
                  }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-sans font-black tracking-wide transition-colors shrink-0 cursor-pointer ${
                      item.isActive
                        ? 'bg-brand-purple text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-xs leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Group: User Profile Controls for Desktop */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 justify-end">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleTabClick('admin')}
                  className={`h-10 px-3 rounded-xl border transition-colors flex items-center gap-1.5 text-[9px] font-black uppercase ${isAdminActive ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                  aria-current={isAdminActive ? 'page' : undefined}
                >
                  <Shield className="h-3.5 w-3.5" /> Admin
                </button>
              )}
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
                className="h-10 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer text-slate-700 flex items-center gap-1.5 shadow-3xs"
                  title={t('app.switch_language')}
                  aria-label={t('app.switch_language')}
              >
                <span className="text-sm">🌐</span>
                <span className="font-sans font-black text-[9.5px] uppercase tracking-wider">
                  {language === 'en' ? 'မြန်မာ' : 'EN'}
                </span>
              </button>

              {/* Authentication Controls */}
              {isLoggedIn ? (
                <div className="flex items-center gap-3.5 bg-slate-50 hover:bg-slate-100/40 border border-slate-200 p-1 pl-3.5 rounded-2xl transition-colors">
                  <button type="button" onClick={() => handleTabClick('profile')} className="flex flex-col text-right rounded-lg px-1.5 py-1 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-purple/20" aria-label="Open profile" aria-current={isProfileActive ? 'page' : undefined}>
                    <div className="flex items-center gap-1 justify-end">
                      {isAdmin ? (
                        <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                      )}
                      <span className="text-[10.5px] font-sans font-black text-slate-800 uppercase tracking-tight">
                        {currentUser}
                      </span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-mono text-brand-purple font-black uppercase tracking-wider -mt-0.5 leading-none">
                      {isAdmin ? t('auth.administrator') : `${progress.totalXp} XP • LEVEL ${Math.floor(progress.totalXp / 1000) + 1}`}
                    </span>
                  </button>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="p-1 px-3 py-2 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                    title={t('auth.sign_out')}
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-sans font-black text-[9.5px] leading-none uppercase tracking-wider">
                      {t('auth.sign_out')}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthTab('student-login');
                      setAuthError('');
                      navigate('/sign-in');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-brand-purple to-[#7a42c4] hover:brightness-105 text-white rounded-xl border-b-4 border-brand-purple-shadow flex items-center gap-1.5 font-sans font-black text-[10px] sm:text-xs transition-transform active:translate-y-0.5 cursor-pointer uppercase tracking-wider select-none shrink-0 shadow-xs"
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    {t('auth.sign_in')}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main id="main-content" className={`flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-28 scroll-pb-24 ${activeLessonId !== null ? 'lg:pb-32' : 'lg:pb-8'}`}>
        
        {activeEbookId ? (
          <div className="space-y-6">
            <AudioEbookPlayer ebookId={activeEbookId} onClose={() => setActiveEbookId(null)} />
            <TextbookReader bookId={activeEbookId} onClose={() => setActiveEbookId(null)} />
          </div>
        ) : showVocabPage ? (
          <VocabPage onClose={() => setShowVocabPage(false)} />
        ) : !activeLessonId ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Courses Segmented Top Sub-Selector - Only visible under Courses Bottom Tab */}
            {['orientation', 'handbook', 'alphabet', 'ebooks'].includes(dashboardTab) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-gray-100 select-none max-w-4xl mx-auto shadow-xs">
                <button
                  onClick={() => setDashboardTab('orientation')}
                  className={`py-3 px-1.5 text-center rounded-xl font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    dashboardTab === 'orientation'
                      ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                      : 'text-brand-muted hover:text-brand-dark hover:bg-gray-50'
                  }`}
                >
                  🧭 {t('navbar.orientation')}
                </button>
                <button
                  onClick={() => {
                    setDashboardTab('handbook');
                    setMobileChapterDetailActive(false);
                  }}
                  className={`py-3 px-1.5 text-center rounded-xl font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    dashboardTab === 'handbook'
                      ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                      : 'text-brand-muted hover:text-brand-dark hover:bg-gray-50'
                  }`}
                >
                  📖 {t('navbar.grammar_manual')}
                </button>
                <button
                  onClick={() => setDashboardTab('alphabet')}
                  className={`py-3 px-1.5 text-center rounded-xl font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    dashboardTab === 'alphabet'
                      ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                      : 'text-brand-muted hover:text-brand-dark hover:bg-gray-50'
                  }`}
                >
                  🔠 {t('navbar.alphabet_guide')}
                </button>
                <button
                  onClick={() => setDashboardTab('ebooks')}
                  className={`py-3 px-1.5 text-center rounded-xl font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                    dashboardTab === 'ebooks'
                      ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                      : 'text-brand-muted hover:text-brand-dark hover:bg-gray-50'
                  }`}
                >
                  🎧 {t('navbar.audio_ebooks')}
                </button>
              </div>
            )}

            {/* TAB CONTENT: 1. Lessons pathways */}
            {dashboardTab === 'lessons' && (
              <div className="max-w-4xl mx-auto space-y-6 min-h-[500px]">

                {/* Contextual course switcher replaces the desktop header pills on mobile. */}
                <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 lg:hidden" aria-label="Choose course content">
                  {[
                    { id: 'course-basic', label: t('navbar.basic_course'), icon: '⭐' },
                    { id: 'course-business', label: t('navbar.advanced_course'), icon: '💎' },
                    { id: 'resources', label: t('navbar.resources'), icon: '📚' }
                  ].map((item) => {
                    const active = selectedCourseTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourseTab(item.id);
                          setActiveLessonId(null);
                          setCurrentPage(1);
                        }}
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[9px] font-black uppercase transition-colors ${
                          active ? 'bg-brand-purple text-white shadow-sm' : 'bg-white text-slate-600 hover:text-brand-purple'
                        }`}
                        aria-pressed={active}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedCourseTab !== 'resources' && (() => {
                  const activeCourse = courses.find(c => c.id === selectedCourseTab);
                  if (!activeCourse) return <p className="text-center font-sans font-bold text-xs text-brand-muted py-10">Unknown Course selection.</p>;

                  const unlocked = isCourseUnlocked(activeCourse.id);

                  if (unlocked) {
                    const courseResources = storeItems.filter(item => item.courseId === activeCourse.id);
                    const courseLinkedEbooks = courseResources;
                    const hasDirectResources = activeCourse.resources && activeCourse.resources.length > 0;
                    const hasStoreResources = courseResources.length > 0;
                    const hasAnyResources = hasDirectResources || hasStoreResources;
                    const activeSubTab = (courseSubTab === 'resources' && !hasAnyResources) ? 'lessons' : courseSubTab;

                    return (
                      <>
                        {/* Course Tab Navigation Bar - Commented out & hidden as requested */}
                        {/* 
                        {hasAnyResources && (
                          <div className="bg-white p-2 rounded-2xl border-2 border-gray-100 flex items-center gap-2 select-none shadow-sm mb-6">
                            <button
                              type="button"
                              onClick={() => setCourseSubTab('lessons')}
                              className={`flex-1 py-3 px-4 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSubTab === 'lessons'
                                  ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow shadow-sm'
                                  : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              Study Syllabus Lessons (သင်ခန်းစာများ)
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setCourseSubTab('resources');
                                const samplePdfUrl = activeCourse.resources?.[0]?.downloadUrl || activeCourse.resources?.[0]?.pdfDownloadUrl || 'https://drive.google.com/open?id=demo_blue_book';
                                window.open(samplePdfUrl, '_blank');
                              }}
                              className={`flex-1 py-3 px-4 rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSubTab === 'resources'
                                  ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow shadow-sm'
                                  : 'text-brand-muted hover:text-brand-dark hover:bg-slate-50'
                              }`}
                              title="Click to view course PDFs and open sample document in a new tab"
                            >
                              <FileText className={`w-4 h-4 ${activeSubTab === 'resources' ? 'text-white' : 'text-brand-purple'}`} />
                              Course eBooks & PDFs ({courseResources.length + (activeCourse.resources?.length || 0)}) ↗
                            </button>
                          </div>
                        )}
                        */}

                        {activeSubTab === 'lessons' ? (
                          <div className="space-y-6 animate-fade-in text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border-2 border-gray-100">
                              <div>
                                <span className="text-[10px] text-brand-purple font-sans font-black uppercase tracking-wider block">
                                  {t('courses.course')}: {language === 'my' ? (activeCourse.nameMm || activeCourse.name) : activeCourse.name}
                                </span>
                                <h3 className="font-sans font-black text-brand-dark text-base mb-0.5 uppercase tracking-tight mt-0.5">
                                  {t('courses.syllabus_lessons')}
                                </h3>
                                <p className="text-xs text-brand-muted font-sans font-semibold">
                                  {t('courses.lessons_range', {
                                    from: (currentPage - 1) * lessonsPerPage + 1,
                                    to: Math.min(currentPage * lessonsPerPage, totalLessons),
                                    total: totalLessons,
                                  })}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 self-center sm:self-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => setShowVocabPage(true)}
                                  className="duo-btn duo-btn-purple text-xs font-black py-2.5 px-4 flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer animate-pulse"
                                  title="Open Course Vocabulary Book"
                                >
                                  📙 {t('courses.vocab_book')}
                                </button>

                                {/* Compact Pagination Top Control */}
                                {totalPages > 1 && (
                                  <div className="flex items-center gap-1.5 select-none border-none bg-transparent p-0">
                                    <button
                                      onClick={() => {
                                        setCurrentPage((p) => Math.max(1, p - 1));
                                      }}
                                      disabled={currentPage === 1}
                                      className="w-7 h-7 text-brand-purple hover:text-brand-dark disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      title="Previous page"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <div className="text-[11px] font-sans font-black tracking-wider text-brand-purple/90 uppercase whitespace-nowrap px-1">
                                      {currentPage} / {totalPages}
                                    </div>

                                    <button
                                      onClick={() => {
                                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                                      }}
                                      disabled={currentPage === totalPages}
                                      className="w-7 h-7 text-brand-purple hover:text-brand-dark disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                      title="Next page"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="lessons-catalog">
                              {paginatedLessons.map((lesson) => {
                                const isCompleted = progress.completedLessons.includes(lesson.id);
                                const score = progress.quizHighScores[lesson.id] || 0;

                                return (
                                  <LessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    isCompleted={isCompleted}
                                    score={score}
                                    getMyanmarPhonetic={getMyanmarPhonetic}
                                    onClick={handleLessonClick}
                                  />
                                );
                              })}
                            </div>

                            {/* Duolingo Modern Pagination Panel */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 bg-white p-4 rounded-2xl border-2 border-gray-100/80">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPage((p) => Math.max(1, p - 1));
                                    document.getElementById('lessons-catalog')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === 1}
                                  className="duo-btn bg-white hover:bg-gray-50 border-2 border-gray-200 text-brand-dark disabled:opacity-40 disabled:pointer-events-none text-xs px-3.5 py-2 flex items-center gap-1 font-bold"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Prev
                                </button>
                                
                                <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[200px] sm:max-w-none">
                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      type="button"
                                      key={page}
                                      onClick={() => {
                                        setCurrentPage(page);
                                        document.getElementById('lessons-catalog')?.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className={`w-9 h-9 rounded-xl font-sans font-black text-xs flex items-center justify-center transition-all ${
                                        currentPage === page
                                          ? "bg-brand-purple text-white border-b-4 border-brand-purple-shadow"
                                          : "bg-white border-2 border-gray-100 text-brand-dark hover:border-gray-200"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                                    document.getElementById('lessons-catalog')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  disabled={currentPage === totalPages}
                                  className="duo-btn bg-white hover:bg-gray-50 border-2 border-gray-200 text-brand-dark disabled:opacity-40 disabled:pointer-events-none text-xs px-3.5 py-2 flex items-center gap-1 font-bold"
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6 animate-fade-in text-left">
                            <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div>
                                <span className="text-[10px] text-brand-purple font-sans font-black uppercase tracking-wider block">Course Resources</span>
                                <h3 className="font-sans font-black text-brand-dark text-base mb-0.5 uppercase tracking-tight mt-0.5">
                                  📕 Course eBooks &amp; PDF Downloads • စာအုပ်များနှင့် PDFs
                                </h3>
                                <p className="text-xs text-brand-muted font-sans font-semibold">
                                  Course-specific companion workbooks, reference sheets, and curriculum materials.
                                </p>
                              </div>
                            </div>

                            {(() => {
                              const hasDirectResources = activeCourse.resources && activeCourse.resources.length > 0;
                              const hasStoreResources = courseResources.length > 0;

                              if (!hasDirectResources && !hasStoreResources) {
                                return (
                                  <div className="bg-[#fcf8ff] rounded-3xl p-8 border-2 border-dashed border-brand-purple/10 text-center space-y-2">
                                    <span className="text-2xl block">📚</span>
                                    <h4 className="font-sans font-black text-sm text-[#3c3c3c]">No resources configured yet.</h4>
                                    <p className="text-[10px] text-brand-muted font-sans font-semibold">
                                      The administrator hasn't linked any custom eBooks or PDF sheets to this course group. Check general Study Store catalogs!
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-8">
                                  {/* Section A: Direct Companion eBook uploads */}
                                  {hasDirectResources && (
                                    <div className="space-y-4">
                                      <h4 className="font-sans font-black text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 text-left">
                                        <span>📕 Course Companion eBooks & Workbooks ({activeCourse.resources?.length || 0})</span>
                                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-sans font-black px-1.5 py-0.2 rounded-lg uppercase">
                                          Enrolled Materials
                                        </span>
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeCourse.resources?.map((res: any) => {
                                          const isFree = res.priceAmount === 0;
                                          const itemOwned = isStoreItemUnlocked(res.id, res.priceAmount);
                                          return (
                                            <div
                                              key={res.id}
                                              className="duo-card p-6 bg-white flex flex-col justify-between hover:shadow-md transition-all duration-200 animate-fade-in border-2 border-slate-100"
                                            >
                                              <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                  <div className="w-11 h-11 rounded-xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-2xl select-none">
                                                    📕
                                                  </div>
                                                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border select-none ${
                                                    isFree 
                                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                                  }`}>
                                                    {isFree ? "FREE DOWNLOAD" : "PREMIUM EBOOK"}
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
                                                    Official direct study companion material provided directly for students attending <b>{activeCourse.name}</b>.
                                                    {isFree ? " You have instant free download access." : " Purchase this course companion key to unlock direct access."}
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
                                                        onClick={() => {
                                                          setActiveReadingResource(res);
                                                        }}
                                                        className="px-3 py-2 bg-[#5a3194] hover:bg-[#4a267a] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#3e1c6b] flex items-center gap-1 shrink-0"
                                                      >
                                                        📖 Study Interactive
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        window.open(res.downloadUrl, '_blank');
                                                        addSystemLog(currentUser || 'student', `Downloaded PDF companion resource: "${res.name}"`);
                                                      }}
                                                      className="px-3.5 py-2 bg-gradient-to-r from-[#00875a] to-[#00a36c] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#006644] flex items-center gap-1 shrink-0"
                                                    >
                                                      📥 Open / Download
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const checkoutProduct = {
                                                        id: res.id,
                                                        name: res.name,
                                                        nameMm: res.nameMm || '',
                                                        priceAmount: res.priceAmount,
                                                        currency: 'MMK' as const,
                                                        itemType: 'e-book',
                                                        duration: "Companion eBook Study Resource",
                                                        description: `Direct premium supplementary eBook for ${activeCourse.name}`,
                                                        descriptionMm: res.nameMm || '',
                                                        instructor: activeCourse.instructor || "Kru Jane & Sayar Thura",
                                                        includes: ["Permanent direct download URL", "Study exercises", "Vocabulary sheets"]
                                                      };
                                                      setGatewayCourse(checkoutProduct as any);
                                                      setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                                                      setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                                                      setGatewayStep(1);
                                                      setGatewayPaymentMethod('kbzpay');
                                                      setGatewayOtp('');
                                                      setGatewayTimer(180);
                                                      setIsGatewayOpen(true);
                                                    }}
                                                    className="px-3.5 py-2 bg-gradient-to-r from-[#583092] to-[#7a42c4] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-[#3c1e66] flex items-center gap-1 shrink-0"
                                                  >
                                                    🔒 Unlock eBook
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Section B: General related bookstore cards */}
                                  {hasStoreResources && (
                                    <div className="space-y-4 pt-4">
                                      <h4 className="font-sans font-black text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 text-left">
                                        <span>🛍️ Bookstore Reference Sheets ({courseResources.length})</span>
                                        <span className="text-[8px] bg-brand-purple/10 text-brand-purple font-sans font-black px-1.5 py-0.2 rounded-lg uppercase">
                                          Store Catalog
                                        </span>
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {courseResources.map((item) => {
                                          const itemOwned = isStoreItemUnlocked(item.id, item.price);
                                          const isFree = item.price === 0;

                                          const getBookStyles = (id: string, nameStr: string) => {
                                            if (id === 'free-writing') {
                                              return {
                                                gradient: "from-purple-700 via-indigo-850 to-indigo-950",
                                                borderLeft: "border-purple-900",
                                                accentText: "text-purple-200",
                                                titleColor: "text-yellow-250",
                                                topLabel: "ALPHABET SHEETS",
                                                titleText: "LETTER WRITING",
                                                subText: "PRACTICE EXERCISES",
                                                emoji: "✍️",
                                                emojiLabel: "STROKE GUIDELINES",
                                                author: "STUDY WORKSHEET",
                                                status: "FREE PRACTICE BOOK"
                                              };
                                            }
                                            
                                            // Breathtaking cover template for any dynamic custom user-created products!
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

                                          if (item.id === 'sayar-son-jai-blue-book' || item.id === 'free-writing') {

                                  return (
                                    <div
                                      key={item.id}
                                      className="col-span-1 md:col-span-2 duo-card p-5 sm:p-6 bg-white border-2 border-slate-150 rounded-2xl flex flex-col md:flex-row gap-5 hover:shadow-md transition-all duration-200 animate-fade-in relative overflow-hidden text-left"
                                    >
                                      {/* A4 Shape cover image */}
                                      <div className={`w-[120px] sm:w-[150px] mx-auto md:mx-0 aspect-[1/1.414] bg-gradient-to-tr ${bookStyle.gradient} rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] active:scale-95 shrink-0 relative flex flex-col justify-between p-4 text-white border-l-4 ${bookStyle.borderLeft} border-r border-t border-b border-white/10 select-none overflow-hidden`}>
                                        {/* Book shine overlay */}
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
                                          <div 
                                            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex flex-col items-center justify-center animate-pulse cursor-pointer"
                                            onClick={() => {
                                              openEnrollmentPortal({
                                                id: item.id,
                                                title: item.name,
                                                price: item.price,
                                                type: "PREMIUM RESOURCE"
                                              });
                                            }}
                                          >
                                            <span className="text-base text-white">{bookStyle.emoji}</span>
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

                                      {/* EBook Details Panel */}
                                      <div className="flex-1 flex flex-col justify-between text-left font-sans">
                                        <div className="space-y-3">
                                          <div>
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                              <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border select-none ${
                                                isFree
                                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                                              }`}>
                                                {isFree ? 'FREE PDF DOWNLOAD' : 'PREMIUM STUDY BOOK'}
                                              </span>
                                              {item.popular && (
                                                <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-0.5 animate-pulse">
                                                  🔥 COMPREHENSIVE
                                                </span>
                                              )}
                                            </div>
                                            <h3 className="font-sans font-black text-base sm:text-lg text-slate-800 leading-snug">
                                              {item.name}
                                            </h3>
                                            <p className="text-xs font-extrabold text-brand-purple mt-0.5">
                                              {item.nameMm}
                                            </p>
                                          </div>

                                          <div className="text-xs text-brand-muted space-y-1.5 leading-relaxed font-medium">
                                            <p>{item.description}</p>
                                            {item.descriptionMm && (
                                              <p className="text-[11px] text-slate-500 italic">{item.descriptionMm}</p>
                                            )}
                                            <div className="pt-2 flex flex-wrap gap-2 text-[9.5px] font-bold uppercase text-slate-500">
                                              {item.id === 'sayar-son-jai-blue-book' ? (
                                                <>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">🎙️ 40 Full Audio Lessons</span>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">📘 Plain Textbook Style Layout</span>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">🇲🇲 Myanmar Phonetic Assist</span>
                                                </>
                                              ) : (
                                                <>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">📱 Optimized for Mobile Study</span>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">🇲🇲 Burmese Translation Guides</span>
                                                  <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">✏️ Stroke lessons & vocabulary sheets</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 pt-4 mt-6 border-t border-slate-100 -mx-5 -mb-5 p-4 bg-[#fafafc] rounded-b-2xl md:-mx-0 md:-mb-0 md:rounded-none md:bg-transparent md:border-none md:p-0 md:pt-4 md:mt-4">
                                          <div className="text-left select-none">
                                            <span className="text-[7.5px] text-brand-muted block font-extrabold uppercase leading-none">Access Price</span>
                                            <span className="text-xs sm:text-sm font-black text-brand-purple block mt-0.5">
                                              {isFree ? 'FREE' : `${item.price.toLocaleString()} MMK`}
                                            </span>
                                          </div>

                                          {itemOwned ? (
                                            <button
                                              onClick={() => {
                                                setActiveEbookId(item.id);
                                                setActiveEbookLessonId(1);
                                                window.speechSynthesis?.cancel();
                                                addSystemLog(currentUser || 'student', `Opened dynamic textbook reader: "${item.name}"`);
                                              }}
                                              className="px-4 py-2 bg-gradient-to-r from-brand-purple to-[#7a42c4] text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-brand-purple-shadow flex items-center gap-1.5 shrink-0"
                                            >
                                              <span>📖 Enter Book (စာအုပ်ဖတ်ရန်)</span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                const bookProduct = {
                                                  id: item.id,
                                                  name: item.name,
                                                  nameMm: item.nameMm,
                                                  priceAmount: item.price,
                                                  currency: item.currency || 'MMK',
                                                  itemType: 'e-book',
                                                  duration: "Lifetime Study Access License",
                                                  description: item.description,
                                                  descriptionMm: item.descriptionMm,
                                                  instructor: "Kru Jane & Sayar Thura",
                                                  includes: ["Full Interactive Audiobook Access", "Complete plain textbook lessons", "Thai Accent Pronunciation Tracks", "Burmese Phonetic Guides"]
                                                };
                                                setGatewayCourse(bookProduct as any);
                                                setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                                                setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                                                setGatewayStep(1);
                                                setGatewayPaymentMethod('kbzpay');
                                                setGatewayOtp('');
                                                setGatewayTimer(180);
                                                setIsGatewayOpen(true);
                                              }}
                                              className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-purple/95 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-lg cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-brand-purple-shadow flex items-center gap-1 shrink-0"
                                            >
                                              🔒 Unlock eBook & Audio
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }


                                  return (
                                    <div
                                      key={item.id}
                                      className="duo-card p-5 sm:p-6 bg-white border-2 border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-200 animate-fade-in relative overflow-hidden"
                                    >
                                      {item.popular && (
                                        <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider select-none animate-pulse">
                                          🔥 POPULAR
                                        </div>
                                      )}
                                      <div className="space-y-3.5">
                                        <div className="flex items-center justify-between">
                                          <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border select-none ${
                                            isFree
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                              : 'bg-brand-purple/10 text-[#583092] border-brand-purple/20'
                                          }`}>
                                            {isFree ? 'FREE PDF DOWNLOAD' : 'PREMIUM STUDY BOOK'}
                                          </span>
                                          <FileText className={`w-4 h-4 ${isFree ? 'text-emerald-600' : 'text-brand-purple'}`} />
                                        </div>
                                        <div>
                                          <h4 className="font-sans font-black text-sm text-[#3c3c3c] leading-snug">
                                            {item.name}
                                          </h4>
                                          <p className="text-[10px] sm:text-[11px] font-sans font-bold text-brand-purple mt-0.5">
                                            {item.nameMm}
                                          </p>
                                          <p className="text-[11px] text-brand-muted font-sans font-medium mt-2 leading-relaxed">
                                            {item.description}
                                          </p>
                                          {item.descriptionMm && (
                                            <p className="text-[10.5px] text-slate-500 font-sans italic mt-1 leading-relaxed">
                                              {item.descriptionMm}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between gap-3 pt-4 mt-5 border-t border-slate-100 -mx-5 -mb-5 p-4 bg-[#fafafc] rounded-b-2xl">
                                        <div className="text-left font-sans select-none">
                                          <span className="text-[7.5px] text-brand-muted block font-extrabold uppercase leading-none">Price Tag</span>
                                          <span className="text-xs sm:text-sm font-black text-brand-purple block mt-0.5">
                                            {isFree ? 'FREE' : `${item.price.toLocaleString()} ${item.currency}`}
                                          </span>
                                        </div>

                                        {itemOwned ? (
                                          <button
                                            onClick={() => {
                                              if (item.pdfDownloadUrl) {
                                                window.open(item.pdfDownloadUrl, '_blank');
                                                addSystemLog(currentUser || 'student', `Opened dynamic download link for eBook: "${item.name}"`);
                                              } else {
                                                triggerPdfDownload(
                                                  item.pdfFileName || `${item.id}.pdf`,
                                                  item.name,
                                                  item.description,
                                                  [
                                                    { thai: "สวัสดี ครับ/ค่ะ", pronunciation: "sawàtdii khráp/khâ", myanmar: "မင်္ဂလာပါ (ကျား/မ)" },
                                                    { thai: "ขอบคุณ ครับ/ค่ะ", pronunciation: "khɔ̀ɔp-khun khráp/khâ", myanmar: "ကျေးဇူးတင်ပါတယ်" },
                                                    { thai: "สบายดีไหม", pronunciation: "sabaaj dii mǎi", myanmar: "နေကောင်းလား" },
                                                    { thai: "ขอโทษ ครับ/ค่ะ", pronunciation: "khɔ̌ɔ-thôot khráp/khâ", myanmar: "ตောင်းပန်ပါတယ်" },
                                                    { thai: "เรียนภาษาไทย", pronunciation: "riian phaasǎathai", myanmar: "ထိုင်းစာ သင်ယူသည်" }
                                                  ]
                                                );
                                                addSystemLog(currentUser || 'student', `Completed dynamic auto-generation download: "${item.name}"`);
                                              }
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-750 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-emerald-800 flex items-center gap-1.5 shrink-0"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            📥 Download Free Guide
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const bookProduct = {
                                                id: item.id,
                                                name: item.name,
                                                nameMm: item.nameMm,
                                                priceAmount: item.price,
                                                currency: item.currency || 'MMK',
                                                itemType: 'e-book',
                                                duration: "Lifetime Study Access License",
                                                description: item.description,
                                                descriptionMm: item.descriptionMm,
                                                instructor: "Kru Jane & Sayar Thura",
                                                includes: ["Full Dynamic PDF eBook Download", "Offline Reading Support", "Grammar Revision Sheets", "Burmese Pronunciation Guide"]
                                              };
                                              setGatewayCourse(bookProduct as any);
                                              setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                                              setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                                              setGatewayStep(1);
                                              setGatewayPaymentMethod('kbzpay');
                                              setGatewayOtp('');
                                              setGatewayTimer(180);
                                              setIsGatewayOpen(true);
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-purple/95 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-brand-purple-shadow flex items-center gap-1 shrink-0"
                                          >
                                            🔒 Unlock eBook
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2. COURSE LINKED STUDY MANUALS */}
                          {courseLinkedEbooks.length > 0 && (
                            <div className="space-y-4 pt-4">
                              <h4 className="font-sans font-black text-xs text-brand-dark uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-100 pb-2 text-left">
                                <span className="p-1 rounded-lg bg-amber-50 text-amber-700">📚</span>
                                <span>Course Companion eBooks & Specific Lesson PDFs ({courseLinkedEbooks.length})</span>
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                {courseLinkedEbooks.map((item) => {
                                  const isFree = item.price === 0;
                                  const itemOwned = isStoreItemUnlocked(item.id, item.price);
                                  const linkedCourse = courses.find(c => c.id === item.courseId);

                                  return (
                                    <div
                                      key={item.id}
                                      className="duo-card p-5 sm:p-6 bg-white border-2 border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-200 animate-fade-in relative overflow-hidden"
                                    >
                                      {item.popular && (
                                        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider select-none">
                                          ★ FEATURED
                                        </div>
                                      )}
                                      <div className="space-y-3.5">
                                        <div className="flex items-center justify-between">
                                          <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-850 border border-amber-200 uppercase tracking-widest leading-none">
                                            Linked: {linkedCourse ? linkedCourse.name : item.courseId}
                                          </span>
                                        </div>
                                        <div>
                                          <h4 className="font-sans font-black text-sm text-[#3c3c3c] leading-snug">
                                            {item.name}
                                          </h4>
                                          <p className="text-[10px] sm:text-[11px] font-sans font-bold text-brand-purple mt-0.5">
                                            {item.nameMm}
                                          </p>
                                          <p className="text-[11px] text-brand-muted font-sans font-medium mt-2 leading-relaxed">
                                            {item.description}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between gap-3 pt-4 mt-5 border-t border-slate-100 -mx-5 -mb-5 p-4 bg-[#fafafc] rounded-b-2xl">
                                        <div className="text-left font-sans select-none">
                                          <span className="text-[7.5px] text-brand-muted block font-extrabold uppercase leading-none">Syllabus Access</span>
                                          <span className="text-xs sm:text-sm font-black text-brand-purple block mt-0.5">
                                            {isFree ? 'FREE' : `${item.price.toLocaleString()} ${item.currency}`}
                                          </span>
                                        </div>

                                        {itemOwned ? (
                                          <button
                                            onClick={() => {
                                              if (item.pdfDownloadUrl) {
                                                window.open(item.pdfDownloadUrl, '_blank');
                                                addSystemLog(currentUser || 'student', `Downloaded companion booklet: "${item.name}"`);
                                              } else {
                                                triggerPdfDownload(
                                                  item.pdfFileName || `${item.id}.pdf`,
                                                  item.name,
                                                  item.description,
                                                  [
                                                    { thai: "สวัสดี ครับ", pronunciation: "sawàtdii khráp", myanmar: "မဂ်လာပါခင်ဗျာ" },
                                                    { thai: "ขอบคุณ ครับ", pronunciation: "khɔ̀ɔp-khun khráp", myanmar: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ" },
                                                    { thai: "โชคดี", pronunciation: "chôok-dii", myanmar: "ကံကောင်းပါစေ" }
                                                  ]
                                                );
                                                addSystemLog(currentUser || 'student', `Auto generated dynamic Companion PDF download: "${item.name}"`);
                                              }
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-750 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-emerald-800 flex items-center gap-1.5 shrink-0"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            📥 Download
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              const bookProduct = {
                                                id: item.id,
                                                name: item.name,
                                                nameMm: item.nameMm,
                                                priceAmount: item.price,
                                                currency: item.currency || 'MMK',
                                                itemType: 'e-book',
                                                duration: "Linked Syllabus Learning Course Pack",
                                                description: item.description,
                                                descriptionMm: item.descriptionMm,
                                                instructor: "Kru Jane & Sayar Thura",
                                                includes: ["Full PDF Handbook Download Link", "Specific Course Exercises", "Vocabulary sheets"]
                                              };
                                              setGatewayCourse(bookProduct as any);
                                              setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                                              setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                                              setGatewayStep(1);
                                              setGatewayPaymentMethod('kbzpay');
                                              setGatewayOtp('');
                                              setGatewayTimer(180);
                                              setIsGatewayOpen(true);
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-purple/95 text-white rounded-xl text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-brand-purple-shadow flex items-center gap-1 shrink-0"
                                          >
                                            🔒 Unlock eBook
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            );
          }

          return (
            <div className="max-w-3xl mx-auto space-y-6 text-left animate-fade-in py-4">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-100 shadow-sm text-center space-y-6 relative overflow-hidden">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-purple via-indigo-500 to-purple-600" />
                
                {/* Lock Badge & Icon */}
                <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 border-2 border-brand-purple/20 text-brand-purple flex items-center justify-center text-4xl mx-auto shadow-inner">
                  💎
                </div>

                <div className="space-y-2 max-w-xl mx-auto">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-brand-purple border border-purple-200">
                    PREMIUM ADVANCED COURSE • အဆင့်မြင့်ထိုင်းစာသင်တန်း
                  </span>
                  <h2 className="font-sans font-black text-xl sm:text-2xl text-slate-800 tracking-tight">
                    {activeCourse.name}
                  </h2>
                  {activeCourse.nameMm && (
                    <p className="text-xs sm:text-sm font-bold text-brand-purple">
                      {activeCourse.nameMm}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2">
                    {activeCourse.description}
                  </p>
                  {activeCourse.descriptionMm && (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      {activeCourse.descriptionMm}
                    </p>
                  )}
                </div>

                {/* Course Highlights / Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left border-t border-slate-100 max-w-xl mx-auto">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-base block">📚</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase block">10 Full Lessons</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">Business dialogues & letters</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-base block">🎙️</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase block">Native Audio Clips</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">Clear pronunciation practice</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-base block">📜</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase block">Workplace Templates</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">Formal email & phone guides</span>
                  </div>
                </div>

                {/* Pricing & Unlock Actions */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto">
                  <div className="text-center sm:text-left">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Course Fee Rate</span>
                    <span className="text-xl font-sans font-black text-brand-purple block">
                      {activeCourse.priceAmount ? `${activeCourse.priceAmount.toLocaleString()} MMK` : '65,000 MMK'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        openEnrollmentPortal({
                          title: activeCourse.name || "Advanced Business Thai Speaking",
                          price: activeCourse.priceAmount || "35,000",
                          type: "PREMIUM COURSE"
                        });
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-purple to-purple-700 hover:brightness-110 text-white rounded-2xl text-xs font-sans font-black uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer transition-all transform active:translate-y-0.5 border-b-4 border-purple-900 flex items-center justify-center gap-2"
                    >
                      <span>🔓 UNLOCK COURSE NOW</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openEnrollmentPortal({
                          title: activeCourse.name || "Advanced Business Thai Speaking",
                          price: activeCourse.priceAmount || "35,000",
                          type: "PREMIUM COURSE"
                        });
                      }}
                      className="w-full sm:w-auto px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-sans font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>💳 Pay & Enroll</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {selectedCourseTab === 'resources' && (() => {
          const resourceItems: any[] = resourceCatalog.length > 0 ? [...resourceCatalog] : [{
            id: 'basic-thai-book-pdf',
            name: 'Basic Thai Book PDF',
            nameMm: 'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်',
            description: 'A free foundational Thai speaking book for everyday conversation practice.',
            descriptionMm: 'နေ့စဉ်သုံး ထိုင်းစကားပြောနှင့် အခြေခံဝေါဟာရများကို လေ့လာရန် အခမဲ့ PDF စာအုပ်။',
            priceAmount: 0,
            currency: 'MMK',
            isFree: true,
            courseName: 'Complete Thai Foundational Mastery Course',
            openUrl: 'https://drive.google.com/file/d/1GDVMsaqLRFoIIPMhOK09mbvBfPhd-i_c/view?usp=sharing',
            downloadUrl: 'https://drive.google.com/uc?export=download&id=1GDVMsaqLRFoIIPMhOK09mbvBfPhd-i_c'
          }];

          // Include extra store items or resources if available
          storeItems.forEach(item => {
            if (!resourceItems.some(r => r.id === item.id)) {
              const linkedCourse = courses.find(c => c.id === item.courseId);
              resourceItems.push({
                id: item.id,
                name: item.name,
                nameMm: item.nameMm,
                description: item.description || `Study worksheets and practice guidelines specifically designed for ${linkedCourse ? linkedCourse.name : 'the Complete Thai Foundational Mastery Course'}.`,
                priceAmount: item.price || 0,
                currency: item.currency || 'MMK',
                isFree: (item.price || 0) === 0,
                courseName: linkedCourse ? linkedCourse.name : 'Complete Thai Foundational Mastery Course',
                pdfDownloadUrl: item.pdfDownloadUrl,
                vocabEntries: item.vocabEntries,
                sentenceEntries: item.sentenceEntries,
                dialogueEntries: item.dialogueEntries,
                conversationEntries: item.conversationEntries,
                rawItem: item
              } as any);
            }
          });

          return (
            <div className="space-y-6 animate-fade-in text-left max-w-4xl mx-auto">
              {/* Header Banner */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-2 text-left">
                <span className="text-[10px] text-brand-purple font-sans font-black uppercase tracking-wider block">
                  SYLLABUS MATERIALS
                </span>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-slate-800 tracking-tight flex items-center gap-2">
                  📚 ENROLLED COURSE COMPANION RESOURCES • စာရွက်စာတမ်းများ
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-sans font-medium leading-relaxed">
                  Access your official lesson worksheets, writing workbooks, exam reference templates, and homework sheets for basic and advanced courses.
                </p>
              </div>

              {/* Section Title */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg">🎓</span>
                  <h4 className="font-sans font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                    COMPLETE THAI FOUNDATIONAL MASTERY COURSE COMPANION MATERIALS
                  </h4>
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-black px-2 py-0.5 rounded tracking-normal uppercase border border-purple-200 select-none">
                    ENROLLED GUIDES
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resourceItems.map((res) => {
                    const isFree = res.isFree ?? Number(res.priceAmount || 0) === 0;
                    const itemOwned = isFree || isStoreItemUnlocked(res.id, res.priceAmount);
                    const courseName = res.courseName || "Complete Thai Foundational Mastery Course";

                    return (
                      <CourseResourceCard
                        key={res.id}
                        res={res}
                        courseName={courseName}
                        isFree={isFree}
                        itemOwned={itemOwned}
                        onStudyInteractive={(resource) => {
                          if (resource.rawItem) {
                            setActiveReadingResource(resource.rawItem);
                          } else {
                            setActiveEbookId(resource.id);
                            setActiveEbookLessonId(1);
                          }
                        }}
                        onDownload={(resource) => {
                          if (openResourceInNewTab(resource)) {
                            addSystemLog(currentUser || 'student', `Opened download for resource: "${resource.name}"`);
                          } else {
                            alert('This resource does not have a valid PDF link yet.');
                          }
                        }}
                        onPurchase={(resource) => {
                          const checkoutProduct = {
                            id: resource.id,
                            name: resource.name,
                            nameMm: resource.nameMm || '',
                            priceAmount: resource.priceAmount,
                            currency: resource.currency || 'MMK',
                            itemType: 'e-book' as const,
                            duration: "Course Companion Resource License",
                            description: resource.description,
                            descriptionMm: resource.nameMm || '',
                            instructor: "Kru Jane & Sayar Thura",
                            includes: ["Direct PDF Download Link", "Practice Worksheets", "Vocabulary sheets"]
                          };
                          setGatewayCourse(checkoutProduct as any);
                          setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                          setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                          setGatewayStep(1);
                          setGatewayPaymentMethod('kbzpay');
                          setGatewayOtp('');
                          setGatewayTimer(180);
                          setIsGatewayOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    )}

    {/* EBOOKS VIEW (Triggered by EBOOKS top navigation tab or handbook mode) */}
        {dashboardTab === 'handbook' && (() => {
          const ebooks = [
            {
              id: 1,
              storeId: 'sayar-son-jai-blue-book',
              coverTheme: 'from-blue-600 to-blue-900',
              coverTopText: 'BASIC THAI GUIDE',
              coverTitle: 'BLUE BOOK',
              coverSub: 'SAYAR SON JAI',
              coverCenterIcon: '📘',
              coverCenterLabel: 'AUDIO INSIDE',
              coverBottom1: 'BESTSELLER TEXTBOOK',
              coverBottom2: 'PREMIUM AUDIO BOOK',
              badgeText: 'PREMIUM STUDY BOOK',
              badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
              title: 'Sayar Son Jai Basic Thai Blue Book (Audio eBook)',
              titleMm: 'ဆရာဆွန်ဂျိုင်း စိတ်ကြိုက် အခြေခံထိုင်းစာအုပ် (အသံဖိုင်ပါဝင်သည်)',
              descEn: 'Contains 40 plain-text textbook lessons with audio files. Study Myanmar to Thai translation tables with Myanmar phonetic guidelines.',
              descMm: 'သင်ခန်းစာ ၄၀ ပါဝင်သော အခြေခံထိုင်းစာအုပ်ဖြစ်ပြီး အသံဖိုင်များလည်း ပါရှိသည်။ မြန်မာဘာသာပြန်နှင့် ဖတ်ရလွယ်ကူသော အသံထွက်လမ်းညွှန်ချက်များ ပါရှိသည်။',
              price: '25,000 MMK',
              priceAmount: 25000,
              isFree: false
            },
            {
              id: 2,
              storeId: 'free-phrases',
              coverTheme: 'from-emerald-600 to-emerald-900',
              coverTopText: 'PHRASES GUIDE',
              coverTitle: '100 THAI WORDS',
              coverSub: 'DAILY SPEAKING',
              coverCenterIcon: '💬',
              coverCenterLabel: 'POCKET ESSENTIALS',
              coverBottom1: 'KRU JANE MANUAL',
              coverBottom2: 'FREE PHRASES BOOK',
              badgeText: 'FREE PDF DOWNLOAD',
              badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
              title: '100 Daily Essential Thai Phrases Guide',
              titleMm: 'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ်',
              descEn: 'Contains vital expressions for daily commute, polite particles, asking directions, ordering meals, and instant street conversation guides.',
              descMm: 'နေ့စဉ်သုံး အထူးထိုင်းစကားပြော စာအုပ် - ခရီးသွားလာခြင်း၊ လမ်းမေးခြင်း၊ အစားအသောက်မှာယူခြင်းတို့အတွက် အထူးလေ့ကျင့်ပါ။',
              price: 'FREE',
              priceAmount: 0,
              isFree: true
            }
          ];

          return (
            <div className="space-y-6 animate-fade-in text-left">
              {/* 1. Header Section */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-2 text-left">
                <h2 className="text-xl sm:text-2xl font-sans font-black text-slate-800 tracking-tight flex items-center gap-2">
                  📕 PREMIUM THAI-MYANMAR AUDIO EBOOKS • အသံဖိုင်ပါစာအုပ်များ
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-sans font-medium leading-relaxed">
                  Study with our interactive companion audio textbook guides, trace writing, and reference books featuring full native Thai sound clips.
                </p>
              </div>

              {/* 2. Section Title */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg">📖</span>
                  <h4 className="font-sans font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                    GENERAL STUDY E-BOOKS & REFERENCE LIBRARY
                  </h4>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-black tracking-normal uppercase border border-slate-200 select-none">
                    LIBRARY CATALOG
                  </span>
                </div>

                {/* 3. The Books Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {ebooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 gap-5 sm:gap-6 hover:shadow-md transition-all text-left relative overflow-hidden"
                    >
                      {/* Left Side (Book Cover Graphics) */}
                      <div className={`w-[130px] sm:w-[140px] aspect-[1/1.414] bg-gradient-to-b ${book.coverTheme} rounded-xl shadow-md p-3.5 text-white flex flex-col justify-between shrink-0 select-none relative overflow-hidden border-l-4 border-black/30 text-center mx-auto sm:mx-0`}>
                        <div className="space-y-1">
                          <span className="block text-[7px] font-black tracking-widest text-white/80 uppercase leading-none">
                            {book.coverTopText}
                          </span>
                          <div className="h-[1.5px] bg-yellow-400 w-1/2 mx-auto mt-1 rounded" />
                          <h4 className="font-sans font-black text-[11px] leading-tight text-yellow-300 drop-shadow mt-1">
                            {book.coverTitle}
                          </h4>
                          <p className="text-[7.5px] tracking-wide font-sans font-black text-white/90 uppercase leading-tight">
                            {book.coverSub}
                          </p>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-1 py-1">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center">
                            <span className="text-xs text-white">{book.coverCenterIcon}</span>
                          </div>
                          <span className="text-[6.5px] font-bold text-yellow-200 tracking-wider uppercase text-center leading-tight">
                            {book.coverCenterLabel}
                          </span>
                        </div>

                        <div className="space-y-0.5 text-center">
                          <div className="h-[1px] bg-white/20 w-3/4 mx-auto rounded" />
                          <p className="text-[7.5px] font-bold text-white/95 uppercase">
                            {book.coverBottom1}
                          </p>
                          <p className="text-[6.5px] text-yellow-400 font-extrabold tracking-wider uppercase leading-none">
                            {book.coverBottom2}
                          </p>
                        </div>
                      </div>

                      {/* Right Side (Book Details) */}
                      <div className="flex-1 flex flex-col justify-between font-sans text-left space-y-3">
                        <div className="space-y-2">
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border select-none inline-block ${book.badgeColor}`}>
                              {book.badgeText}
                            </span>
                          </div>
                          <h3 className="font-sans font-black text-sm sm:text-base text-slate-800 leading-snug">
                            {book.title}
                          </h3>
                          <p className="text-xs font-black text-brand-purple mt-0.5">
                            {book.titleMm}
                          </p>
                          <div className="text-xs text-slate-500 space-y-1 mt-2 leading-relaxed">
                            <p className="font-medium">{book.descEn}</p>
                            <p className="text-[11px] text-slate-400 italic">{book.descMm}</p>
                          </div>
                        </div>

                        {/* Footer (Price Tag & ENTER BOOK button) */}
                        <div className="flex items-end justify-between gap-3 pt-3 mt-4 border-t border-gray-100">
                          <div className="select-none">
                            <span className="text-[7.5px] text-slate-400 block font-black uppercase leading-none">PRICE TAG</span>
                            <span className={`text-xs sm:text-sm font-sans font-black block mt-0.5 ${book.isFree ? 'text-emerald-600' : 'text-brand-purple'}`}>
                              {book.price}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (book.isFree || isStoreItemUnlocked(book.storeId, book.priceAmount || 25000)) {
                                setActiveEbookId(book.storeId);
                                setActiveEbookLessonId(1);
                                window.speechSynthesis?.cancel();
                                addSystemLog(currentUser || 'student', `Opened dynamic textbook reader: "${book.title}"`);
                              } else {
                                openEnrollmentPortal({
                                  id: book.storeId,
                                  title: book.title,
                                  price: book.price,
                                  type: "PREMIUM RESOURCE"
                                });
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-brand-purple to-[#7a42c4] hover:brightness-105 text-white rounded-xl text-xs font-sans font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all active:scale-95 border-b-4 border-brand-purple-shadow flex items-center gap-1.5 shrink-0 shadow-xs"
                          >
                            {book.isFree || isStoreItemUnlocked(book.storeId, book.priceAmount || 25000) ? "📖 ENTER BOOK" : "🔒 UNLOCK EBOOK"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

            {/* TAB CONTENT: Orientation & Pronunciation Guide */}
            {dashboardTab === 'orientation' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 min-h-[500px]">
                
                {/* Left Sidebar Article Selector */}
                <div className="space-y-4 lg:col-span-1">
                  <div className="mb-4">
                    <h3 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wider">
                      Orientation • လမ်းညွှန်ချက်
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {(orientationData || []).map((article) => {
                      const isActive = article?.id === activeOrientationId;
                      return (
                        <button
                          key={article?.id}
                          onClick={() => setActiveOrientationId(article?.id)}
                          className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all text-xs outline-none ${
                            isActive
                              ? 'bg-brand-purple text-white border-brand-purple border-b-4 border-brand-purple-shadow'
                              : 'bg-white hover:bg-gray-50 text-brand-dark border-gray-150 border-b-4'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={`font-sans font-black leading-tight text-sm ${isActive ? 'text-white' : 'text-[#3c3c3c]'}`}>
                              {article?.titleEnglish}
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-white' : 'text-gray-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area Article details panel */}
                <div className="lg:col-span-3 space-y-6">
                  {(() => {
                    const article = (orientationData || []).find(a => a?.id === activeOrientationId) || orientationData?.[0];
                    if (!article) return <div className="p-6 bg-white rounded-2xl text-xs font-bold text-brand-muted">No orientation data available.</div>;

                    return (
                      <>
                        {/* Article Welcome Card */}
                        <div className="duo-card p-6 md:p-8 bg-white border-2 border-gray-100">
                          <span className="text-[10px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-1 rounded-full font-extrabold border border-brand-purple/20 select-none uppercase">
                            Course Orientation
                          </span>
                          <h2 className="text-xl md:text-2xl font-sans font-black text-brand-dark tracking-tight mt-3">
                            {article.titleEnglish}
                          </h2>
                        </div>

                        {/* Article Sections */}
                        <div className="space-y-6">
                          {(article.sections || []).map((section, secIdx) => (
                            <motion.div
                              key={secIdx}
                              className="duo-card p-6 bg-white border-2 border-gray-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: secIdx * 0.05 }}
                            >
                              <h4 className="font-sans font-black text-brand-purple text-base mb-2">
                                {section?.headingEnglish}
                              </h4>
                              <h5 className="font-sans font-black text-brand-muted text-xs mb-4">
                                {section?.headingMyanmar}
                              </h5>
                              <div className="space-y-4">
                                {(section?.paragraphs || []).map((p, pIdx) => (
                                  <div key={pIdx} className="space-y-1">
                                    <p className="text-xs sm:text-sm text-brand-dark font-sans leading-relaxed font-semibold">
                                      {p?.en}
                                    </p>
                                    <p className="text-xs sm:text-sm text-brand-muted font-sans leading-relaxed italic border-l-4 border-brand-purple/20 pl-3 font-semibold whitespace-pre-line">
                                      {p?.mm}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {section?.highlights && section.highlights.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(section.highlights || []).map((hl, hlIdx) => (
                                    <div key={hlIdx} className="p-3.5 bg-brand-light/50 border border-gray-200 rounded-xl flex items-center justify-between gap-3.5 hover:border-brand-purple/30 transition-all shadow-3xs">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-sans font-bold text-xs flex items-center flex-wrap gap-1">
                                          {hl.termThai && (
                                            <span className="text-brand-purple text-base font-black mr-1">{hl.termThai}</span>
                                          )}
                                          <span className="text-brand-green italic font-black">({hl.termPhonetic})</span>
                                          {hl.termPhonetic && (
                                            <span className="text-[10px] text-emerald-600 font-extrabold ml-1.5 font-sans">အသံထွက်: {getMyanmarPhonetic(hl.termPhonetic)}</span>
                                          )}
                                        </div>
                                        <div className="text-[11px] font-sans mt-2 font-bold text-brand-dark leading-snug">
                                          {hl.meaningEnglish} • <span className="text-brand-muted">{hl.meaningMyanmar}</span>
                                        </div>
                                      </div>
                                      {hl.termThai && (
                                        <button
                                          onClick={() => speakText(hl.termThai)}
                                          className="p-1 px-2 border-2 border-brand-purple/20 bg-[#fbfaff] hover:bg-brand-purple/10 text-brand-purple hover:text-brand-purple-dark text-[10px] rounded-lg font-black shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                          title="Play sound • အသံထွက်ဖွင့်ရန်"
                                        >
                                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                          <span>Play</span>
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. Grammar Handbook */}
            {dashboardTab === 'handbook' && (
              <div className="max-w-7xl mx-auto space-y-6 min-h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  {/* Left Column: Grammar Index Sidebar */}
                  <div className="lg:col-span-1 duo-card p-5 bg-white space-y-4 shadow-xs border-2 border-gray-100 rounded-3xl">
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="font-sans font-black text-brand-dark text-xs sm:text-sm uppercase tracking-wider">
                        GRAMMAR INDEX • သဒ္ဒါမာတိကာ
                      </h3>
                    </div>

                    <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                      {(grammarChapters || []).map((ch, idx) => {
                        const cNum = Number(ch?.id ?? ch?.chapter_number ?? ch?.chapterNumber ?? (idx + 1));
                        const totalChapters = (grammarChapters || []).length || 19;
                        const rawTitle = ch?.titleEnglish || ch?.title_english || ch?.title || `Lesson ${cNum}`;
                        const cleanTitle = rawTitle.replace(/^Lesson\s+\d+(\s+of\s+\d+)?:\s*/i, '');
                        const displayTitle = `Lesson ${cNum} of ${totalChapters}: ${cleanTitle}`;
                        const isSelected = activeChapterId === cNum || Number(activeChapterId) === cNum;

                        return (
                          <button
                            key={cNum}
                            onClick={() => {
                              setActiveChapterId(cNum);
                              setActiveHandbookSubTab('vocab');
                              setExpandedGrammarSection(null);
                              setExpandedChapterRuleIndex(0);
                              setHandbookSubPageIndex(0);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl transition-all border-2 text-xs flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? 'bg-brand-purple text-white border-brand-purple border-b-4 border-brand-purple-shadow shadow-xs'
                                : 'bg-white hover:bg-gray-50 text-brand-dark border-gray-200 border-b-4'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <BookOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-brand-purple'}`} />
                              <span className="font-sans font-black text-sm tracking-tight leading-snug truncate">
                                {displayTitle}
                              </span>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 ml-1.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Active Content */}
                  <div className="lg:col-span-3 space-y-6">
                    {(() => {
                      const normalizedActiveId = Number(activeChapterId ?? 1) || 1;
                      const chapter = (grammarChapters || []).find(c => {
                        const cNum = Number(c?.id ?? c?.chapter_number ?? c?.chapterNumber ?? 0);
                        return cNum === normalizedActiveId;
                      }) || (grammarChapters || [])[0] || {};
                      const totalChapters = (grammarChapters || []).length || 19;
                      const rawChapterTitle = chapter?.titleEnglish || chapter?.title_english || chapter?.title || `Chapter ${normalizedActiveId}`;
                      const cleanChapterTitle = rawChapterTitle.replace(/^Lesson\s+\d+(\s+of\s+\d+)?:\s*/i, '');
                      const chapterNumDisplay = Number(chapter?.id ?? chapter?.chapter_number ?? chapter?.chapterNumber ?? normalizedActiveId);
                      const chapterSubtitle = chapter?.titleMyanmar || chapter?.title_myanmar || '';

                      return (
                        <div className="space-y-6">
                          {/* Active Chapter Welcome Card */}
                          <div className="duo-card p-6 md:p-8 bg-white border-2 border-gray-100 flex items-start gap-4">
                            <div className="w-12 h-12 bg-brand-purple-light text-brand-purple rounded-2xl flex items-center justify-center shrink-0 border border-brand-purple/20 shadow-xs font-sans font-black text-sm select-none">
                              {chapterNumDisplay}
                            </div>
                            <div>
                              <span className="text-[10px] font-sans text-brand-purple bg-brand-purple-light px-3 py-1 rounded-full font-extrabold border border-brand-purple/20 select-none uppercase tracking-wider">
                                ACTIVE HANDBOOK CHAPTER
                              </span>
                              <h2 className="text-xl md:text-2xl font-sans font-black text-brand-dark tracking-tight mt-2">
                                Lesson {chapterNumDisplay} of {totalChapters}: {cleanChapterTitle}
                              </h2>
                              {chapterSubtitle && (
                                <p className="text-base text-brand-muted font-sans font-bold mt-2 leading-relaxed">
                                  {chapterSubtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 4 Subtabs Selector Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-3xl border-2 border-gray-100 shadow-xs mb-6 select-none">
                            {(['vocab', 'grammar', 'dialogue', 'conversation'] as const).map((tab) => {
                              const isActive = activeHandbookSubTab === tab;
                              let title = '';
                              let mmTitle = '';
                              let thTitle = '';
                              let icon = null;

                              if (tab === 'vocab') {
                                title = 'Vocabulary';
                                mmTitle = 'ဝေါဟာရစု';
                                thTitle = 'คำศัพท์';
                                icon = <FileText className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-purple'}`} strokeWidth={2} />;
                              } else if (tab === 'grammar') {
                                title = 'Grammar';
                                mmTitle = 'သဒ္ဒါ';
                                thTitle = 'ไวยากรณ์';
                                icon = <BookOpen className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-purple'}`} strokeWidth={2} />;
                              } else if (tab === 'dialogue') {
                                title = 'Dialogue';
                                mmTitle = 'အမေးအဖြေ';
                                thTitle = 'ถาม-ตอบ';
                                icon = <HelpCircle className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-purple'}`} strokeWidth={2} />;
                              } else {
                                title = 'Conversation';
                                mmTitle = 'စကားပြော';
                                thTitle = 'บทสนทนา';
                                icon = <Users className={`w-5 h-5 ${isActive ? 'text-white' : 'text-brand-purple'}`} strokeWidth={2} />;
                              }

                              return (
                                <button
                                  key={tab}
                                  onClick={() => setActiveHandbookSubTab(tab)}
                                  className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all outline-none text-center select-none cursor-pointer ${
                                    isActive
                                      ? 'bg-brand-purple border-brand-purple text-white border-b-4 border-brand-purple-shadow shadow-xs'
                                      : 'bg-white hover:bg-gray-50 text-brand-dark border-gray-150 border-b-4'
                                  }`}
                                >
                                  <div className={`p-2 rounded-xl mb-1.5 shrink-0 flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-brand-purple-light'}`}>
                                    {icon}
                                  </div>
                                  <span className="font-sans font-black text-xs sm:text-sm tracking-tight line-clamp-1 leading-tight">
                                    {title}
                                  </span>
                                  <span className={`text-[9.5px] font-sans font-bold leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-brand-muted'}`}>
                                    {mmTitle} • {thTitle}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                        {/* Selected Tab Content Area */}
                        <div className="space-y-6 pb-24">
                          {(() => {
                            const enriched = getGrammarExtDataForChapter(chapter.id, chapter.titleEnglish, chapter.titleMyanmar, grammarExtMap, lessons);

                            if (activeHandbookSubTab === 'vocab') {
                              const rawVocab = Array.isArray(enriched?.vocab) ? enriched.vocab : [];
                              const filteredVocab = rawVocab.filter((v: any) => {
                                const q = vocabSearch.trim().toLowerCase();
                                if (!q) return true;
                                const thai = (v?.thai || v?.text_thai || v?.textThai || '').toLowerCase();
                                const phonetic = (v?.phonetic || v?.text_phonetic || v?.textPhonetic || '').toLowerCase();
                                const english = (v?.english || v?.text_english || v?.textEnglish || '').toLowerCase();
                                const myanmar = (v?.myanmar || v?.text_myanmar || v?.textMyanmar || '').toLowerCase();
                                const myanmarPhonetic = (v?.phonetic_mm || v?.phoneticMm || v?.myanmarPhonetic || '').toLowerCase();
                                return (
                                  thai.includes(q) ||
                                  phonetic.includes(q) ||
                                  english.includes(q) ||
                                  myanmar.includes(q) ||
                                  myanmarPhonetic.includes(q)
                                );
                              });

                              return (
                                <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xs p-6 space-y-4 animate-fadeIn">
                                  <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-purple-light text-brand-purple flex items-center justify-center shrink-0 border border-brand-purple/20">
                                      <FileText className="w-6 h-6 text-brand-purple" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded font-black uppercase">
                                        Section 1 • အပိုင်း ၁
                                      </span>
                                      <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark tracking-tight">
                                        Vocabulary • ဝေါဟာရစု <span className="text-brand-muted text-sm font-normal font-sans">(คำศัพท์)</span>
                                      </h3>
                                      <p className="text-xs text-brand-muted font-sans font-bold mt-1">
                                        Core vocabulary words with phonetic guides, Myanmar translations, and native pronunciation playback.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Vocab Search Controls Bar */}
                                  <div className="flex items-center gap-3 bg-gray-50/50 p-3.5 rounded-2xl border-2 border-gray-150">
                                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input
                                      type="text"
                                      placeholder="Search vocabulary words (Thai, Phonetics, Myanmar, English)..."
                                      className="w-full bg-transparent border-none outline-none font-sans font-bold text-xs text-brand-dark"
                                      value={vocabSearch}
                                      onChange={(e) => setVocabSearch(e.target.value)}
                                    />
                                    {vocabSearch && (
                                      <button
                                        onClick={() => setVocabSearch('')}
                                        className="text-[10px] font-sans font-black text-brand-purple bg-brand-purple-light px-2.5 py-1 rounded-lg"
                                      >
                                        CLEAR
                                      </button>
                                    )}
                                  </div>

                                  {/* Vocabulary Entries Grid */}
                                  {filteredVocab.length === 0 ? (
                                    <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-150">
                                      <p className="text-xs font-sans font-bold text-brand-muted">
                                        No matching vocabulary words found in this chapter.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                                      {filteredVocab.map((item: any, idx: number) => {
                                        const thaiText = item?.thai || item?.text_thai || item?.textThai || '';
                                        const phoneticText = item?.phonetic || item?.text_phonetic || item?.textPhonetic || '';
                                        const englishText = item?.english || item?.text_english || item?.textEnglish || '';
                                        const myanmarText = item?.myanmar || item?.text_myanmar || item?.textMyanmar || '';
                                        const myanmarPhonetic = item?.phonetic_mm || item?.phoneticMm || item?.myanmarPhonetic || '';

                                        return (
                                          <div
                                            key={idx}
                                            className="duo-card p-5 bg-gray-50/50 border border-gray-100 flex items-center justify-between gap-4 hover:border-gray-250 transition-all min-h-[150px]"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div className="font-sans font-black text-brand-dark text-base leading-tight flex items-baseline gap-2 flex-wrap">
                                                <span className="text-brand-purple text-xl sm:text-2xl">{thaiText}</span>
                                                {phoneticText && (
                                                  <span className="text-xs sm:text-sm text-brand-green font-extrabold italic bg-brand-green-light px-2.5 py-1 rounded-full">
                                                    ({phoneticText})
                                                  </span>
                                                )}
                                                {phoneticText && (
                                                  <span className="text-sm sm:text-base text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full leading-relaxed">
                                                    အသံထွက်: {myanmarPhonetic || getMyanmarPhonetic(phoneticText)}
                                                  </span>
                                                )}
                                              </div>
                                              {englishText && (
                                                <div className="text-sm text-brand-muted font-sans font-bold leading-normal mt-3">
                                                  {englishText}
                                                </div>
                                              )}
                                              {myanmarText && (
                                                <div className="text-base sm:text-lg text-brand-dark font-sans font-semibold border-l-3 border-brand-purple/25 pl-3 mt-2 leading-relaxed">
                                                  {myanmarText}
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <GrammarVocabDropdown sentence={thaiText} allLessons={lessons} />
                                              <button
                                                onClick={() => speakText(thaiText)}
                                                className="w-10 h-10 rounded-xl bg-white border-2 border-b-4 border-gray-200 hover:bg-gray-50 flex items-center justify-center shrink-0 transition-all active:translate-y-0.5 active:border-b-2"
                                                title="Listen pronunciation"
                                              >
                                                <Volume2 className="w-5 h-5 text-brand-purple" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                               if (activeHandbookSubTab === 'grammar') {
                               const grammarRulesList: any[] = [];
                               if (chapter?.rules && Array.isArray(chapter.rules) && chapter.rules.length > 0) {
                                 grammarRulesList.push(...chapter.rules);
                               }
                               if (enriched) {
                                 if (Array.isArray(enriched.grammarList) && enriched.grammarList.length > 0) {
                                   grammarRulesList.push(...enriched.grammarList);
                                 } else if (enriched.title || enriched.explanation || (enriched.examples && enriched.examples.length > 0)) {
                                   grammarRulesList.push({
                                     title: enriched.title || chapter?.titleEnglish || 'Grammar Note',
                                     title_myanmar: enriched.title_myanmar || chapter?.titleMyanmar || '',
                                     explanation: enriched.explanation || '',
                                     explanation_myanmar: enriched.explanation_myanmar || '',
                                     examples: Array.isArray(enriched.examples)
                                       ? enriched.examples
                                       : (enriched.vocab || enriched.sentences || enriched.qa || [])
                                   });
                                 }
                               }

                               return (
                                 <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xs p-6 space-y-4 animate-fadeIn">
                                   <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                                     <div className="w-12 h-12 rounded-2xl bg-brand-purple-light text-brand-purple flex items-center justify-center shrink-0 border border-brand-purple/20">
                                       <BookOpen className="w-6 h-6 text-brand-purple" />
                                     </div>
                                     <div>
                                       <span className="text-[9px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded font-black uppercase">
                                         Section 2 • အပိုင်း ၂
                                       </span>
                                       <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark tracking-tight">
                                         Grammar Notes • သဒ္ဒါမှတ်စုများ <span className="text-brand-muted text-sm font-normal font-sans">(ไวยากรณ์)</span>
                                       </h3>
                                       <p className="text-xs text-brand-muted font-sans font-bold mt-1">
                                         Interactive syntax patterns, descriptive grammar components, and practice exercises.
                                       </p>
                                     </div>
                                   </div>

                                   {grammarRulesList.length === 0 ? (
                                     <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-150">
                                       <p className="text-xs font-sans font-bold text-brand-muted">
                                         No grammar notes available for this section.
                                       </p>
                                     </div>
                                   ) : (
                                     <div className="space-y-4">
                                       {grammarRulesList.map((rule, ruleIdx) => {
                                         const isExpanded = expandedChapterRuleIndex === ruleIdx || expandedChapterRuleIndex === -1;
                                         const currentMode = exampleModeForRules[`${chapter.id}-${ruleIdx}`] || 'standard';
                                         
                                         // Get page-specific rule data or rule fallback
                                         const ruleData = getSubPageContent('handbook', chapter.id, ruleIdx, handbookSubPageIndex, rule);
                                         const titleText = rule.title || ruleData.title;
                                         const titleMmText = rule.title_myanmar || '';
                                         const expText = rule.explanation || ruleData.explanation;
                                         const expMmText = rule.explanation_myanmar || ruleData.explanationMyanmar;

                                         // Active examples
                                         const activeExamples = (rule.examples && rule.examples.length > 0)
                                           ? rule.examples
                                           : (currentMode === 'standard' 
                                             ? (ruleData.examples || []) 
                                             : getAdditionalPhrases(chapter.id, ruleIdx, currentMode));

                                         return (
                                           <div
                                             key={ruleIdx}
                                             id={`handbook-rule-${ruleIdx}`}
                                             className="duo-card bg-white border-2 border-gray-100 overflow-hidden"
                                           >
                                             {/* Accordion Header */}
                                             <button
                                               onClick={() => {
                                                 setExpandedChapterRuleIndex(isExpanded && expandedChapterRuleIndex !== -1 ? -1 : ruleIdx);
                                                 setHandbookSubPageIndex(0);
                                               }}
                                               className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-gray-55 transition-colors select-none focus:outline-none"
                                             >
                                               <div className="flex items-center gap-3 min-w-0">
                                                 <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-sans font-black text-xs shrink-0 select-none ${
                                                   isExpanded 
                                                     ? 'bg-brand-purple text-white border-brand-purple shadow-xs' 
                                                     : 'bg-brand-purple-light text-brand-purple border-brand-purple/20'
                                                 }`}>
                                                   {ruleIdx + 1}
                                                 </div>
                                                 <div className="min-w-0">
                                                   <h5 className="font-sans font-black text-brand-purple text-base leading-tight truncate">
                                                     {titleText}
                                                     {titleMmText && <span className="text-gray-500 font-normal ml-2">({titleMmText})</span>}
                                                   </h5>
                                                 </div>
                                               </div>

                                               <div className="shrink-0">
                                                 {isExpanded ? (
                                                   <ChevronUp className="w-5 h-5 text-brand-purple" />
                                                 ) : (
                                                   <ChevronDown className="w-5 h-5 text-gray-400" />
                                                 )}
                                               </div>
                                             </button>

                                             {/* Content Body */}
                                             {isExpanded && (
                                               <div className="px-5 pb-5 pt-2 space-y-4 border-t border-gray-100">
                                                 {/* Expositions */}
                                                 {expText && (
                                                   <p className="text-xs sm:text-sm text-brand-dark font-sans leading-relaxed font-semibold">
                                                     {expText}
                                                   </p>
                                                 )}
                                                 {expMmText && (
                                                   <p className="text-xs sm:text-sm text-brand-muted font-sans leading-relaxed italic border-l-4 border-brand-purple/20 pl-3 font-semibold mt-1">
                                                     {expMmText}
                                                   </p>
                                                 )}

                                                 {/* Rule Examples Grid */}
                                                 {activeExamples && activeExamples.length > 0 && (
                                                   <div className="space-y-3 pt-2">
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                       {activeExamples.map((ex: any, exIdx: number) => (
                                                         <div key={exIdx} className="duo-card p-4 bg-gray-50/50 border border-gray-100 flex items-center justify-between gap-4 hover:border-gray-250 transition-all">
                                                           <div className="min-w-0 flex-1">
                                                             <div className="font-sans font-black text-brand-dark text-sm leading-tight flex items-baseline gap-1.5 flex-wrap">
                                                               <span className="text-brand-purple text-[15px]">{ex.thai}</span>
                                                               {ex.phonetic && (
                                                                 <span className="text-[10px] text-brand-green font-extrabold italic bg-brand-green-light px-2 py-0.5 rounded-full">
                                                                   ({ex.phonetic})
                                                                 </span>
                                                               )}
                                                               {ex.phonetic && (
                                                                 <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                                   အသံထွက်: {getMyanmarPhonetic(ex.phonetic)}
                                                                 </span>
                                                               )}
                                                             </div>
                                                             {ex.english && (
                                                               <div className="text-[11px] text-brand-muted font-sans font-bold leading-normal mt-2">
                                                                 {ex.english}
                                                               </div>
                                                             )}
                                                             {ex.myanmar && (
                                                               <div className="text-[11px] text-brand-dark font-sans font-bold leading-normal mt-0.5">
                                                                 {ex.myanmar}
                                                               </div>
                                                             )}
                                                           </div>

                                                           <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0 self-start">
                                                             <GrammarVocabDropdown sentence={ex.thai} allLessons={lessons} />
                                                             <button
                                                               onClick={() => speakText(ex.thai)}
                                                               className="px-2 h-8 rounded-xl bg-white border-2 border-b-4 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1 shrink-0 transition-all active:translate-y-0.5"
                                                               title="Listen normal speed"
                                                             >
                                                               <Volume2 className="w-3.5 h-3.5 text-brand-purple" />
                                                               <span className="text-[8px] font-sans font-black text-brand-purple bg-brand-purple-light px-1 py-0.5 rounded-md select-none leading-none">1.0x</span>
                                                             </button>
                                                           </div>
                                                         </div>
                                                       ))}
                                                     </div>
                                                   </div>
                                                 )}
                                               </div>
                                             )}
                                           </div>
                                         );
                                       })}
                                     </div>
                                   )}
                                 </div>
                               );
                             }

                            if (activeHandbookSubTab === 'dialogue') {
                              const rawList = (enriched && Array.isArray(enriched.dialogueList) && enriched.dialogueList.length > 0)
                                ? enriched.dialogueList
                                : ((enriched && Array.isArray(enriched.dialogue)) ? enriched.dialogue : []);
                              
                              const dialogueList = rawList.filter((item: any, index: number, self: any[]) =>
                                index === self.findIndex((t: any) => {
                                  const itemThai = item?.text_thai || item?.textThai || item?.thai || '';
                                  const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                                  return (
                                    (t.id && item.id && String(t.id) === String(item.id)) ||
                                    (tThai && itemThai && tThai === itemThai)
                                  );
                                })
                              );

                              const firstSpeaker = dialogueList[0]?.speaker || '';

                              return (
                                <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xs p-6 space-y-4 animate-fadeIn">
                                  <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-purple-light text-brand-purple flex items-center justify-center shrink-0 border border-brand-purple/20">
                                      <HelpCircle className="w-6 h-6 text-brand-purple" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded font-black uppercase">
                                        Section 3 • အပိုင်း ၃
                                      </span>
                                      <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark tracking-tight">
                                        Dialogue Q&A • စကားပြောအမေးအဖြေ <span className="text-brand-muted text-sm font-normal font-sans">(ถาม-ตอบ)</span>
                                      </h3>
                                      <p className="text-xs text-brand-muted font-sans font-bold mt-1">
                                        Conversational response practice. Play and repeat either query or resolution.
                                      </p>
                                    </div>
                                  </div>

                                  {dialogueList.length > 0 ? (
                                    <div className="space-y-4">
                                      {dialogueList.map((item: any, idx: number) => {
                                        const thaiText = item?.text_thai || item?.textThai || item?.thai || '';
                                        const mmText = item?.text_myanmar || item?.textMyanmar || item?.myanmar || '';
                                        const speakerName = item?.speaker || (idx % 2 === 0 ? 'Question' : 'Answer');
                                        const phonetic = item?.phonetic || item?.text_phonetic || item?.textPhonetic || '';
                                        
                                        const cleanSpeaker = String(speakerName).trim().toUpperCase();
                                        let isSpeakerQ: boolean;
                                        if (cleanSpeaker === 'Q' || cleanSpeaker === 'QUESTION' || (firstSpeaker && item?.speaker === firstSpeaker)) {
                                          isSpeakerQ = true;
                                        } else if (cleanSpeaker === 'A' || cleanSpeaker === 'ANSWER') {
                                          isSpeakerQ = false;
                                        } else {
                                          isSpeakerQ = idx % 2 === 0;
                                        }

                                        return (
                                          <div key={idx} className="duo-card p-5 bg-white border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 transition-all">
                                            <div className="flex items-start gap-3.5 min-w-0">
                                              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-sans font-black text-xs ${
                                                isSpeakerQ ? 'bg-amber-500 text-white shadow-xs' : 'bg-emerald-500 text-white shadow-xs'
                                              }`}>
                                                {isSpeakerQ ? 'Q' : 'A'}
                                              </div>

                                              <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-[10px] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                    {speakerName}
                                                  </span>
                                                  {phonetic && (
                                                    <span className="text-[10px] text-brand-purple font-extrabold italic bg-brand-purple-light px-2 py-0.5 rounded-full">
                                                      ({phonetic})
                                                    </span>
                                                  )}
                                                </div>

                                                <h5 className="font-sans font-black text-brand-dark text-base sm:text-lg leading-tight">
                                                  {thaiText}
                                                </h5>

                                                {mmText && (
                                                  <p className="text-xs sm:text-sm text-brand-muted font-sans font-bold leading-normal">
                                                    {mmText}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                                              <GrammarVocabDropdown sentence={thaiText} allLessons={lessons} />
                                              <button
                                                onClick={() => speakText(thaiText)}
                                                className="w-10 h-10 rounded-2xl bg-white border-2 border-b-4 border-gray-200 hover:bg-gray-50 flex items-center justify-center text-brand-purple transition-all active:translate-y-0.5 shadow-xs"
                                                title="Listen audio"
                                              >
                                                <Volume2 className="w-5 h-5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : Array.isArray(enriched?.qa) && enriched.qa.length > 0 ? (
                                    <div className="space-y-4">
                                      {enriched.qa.map((qa: any, qi: number) => (
                                        <div
                                          key={qi}
                                          className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-xs space-y-4"
                                        >
                                          <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center font-sans font-black text-xs shrink-0 select-none">
                                              Q
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-1">
                                              <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-base font-sans font-extrabold text-brand-dark">
                                                  {qa.q?.thai || qa.q}
                                                </span>
                                                {qa.q?.phonetic && (
                                                  <span className="text-[9px] text-[#e0a800] font-extrabold italic bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                    ({qa.q.phonetic})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-brand-muted font-sans font-medium">
                                                {qa.q?.myanmar}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => speakText(qa.q?.thai || qa.q)}
                                              className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center shrink-0"
                                            >
                                              <Volume2 className="w-4 h-4 text-brand-purple" />
                                            </button>
                                          </div>

                                          <div className="border-t border-dashed border-gray-150 my-1" />

                                          <div className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-brand-green text-white rounded-lg flex items-center justify-center font-sans font-black text-xs shrink-0 select-none">
                                              A
                                            </span>
                                            <div className="min-w-0 flex-1 space-y-1">
                                              <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-base font-sans font-extrabold text-[#4caf50]">
                                                  {qa.a?.thai || qa.a}
                                                </span>
                                                {qa.a?.phonetic && (
                                                  <span className="text-[9px] text-brand-green font-extrabold italic bg-brand-green-light px-1.5 py-0.5 rounded-full border border-green-200">
                                                    ({qa.a.phonetic})
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-brand-dark font-sans font-semibold">
                                                {qa.a?.myanmar}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => speakText(qa.a?.thai || qa.a)}
                                              className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center shrink-0"
                                            >
                                              <Volume2 className="w-4 h-4 text-brand-purple" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-150">
                                      <p className="text-xs font-sans font-bold text-brand-muted">
                                        No dialogue notes available for this section.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            if (activeHandbookSubTab === 'conversation') {
                              const rawList = (enriched && Array.isArray(enriched.conversationList) && enriched.conversationList.length > 0)
                                ? enriched.conversationList
                                : ((enriched && Array.isArray(enriched.conversation)) ? enriched.conversation : []);
                              
                              const convList = rawList.filter((turn: any, index: number, self: any[]) =>
                                index === self.findIndex((t: any) => {
                                  const turnThai = turn?.text_thai || turn?.textThai || turn?.thai || '';
                                  const tThai = t?.text_thai || t?.textThai || t?.thai || '';
                                  return (
                                    (t.id && turn.id && String(t.id) === String(turn.id)) ||
                                    (tThai && turnThai && tThai === turnThai)
                                  );
                                })
                              );

                              const firstSpeaker = convList[0]?.speaker || '';

                              return (
                                <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xs p-6 space-y-4 animate-fadeIn">
                                  <div className="flex items-start gap-4 border-b border-gray-100 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-purple-light text-brand-purple flex items-center justify-center shrink-0 border border-brand-purple/20">
                                      <Users className="w-6 h-6 text-brand-purple" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-sans text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded font-black uppercase">
                                        Section 4 • အပိုင်း ၄
                                      </span>
                                      <h3 className="text-lg md:text-xl font-sans font-black text-brand-dark tracking-tight">
                                        Dialogue & Conversations • စကားပြော <span className="text-brand-muted text-sm font-normal font-sans">(บทสนทนา)</span>
                                      </h3>
                                      <p className="text-xs text-brand-muted font-sans font-bold mt-1">
                                        Practice native conversational flow utilizing this chapter's key grammar points.
                                      </p>
                                    </div>
                                  </div>

                                  {convList.length > 0 ? (
                                    <div className="space-y-4 bg-gray-50/50 p-4 md:p-6 rounded-3xl border-2 border-gray-100">
                                      {convList.map((turn: any, ti: number) => {
                                        const thaiText = turn?.text_thai || turn?.textThai || turn?.thai || '';
                                        const phonetic = turn?.text_phonetic || turn?.textPhonetic || turn?.phonetic || '';
                                        const mmText = turn?.text_myanmar || turn?.textMyanmar || turn?.myanmar || '';
                                        const engText = turn?.text_english || turn?.textEnglish || turn?.english || '';
                                        const speakerName = turn?.speaker || (ti % 2 === 0 ? 'Somchai' : 'Mark');
                                        const isSpeaker1 = ti % 2 === 0 || (firstSpeaker && turn?.speaker === firstSpeaker) || speakerName.toLowerCase().includes('somchai') || speakerName.toLowerCase().includes('customer');

                                        return (
                                          <div
                                            key={ti}
                                            className={`flex items-start gap-3 ${isSpeaker1 ? 'justify-start' : 'justify-end'}`}
                                          >
                                            {isSpeaker1 && (
                                              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-sans font-black text-xs select-none shadow-xs shrink-0 mt-1">
                                                {speakerName.charAt(0)}
                                              </div>
                                            )}

                                            <div
                                              className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-xs relative border-2 ${
                                                isSpeaker1
                                                  ? 'bg-white border-gray-150 rounded-tl-none'
                                                  : 'bg-brand-purple-light border-brand-purple/20 rounded-tr-none'
                                              }`}
                                            >
                                              <div className="space-y-1.5 pr-8">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-[10px] font-sans font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                    {speakerName}
                                                  </span>
                                                  {phonetic && (
                                                    <span className="text-[10px] text-brand-purple font-extrabold italic bg-brand-purple-light px-2 py-0.5 rounded-full">
                                                      ({phonetic})
                                                    </span>
                                                  )}
                                                </div>

                                                <h5 className="font-sans font-black text-brand-dark text-base sm:text-lg leading-tight">
                                                  {thaiText}
                                                </h5>

                                                {engText && (
                                                  <div className="text-xs text-brand-muted font-sans font-medium">
                                                    {engText}
                                                  </div>
                                                )}

                                                {mmText && (
                                                  <div className="text-xs sm:text-sm text-brand-dark font-sans font-bold leading-normal pt-1 border-t border-dashed border-gray-200/60">
                                                    {mmText}
                                                  </div>
                                                )}
                                              </div>

                                              <button
                                                onClick={() => speakText(thaiText)}
                                                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-brand-purple shadow-xs cursor-pointer active:translate-y-0.5 transition-transform"
                                                title="Play Audio"
                                              >
                                                <Volume2 className="w-4 h-4" />
                                              </button>
                                            </div>

                                            {!isSpeaker1 && (
                                              <div className="w-9 h-9 rounded-2xl bg-brand-purple text-white flex items-center justify-center font-sans font-black text-xs select-none shadow-xs shrink-0 mt-1">
                                                {speakerName.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-150">
                                      <p className="text-xs font-sans font-bold text-brand-muted">
                                        No conversation data available for this section.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

            {/* TAB CONTENT: 3. Alphabet Guide */}
            {dashboardTab === 'alphabet' && (
              <div className="max-w-7xl mx-auto space-y-6 min-h-[500px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-sans font-black text-brand-dark text-base uppercase tracking-tight">
                      {t('navbar.alphabet_guide')}
                    </h3>
                  </div>
                </div>

                <AlphabetGuide speakText={speakText} />
              </div>
            )}

            {/* TAB CONTENT: 4. E-Book Audio Player */}
            {dashboardTab === 'ebooks' && (() => {
              const activeEbook = EBOOK_AUDIO_DATA.find(b => b.id === selectedAudioEbookId) || EBOOK_AUDIO_DATA[2];
              const activeTrack = activeEbook.tracks.find(t => t.id === selectedAudioTrackId) || activeEbook.tracks[0] || EBOOK_AUDIO_DATA[2].tracks[0];
              const trackPhrases = activeTrack.phrases || [];

              const filteredPhrases = (trackPhrases || []).filter(p => {
                if (!p) return false;
                const q = (audioPhraseSearch || '').trim().toLowerCase();
                if (!q) return true;
                const thai = (p.thai || '').toLowerCase();
                const phonetic = (p.phonetic || '').toLowerCase();
                const myanmar = (p.myanmar || '').toLowerCase();
                return (
                  thai.includes(q) ||
                  phonetic.includes(q) ||
                  myanmar.includes(q)
                );
              });

              const formatTime = (secs: number) => {
                const m = Math.floor(secs / 60);
                const s = Math.floor(secs % 60);
                return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
              };

              const prepareAudioPlayer = (track = activeTrack) => {
                if (!audioPlayerRef.current || audioPlayerRef.current.src !== track.audioUrl) {
                  audioPlayerRef.current?.destroy();
                  const player = createWebAudioPlayer(track.audioUrl);
                  player.playbackRate = audioPlayerSpeed;
                  player.ontimeupdate = () => setAudioPlayerCurrentTime(player.currentTime);
                  player.onloadedmetadata = () => setAudioPlayerDuration(player.duration || track.durationSec);
                  player.onended = () => setIsAudioPlayerPlaying(false);
                  player.onerror = () => setIsAudioPlayerPlaying(false);
                  audioPlayerRef.current = player;
                }
                return audioPlayerRef.current;
              };

              const playSelectedTrack = (track = activeTrack) => {
                const player = prepareAudioPlayer(track);
                void player.play().then(() => setIsAudioPlayerPlaying(true)).catch((error) => {
                  setIsAudioPlayerPlaying(false);
                  console.warn('Web Audio eBook playback failed.', error);
                });
              };

              return (
                <div className="max-w-7xl mx-auto space-y-6 min-h-[500px]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Book & Track Selection (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Select E-Book Card */}
                      <div className="bg-white rounded-3xl border-2 border-gray-100 p-5 space-y-4 shadow-xs">
                        <div className="border-b border-gray-100 pb-3">
                          <h3 className="font-sans font-black text-brand-purple text-xs uppercase tracking-wider">
                            SELECT E-BOOK • စာအုပ်ရွေးချယ်ရန်
                          </h3>
                        </div>

                        <div className="space-y-3">
                          {EBOOK_AUDIO_DATA.map((book) => {
                            const isSelected = book.id === activeEbook.id;
                            let iconBadge = null;

                            if (book.iconType === 'abcd') {
                              iconBadge = (
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white font-sans font-black text-xs flex items-center justify-center shrink-0 shadow-xs select-none">
                                  AB<br />CD
                                </div>
                              );
                            } else if (book.iconType === 'book') {
                              iconBadge = (
                                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs select-none">
                                  <BookOpen className="w-6 h-6 text-white" />
                                </div>
                              );
                            } else {
                              iconBadge = (
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs select-none">
                                  <Mail className="w-6 h-6 text-white" />
                                </div>
                              );
                            }

                            return (
                              <div
                                key={book.id}
                                onClick={() => {
                                  audioPlayerRef.current?.destroy();
                                  audioPlayerRef.current = null;
                                  setSelectedAudioEbookId(book.id);
                                  const firstTrack = book.tracks[0];
                                  if (firstTrack) {
                                    setSelectedAudioTrackId(firstTrack.id);
                                    setAudioPlayerDuration(firstTrack.durationSec);
                                    setAudioPlayerCurrentTime(0);
                                    setIsAudioPlayerPlaying(false);
                                  }
                                }}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                                  isSelected
                                    ? 'border-brand-purple bg-brand-purple-light/20 shadow-xs'
                                    : 'border-gray-150 bg-white hover:bg-gray-50'
                                }`}
                              >
                                {iconBadge}
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="font-sans font-black text-sm text-brand-dark leading-snug truncate">
                                    {book.title}
                                  </h4>
                                  <p className="text-xs font-sans font-bold text-brand-muted line-clamp-1">
                                    {book.subtitle}
                                  </p>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded bg-gray-100 text-brand-dark uppercase">
                                      {book.author}
                                    </span>
                                    <span className="text-[9px] font-sans font-extrabold px-2 py-0.5 rounded bg-brand-purple-light text-brand-purple uppercase">
                                      {book.trackCountLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Audio Track List Card */}
                      <div className="bg-white rounded-3xl border-2 border-gray-100 p-5 space-y-4 shadow-xs">
                        <div className="border-b border-gray-100 pb-3">
                          <h3 className="font-sans font-black text-brand-purple text-xs uppercase tracking-wider">
                            AUDIO TRACK LIST • အသံဖိုင်သင်ခန်းစာများ
                          </h3>
                        </div>

                        <div className="space-y-2.5">
                          {activeEbook.tracks.map((track) => {
                            const isSelected = track.id === activeTrack.id;

                            return (
                              <div
                                key={track.id}
                                onClick={() => {
                                  setSelectedAudioTrackId(track.id);
                                  setAudioPlayerDuration(track.durationSec);
                                  setAudioPlayerCurrentTime(0);
                                  playSelectedTrack(track);
                                }}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                  isSelected
                                    ? 'border-brand-purple bg-brand-purple-light/20 shadow-xs'
                                    : 'border-gray-150 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="font-sans font-black text-sm text-brand-purple shrink-0">
                                    {track.trackNumber}
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="font-sans font-black text-xs text-brand-dark truncate leading-tight">
                                      {track.title}
                                    </h5>
                                    <p className="text-[10.5px] font-sans font-bold text-brand-muted truncate mt-0.5">
                                      {track.subtitle}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[11px] font-mono font-bold text-brand-muted">
                                    {track.duration}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-brand-purple hover:bg-white cursor-pointer"
                                    title="Download Track"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Audio Player & Phrases (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Native Audio Player Card (Dark Navy) */}
                      <div className="bg-[#0b0f28] text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-xl border border-white/10 relative overflow-hidden select-none">
                        {/* Top Header Status Row */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="bg-purple-900/60 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5 text-purple-400" />
                            HIGH-QUALITY NATIVE PLAYER
                          </span>
                          <span className="text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Offline Ready
                          </span>
                        </div>

                        {/* Center Track Details Row */}
                        <div className="flex items-start gap-5 pt-2">
                          <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg text-white">
                            {activeEbook.iconType === 'abcd' ? (
                              <span className="font-sans font-black text-sm text-white">ABCD</span>
                            ) : activeEbook.iconType === 'book' ? (
                              <BookOpen className="w-10 h-10 text-white" />
                            ) : (
                              <Mail className="w-10 h-10 text-white" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-purple-400 font-mono font-bold text-[10px] uppercase tracking-wider block">
                              BOOK TRACK #{activeTrack.trackNumber}
                            </span>
                            <h3 className="text-base sm:text-lg md:text-xl font-sans font-black text-white tracking-tight uppercase leading-snug">
                              LESSON {activeTrack.trackNumber}: {activeTrack.title}
                            </h3>
                            <p className="text-xs text-slate-300 font-sans font-bold leading-tight">
                              {activeTrack.subtitle}
                            </p>
                            <div className="pt-1">
                              <span className="bg-slate-800/90 text-slate-300 px-3 py-0.5 rounded-full text-[10px] font-medium border border-slate-700/80 inline-block">
                                Narrator: {activeEbook.author}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Slider & Timers */}
                        <div className="space-y-2 pt-2">
                          <div className="relative flex items-center">
                            <input
                              type="range"
                              min={0}
                              max={audioPlayerDuration || 100}
                              value={audioPlayerCurrentTime}
                              onChange={(e) => {
                                const newTime = Number(e.target.value);
                                setAudioPlayerCurrentTime(newTime);
                                if (audioPlayerRef.current) {
                                  audioPlayerRef.current.currentTime = newTime;
                                }
                              }}
                              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none outline-none cursor-pointer accent-purple-500"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                            <span>{formatTime(audioPlayerCurrentTime)}</span>
                            <span>{formatTime(audioPlayerDuration)}</span>
                          </div>
                        </div>

                        {/* Center Player Controls */}
                        <div className="flex items-center justify-center gap-6 py-2">
                          <button
                            onClick={() => {
                              const newTime = Math.max(0, audioPlayerCurrentTime - 10);
                              setAudioPlayerCurrentTime(newTime);
                              if (audioPlayerRef.current) audioPlayerRef.current.currentTime = newTime;
                            }}
                            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Rewind 10s"
                          >
                            <SkipBack className="w-6 h-6" />
                          </button>

                          <button
                            onClick={() => {
                              if (isAudioPlayerPlaying && audioPlayerRef.current) {
                                audioPlayerRef.current.pause();
                                setIsAudioPlayerPlaying(false);
                              } else {
                                playSelectedTrack();
                              }
                            }}
                            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                            title={isAudioPlayerPlaying ? "Pause" : "Play"}
                          >
                            {isAudioPlayerPlaying ? (
                              <Pause className="w-7 h-7 text-black fill-black" />
                            ) : (
                              <Play className="w-7 h-7 text-black fill-black ml-1" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const newTime = Math.min(audioPlayerDuration, audioPlayerCurrentTime + 10);
                              setAudioPlayerCurrentTime(newTime);
                              if (audioPlayerRef.current) audioPlayerRef.current.currentTime = newTime;
                            }}
                            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Forward 10s"
                          >
                            <SkipForward className="w-6 h-6" />
                          </button>
                        </div>

                        {/* Speed Control Row at Bottom */}
                        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                          <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                            SPEED:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[0.8, 1, 1.25, 1.5].map((speed) => {
                              const isActive = audioPlayerSpeed === speed;
                              return (
                                <button
                                  key={speed}
                                  onClick={() => {
                                    setAudioPlayerSpeed(speed);
                                    if (audioPlayerRef.current) {
                                      audioPlayerRef.current.playbackRate = speed;
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-brand-purple text-white shadow-xs'
                                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  {speed}x
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Synchronized Transcript & Interactive Phrases Card */}
                      <div className="bg-white rounded-3xl border-2 border-gray-100 p-6 space-y-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                          <div>
                            <span className="text-[10px] font-sans font-black text-brand-purple uppercase tracking-wider block">
                              SYNCHRONIZED TRANSCRIPT • စကားပြောစာသားများ
                            </span>
                            <h4 className="text-base sm:text-lg font-sans font-black text-brand-dark flex items-center gap-2 tracking-tight mt-0.5">
                              📖 INTERACTIVE LESSON PHRASES ({filteredPhrases.length})
                            </h4>
                          </div>

                          <div className="relative shrink-0">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search phrases..."
                              value={audioPhraseSearch}
                              onChange={(e) => setAudioPhraseSearch(e.target.value)}
                              className="pl-9 pr-4 py-1.5 text-xs font-sans font-bold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none w-full sm:w-60 focus:border-brand-purple transition-all"
                            />
                          </div>
                        </div>

                        {/* Phrase List */}
                        <div className="space-y-3">
                          {filteredPhrases.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-gray-150">
                              <p className="text-xs font-sans font-bold text-brand-muted">
                                No interactive phrases found for this search.
                              </p>
                            </div>
                          ) : (
                            filteredPhrases.map((phrase) => (
                              <div
                                key={phrase.id}
                                className="p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="space-y-1">
                                  <h5 className="text-lg font-sans font-black text-brand-dark tracking-tight">
                                    {phrase.thai}
                                  </h5>
                                  <p className="text-xs font-sans font-bold text-brand-purple">
                                    {phrase.phonetic}
                                  </p>
                                  <p className="text-xs font-sans font-bold text-brand-muted">
                                    {phrase.myanmar}
                                  </p>
                                </div>

                                <button
                                  onClick={() => speakGlobalText(phrase.thai)}
                                  className="px-4 py-2 bg-brand-purple-light text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl font-sans font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all border border-brand-purple/20 cursor-pointer shrink-0 self-start sm:self-center"
                                >
                                  <Volume2 className="w-4 h-4" />
                                  <span>SPEAK</span>
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB CONTENT: 4. Notebook & Custom Vocabulary (Add Word Panel) */}
            {dashboardTab === 'notebook' && (
              <div className="max-w-7xl mx-auto space-y-6 min-h-[500px]">
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-sans font-black text-brand-dark text-base uppercase tracking-tight">
                      Vocabulary Notebook • ဝေါဟာရစုစည်းမှု
                    </h3>
                  </div>
                  {!isLoggedIn && (
                    <button
                      onClick={() => {
                        setAuthTab('user');
                        navigate('/sign-up');
                      }}
                      className="px-4 py-2.5 bg-brand-purple text-white rounded-xl border-b-4 border-brand-purple-shadow font-sans font-black text-xs uppercase tracking-wider flex items-center gap-1 shrink-0"
                    >
                      <User className="w-4 h-4" />
                      Sign In to Add Words
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Add Word Form Card */}
                  <div className="lg:col-span-1 bg-white p-5 rounded-2xl border-2 border-gray-100 h-fit space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                      <Plus className="w-5 h-5 text-brand-purple" />
                      <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide">
                        Add Custom Word • စကားလုံးအသစ်ထည့်မည်
                      </h4>
                    </div>

                    {!isLoggedIn ? (
                      <div className="p-3 bg-brand-purple-light/40 border border-brand-purple/20 text-brand-purple rounded-xl text-xs sm:text-sm leading-relaxed text-center font-bold font-sans">
                        ⚠️ Please sign in to unlock custom contributions!
                      </div>
                    ) : (
                      <>
                        {notebookError && (
                          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold leading-relaxed border border-red-100 flex items-center gap-2">
                            <span>⚠️ {notebookError}</span>
                          </div>
                        )}

                        {notebookSuccess && (
                          <div className="bg-green-50 text-brand-green p-3 rounded-xl text-xs font-black leading-relaxed border border-green-100 flex items-center gap-2">
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{notebookSuccess}</span>
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <p className="text-[10px] text-brand-purple font-semibold leading-normal font-sans bg-brand-purple-light/40 p-2.5 rounded-lg border border-brand-purple/10">
                            💡 <strong>Smart Filler Enabled:</strong> Fill only 1-2 fields (e.g. English or Thai) and submit! The app will automatically translate, structure, and create the card for you.
                          </p>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Thai Script (e.g. สวัสดี)
                            </label>
                            <input
                              type="text"
                              placeholder="พิมพ์ภาษาไทย"
                              value={newWordThai}
                              onChange={(e) => setNewWordThai(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Phonetic pronunciation (e.g. sà-wàt-dii)
                            </label>
                            <input
                              type="text"
                              placeholder="pronunciation guide"
                              value={newWordPhonetic}
                              onChange={(e) => setNewWordPhonetic(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              English Translation (e.g. Hello)
                            </label>
                            <input
                              type="text"
                              placeholder="English meaning"
                              value={newWordEnglish}
                              onChange={(e) => setNewWordEnglish(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Myanmar Translation (e.g. မင်္ဂလာပါ)
                            </label>
                            <input
                              type="text"
                              placeholder="မြန်မာဘာသာပြန်"
                              value={newWordMyanmar}
                              onChange={(e) => setNewWordMyanmar(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Myanmar Phonetic pronunciation (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="မြန်မာအသံထွက် ဥပမာ - မင်-ဂလာ-ပါ"
                              value={newWordMyanmarPhonetic}
                              onChange={(e) => setNewWordMyanmarPhonetic(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Part of Speech
                            </label>
                            <select
                              value={newWordPos}
                              onChange={(e) => setNewWordPos(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-black font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            >
                              <option value="Noun">Noun (နာမ်)</option>
                              <option value="Verb">Verb (ကြိယာ)</option>
                              <option value="Adjective">Adjective (နာမဝိသေသန)</option>
                              <option value="Adverb">Adverb (ကြိယာဝိသေသန)</option>
                              <option value="Phrase">Phrase (စကားစု)</option>
                              <option value="Pronoun">Pronoun (နာမ်စား)</option>
                              <option value="Conjunction">Conjunction (သမ္ဗန္ဓ)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1 text-brand-muted">
                              Notes / Usage Example (Optional)
                            </label>
                            <textarea
                              placeholder="Enter context clues or notes..."
                              value={newWordNotes}
                              onChange={(e) => setNewWordNotes(e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-xs font-semibold font-sans focus:border-brand-purple focus:outline-none transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1 text-brand-muted">
                              Audio Streaming URL Path (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com/audio.mp3"
                              value={newWordAudioUrl}
                              onChange={(e) => setNewWordAudioUrl(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors bg-white text-black"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1 text-brand-muted">
                              Google Drive PDF Path (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="https://drive.google.com/..."
                              value={newWordPdfDriveUrl}
                              onChange={(e) => setNewWordPdfDriveUrl(e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-bold font-sans focus:border-brand-purple focus:outline-none transition-colors bg-white text-black"
                            />
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const cleanThai = newWordThai.trim();
                              const cleanPhonetic = newWordPhonetic.trim();
                              const cleanEnglish = newWordEnglish.trim();
                              const cleanMyanmar = newWordMyanmar.trim();
                              const cleanMyanmarPhonetic = newWordMyanmarPhonetic.trim();
                              if (!cleanThai && !cleanPhonetic && !cleanEnglish && !cleanMyanmar) {
                                setNotebookError("Please enter at least one or two options in the form to generate words!");
                                return;
                              }
                              
                              const completedWord = autoFillWord(
                                cleanThai,
                                cleanPhonetic,
                                cleanEnglish,
                                cleanMyanmar,
                                newWordPos,
                                lessons,
                                cleanMyanmarPhonetic
                              );

                              if (customWords.some(w => w.thai === completedWord.thai && !w.isArchived)) {
                                setNotebookError(`"${completedWord.thai}" already exists in active list!`);
                                return;
                              }

                              const wordPayload = {
                                ...completedWord,
                                url: newWordAudioUrl.trim() || undefined,
                                pdf_drive_url: newWordPdfDriveUrl.trim() || undefined,
                                notes: newWordNotes.trim() || undefined,
                                author: currentUser || 'User',
                                isArchived: false
                              };

                               // Pipe straight via Fetch API to integrated D1 serverless routing functions
                               const fetchHeaders1 = {
                                  'Content-Type': 'application/json',
                                  'X-Static-Admin': 'true'
                                };
                                fetch('/api/d1-admin-deploy', {
                                  method: 'POST',
                                  headers: fetchHeaders1,
                                 body: JSON.stringify({
                                    thai_text: completedWord.thai,
                                    thai: completedWord.thai,
                                    phonetic: completedWord.phonetic,
                                    phoneticMm: completedWord.myanmarPhonetic || null,
                                    english_text: completedWord.english,
                                    english: completedWord.english,
                                    myanmar_text: completedWord.myanmar,
                                    myanmar: completedWord.myanmar,
                                  audio_url: newWordAudioUrl.trim() || null,
                                  pdf_drive_url: newWordPdfDriveUrl.trim() || null,
                                  pos: newWordPos,
                                  notes: newWordNotes.trim() || null
                                })
                              }).catch(err => console.error("D1 sync failed:", err));

                              const updated = [wordPayload, ...customWords];
                              setCustomWords(updated);
                              localStorage.setItem('thai_custom_words_v1', JSON.stringify(updated));
                              setNewWordThai('');
                              setNewWordPhonetic('');
                              setNewWordEnglish('');
                              setNewWordMyanmar('');
                              setNewWordMyanmarPhonetic('');
                              setNewWordAudioUrl('');
                              setNewWordPdfDriveUrl('');
                              setNewWordNotes('');
                              setNotebookError('');
                              setNotebookSuccess(`Successfully added "${completedWord.thai}"! (+5 XP gained)`);
                              saveProgress({
                                ...progress,
                                totalXp: progress.totalXp + 5
                              });
                              addSystemLog(currentUser || 'User', `Contributed new word "${completedWord.thai}" to Notebook`);
                              setTimeout(() => setNotebookSuccess(''), 4000);
                            }}
                            className="w-full duo-btn duo-btn-purple text-xs font-black py-3.5 flex items-center justify-center gap-2"
                          >
                            <CheckSquare className="w-4 h-4" />
                            SUBMIT WORD (+5 XP)
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Words List Card */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Active vs Archived segmented filter */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-150 select-none">
                      <button
                        onClick={() => setShowArchived(false)}
                        className={`py-2 text-center rounded-lg font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                          !showArchived
                            ? 'bg-white text-brand-purple border-b-2 border-brand-purple/30 shadow-xs'
                            : 'text-brand-muted hover:text-brand-dark'
                        }`}
                      >
                        📂 Active Words ({customWords.filter(w => !w.isArchived).length})
                      </button>
                      <button
                        onClick={() => setShowArchived(true)}
                        className={`py-2 text-center rounded-lg font-sans font-black text-[10px] sm:text-xs transition-all uppercase tracking-wider cursor-pointer ${
                          showArchived
                            ? 'bg-white text-brand-purple border-b-2 border-brand-purple/30 shadow-xs'
                            : 'text-brand-muted hover:text-brand-dark'
                        }`}
                      >
                        📦 Archived Words ({customWords.filter(w => w.isArchived).length})
                      </button>
                    </div>

                    {/* Sub card Search */}
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 flex items-center gap-2">
                      <Search className="w-4 h-4 text-brand-muted shrink-0" />
                      <input
                        type="text"
                        placeholder="Search custom notebook (Thai, Eng, Myanmar)..."
                        value={customWordSearch}
                        onChange={(e) => setCustomWordSearch(e.target.value)}
                        className="w-full text-xs font-semibold font-sans bg-transparent outline-none"
                      />
                    </div>

                    {/* custom words iterator */}
                    {(() => {
                      const filteredCustom = customWords.filter(item => {
                        const isCardArchived = !!item.isArchived;
                        if (isCardArchived !== showArchived) return false;

                        const query = customWordSearch.toLowerCase();
                        return (
                          item.thai.toLowerCase().includes(query) ||
                          item.phonetic.toLowerCase().includes(query) ||
                          item.english.toLowerCase().includes(query) ||
                          item.myanmar.toLowerCase().includes(query)
                        );
                      });

                      if (filteredCustom.length === 0) {
                        return (
                          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
                            <HelpCircle className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                            <h4 className="font-sans font-black text-brand-dark text-sm uppercase">No Custom Words Found</h4>
                            <p className="text-xs text-brand-muted font-sans font-semibold mt-1">Be the first to add a useful vocabulary word to the dictionary!</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredCustom.map((item, idx) => {
                            const isEdited = editingWordThai === item.thai;
                            const isMastered = progress.masteredWords.includes(item.thai);

                            return (
                              <div key={idx} className="bg-white border-2 border-gray-100 rounded-2xl p-4 sm:p-5 hover:border-brand-purple/40 hover:shadow-xs transition-all relative flex flex-col justify-between">
                                {isEdited ? (
                                  /* Edit Form Inside Card */
                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[9px] font-sans font-black text-brand-purple uppercase tracking-widest block mb-1">Editing: {item.thai}</span>
                                      <input
                                        type="text"
                                        placeholder="Phonetic translation"
                                        value={editWordPhonetic}
                                        onChange={(e) => setEditWordPhonetic(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-bold font-sans text-brand-dark"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="English translation"
                                        value={editWordEnglish}
                                        onChange={(e) => setEditWordEnglish(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-bold font-sans text-brand-dark"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Myanmar translation"
                                        value={editWordMyanmar}
                                        onChange={(e) => setEditWordMyanmar(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-bold font-sans text-brand-dark"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Myanmar phonetic"
                                        value={editWordMyanmarPhonetic}
                                        onChange={(e) => setEditWordMyanmarPhonetic(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-bold font-sans text-brand-dark"
                                      />
                                    </div>
                                    <div>
                                      <select
                                        value={editWordPos}
                                        onChange={(e) => setEditWordPos(e.target.value)}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-bold font-sans text-brand-dark"
                                      >
                                        <option value="Noun">Noun</option>
                                        <option value="Verb">Verb</option>
                                        <option value="Adjective">Adjective</option>
                                        <option value="Phrase">Phrase</option>
                                        <option value="Pronoun">Pronoun</option>
                                      </select>
                                    </div>
                                    <div>
                                      <textarea
                                        placeholder="Private notes..."
                                        value={editWordNotes}
                                        onChange={(e) => setEditWordNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded text-xs font-semibold font-sans text-brand-dark"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const updated = customWords.map(w => {
                                            if (w.thai === item.thai) {
                                              return {
                                                ...w,
                                                phonetic: editWordPhonetic,
                                                english: editWordEnglish,
                                                myanmar: editWordMyanmar,
                                                myanmarPhonetic: editWordMyanmarPhonetic.trim() || undefined,
                                                partOfSpeech: editWordPos,
                                                notes: editWordNotes.trim() || undefined
                                              };
                                            }
                                            return w;
                                          });
                                          setCustomWords(updated);
                                          localStorage.setItem('thai_custom_words_v1', JSON.stringify(updated));
                                          setEditingWordThai(null);
                                          addSystemLog(currentUser || 'User', `Edited word "${item.thai}"`);
                                        }}
                                        className="flex-1 py-1 px-2.5 bg-brand-green text-white text-[10px] font-sans font-black rounded hover:opacity-90 cursor-pointer"
                                      >
                                        SAVE
                                      </button>
                                      <button
                                        onClick={() => setEditingWordThai(null)}
                                        className="flex-1 py-1 px-2.5 bg-gray-500 text-white text-[10px] font-sans font-black rounded hover:opacity-90 cursor-pointer"
                                      >
                                        CANCEL
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Display layout */
                                  <>
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <span className="text-[9px] font-sans font-black text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded border border-brand-purple/10 uppercase tracking-widest leading-none">
                                          {item.partOfSpeech}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => handleToggleMasteredWord(item.thai)}
                                            className="p-1 text-amber-400 hover:text-amber-500 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                            title={isMastered ? "Unmark Mastered" : "Mark Mastered (+10 XP)"}
                                          >
                                            <Star className={`w-4 h-4 ${isMastered ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                          </button>
                                          <>
                                            <button
                                              onClick={() => {
                                                setEditingWordThai(item.thai);
                                                setEditWordPhonetic(item.phonetic);
                                                setEditWordEnglish(item.english);
                                                setEditWordMyanmar(item.myanmar);
                                                setEditWordMyanmarPhonetic(item.myanmarPhonetic || '');
                                                setEditWordPos(item.partOfSpeech);
                                                setEditWordNotes(item.notes || '');
                                              }}
                                              className="p-1 hover:bg-gray-150 rounded text-brand-muted hover:text-brand-dark cursor-pointer transition-colors"
                                              title="Edit Card"
                                            >
                                              <Pencil className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const updated = customWords.map(w => {
                                                  if (w.thai === item.thai) {
                                                    return { ...w, isArchived: !w.isArchived };
                                                  }
                                                  return w;
                                                });
                                                setCustomWords(updated);
                                                localStorage.setItem('thai_custom_words_v1', JSON.stringify(updated));
                                                addSystemLog(currentUser || 'User', item.isArchived ? `Restored word "${item.thai}" from Archive` : `Archived * ${item.thai}`);
                                              }}
                                              className={`p-1 rounded cursor-pointer transition-colors ${
                                                item.isArchived ? 'bg-brand-purple/10 text-brand-purple' : 'text-brand-muted hover:bg-gray-100 hover:text-brand-dark'
                                              }`}
                                              title={item.isArchived ? "Unarchive / Restore word" : "Archive word"}
                                            >
                                              <Archive className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                const updated = customWords.filter(w => w.thai !== item.thai);
                                                setCustomWords(updated);
                                                localStorage.setItem('thai_custom_words_v1', JSON.stringify(updated));
                                                addSystemLog(currentUser || 'User', `Removed word "${item.thai}" from Notebook`);
                                              }}
                                              className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600 cursor-pointer transition-colors"
                                              title="Delete Card"
                                            >
                                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                            </button>
                                          </>
                                        </div>
                                      </div>

                                      <p className="text-xl sm:text-2xl font-sans font-black text-brand-dark mt-2 tracking-tight select-all leading-none">
                                        {item.thai}
                                      </p>
                                      <div className="text-xs font-mono text-brand-muted mt-1.5 flex items-center gap-1.5 font-bold">
                                        <span>{item.phonetic}</span>
                                        <button
                                          onClick={() => speakText(item.thai)}
                                          className="p-1 bg-gray-50 hover:bg-gray-150 rounded-full text-brand-purple transition-all cursor-pointer"
                                          title="Listen native speak"
                                        >
                                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                        </button>
                                      </div>

                                      <div className="mt-3.5 text-xs font-semibold border-t border-gray-50 pt-3 space-y-1.5">
                                        <p className="text-brand-dark leading-tight">
                                          <span className="text-brand-muted text-[10px] font-sans mr-2 uppercase tracking-wide">English:</span>
                                          {item.english}
                                        </p>
                                        <p className="text-brand-purple italic leading-tight">
                                          <span className="text-brand-muted text-[10px] font-sans mr-2 uppercase tracking-wide">Myanmar:</span>
                                          {item.myanmar}
                                        </p>
                                        <p className="text-emerald-600 font-bold text-[10px] leading-tight">
                                          <span className="text-brand-muted text-[10px] font-sans mr-2 uppercase tracking-wide">အသံထွက်:</span>
                                          {item.myanmarPhonetic || getMyanmarPhonetic(item.phonetic)}
                                        </p>
                                      </div>

                                      {item.notes && (
                                        <div className="bg-gray-50/50 rounded-xl px-3 py-2 mt-3 border border-gray-100 text-[10px] font-semibold text-brand-dark/70 leading-relaxed">
                                          <span className="font-bold underline text-[9px] block mb-0.5 text-brand-muted uppercase">Usage context clue</span>
                                          {item.notes}
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-4 border-t border-brand-light pt-2 text-[8px] font-sans text-brand-muted font-bold tracking-wider uppercase flex items-center gap-1">
                                      👤 Saved by {item.author || "System"}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
 
            {/* TAB CONTENT: My Account / Student Profile Page */}
            {dashboardTab === 'profile' && (
              <div className="max-w-7xl mx-auto space-y-6 min-h-[500px] text-left">
                {/* 1. Account Identity & Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Profile Card */}
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-brand-purple/10 border-2 border-brand-purple flex items-center justify-center font-sans font-black text-2xl text-brand-purple shrink-0">
                          {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <h3 className="font-sans font-black text-brand-dark text-lg capitalize tracking-tight leading-tight">
                            {currentUser || 'Guest Student (ဧည့်သည်တော်)'}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                <Shield className="w-2.5 h-2.5" /> Staff Admin
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                                Student Scholar
                              </span>
                            )}
                            <span className="text-[10px] text-brand-muted font-bold font-sans">
                              Joined {isLoggedIn ? 'Recently' : 'Now'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 space-y-3 font-sans text-xs">
                        <div className="flex justify-between">
                          <span className="text-brand-muted font-semibold">Account Status:</span>
                          <span className="text-brand-dark font-black uppercase tracking-wider flex items-center gap-1">
                            {isLoggedIn ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-ping"></span>
                                Logged In (အကောင့်ဝင်ပြီး)
                              </>
                            ) : (
                              'Not Registered (ဧည့်သည်)'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-muted font-semibold">Total XP Reward:</span>
                          <span className="text-brand-purple font-black font-mono text-sm">{progress.totalXp} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-muted font-semibold">Current Title:</span>
                          <span className="text-brand-green font-extrabold uppercase">
                            Level {Math.floor(progress.totalXp / 1000) + 1} Thai Scholar
                          </span>
                        </div>

                        {isLoggedIn && (
                          <button
                            onClick={handleSignOut}
                            className="w-full mt-3 py-2.5 px-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border-2 border-rose-200 hover:border-rose-600 rounded-xl transition-all font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            id="btn-profile-logout"
                          >
                            <LogOut className="w-4 h-4 stroke-[2.5]" />
                            Log Out • အကောင့်ထွက်မည်
                          </button>
                        )}
                      </div>
                    </div>

                    {!isLoggedIn ? (
                      <div className="bg-brand-purple-light p-4 rounded-xl border border-brand-purple/20 space-y-3 text-left">
                        <p className="text-[11px] font-semibold text-brand-purple leading-normal">
                          ⚠️ You are viewing as a guest. Please sign up or log in to track your XP, earn dynamic certificates, and order study manuals securely!
                        </p>
                        <button
                          onClick={() => {
                            setAuthTab('student-signup');
                            navigate('/sign-up');
                          }}
                          className="w-full py-2 bg-brand-purple text-white text-[10px] font-black uppercase tracking-wider rounded-lg border-b-4 border-brand-purple-shadow hover:brightness-105 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" /> Complete Registration Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 text-left">
                          <span className="text-[9.5px] font-sans font-black text-brand-purple uppercase tracking-wider block">
                            Account Profile Details • အချက်အလက်များပြင်ဆင်ရန်
                          </span>
                          
                          <div className="space-y-2 text-[11px]">
                            <div>
                              <label className="block text-[9.5px] text-slate-500 font-bold mb-1">Full Name (အမည်):</label>
                              <input 
                                type="text"
                                value={checkoutName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCheckoutName(val);
                                  setRegisteredUsers(prev => {
                                    const updated = prev.map(u => (u?.username || '').toLowerCase() === (currentUser || '').toLowerCase() ? { ...u, fullName: val } : u);
                                    localStorage.setItem('thai_registered_users_list', JSON.stringify(updated));
                                    return updated;
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-lg font-semibold focus:outline-none focus:border-brand-purple text-xs text-slate-800"
                                placeholder="e.g. Nay Min"
                              />
                            </div>

                            <div>
                              <label className="block text-[9.5px] text-slate-500 font-bold mb-1">Phone Number (ဖုန်းနံပါတ်):</label>
                              <input 
                                type="text"
                                value={gatewayPhone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGatewayPhone(val);
                                  setRegisteredUsers(prev => {
                                    const updated = prev.map(u => (u?.username || '').toLowerCase() === (currentUser || '').toLowerCase() ? { ...u, phone: val } : u);
                                    localStorage.setItem('thai_registered_users_list', JSON.stringify(updated));
                                    return updated;
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-lg font-semibold focus:outline-none focus:border-brand-purple font-mono text-xs text-slate-800"
                                placeholder="e.g. 09791234567"
                              />
                            </div>

                            <div>
                              <label className="block text-[9.5px] text-slate-500 font-bold mb-1">Email (အီးမေးလ်):</label>
                              <input 
                                type="email"
                                value={gatewayEmail}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setGatewayEmail(val);
                                  setRegisteredUsers(prev => {
                                    const updated = prev.map(u => (u?.username || '').toLowerCase() === (currentUser || '').toLowerCase() ? { ...u, email: val } : u);
                                    localStorage.setItem('thai_registered_users_list', JSON.stringify(updated));
                                    return updated;
                                  });
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-150 rounded-lg font-semibold focus:outline-none focus:border-brand-purple text-xs text-slate-800"
                                placeholder="e.g. student@gmail.com"
                              />
                            </div>
                          </div>
                          
                          <div className="text-[8px] text-slate-400 font-bold leading-normal">
                            ✨ These profile details will automatically auto-fill your course checkout form.
                          </div>
                        </div>

                        <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-[10px] font-sans font-bold text-brand-muted leading-relaxed">
                          ✨ Local Session State has been synchronized. All orders and metrics are logged dynamically in local storage.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Columns: User Metrics Dashboard Display */}
                  <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                      <h4 className="font-sans font-black text-brand-dark text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-brand-purple shrink-0" />
                        My Progress • သင်ယူမှုမှတ်တမ်း
                      </h4>
                    </div>

                    {/* Metrics Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Lessons Passed */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/85 text-center">
                        <span className="text-[10px] font-sans text-brand-muted block uppercase font-black tracking-wider">Lessons Passed</span>
                        <span className="text-2xl font-sans font-black text-brand-dark min-h-8 flex items-center justify-center mt-0.5">
                          {progress.completedLessons.length} <span className="text-xs text-slate-400 font-bold ml-1">/ {lessons.length || 10}</span>
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className="bg-brand-purple h-full rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, lessons.length > 0 ? (progress.completedLessons.length / lessons.length) * 100 : (progress.completedLessons.length > 0 ? 100 : 0))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Saved / Mastered Vocabulary Words */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/85 text-center">
                        <span className="text-[10px] font-sans text-brand-muted block uppercase font-black tracking-wider">Saved Words</span>
                        <span className="text-2xl font-sans font-black text-brand-purple min-h-8 flex items-center justify-center mt-0.5">
                          {progress.masteredWords.length}
                        </span>
                        <span className="text-[9px] text-brand-muted block leading-none mt-1 font-bold">marked mastered</span>
                      </div>

                      {/* Total XP & Active Streak */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/85 text-center">
                        <span className="text-[10px] font-sans text-brand-muted block uppercase font-black tracking-wider">Total XP</span>
                        <span className="text-2xl font-sans font-black text-amber-500 min-h-8 flex items-center justify-center mt-0.5 gap-1">
                          ⚡ {progress.totalXp} <span className="text-[10px] text-brand-muted font-bold">XP</span>
                        </span>
                        <span className="text-[9px] text-amber-600 block leading-none mt-1 font-extrabold">🔥 {progress.streak} day streak</span>
                      </div>

                      {/* Current Level */}
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/85 text-center">
                        <span className="text-[10px] font-sans text-brand-muted block uppercase font-black tracking-wider">Current Level</span>
                        <span className="text-2xl font-sans font-black text-brand-green min-h-8 flex items-center justify-center mt-0.5">
                          LVL {Math.floor(progress.totalXp / 720) + 1}
                        </span>
                        <span className="text-[9px] text-brand-muted block leading-none mt-1 font-bold">
                          {720 - (progress.totalXp % 720)} XP to next
                        </span>
                      </div>
                    </div>

                    {/* Progress Achievements */}
                    <div className="space-y-3">
                      <h5 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1 text-left">
                        <Award className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                        🏆 Earned Accolades & Milestones (အောင်မြင်မှုဆုတံဆိပ်များ)
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${progress.completedLessons.length > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/40 border-gray-100 opacity-60'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${progress.completedLessons.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            🎬
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-[11px] font-sans font-black text-brand-dark truncate">First Breakthrough</h6>
                            <p className="text-[9px] text-brand-muted leading-tight font-bold">Completed 1+ lessons.</p>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${progress.masteredWords.length >= 5 ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/40 border-gray-100 opacity-60'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${progress.masteredWords.length >= 5 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            👑
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-[11px] font-sans font-black text-brand-dark truncate">Vocab Titan</h6>
                            <p className="text-[9px] text-brand-muted leading-tight font-bold">Mastered 5+ words.</p>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left ${progress.totalXp >= 1000 ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/40 border-gray-100 opacity-60'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${progress.totalXp >= 1000 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            🎖️
                          </div>
                          <div className="min-w-0">
                            <h6 className="text-[11px] font-sans font-black text-brand-dark truncate">Scholar Grade</h6>
                            <p className="text-[9px] text-brand-muted leading-tight font-bold">Earned 1000+ points.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Scores & Exam History Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5 text-left">
                          <CheckCircle className="w-3.5 h-3.5 text-brand-green shrink-0" />
                          📊 Lesson Exam Scores & Progress (သင်ခန်းစာအမှတ်များနှင့် ရမှတ်များ)
                        </h5>
                        <span className="text-[10px] font-sans font-extrabold text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded-full">
                          {progress.completedLessons.length} / {lessons.length || 0} Passed
                        </span>
                      </div>

                      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        {lessons && lessons.length > 0 ? (
                          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
                            {lessons.map((lesson) => {
                              const isPassed = progress.completedLessons.some((id: any) => String(id) === String(lesson.id));
                              const score = progress.quizHighScores[lesson.id];
                              const hasScore = score !== undefined && score !== null;

                              return (
                                <div key={lesson.id} className="p-3 sm:p-3.5 bg-white flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors text-left">
                                  <div className="min-w-0 flex-1 flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-sans font-black shrink-0 ${
                                      isPassed ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}>
                                      {lesson.id}
                                    </span>
                                    <div className="min-w-0">
                                      <h6 className="text-xs font-sans font-black text-slate-800 truncate">
                                        {lesson.titleEnglish || `Lesson ${lesson.id}`}
                                      </h6>
                                      <p className="text-[10px] font-sans text-emerald-600 font-bold truncate">
                                        {lesson.titleThai} {lesson.titleMyanmar ? `• ${lesson.titleMyanmar}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right min-w-[80px]">
                                      {hasScore ? (
                                        <span className={`text-xs font-mono font-black ${score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                          {score}%
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-sans text-slate-400 font-bold">
                                          {isPassed ? 'Passed ✓' : 'No exam yet'}
                                        </span>
                                      )}
                                      <span className="block text-[8.5px] font-sans uppercase font-extrabold mt-0.5" style={{ color: isPassed ? '#10b981' : (hasScore ? '#f59e0b' : '#94a3b8') }}>
                                        {isPassed ? 'Completed ✓' : (hasScore ? 'Attempted' : 'Not Started')}
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => {
                                        handleLessonClick(String(lesson.id));
                                        setDashboardTab('lessons');
                                      }}
                                      className="px-3 py-1.5 bg-brand-purple-light hover:bg-brand-purple text-brand-purple hover:text-white rounded-xl text-[10px] font-sans font-black transition-all cursor-pointer border border-brand-purple/20"
                                    >
                                      {isPassed ? 'Review' : 'Take Quiz'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-brand-muted">
                            <p className="text-xs font-sans font-bold">No lesson records available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.4. MY PURCHASED COURSES SECTION */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-emerald-500/20 shadow-sm space-y-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                        <BookOpen className="w-4 h-4 shrink-0 text-emerald-500" />
                        My Purchased Courses • ဝယ်ယူထားသော သင်တန်းများ
                      </h4>
                      <p className="text-[10px] font-sans font-semibold text-brand-muted mt-0.5 leading-relaxed">
                        Courses you have purchased and unlocked for lifetime access with Kru Jane.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                      {purchasedCourses.length} {purchasedCourses.length === 1 ? 'Course' : 'Courses'} Purchased
                    </span>
                  </div>

                  {isPurchasedCoursesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
                        </div>
                      ))}
                    </div>
                  ) : purchasedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {purchasedCourses.map((course) => (
                        <div
                          key={course.id || course.transaction_id}
                          className="bg-gradient-to-br from-emerald-50/40 via-white to-gray-50/50 hover:shadow-md transition-all duration-300 p-4 rounded-2xl border border-emerald-200/80 flex flex-col justify-between space-y-3 group relative"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800">
                                {course.duration || 'Lifetime Access'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ✓ Approved
                              </span>
                            </div>

                            <div>
                              <h5 className="font-sans font-black text-brand-dark text-sm leading-tight group-hover:text-emerald-600 transition-colors">
                                {course.name || course.title}
                              </h5>
                              {course.name_mm && (
                                <h6 className="font-sans font-bold text-xs text-emerald-700 leading-tight mt-0.5">
                                  {course.name_mm}
                                </h6>
                              )}
                            </div>

                            {course.description && (
                              <p className="text-[10px] text-brand-muted font-medium line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                            )}
                          </div>

                          <div className="border-t border-emerald-100/70 pt-2.5 flex items-center justify-between text-[9.5px]">
                            <span className="text-brand-muted font-bold">
                              Instructor: <strong className="text-slate-700">{course.instructor || 'Kru Jane'}</strong>
                            </span>
                            {course.purchased_at && (
                              <span className="text-slate-400 font-mono text-[9px]">
                                {new Date(course.purchased_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg">
                        🎓
                      </div>
                      <h5 className="text-xs font-sans font-black text-slate-700">
                        သင်တန်းများ ဝယ်ယူထားခြင်း မရှိသေးပါ။
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium max-w-sm mx-auto">
                        No courses purchased yet. Browse our premium Thai language courses below to start learning!
                      </p>
                    </div>
                  )}
                </div>

                {/* 1.5. PREMIUM LANGUAGE COURSES ACQUISITION HUB */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-brand-purple/15 shadow-sm space-y-5 text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-brand-purple"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-purple">
                        <Award className="w-4 h-4 shrink-0" />
                        🎓 Premium Thai-Myanmar Language Courses • အွန်လိုင်းတန်းခွဲများ
                      </h4>
                      <p className="text-[10px] font-sans font-semibold text-brand-muted mt-1 leading-relaxed">
                        Improve your fluency quickly! Purchase lifetime-access structured courses with Kru Jane. Secure payments processed instantly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCourseStoreExpanded(!isCourseStoreExpanded)}
                      className="px-3.5 py-1.5 border-2 border-brand-purple/30 bg-[#fbfaff] hover:bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      {isCourseStoreExpanded ? "HIDE CHANNELS • ဖျောက်ထားရန်" : "VIEW COURSE SILLYABUS • သင်တန်းများကြည့်ရန်"}
                    </button>
                  </div>

                  {isCourseStoreExpanded && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1 animate-fade-in">
                      {Array.isArray(courses) ? courses.map((course) => {
                        const calculatedThb = Math.round(course.priceAmount / 70); // Simulated approximate THB rate
                        return (
                          <div 
                            key={course.id} 
                            className="bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300 p-5 rounded-2xl border border-gray-200/90 flex flex-col justify-between space-y-5 relative group"
                          >
                            <div className="space-y-3">
                              {/* Header Card Badges */}
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase bg-brand-purple/10 text-brand-purple">
                                  {course.duration}
                                </span>
                                <span className="text-[10.5px] font-mono font-black text-brand-muted">
                                  ID: {course.id.toUpperCase()}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h5 className="font-sans font-black text-brand-dark text-[14px] leading-tight group-hover:text-brand-purple transition-colors">
                                  {course.name}
                                </h5>
                                <h6 className="font-sans font-extrabold text-[12px] text-brand-purple leading-tight">
                                  {course.nameMm}
                                </h6>
                              </div>

                              <div className="border-t border-gray-150 pt-2.5 text-[9.5px] text-brand-muted font-semibold space-y-1">
                                <div><span className="text-brand-dark font-extrabold">Instructor:</span> {course.instructor}</div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10.5px] text-brand-muted leading-relaxed">
                                  {course.description}
                                </p>
                                <p className="text-[10.5px] italic text-brand-dark/85 leading-relaxed font-semibold">
                                  {course.descriptionMm}
                                </p>
                              </div>

                              {/* Included bullet items */}
                              <div className="space-y-1.5 pt-1.5 border-t border-dashed border-gray-200">
                                <span className="text-[8.5px] font-black text-brand-dark uppercase tracking-wider block">Course Resources Included:</span>
                                <div className="space-y-1">
                                  {course.includes.map((inc, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-brand-dark font-semibold">
                                      <Check className="w-3 h-3 text-brand-green bg-brand-green/10 rounded-full p-0.5 shrink-0" />
                                      <span>{inc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Price and CTA */}
                            <div className="border-t border-gray-150 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="text-left">
                                <span className="text-[8px] font-mono text-brand-muted block uppercase font-extrabold leading-none mb-1">Tuition Fee</span>
                                <div className="space-y-0.5">
                                  <span className="text-sm sm:text-base font-black text-brand-purple font-mono block leading-none">
                                    {course.priceAmount.toLocaleString()} MMK
                                  </span>
                                  <span className="text-[10px] text-brand-muted font-mono font-bold block">
                                    ~ {calculatedThb.toLocaleString()} THB (PromptPay)
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  // Parse current student name if logged in
                                  setCheckoutName(currentUser || '');
                                  // Initialize simulated secure checkout terminal state
                                  setGatewayCourse(course);
                                  setGatewayPhone(progress.masteredWords.length > 0 ? "09-791112233" : "09-");
                                  setGatewayEmail(currentUser ? `${currentUser.toLowerCase()}@classroom.edu` : "student@classroom.edu");
                                  setGatewayStep(1);
                                  setGatewayPaymentMethod('kbzpay');
                                  setGatewayOtp('');
                                  setGatewayTimer(180);
                                  setIsGatewayOpen(true);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-purple/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-1"
                              >
                                🎓 Enroll • ဝယ်ယူမည်
                              </button>
                            </div>
                          </div>
                        );
                      }) : null}
                    </div>
                  )}

                  {!isCourseStoreExpanded && (
                    <div className="bg-brand-purple/[0.02] p-4 rounded-xl border border-dashed border-brand-purple/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left space-y-1">
                        <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-brand-purple text-white">PROMOTION VALUE</span>
                        <h6 className="text-[12px] font-sans font-black text-brand-dark">Special Interactive Structured Course Modules with Kru Jane</h6>
                        <p className="text-[10px] font-sans font-medium text-brand-muted leading-tight">Complete grammar lessons, native tone guidelines and digital worksheets with dynamic 1-click gateway checkouts.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCourseStoreExpanded(true)}
                        className="px-4 py-2 bg-brand-purple text-white border-b-4 border-brand-purple-shadow rounded-xl text-[10px] font-black uppercase tracking-wider hover:brightness-105 cursor-pointer transform transition-transform"
                      >
                        Enroll Course Now • သင်တန်းအပ်ရန်
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. PREMIUM RESOURCE STUDY STORE (WHERE USERS PURCHASE ORDERS) */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-left">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-purple">
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        Study Resources Store • အပိုဆောင်းလေ့လာရန်
                      </h4>
                    </div>
                  </div>

                  {/* Grid of Store Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storeItems.map((item) => {
                      return (
                        <div key={item.id} className="bg-gray-50/40 hover:bg-gray-50/80 p-4 rounded-xl border border-gray-200/90 flex flex-col justify-between space-y-4 transition-all relative">
                          {item.popular && (
                            <span className="absolute top-2.5 right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-brand-purple text-white">
                              POPULAR • အရောင်းရဆုံး
                            </span>
                          )}
                          <div className="space-y-2 text-left">
                            <div className="flex gap-1.5 text-xs font-sans font-black uppercase text-brand-purple text-left items-center">
                              <span>
                                {item.type === 'e-book' && '📕'}
                                {item.type === 'tutoring' && '🗣️'}
                                {item.type === 'certificate' && '🎖️'}
                                {item.type === 'vip-package' && '⭐'}
                              </span>
                              <span>{item.type}</span>
                            </div>
                            <h5 className="font-sans font-black text-brand-dark text-[13px] leading-snug">
                              {item.name}
                            </h5>
                            <p className="font-sans font-extrabold text-[12px] text-brand-purple/90 leading-tight">
                              {item.nameMm}
                            </p>
                            <p className="text-[10.5px] text-brand-muted leading-relaxed">
                              {item.description}
                            </p>
                            <p className="text-[10.5px] italic text-brand-dark/80 leading-relaxed font-semibold">
                              {item.descriptionMm}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-150 pt-3 flex-wrap gap-2 text-left">
                            <div>
                              <span className="text-[10px] font-mono text-brand-muted block leading-none font-bold">TOTAL VALUE PRICE</span>
                              <span className="text-base font-sans font-black text-brand-purple font-mono">
                                {item.price.toLocaleString()} {item.currency}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (!isLoggedIn) {
                                  alert("You must be registered and logged in as a student to purchase resources!");
                                  setAuthTab('student-signup');
                                  navigate('/sign-up');
                                  return;
                                }
                                if (item.currency === 'XP' && progress.totalXp < item.price) {
                                  alert(`Error: You need at least ${item.price} XP points to redeem this certificate! (You current have ${progress.totalXp} XP)`);
                                  return;
                                }
                                setSelectedStoreItem(item);
                                setCheckoutPhone('');
                                setCheckoutName(currentUser || '');
                                setCheckoutNetwork(item.currency === 'XP' ? 'XP' : 'KBZPay');
                              }}
                              className="px-4 py-2 bg-brand-purple text-white border-b-4 border-brand-purple-shadow rounded-lg text-[10px] font-black uppercase tracking-wider hover:brightness-105 cursor-pointer active:translate-y-0.5"
                            >
                              {item.currency === 'XP' ? 'Redeem with XP' : 'Purchase Order'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  {/* Inline Checkout Form Modal/Card */}
                  {selectedStoreItem && (
                    <div className="bg-amber-50/40 border-2 border-amber-200 p-5 rounded-2xl space-y-4 text-left" id="store-checkout-block">
                      <div className="flex items-start justify-between border-b border-amber-200 pb-2 text-left">
                        <div>
                          <h4 className="font-sans font-black text-brand-dark text-[13px] uppercase tracking-wide flex items-center gap-1 text-amber-800">
                            <CreditCard className="w-4 h-4 text-amber-600 shrink-0" /> Secure Order Checkout Terminal
                          </h4>
                          <p className="text-[10px] text-amber-700/80 font-semibold font-sans">
                            Complete details below to submit your study course order logic.
                          </p>
                        </div>
                        <button 
                          onClick={() => setSelectedStoreItem(null)} 
                          className="p-1 hover:bg-amber-100 text-amber-800 rounded-full cursor-pointer"
                          title="Cancel Checkout"
                        >
                          <X className="w-4 h-4 shrink-0" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="md:col-span-1 bg-white p-3 rounded-xl border border-amber-200 space-y-2 text-left">
                          <span className="text-[9px] font-black text-brand-purple uppercase tracking-wider block">Selected Package</span>
                          <h5 className="font-sans font-black text-brand-dark text-xs">{selectedStoreItem.name}</h5>
                          <p className="text-[11px] font-sans font-mono font-black text-brand-purple mt-1 text-base">
                            {selectedStoreItem.price.toLocaleString()} {selectedStoreItem.currency}
                          </p>
                          <div className="text-[10px] text-brand-muted leading-relaxed font-semibold">
                            Once confirmed, a "Pending Approval" state will appear in your Order Ledger. Logged administrators will instantly review the transaction.
                          </div>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const id = "ORD-" + Math.floor(10000 + Math.random() * 90000);
                          
                          // If payment currency is XP
                          if (selectedStoreItem.currency === 'XP') {
                            if (progress.totalXp < selectedStoreItem.price) {
                              alert("Insufficient XP balance!");
                              return;
                            }
                            // Deduct XP
                            const nextXp = progress.totalXp - selectedStoreItem.price;
                            saveProgress({ ...progress, totalXp: nextXp });
                          }

                          const newOrder: PurchaseOrder = {
                            id,
                            username: currentUser || 'Anonymous',
                            itemName: selectedStoreItem.name,
                            itemType: selectedStoreItem.type,
                            priceAmount: selectedStoreItem.price,
                            currency: selectedStoreItem.currency,
                            status: 'pending',
                            orderDate: new Date().toISOString().split('T')[0]
                          };

                          const nextOrders = [newOrder, ...orders];
                          setOrders(nextOrders);
                          addSystemLog(currentUser || 'User', `Ordered package "${selectedStoreItem.name}" (ID: ${id})`);
                          setSelectedStoreItem(null);
                          alert(`Your order ${id} has been submitted successfully!\nAdmin is checking the transaction details.`);
                        }} className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                              Student Name / Contact
                            </label>
                            <input
                              type="text"
                              required
                              value={checkoutName}
                              onChange={(e) => setCheckoutName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                              placeholder="e.g. ko_nay_min"
                            />
                          </div>

                          {selectedStoreItem.currency !== 'XP' ? (
                            <>
                              <div>
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                                  Mobile Wallet Phone Number (Myanmar)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={checkoutPhone}
                                  onChange={(e) => setCheckoutPhone(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-brand-dark focus:border-brand-purple focus:outline-none"
                                  placeholder="e.g. 09-987654321 / 09-791234567"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">
                                  Myanmar Mobile Payment System
                                </label>
                                <select
                                  value={checkoutNetwork}
                                  onChange={(e) => setCheckoutNetwork(e.target.value)}
                                  className="w-full px-2.5 py-2 bg-white border border-amber-200 rounded-lg text-[10px] font-black font-sans text-brand-purple focus:border-brand-purple focus:outline-none"
                                >
                                  <option value="KBZPay">KBZPay Wallet Merchant (09987654321)</option>
                                  <option value="WavePay">WavePay Mobile Wallet (09791234567)</option>
                                  <option value="CBPay">CBPay Fast App Transfer</option>
                                  <option value="AYAPay">AYA Pay Secure Pay</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <div className="sm:col-span-1 bg-amber-100/20 p-2.5 rounded-lg border border-amber-200 text-[10px] text-amber-800 font-bold leading-normal">
                              Redeeming with XP! This purchase will deduct {selectedStoreItem.price} XP directly from your registered progress balance!
                            </div>
                          )}

                          <div className="sm:col-span-2 flex justify-end pt-2">
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-brand-purple text-white border-b-4 border-brand-purple-shadow rounded-lg text-[10.5px] font-black uppercase tracking-wider hover:brightness-105 active:translate-y-0.5 cursor-pointer"
                            >
                              Submit Order Purchase • ဝယ်ယူမှုအတည်ပြုမည်
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                {/* 3. STUDENT LEDGER/ORDERS HISTORY PREVIEW */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                    <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-brand-purple shrink-0" />
                      📜 Personal Purchase Ledger & Order Compliance ({currentUser ? orders.filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase()).length : 0})
                    </h4>
                    {isLoggedIn && orders.filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase()).length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadOrdersAsJSON(orders.filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase()))}
                          className="px-2.5 py-1.5 bg-gray-50 text-brand-dark hover:bg-brand-purple/5 border border-gray-200 hover:border-brand-purple rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0"
                          title="Download my purchase history as structured JSON"
                        >
                          <Download className="w-3.5 h-3.5 text-brand-purple" />
                          Download JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadOrdersAsCSV(orders.filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase()))}
                          className="px-2.5 py-1.5 bg-gray-50 text-brand-dark hover:bg-brand-purple/5 border border-gray-200 hover:border-brand-purple rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0"
                          title="Download my purchase history as a CSV spreadsheet"
                        >
                          <Download className="w-3.5 h-3.5 text-[#00875a]" />
                          Download CSV
                        </button>
                      </div>
                    )}
                  </div>

                  {!isLoggedIn ? (
                    <div className="text-center py-6 text-xs text-brand-muted font-sans font-bold">
                      Please register an account above to track your transaction logs.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-left font-sans text-xs">
                        <thead className="bg-gray-50/70">
                          <tr className="border-b border-gray-100 text-brand-muted text-[10px] font-black uppercase tracking-wider">
                            <th className="py-2.5 px-3">ORDER ID</th>
                            <th className="py-2.5 px-3">ITEM DESCRIPTION</th>
                            <th className="py-2.5 px-3">DATE PLACED</th>
                            <th className="py-2.5 px-3">METHOD VALUE</th>
                            <th className="py-2.5 px-3 text-right">STATUS BADGE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {orders.filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase()).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-brand-muted font-bold">
                                No previous orders exist on your student account. Click "Purchase Order" above to purchase!
                              </td>
                            </tr>
                          ) : (
                            orders
                              .filter(o => (o?.username || '').toLowerCase() === (currentUser || '').toLowerCase())
                              .map((ord) => (
                                <tr 
                                  key={ord.id} 
                                  onClick={() => setSelectedDetailOrder(ord)}
                                  className="hover:bg-brand-purple/5 transition-all cursor-pointer group"
                                  title="Click to view order payment details & admin notes"
                                >
                                  <td className="py-3 px-3 font-mono font-black text-brand-purple group-hover:underline">{ord.id}</td>
                                  <td className="py-3 px-3 font-bold text-brand-dark text-[11px]">{ord.itemName}</td>
                                  <td className="py-3 px-3 text-brand-muted font-bold">{ord.orderDate}</td>
                                  <td className="py-3 px-3 font-mono font-black text-brand-dark">
                                    {ord.priceAmount.toLocaleString()} {ord.currency}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {ord.status === 'pending' ? (
                                        <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                          Pending Admin
                                        </span>
                                      ) : ord.status === 'completed' ? (
                                        <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase bg-green-50 text-green-700 border border-green-200">
                                          Approved / Sent
                                        </span>
                                      ) : (
                                        <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                                          Cancelled
                                        </span>
                                      )}
                                      <button className="px-2 py-0.5 text-[9px] font-bold text-brand-purple bg-brand-purple/10 rounded group-hover:bg-brand-purple group-hover:text-white transition-colors cursor-pointer">
                                        View
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. Admin Panel */}
            {dashboardTab === 'admin' && (
              <StaticAdminGuard>
                <div className="max-w-7xl mx-auto space-y-6 min-h-[500px]">
                <div className="bg-brand-dark text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-sans font-black text-xl sm:text-2xl mb-1 uppercase tracking-tight flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400 fill-amber-400/10 shrink-0" />
                      🛡️ Administrator Control Console
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300 font-sans font-semibold">
                      Control app announcements, review user logs, and audit student databases and custom wordlists.
                    </p>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-gray-200 h-fit self-start sm:self-auto font-black uppercase">
                    Status: Root Authorized
                  </div>
                </div>

                {/* COMBINED: Core Student Register & Purchase Ledger Hub */}
                <div id="student-commerce-ledger-hub" className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden text-left shadow-xs">
                  {/* TWO PRIMARY CATEGORY TABS */}
                  <div className="flex border-b border-gray-150 bg-slate-50 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminCategory('students');
                        setAdminHubTab('orders');
                      }}
                      className={`flex-1 py-4.5 text-center font-sans font-black text-xs sm:text-[13px] uppercase tracking-wider cursor-pointer transition-all border-b-4 flex items-center justify-center gap-2 ${
                        adminCategory === 'students'
                          ? 'border-brand-purple text-brand-purple bg-white font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                      }`}
                    >
                      <Users className="w-4 h-4 text-brand-purple" />
                      Students & Commerce (ကျောင်းသားရေးရာနှင့် အော်ဒါစီမံမှု)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminCategory('curriculum');
                        setAdminHubTab('cms');
                      }}
                      className={`flex-1 py-4.5 text-center font-sans font-black text-xs sm:text-[13px] uppercase tracking-wider cursor-pointer transition-all border-b-4 flex items-center justify-center gap-2 ${
                        adminCategory === 'curriculum'
                          ? 'border-brand-purple text-brand-purple bg-white font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-brand-purple" />
                      Curriculum & Data Entry (သင်ရိုးနှင့် ဒေတာအဝင်)
                    </button>
                  </div>

                  {/* Tab/Indicator Selector bar */}
                  <div className="bg-gradient-to-r from-brand-dark to-[#1d232a] text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
                    <div>
                      {adminCategory === 'students' ? (
                        <>
                          <h4 className="font-sans font-black text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-purple shrink-0" />
                            👥 Students & Commerce Hub • ကျောင်းသားရေးရာနှင့် အော်ဒါစီမံမှု
                          </h4>
                          <p className="text-[11px] text-gray-400 font-sans font-semibold mt-1">
                            Unified directory for student accounts management, progress level checks, and checkout transaction auditing.
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-sans font-black text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-brand-purple shrink-0" />
                            ✍️ Curriculum & Data Entry Hub • သင်ရိုးညွှန်းတမ်းနှင့် အချက်အလက်ထည့်သွင်းခြင်း
                          </h4>
                          <p className="text-[11px] text-gray-400 font-sans font-semibold mt-1">
                            Easily create and publish new courses, custom lesson structures, products in the Study Store, orientation, and handbook resources.
                          </p>
                        </>
                      )}
                    </div>

                    {/* Segmented controls button */}
                    <div className="bg-white/10 p-1.5 rounded-xl border border-white/10 flex flex-wrap items-center gap-1.5 w-full md:w-auto self-start md:self-auto select-none">
                      {adminCategory === 'students' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('orders')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'orders'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Purchase Orders ({orders.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('accounts')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'accounts'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            Student Directory ({registeredUsers.length})
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('cms')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'cms'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Database className="w-3.5 h-3.5" />
                            Content CMS
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('courses')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'courses'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Course Manager ({courses.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('lessons')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'lessons'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 text-yellow-300" />
                            ✍️ Lesson Entry ({lessons.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('store')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'store'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Study Store ({storeItems.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('orientation')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'orientation'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Orientation Articles ({orientationData.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('grammar')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'grammar'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Grammar Handbook ({grammarChapters.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminHubTab('brand')}
                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              adminHubTab === 'brand'
                                ? 'bg-brand-purple text-white shadow-sm shadow-brand-purple-shadow'
                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Palette className="w-3.5 h-3.5" />
                            Brand & Theme
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-6">
                    {/* SUB-SECTION 1: PURCHASE ORDERS */}
                    {adminHubTab === 'orders' && (
                      <div className="space-y-4 animate-fade-in text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                          <div>
                            <h5 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5">
                              📋 Student Purchase Orders Manager (ကျောင်းသားများ ဝယ်ယူမှုအော်ဒါများ)
                            </h5>
                            <p className="text-[10px] text-brand-muted font-sans font-semibold mt-1">
                              Review, audit, Approve or cancel client transactions submitted from study resource store checkout.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowCreateOrderModal(true)}
                              className="px-3 py-1.5 bg-brand-purple text-white hover:bg-brand-purple/90 rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-3xs"
                              title="Manually create a new student purchase order in D1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Order
                            </button>

                            <button
                              type="button"
                              onClick={fetchOrdersFromD1}
                              disabled={isSyncingD1Orders}
                              className="px-3 py-1.5 bg-white text-brand-dark hover:bg-brand-purple/5 border border-gray-200 hover:border-brand-purple rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-3xs"
                              title="Sync live student purchase orders from Cloudflare D1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-brand-purple ${isSyncingD1Orders ? 'animate-spin' : ''}`} />
                              {isSyncingD1Orders ? 'Syncing...' : 'Sync D1'}
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadOrdersAsJSON(orders, `all_student_orders_ledger_${new Date().toISOString().split('T')[0]}.json`)}
                              className="px-3 py-1.5 bg-white text-brand-dark hover:bg-brand-purple/5 border border-gray-200 hover:border-brand-purple rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-3xs"
                              title="Download all purchase orders as structured JSON"
                            >
                              <Download className="w-3.5 h-3.5 text-brand-purple" />
                              Export JSON
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadOrdersAsCSV(orders, `all_student_orders_ledger_${new Date().toISOString().split('T')[0]}.csv`)}
                              className="px-3 py-1.5 bg-white text-brand-dark hover:bg-brand-purple/5 border border-gray-200 hover:border-brand-purple rounded-xl text-[10px] sm:text-[10.5px] font-sans font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shrink-0 shadow-3xs"
                              title="Download all purchase orders as a CSV spreadsheet"
                            >
                              <Download className="w-3.5 h-3.5 text-[#00875a]" />
                              Export CSV
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm("Restore demo mock transactions?")) {
                                  const initialOrders: PurchaseOrder[] = [
                                    {
                                      id: "ORD-99321",
                                      username: "ko_nay_min",
                                      itemName: "🗣️ 1-on-1 Practice Speaking Session with Kru Jane (1 Hour Zoom)",
                                      itemType: "tutoring",
                                      priceAmount: 45000,
                                      currency: "MMK",
                                      status: "completed",
                                      orderDate: "2026-06-10",
                                      studentPhone: "09-771234567",
                                      studentEmail: "konaymin@gmail.com",
                                      adminNotes: "Session scheduled with Kru Jane. Zoom link dispatched to student mail/viber pipeline."
                                    },
                                    {
                                      id: "ORD-99322",
                                      username: "ma_khine",
                                      itemName: "📕 Advanced Thai-Myanmar Grammar Manual (Printed E-Book)",
                                      itemType: "e-book",
                                      priceAmount: 25000,
                                      currency: "MMK",
                                      status: "pending",
                                      orderDate: "2026-06-13",
                                      studentPhone: "09-445890123",
                                      studentEmail: "makhineoo@viber-me.com",
                                      evidenceImage: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='500' viewBox='0 0 300 500'><rect width='300' height='500' fill='%230056B3'/><rect x='15' y='15' width='270' height='470' rx='20' fill='white'/><circle cx='150' cy='80' r='30' fill='%2328A745'/><path d='M140 80 l7 7 l13 -13' fill='none' stroke='white' stroke-width='4'/><text x='150' y='135' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2328A745' text-anchor='middle'>KPay Verification</text><text x='150' y='160' font-family='sans-serif' font-size='22' font-weight='bold' fill='%23333333' text-anchor='middle'>- 25,000 MMK</text><line x1='30' y1='185' x2='270' y2='185' stroke='%23EEEEEE' stroke-width='2'/><text x='35' y='210' font-family='sans-serif' font-size='11' fill='%23777777'>Transaction ID</text><text x='265' y='210' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>TXN7784013920</text><text x='35' y='245' font-family='sans-serif' font-size='11' fill='%23777777'>Sender</text><text x='265' y='245' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>Ma Khine</text><text x='35' y='280' font-family='sans-serif' font-size='11' fill='%23777777'>Recipient</text><text x='265' y='280' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>Kru Jane Thai School</text><text x='35' y='315' font-family='sans-serif' font-size='11' fill='%23777777'>Date &amp; Time</text><text x='265' y='315' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23333333' text-anchor='end'>2026-06-13 14:15</text><line x1='30' y1='345' x2='270' y2='345' stroke='%23EEEEEE' stroke-width='2'/><rect x='30' y='370' width='240' height='70' rx='10' fill='%23F8F9FA'/><text x='150' y='398' font-family='sans-serif' font-size='11' font-weight='bold' fill='%23666666' text-anchor='middle'>Payment Channel: KBZPay Myanmar</text><text x='150' y='418' font-family='sans-serif' font-size='10' fill='%23999999' text-anchor='middle'>Reference: KBZ-PRINT-THAI</text></svg>"
                                    }
                                  ];
                                  setOrders(initialOrders);
                                  addSystemLog('admin', 'Seeded demo simulated purchase orders ledger');
                                }
                              }}
                              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] font-sans font-black text-brand-dark rounded-lg cursor-pointer flex items-center gap-1 hover:brightness-95 transition-all text-[10px]"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-0.5 text-brand-muted" />
                              SEED DEFAULT ORDERS
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-100 rounded-xl bg-gray-50/25">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-gray-50/75 border-b border-gray-100">
                              <tr className="text-brand-muted text-[9px] font-black uppercase tracking-wider">
                                <th className="py-2.5 px-3">ORDER ID</th>
                                <th className="py-2.5 px-3">USERNAME</th>
                                <th className="py-2.5 px-3">PACKAGE DESCRIPTION</th>
                                <th className="py-2.5 px-3">DATE PLACED</th>
                                <th className="py-2.5 px-3">METHOD TOTAL</th>
                                <th className="py-2.5 px-3">STATUS</th>
                                <th className="py-2.5 px-3 text-right">ADMIN ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-sans">
                              {orders.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-12 text-center text-brand-muted font-bold text-sm">
                                    No purchase orders currently submitted in system memory.
                                  </td>
                                </tr>
                              ) : (
                                orders.map((ord) => (
                                  <AdminTableRow 
                                    key={ord.id}
                                    order={ord}
                                    onViewDetails={setSelectedDetailOrder}
                                    onApprove={handleAdminApproveOrder}
                                    onReject={handleAdminRejectOrder}
                                    onDelete={handleDeleteOrder}
                                  />
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 2: REGISTERED ACCOUNTS */}
                    {adminHubTab === 'accounts' && (
                      <div className="space-y-6 animate-fade-in" id="admin-accounts-tab-view">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Create account form block */}
                          <div className="lg:col-span-5 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150 space-y-4">
                            <h5 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                              Create Student / Admin Account
                            </h5>
                            <p className="text-[10px] text-brand-muted font-sans font-semibold leading-relaxed">
                              Manually add pre-configured login credentials for custom testing or manual student profile onboarding.
                            </p>

                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              const cleanUser = adminNewUserUsername.trim();
                              const cleanPassword = adminNewUserPassword.trim();
                              if (!cleanUser) {
                                alert("Username/ID is required.");
                                return;
                              }
                              const alreadyHas = registeredUsers.some(u => (u?.username || '').toLowerCase() === cleanUser.toLowerCase());
                              if (alreadyHas) {
                                alert("This User ID already exists in users_profile!");
                                return;
                              }

                              // Optimistic UI update: instantly render new user in state
                              const newUserObj: RegisteredUser = {
                                username: cleanUser,
                                password: '— (Clerk Auth)',
                                role: adminNewUserRole === 'admin' ? 'admin' : 'student',
                                xp: 0,
                                dateJoined: new Date().toISOString().split('T')[0],
                                fullName: cleanUser,
                                phone: '',
                                email: `${cleanUser}@classroom.edu`
                              };
                              setRegisteredUsers(prev => [newUserObj, ...prev.filter(u => u.username !== cleanUser)]);

                              try {
                                const res = await fetch('/api/users/sync', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: cleanUser,
                                    full_name: cleanUser,
                                    email: `${cleanUser}@classroom.edu`,
                                    avatar_url: '',
                                    role: adminNewUserRole
                                  })
                                });
                                if (res.ok) {
                                  addSystemLog('admin', `Created new ${adminNewUserRole.toUpperCase()} profile for "${cleanUser}" in users_profile`);
                                  setAdminNewUserUsername('');
                                  setAdminNewUserPassword('');
                                  window.dispatchEvent(new CustomEvent('sirithai_user_synced'));
                                  await fetchD1Users();
                                } else {
                                  const errData: any = await res.json().catch(() => ({}));
                                  alert(`Failed to save account to D1: ${errData.error || 'Server Error'}`);
                                }
                              } catch(err: any) {
                                console.error("Failed to sync new user to D1 users_profile", err);
                              }
                            }} className="space-y-3 pt-1 text-left">
                              <div>
                                <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">User ID / Email Prefix</label>
                                <input
                                  type="text"
                                  placeholder="e.g. ko_phyo or user_123"
                                  value={adminNewUserUsername}
                                  onChange={(e) => setAdminNewUserUsername(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Password</label>
                                <input
                                  type="text"
                                  placeholder="Enter clean password"
                                  value={adminNewUserPassword}
                                  onChange={(e) => setAdminNewUserPassword(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider mb-1">Assigned Role</label>
                                <select
                                  value={adminNewUserRole}
                                  onChange={(e) => setAdminNewUserRole(e.target.value as 'student' | 'admin')}
                                  className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs font-black font-sans text-brand-purple focus:border-brand-purple focus:outline-none cursor-pointer"
                                >
                                  <option value="student">STUDENT (ကျောင်းသားရှုထောင့်)</option>
                                  <option value="admin">ADMIN CONTROL (စီမံသူရှုထောင့်)</option>
                                </select>
                              </div>
                              <button
                                type="submit"
                                className="w-full py-3 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl border-b-4 border-brand-purple-shadow text-[11px] font-sans font-black hover:brightness-105 active:translate-y-0.5 cursor-pointer uppercase tracking-wider transition-all pt-3 flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Profile To D1 users_profile
                              </button>
                            </form>
                          </div>

                          {/* List of registered users directory cards */}
                          <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between text-left">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h6 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  CURRENT REGISTER LIST ({registeredUsers.length} USERS)
                                </h6>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={forceSync}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9.5px] font-sans font-black uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                                    title="Manually trigger POST /api/users/sync with test payload"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    Force Sync Test
                                  </button>
                                  <button
                                    onClick={() => fetchD1Users()}
                                    disabled={isSyncingD1Users}
                                    className="text-[9.5px] font-sans font-black text-brand-purple hover:underline flex items-center gap-1 cursor-pointer select-none"
                                  >
                                    <RefreshCw className={`w-3 text-brand-purple ${isSyncingD1Users ? 'animate-spin' : ''}`} />
                                    {isSyncingD1Users ? 'SYNCING D1...' : 'REFRESH LIVE D1 USERS'}
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 bg-gray-50/30 p-2 border border-gray-100 rounded-xl">
                                {(() => {
                                  const users = Array.isArray(registeredUsers) ? registeredUsers : [];
                                  console.log("Component rendering. Users state:", users);

                                  if (isSyncingD1Users && users.length === 0) {
                                    return (
                                      <div className="p-8 text-center space-y-3">
                                        <RefreshCw className="w-6 h-6 text-brand-purple animate-spin mx-auto" />
                                        <p className="text-xs font-sans font-bold text-brand-muted">Fetching live user profiles from Cloudflare D1 database...</p>
                                      </div>
                                    );
                                  }

                                  if (d1UsersError) {
                                    return (
                                      <div className="p-8 text-center space-y-3 bg-red-50/50 rounded-xl border border-red-100 p-4">
                                        <p className="text-xs font-sans font-bold text-red-600">
                                          Error fetching data: {d1UsersError}
                                        </p>
                                        <button
                                          onClick={() => fetchD1Users()}
                                          className="px-4 py-2 bg-brand-purple text-white font-bold text-xs rounded-xl shadow-sm hover:bg-brand-purple-dark transition-all cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          Retry Fetching Users
                                        </button>
                                      </div>
                                    );
                                  }

                                  if (users.length === 0) {
                                    return (
                                      <div className="p-8 text-center space-y-3">
                                        <p className="text-xs text-brand-muted font-bold">
                                          No user profiles currently registered in D1 users_profile table.
                                        </p>
                                        <button
                                          onClick={() => fetchD1Users()}
                                          className="px-4 py-2 bg-brand-purple text-white font-bold text-xs rounded-xl shadow-sm hover:bg-brand-purple-dark transition-all cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          Refresh Database Rows
                                        </button>
                                      </div>
                                    );
                                  }

                                  return users.map((usr: any, i: number) => {
                                    const username = usr?.username || usr?.id || `user_${i}`;
                                    const fullName = usr?.fullName || usr?.full_name || usr?.username || usr?.id || 'Student';
                                    const role = usr?.role === 'admin' ? 'admin' : 'student';
                                    const rawDate = usr?.dateJoined || usr?.created_at;
                                    let dateJoined = 'N/A';
                                    if (rawDate) {
                                      try {
                                        dateJoined = String(rawDate).split(' ')[0].split('T')[0];
                                      } catch (e) {
                                        dateJoined = String(rawDate);
                                      }
                                    }
                                    const email = usr?.email || '';
                                    const phone = usr?.phone || '';
                                    const xp = Number(usr?.xp || 0);
                                    const avatarUrl = usr?.avatar_url || usr?.avatarUrl || '';
                                    const initials = (fullName || 'S').slice(0, 2).toUpperCase();

                                    return (
                                      <div key={username} className="bg-white p-3.5 rounded-xl border border-gray-110 flex items-center justify-between gap-3 shadow-3xs hover:border-brand-purple/30 transition-all text-left">
                                        <div className="flex items-start gap-3">
                                          {/* User Profile Avatar / Initial Badge */}
                                          {avatarUrl ? (
                                            <img src={avatarUrl} alt={fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 shadow-2xs bg-gray-100" loading="lazy" decoding="async" />
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-purple-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                              {initials}
                                            </div>
                                          )}

                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-sans font-black text-brand-dark text-xs">{fullName}</span>
                                              {role === 'admin' ? (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 select-none">
                                                  <Shield className="w-2 h-2" /> ADMIN
                                                </span>
                                              ) : (
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-green-50 text-green-700 border border-green-200 select-none">
                                                  STUDENT
                                                </span>
                                              )}
                                              {xp > 0 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-50 text-brand-purple border border-purple-200">
                                                  ⚡ {xp} XP
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-brand-muted font-sans space-y-0.5 font-semibold">
                                              <p>User ID: <code className="bg-gray-100 text-brand-dark px-1.5 py-0.5 rounded font-mono font-bold">{username}</code></p>
                                              {email && <p>Email: <span className="text-slate-700 font-medium">{email}</span></p>}
                                              {phone && <p>Phone: <span className="text-slate-700 font-mono font-bold">{phone}</span></p>}
                                              <p>Joined Date: <span className="text-gray-500 font-mono font-bold">{dateJoined}</span></p>
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          onClick={async () => {
                                            const confirmed = window.confirm(`Are you sure you want to delete profile "${username}" from D1 users_profile? This action is permanent.`);
                                            if (confirmed) {
                                              try {
                                                const res = await fetch('/api/admin/delete-user', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
                                                  body: JSON.stringify({ userId: username })
                                                });
                                                if (res.ok) {
                                                  addSystemLog('admin', `Deleted profile "${username}" from D1 users_profile`);
                                                  await fetchD1Users();
                                                } else {
                                                  alert("Failed to delete user profile from D1 server.");
                                                }
                                              } catch (err: any) {
                                                alert(`Error deleting user: ${err?.message}`);
                                              }
                                            }
                                          }}
                                          className="p-2.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-xl cursor-pointer transition-all border border-transparent hover:border-red-100 flex items-center justify-center shrink-0"
                                          title="Delete User Profile from D1"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 3: COURSE MANAGER */}
                    {adminHubTab === 'cms' && (
                      <div className="space-y-6">
                        <AdminDataEntryDashboard />
                        <AdminContentManager />
                      </div>
                    )}

                    {adminHubTab === 'courses' && (
                      <div className="space-y-6 animate-fade-in" id="admin-courses-tab-view">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                          {/* Course List Panel */}
                          <div className="lg:col-span-5 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 shrink-0 text-brand-purple" />
                                Course Catalog ({courses.length})
                              </h5>
                              <div className="relative">
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'course') {
                                      setCourseIsNew(true);
                                      setCourseNewIdStr('');
                                      setCourseFormName('');
                                      setCourseFormNameMm('');
                                      setCourseFormPrice(35000);
                                      setCourseFormDuration('6 Weeks (Self-paced)');
                                      setCourseFormDescription('');
                                      setCourseFormDescriptionMm('');
                                      setCourseFormInstructor('Kru Jane & Sayar Thura');
                                      
                                      setTimeout(() => {
                                        const el = document.getElementById("admin-course-form-panel");
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth' });
                                        }
                                      }, 50);
                                    } else if (val === 'resource') {
                                      if (courseIsNew) {
                                        setCourseIsNew(false);
                                        setAdminSelectedCourseId('course-basic');
                                      }
                                      setEditingResourceId(null);
                                      setResourceFormName('');
                                      setResourceFormNameMm('');
                                      setResourceFormUrl('');
                                      setResourceFormPrice(0);
                                      setResourceFormType('free');
                                      
                                      setTimeout(() => {
                                        const el = document.getElementById("admin-resource-form-section");
                                        if (el) {
                                          el.scrollIntoView({ behavior: 'smooth' });
                                          const input = el.querySelector('input');
                                          if (input) input.focus();
                                        }
                                      }, 150);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="px-2 py-1.5 bg-brand-purple hover:bg-brand-purple/95 text-white text-[9px] font-black uppercase rounded-lg hover:brightness-105 active:translate-y-0.5 cursor-pointer outline-none border-t-0 border-r-0 border-l-0 border-b-4 border-brand-purple-shadow shadow-3xs font-sans text-center"
                                  defaultValue=""
                                >
                                  <option value="" disabled className="bg-white text-slate-800 text-[10px] font-sans font-bold">➕ CREATE...</option>
                                  <option value="course" className="bg-white text-slate-800 text-[10px] font-sans font-semibold text-left">📚 Course</option>
                                  <option value="resource" className="bg-white text-[#583092] text-[10px] font-sans font-semibold text-left">📕 eBook Resource</option>
                                </select>
                              </div>
                            </div>

                            <p className="text-[10px] text-brand-muted font-sans font-semibold leading-relaxed">
                              Configure core premium language tracks that students can enroll in or purchase dynamically from their screens.
                            </p>

                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                              {Array.isArray(courses) ? courses.map((course) => {
                                const isSelected = !courseIsNew && adminSelectedCourseId === course.id;
                                return (
                                  <div
                                    key={course.id}
                                    onClick={() => {
                                      setCourseIsNew(false);
                                      setAdminSelectedCourseId(course.id);
                                      setCourseFormName(course.name);
                                      setCourseFormNameMm(course.nameMm);
                                      setCourseFormPrice(course.priceAmount);
                                      setCourseFormDuration(course.duration);
                                      setCourseFormDescription(course.description || '');
                                      setCourseFormDescriptionMm(course.descriptionMm || '');
                                      setCourseFormInstructor(course.instructor || '');
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-3xs ${
                                      isSelected
                                        ? 'bg-brand-purple/5 border-brand-purple'
                                        : 'bg-white border-gray-150 hover:border-gray-250'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <h6 className="font-sans font-black text-brand-dark text-[11px] leading-snug">
                                        {course.name}
                                      </h6>
                                      <p className="text-[9px] text-[#583092] font-semibold italic">
                                        {course.nameMm}
                                      </p>
                                      <div className="text-[9px] text-brand-muted font-sans font-bold flex flex-wrap gap-x-2">
                                        <span>⏱️ {course.duration}</span>
                                        <span>•</span>
                                        <span className="text-brand-purple font-mono">{course.priceAmount.toLocaleString()} MMK</span>
                                      </div>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (course.id === 'course-basic') {
                                            alert("The foundational Course (course-basic) is required for system routing and cannot be deleted.");
                                            return;
                                          }
                                          const confirmDel = window.confirm(`Permanently delete the course "${course.name}"? All lessons assigned to it will fallback to Basic Course.`);
                                          if (confirmDel) {
                                            const updated = courses.filter(c => c.id !== course.id);
                                            setCourses(updated);
                                            addSystemLog('admin', `Permanently deleted course "${course.name}"`);
                                            
                                            // Reassign lessons
                                            setLessons(prev => prev.map(l => l.courseId === course.id ? { ...l, courseId: 'course-basic' } : l));
                                            
                                            if (adminSelectedCourseId === course.id) {
                                              setAdminSelectedCourseId('course-basic');
                                              setCourseIsNew(false);
                                            }
                                            if (selectedCourseTab === course.id) {
                                              setSelectedCourseTab('course-basic');
                                            }
                                          }
                                        }}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-red-100"
                                        title="Delete Course"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }) : null}
                            </div>
                          </div>

                          {/* Course Form Editor Panel */}
                          <div id="admin-course-form-panel" className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border-2 border-gray-100 space-y-4 scroll-mt-20">
                            <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 text-brand-purple">
                              <Pencil className="w-4 h-4 text-brand-purple" />
                              {courseIsNew ? "Create New Language Course" : `Edit Course Details`}
                            </h5>
                            
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!courseFormName.trim() || !courseFormDuration.trim() || !courseFormInstructor.trim()) {
                                  alert("Please fill in all core course fields before publishing.");
                                  return;
                                }

                                if (courseIsNew) {
                                  const rawId = courseNewIdStr.trim();
                                  if (!rawId) {
                                    alert("Course ID is required.");
                                    return;
                                  }
                                  const cleanId = rawId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                                  if (!cleanId.startsWith("course-")) {
                                    alert("Highly recommended to prefix course IDs with 'course-' (e.g. course-fluent-thai).");
                                  }
                                  if (courses.some(c => c.id === cleanId)) {
                                    alert("This Course ID is already taken. Choose a unique keyword.");
                                    return;
                                  }

                                  const created: Course = {
                                    id: cleanId,
                                    name: courseFormName.trim(),
                                    nameMm: courseFormNameMm.trim() || courseFormName.trim(),
                                    priceAmount: Number(courseFormPrice) || 0,
                                    currency: 'MMK',
                                    duration: courseFormDuration.trim(),
                                    description: courseFormDescription.trim(),
                                    descriptionMm: courseFormDescriptionMm.trim(),
                                    instructor: courseFormInstructor.trim()
                                  };

                                  const updated = [...courses, created];
                                  setCourses(updated);
                                  setAdminSelectedCourseId(cleanId);
                                  setCourseIsNew(false);
                                  addSystemLog('admin', `Created a brand new Language Course: "${created.name}"`);
                                  alert("Course successfully published to students!");
                                } else {
                                  const updated = courses.map(c => {
                                    if (c.id === adminSelectedCourseId) {
                                      return {
                                        ...c,
                                        name: courseFormName.trim(),
                                        nameMm: courseFormNameMm.trim() || courseFormName.trim(),
                                        priceAmount: Number(courseFormPrice) || 0,
                                        duration: courseFormDuration.trim(),
                                        description: courseFormDescription.trim(),
                                        descriptionMm: courseFormDescriptionMm.trim(),
                                        instructor: courseFormInstructor.trim()
                                      };
                                    }
                                    return c;
                                  });
                                  setCourses(updated);
                                  addSystemLog('admin', `Updated details for Course: "${courseFormName}"`);
                                  alert("Changes synced successfully!");
                                }
                              }}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                            >
                              {courseIsNew && (
                                <div className="sm:col-span-2 space-y-1 text-left">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                    Course ID Key (Unique identifier - No spaces, lowercase only)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. course-advanced-grammar"
                                    value={courseNewIdStr}
                                    onChange={(e) => setCourseNewIdStr(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold font-sans text-brand-purple focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                    required
                                  />
                                </div>
                              )}

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Course Display Name (English)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Advanced Thai Writing Skills"
                                  value={courseFormName}
                                  onChange={(e) => setCourseFormName(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-[#583092] uppercase tracking-wider">
                                  အတန်းအမည် (မြန်မာအသံထွက် / စာသား)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. ထိုင်းစာ ရေးသားခြင်း လက်တွေ့အဆင့်မြင့်တန်း"
                                  value={courseFormNameMm}
                                  onChange={(e) => setCourseFormNameMm(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#fdfbfe] border border-[#f0ebf7] rounded-xl text-xs font-sans font-extrabold text-[#583092] focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Price Amount (MMK)
                                </label>
                                <input
                                  type="number"
                                  value={courseFormPrice}
                                  onChange={(e) => setCourseFormPrice(Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-black text-brand-purple focus:border-brand-purple focus:outline-none transition-all"
                                  min={0}
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Duration Period
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 6 Weeks (Self-paced)"
                                  value={courseFormDuration}
                                  onChange={(e) => setCourseFormDuration(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Active Instructor(s)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Kru Jane & Sayar Thura"
                                  value={courseFormInstructor}
                                  onChange={(e) => setCourseFormInstructor(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Syllabus Outline Description (English)
                                </label>
                                <textarea
                                  placeholder="Provide descriptive details of topic items coverage..."
                                  value={courseFormDescription}
                                  onChange={(e) => setCourseFormDescription(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1 text-left sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  သင်တန်း အတိုချုံး ဖော်ပြချက် (မြန်မာဘာသာ)
                                </label>
                                <textarea
                                  placeholder="ကျောင်းသားများ မြင်တွေ့ရမည့် မြန်မာဘာသာ အတန်းဖော်ပြချက်..."
                                  value={courseFormDescriptionMm}
                                  onChange={(e) => setCourseFormDescriptionMm(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="sm:col-span-2 pt-2 text-left">
                                <button
                                  type="submit"
                                  className="w-full py-3 bg-brand-purple hover:bg-brand-purple/95 text-white border-b-4 border-brand-purple-shadow text-[11px] font-sans font-black tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                                >
                                  <CheckSquare className="w-4 h-4 shrink-0" />
                                  {courseIsNew ? "Publish Language Course" : "Sync Course Details"}
                                </button>
                              </div>
                            </form>

                            {!courseIsNew && (() => {
                              const activeCourse = courses.find(c => c.id === adminSelectedCourseId);
                              return (
                                <div className="border-t border-gray-150 pt-5 mt-6 text-left space-y-4">
                                  <div className="p-4 bg-slate-50/70 border border-slate-200/85 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <h6 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📕 Course Companion eBooks & Resource Links ({activeCourse?.resources?.length || 0})</span>
                                      </h6>
                                      <span className="text-[8.5px] bg-brand-purple/10 text-brand-purple font-sans font-black px-2 py-0.5 rounded-lg uppercase">
                                        Course Material Panel
                                      </span>
                                    </div>

                                    <p className="text-[9.5px] text-brand-muted leading-relaxed font-sans font-semibold">
                                      Include high quality PDF workbooks, vocabulary handbooks, letters manuals, or worksheet links specifically for students studying <b>{courseFormName}</b>. Give students two options: download directly or purchase separate premium eBooks before unlocking!
                                    </p>

                                    {/* List current Resources */}
                                    <div className="space-y-2">
                                      {(!activeCourse?.resources || activeCourse.resources.length === 0) ? (
                                        <div className="text-center py-4 bg-white border border-gray-150/65 rounded-xl text-[10px] text-brand-muted font-bold font-sans">
                                          No companion eBooks configured yet for this course. Add one below!
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                                          {activeCourse.resources.map((res: any) => {
                                            return (
                                              <div key={res.id} className="bg-white border border-gray-150 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs text-[10.5px]">
                                                <div className="space-y-0.5">
                                                  <div className="font-sans font-black text-slate-800 leading-snug flex items-center gap-1.5 flex-wrap">
                                                    <span>📘 {res.name}</span>
                                                    <span className={`text-[8px] font-sans font-black px-1.5 py-0.2 rounded uppercase ${
                                                      res.priceAmount === 0 
                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                        : 'bg-amber-50 text-amber-700 border border-amber-150/20'
                                                    }`}>
                                                      {res.priceAmount === 0 ? "FREE DOWNLOAD" : `PREMIUM: ${res.priceAmount.toLocaleString()} MMK`}
                                                    </span>
                                                  </div>
                                                  {res.nameMm && <p className="text-[9.5px] text-[#583092] font-semibold italic">{res.nameMm}</p>}
                                                  <p className="text-[9px] text-[#0073e6] truncate font-mono max-w-[280px]" title={res.downloadUrl}>🔗 {res.downloadUrl}</p>
                                                </div>
                                                
                                                <div className="flex gap-1 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setEditingResourceId(res.id);
                                                      setResourceFormName(res.name);
                                                      setResourceFormNameMm(res.nameMm || '');
                                                      setResourceFormUrl(res.downloadUrl);
                                                      setResourceFormPrice(res.priceAmount);
                                                      setResourceFormType(res.priceAmount > 0 ? 'premium' : 'free');
                                                      setResourceVocabEntries(res.vocabEntries || []);
                                                      setResourceSentenceEntries(res.sentenceEntries || []);
                                                      setResourceDialogueEntries(res.dialogueEntries || []);
                                                      setResourceConversationEntries(res.conversationEntries || []);
                                                    }}
                                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg cursor-pointer transition-colors border-none"
                                                    title="Edit Resource"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const confirmDel = window.confirm(`Permanently remove eBook resource "${res.name}"?`);
                                                      if (confirmDel) {
                                                        const updatedCourses = courses.map(c => {
                                                          if (c.id === adminSelectedCourseId) {
                                                            return {
                                                              ...c,
                                                              resources: (c.resources || []).filter((r: any) => r.id !== res.id)
                                                            };
                                                          }
                                                          return c;
                                                        });
                                                        setCourses(updatedCourses);
                                                        addSystemLog('admin', `Removed resource eBook "${res.name}" from ${courseFormName}`);
                                                        if (editingResourceId === res.id) {
                                                          setEditingResourceId(null);
                                                          setResourceFormName('');
                                                          setResourceFormNameMm('');
                                                          setResourceFormUrl('');
                                                          setResourceFormPrice(0);
                                                          setResourceFormType('free');
                                                          setResourceVocabEntries([]);
                                                          setResourceSentenceEntries([]);
                                                          setResourceDialogueEntries([]);
                                                          setResourceConversationEntries([]);
                                                        }
                                                      }
                                                    }}
                                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg cursor-pointer transition-colors border-none font-sans font-black flex items-center justify-center"
                                                    title="Delete Resource"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Form card to add/edit eBook resource */}
                                    <div id="admin-resource-form-section" className="p-3 bg-white border border-gray-150 rounded-xl space-y-3 shadow-3xs scroll-mt-20">
                                      <span className="text-[9.5px] font-sans font-black text-brand-purple uppercase tracking-wider block">
                                        {editingResourceId ? "✏️ Edit eBook Resource Details" : "➕ Add eBook / Companion PDF Resource"}
                                      </span>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="space-y-0.5 text-left">
                                          <label className="text-[8.5px] font-sans font-black text-brand-dark uppercase tracking-wide">
                                            eBook Name (English)
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="e.g. Workbook Volume 1"
                                            value={resourceFormName}
                                            onChange={(e) => setResourceFormName(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                          />
                                        </div>

                                        <div className="space-y-0.5 text-left">
                                          <label className="text-[8.5px] font-sans font-black text-[#583092] uppercase tracking-wide">
                                            စာအုပ်အမည် (မြန်မာအသံထွက် / စာသား)
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="e.g. ထိုင်းစာ ရေးပုံရေးနည်း လေ့ကျင့်ခန်းစာအုပ်"
                                            value={resourceFormNameMm}
                                            onChange={(e) => setResourceFormNameMm(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-sans font-bold text-[#583092] focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                          />
                                        </div>

                                        <div className="sm:col-span-2 space-y-0.5 text-left">
                                          <label className="text-[8.5px] font-sans font-black text-brand-dark uppercase tracking-wide flex items-center gap-1">
                                            <span>🔗 eBook Download URL (Direct PDF Link or Google Drive Link)</span>
                                          </label>
                                          <input
                                            type="url"
                                            placeholder="e.g. https://drive.google.com/file/d/... or PDF download link"
                                            value={resourceFormUrl}
                                            onChange={(e) => setResourceFormUrl(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-mono text-brand-dark focus:border-brand-purple focus:outline-none transition-all placeholder-gray-300"
                                          />
                                        </div>

                                        <div className="space-y-0.5 text-left">
                                          <label className="text-[8.5px] font-sans font-black text-brand-dark uppercase tracking-wide">
                                            Access Model Option
                                          </label>
                                          <select
                                            value={resourceFormType}
                                            onChange={(e) => {
                                              const type = e.target.value as 'free' | 'premium';
                                              setResourceFormType(type);
                                              if (type === 'free') {
                                                setResourceFormPrice(0);
                                              } else if (resourceFormPrice === 0) {
                                                setResourceFormPrice(5000);
                                              }
                                            }}
                                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-sans font-bold text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          >
                                            <option value="free">🆓 Free Direct Download for Enrolled Students</option>
                                            <option value="premium">💳 Premium Purchase Required (paid resource)</option>
                                          </select>
                                        </div>

                                        <div className="space-y-0.5 text-left">
                                          <label className="text-[8.5px] font-sans font-black text-brand-dark uppercase tracking-wide">
                                            Purchase Price (MMK)
                                          </label>
                                          <input
                                            type="number"
                                            value={resourceFormPrice}
                                            onChange={(e) => setResourceFormPrice(Number(e.target.value))}
                                            disabled={resourceFormType === 'free'}
                                            className={`w-full px-2.5 py-1.5 border rounded-lg text-[11px] font-mono font-black focus:outline-none transition-all ${
                                              resourceFormType === 'free' 
                                                ? 'bg-slate-50 border-gray-150 text-slate-400 cursor-not-allowed' 
                                                : 'bg-white border-gray-200 text-brand-purple focus:border-brand-purple'
                                            }`}
                                            min={0}
                                          />
                                        </div>
                                      </div>

                                      {/* New interactive sub-sections for Vocab, Sentence, Dialogue, Conversation entries */}
                                      <div className="bg-slate-50 border border-gray-200/85 rounded-xl p-3.5 space-y-3.5 text-left">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-2 gap-2">
                                          <div>
                                            <span className="text-[10px] font-sans font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                                              📖 eBook Study Content Builder (သင်ယူရန်အချက်အလက်များ)
                                            </span>
                                            <p className="text-[8px] text-slate-500 font-medium">Add flashcards, dialogues and translation texts directly into the interactive reader.</p>
                                          </div>
                                          {/* Sub-tabs selection */}
                                          <div className="flex bg-slate-200 p-0.5 rounded-lg select-none shrink-0">
                                            {(['vocab', 'sentence', 'dialogue', 'conversation'] as const).map((tab) => {
                                              const counts = {
                                                vocab: resourceVocabEntries.length,
                                                sentence: resourceSentenceEntries.length,
                                                dialogue: resourceDialogueEntries.length,
                                                conversation: resourceConversationEntries.length
                                              };
                                              return (
                                                <button
                                                  key={tab}
                                                  type="button"
                                                  onClick={() => setResourceSubTab(tab)}
                                                  className={`px-2 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    resourceSubTab === tab
                                                      ? 'bg-white text-brand-purple shadow-3xs'
                                                      : 'text-slate-500 hover:text-slate-800'
                                                  }`}
                                                >
                                                  {tab === 'vocab' && `📝 Vocab (${counts.vocab})`}
                                                  {tab === 'sentence' && `💬 Sentence (${counts.sentence})`}
                                                  {tab === 'dialogue' && `👥 Dialogue (${counts.dialogue})`}
                                                  {tab === 'conversation' && `📖 Conv (${counts.conversation})`}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Dynamic Forms according to selected subtab */}
                                        {resourceSubTab === 'vocab' && (
                                          <div className="space-y-3 animate-fade-in">
                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Thai Word (စကားလုံး)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. สวัสดี"
                                                  value={vocabEntryWord}
                                                  onChange={(e) => setVocabEntryWord(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Pronunciation (အသံထွက်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. sa-wat-dee"
                                                  value={vocabEntryPron}
                                                  onChange={(e) => setVocabEntryPron(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Translation (ဘာသာပြန်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. မင်္ဂလာပါ"
                                                  value={vocabEntryTrans}
                                                  onChange={(e) => setVocabEntryTrans(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-[#5a3194]"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Meaning / Note (အဓိပ္ပာယ်/မှတ်စု)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. Standard greeting in Thai"
                                                  value={vocabEntryMeaning}
                                                  onChange={(e) => setVocabEntryMeaning(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!vocabEntryWord.trim() || !vocabEntryTrans.trim()) {
                                                  alert("Please fill Word and Translation");
                                                  return;
                                                }
                                                const newEntry = {
                                                  word: vocabEntryWord.trim(),
                                                  pronunciation: vocabEntryPron.trim(),
                                                  translation: vocabEntryTrans.trim(),
                                                  meaning: vocabEntryMeaning.trim()
                                                };
                                                setResourceVocabEntries([...resourceVocabEntries, newEntry]);
                                                setVocabEntryWord('');
                                                setVocabEntryPron('');
                                                setVocabEntryTrans('');
                                                setVocabEntryMeaning('');
                                              }}
                                              className="w-full py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-[8.5px] font-black uppercase tracking-wider rounded transition-colors border-none cursor-pointer"
                                            >
                                              ➕ Add Vocabulary Entry
                                            </button>

                                            {/* List current vocab entries in state */}
                                            {resourceVocabEntries.length > 0 && (
                                              <div className="max-h-[140px] overflow-y-auto border border-gray-150 rounded-lg divide-y bg-white text-[9px]">
                                                {resourceVocabEntries.map((item, idx) => (
                                                  <div key={idx} className="p-2 flex items-center justify-between gap-2">
                                                    <div>
                                                      <span className="font-bold text-[#3c3c3c]">{item.word}</span>{' '}
                                                      <span className="text-slate-400">({item.pronunciation})</span>{' '}
                                                      <span className="text-brand-purple font-bold">→ {item.translation}</span>{' '}
                                                      {item.meaning && <span className="text-slate-500 italic block mt-0.5">{item.meaning}</span>}
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => setResourceVocabEntries(resourceVocabEntries.filter((_, i) => i !== idx))}
                                                      className="text-red-500 hover:text-red-700 bg-none border-none p-1 cursor-pointer font-bold"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {resourceSubTab === 'sentence' && (
                                          <div className="space-y-3 animate-fade-in">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Thai Sentence (ဝါကျ)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. คุณสบายดีไหม"
                                                  value={sentenceEntryText}
                                                  onChange={(e) => setSentenceEntryText(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Transcription (အသံထွက်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. khun sa-baai dee mai"
                                                  value={sentenceEntryPron}
                                                  onChange={(e) => setSentenceEntryPron(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Translation (ဘာသာပြန်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. နေကောင်းလား"
                                                  value={sentenceEntryTrans}
                                                  onChange={(e) => setSentenceEntryTrans(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-[#5a3194]"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!sentenceEntryText.trim() || !sentenceEntryTrans.trim()) {
                                                  alert("Please fill Sentence and Translation");
                                                  return;
                                                }
                                                const newEntry = {
                                                  sentence: sentenceEntryText.trim(),
                                                  transcription: sentenceEntryPron.trim(),
                                                  translation: sentenceEntryTrans.trim()
                                                };
                                                setResourceSentenceEntries([...resourceSentenceEntries, newEntry]);
                                                setSentenceEntryText('');
                                                setSentenceEntryPron('');
                                                setSentenceEntryTrans('');
                                              }}
                                              className="w-full py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-[8.5px] font-black uppercase tracking-wider rounded transition-colors border-none cursor-pointer"
                                            >
                                              ➕ Add Sentence Entry
                                            </button>

                                            {/* List current sentence entries in state */}
                                            {resourceSentenceEntries.length > 0 && (
                                              <div className="max-h-[140px] overflow-y-auto border border-gray-150 rounded-lg divide-y bg-white text-[9px]">
                                                {resourceSentenceEntries.map((item, idx) => (
                                                  <div key={idx} className="p-2 flex items-center justify-between gap-2">
                                                    <div>
                                                      <span className="font-bold text-[#3c3c3c]">{item.sentence}</span>{' '}
                                                      <span className="text-slate-400">({item.transcription})</span>{' '}
                                                      <span className="text-brand-purple font-bold">→ {item.translation}</span>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => setResourceSentenceEntries(resourceSentenceEntries.filter((_, i) => i !== idx))}
                                                      className="text-red-500 hover:text-red-700 bg-none border-none p-1 cursor-pointer font-bold"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {resourceSubTab === 'dialogue' && (
                                          <div className="space-y-3 animate-fade-in">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Speaker Name (ပြောသူ)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. Jane, Thura"
                                                  value={dialogueEntrySpeaker}
                                                  onChange={(e) => setDialogueEntrySpeaker(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold"
                                                />
                                              </div>
                                              <div className="space-y-0.5 col-span-1">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Dialogue Text (Thai)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. ไปไหนมา"
                                                  value={dialogueEntryText}
                                                  onChange={(e) => setDialogueEntryText(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Transcription (အသံထွက်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. bpai nai maa"
                                                  value={dialogueEntryPron}
                                                  onChange={(e) => setDialogueEntryPron(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-medium"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Translation (ဘာသာပြန်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. ဘယ်သွားခဲ့လဲ"
                                                  value={dialogueEntryTrans}
                                                  onChange={(e) => setDialogueEntryTrans(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-[#5a3194]"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!dialogueEntrySpeaker.trim() || !dialogueEntryText.trim() || !dialogueEntryTrans.trim()) {
                                                  alert("Please fill Speaker, Dialogue text and Translation");
                                                  return;
                                                }
                                                const newEntry = {
                                                  speaker: dialogueEntrySpeaker.trim(),
                                                  text: dialogueEntryText.trim(),
                                                  transcription: dialogueEntryPron.trim(),
                                                  translation: dialogueEntryTrans.trim()
                                                };
                                                setResourceDialogueEntries([...resourceDialogueEntries, newEntry]);
                                                setDialogueEntrySpeaker('');
                                                setDialogueEntryText('');
                                                setDialogueEntryPron('');
                                                setDialogueEntryTrans('');
                                              }}
                                              className="w-full py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-[8.5px] font-black uppercase tracking-wider rounded transition-colors border-none cursor-pointer"
                                            >
                                              ➕ Add Dialogue Entry
                                            </button>

                                            {/* List current dialogue entries in state */}
                                            {resourceDialogueEntries.length > 0 && (
                                              <div className="max-h-[140px] overflow-y-auto border border-gray-150 rounded-lg divide-y bg-white text-[9px]">
                                                {resourceDialogueEntries.map((item, idx) => (
                                                  <div key={idx} className="p-2 flex items-center justify-between gap-2">
                                                    <div>
                                                      <span className="font-extrabold text-[#3c3c3c]">{item.speaker}:</span>{' '}
                                                      <span className="font-semibold text-slate-800">{item.text}</span>{' '}
                                                      <span className="text-slate-400">({item.transcription})</span>{' '}
                                                      <span className="text-brand-purple font-bold">→ {item.translation}</span>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => setResourceDialogueEntries(resourceDialogueEntries.filter((_, i) => i !== idx))}
                                                      className="text-red-500 hover:text-red-700 bg-none border-none p-1 cursor-pointer font-bold"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {resourceSubTab === 'conversation' && (
                                          <div className="space-y-3 animate-fade-in">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              <div className="space-y-0.5 col-span-1 sm:col-span-2">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Conversation Title / Topic (ခေါင်းစဉ်)</label>
                                                <input
                                                  type="text"
                                                  placeholder="e.g. Meeting New Friends (မိတ်ဆွေအသစ်များနှင့်မိတ်ဆက်ခြင်း)"
                                                  value={conversationEntryTitle}
                                                  onChange={(e) => setConversationEntryTitle(e.target.value)}
                                                  className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-[10px] font-bold"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Thai Paragraph Content (ထိုင်းစာသား)</label>
                                                <textarea
                                                  rows={2}
                                                  placeholder="e.g. วันนี้ยินดีที่ได้รู้จักครับ..."
                                                  value={conversationEntryContent}
                                                  onChange={(e) => setConversationEntryContent(e.target.value)}
                                                  className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold font-sans resize-none"
                                                />
                                              </div>
                                              <div className="space-y-0.5">
                                                <label className="text-[8px] font-sans font-black text-slate-600 uppercase">Transcription / Translation (အသံထွက် / ဘာသာပြန်)</label>
                                                <textarea
                                                  rows={2}
                                                  placeholder="e.g. တဖက်ကပြန်လည်မိတ်ဆက်ပြီး မင်္ဂလာရှိသော..."
                                                  value={conversationEntryTrans}
                                                  onChange={(e) => setConversationEntryTrans(e.target.value)}
                                                  className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold font-sans resize-none text-[#5a3194]"
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!conversationEntryTitle.trim() || !conversationEntryContent.trim() || !conversationEntryTrans.trim()) {
                                                  alert("Please fill Title, Thai content, and Translation");
                                                  return;
                                                }
                                                const newEntry = {
                                                  title: conversationEntryTitle.trim(),
                                                  content: conversationEntryContent.trim(),
                                                  transcription: conversationEntryPron.trim() || undefined,
                                                  translation: conversationEntryTrans.trim()
                                                };
                                                setResourceConversationEntries([...resourceConversationEntries, newEntry]);
                                                setConversationEntryTitle('');
                                                setConversationEntryContent('');
                                                setConversationEntryPron('');
                                                setConversationEntryTrans('');
                                              }}
                                              className="w-full py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-[8.5px] font-black uppercase tracking-wider rounded transition-colors border-none cursor-pointer"
                                            >
                                              ➕ Add Conversation Block
                                            </button>

                                            {/* List current conversation entries in state */}
                                            {resourceConversationEntries.length > 0 && (
                                              <div className="max-h-[140px] overflow-y-auto border border-gray-150 rounded-lg divide-y bg-white text-[9px]">
                                                {resourceConversationEntries.map((item, idx) => (
                                                  <div key={idx} className="p-2 flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                      <span className="font-extrabold text-brand-purple uppercase text-[8px]">Title: {item.title}</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => setResourceConversationEntries(resourceConversationEntries.filter((_, i) => i !== idx))}
                                                        className="text-red-500 hover:text-red-700 bg-none border-none p-0.5 cursor-pointer font-bold"
                                                      >
                                                        ✕
                                                      </button>
                                                    </div>
                                                    <div>
                                                      <p className="font-semibold text-slate-800">{item.content}</p>
                                                      <p className="text-[#5a3194] mt-0.5 font-sans font-semibold">→ {item.translation}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex gap-2 pt-1.5 border-t border-gray-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!resourceFormName.trim() || !resourceFormUrl.trim()) {
                                              alert("Please enter both the eBook Name and Resource Download URL.");
                                              return;
                                            }
                                            
                                            const resourceId = editingResourceId || `res-${Date.now()}`;
                                            const updatedRes = {
                                              id: resourceId,
                                              name: resourceFormName.trim(),
                                              nameMm: resourceFormNameMm.trim() || undefined,
                                              downloadUrl: resourceFormUrl.trim(),
                                              priceAmount: resourceFormType === 'free' ? 0 : (resourceFormPrice || 0),
                                              currency: 'MMK' as const,
                                              vocabEntries: resourceVocabEntries,
                                              sentenceEntries: resourceSentenceEntries,
                                              dialogueEntries: resourceDialogueEntries,
                                              conversationEntries: resourceConversationEntries,
                                            };

                                            const updatedCourses = courses.map(c => {
                                              if (c.id === adminSelectedCourseId) {
                                                const currentResources = c.resources || [];
                                                const resourcesExist = currentResources.some(r => r.id === resourceId);
                                                
                                                let nextResources;
                                                if (resourcesExist) {
                                                  nextResources = currentResources.map(r => r.id === resourceId ? updatedRes : r);
                                                } else {
                                                  nextResources = [...currentResources, updatedRes];
                                                }
                                                
                                                return {
                                                  ...c,
                                                  resources: nextResources
                                                };
                                              }
                                              return c;
                                            });

                                            setCourses(updatedCourses);
                                            addSystemLog('admin', `${editingResourceId ? "Updated" : "Added"} eBook resource "${updatedRes.name}" on course: "${courseFormName}"`);
                                            
                                            // Reset form
                                            setEditingResourceId(null);
                                            setResourceFormName('');
                                            setResourceFormNameMm('');
                                            setResourceFormUrl('');
                                            setResourceFormPrice(0);
                                            setResourceFormType('free');
                                            setResourceVocabEntries([]);
                                            setResourceSentenceEntries([]);
                                            setResourceDialogueEntries([]);
                                            setResourceConversationEntries([]);
                                            alert("eBook Resource synced successfully!");
                                          }}
                                          className="flex-1 py-1.5 bg-slate-900 border-none hover:bg-slate-800 text-white font-sans font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                        >
                                          {editingResourceId ? "💾 Save eBook Changes" : "💾 Add Resource eBook"}
                                        </button>

                                        {editingResourceId && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingResourceId(null);
                                              setResourceFormName('');
                                              setResourceFormNameMm('');
                                              setResourceFormUrl('');
                                              setResourceFormPrice(0);
                                              setResourceFormType('free');
                                              setResourceVocabEntries([]);
                                              setResourceSentenceEntries([]);
                                              setResourceDialogueEntries([]);
                                              setResourceConversationEntries([]);
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-sans font-black text-[10px] uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION: MANUAL LESSON ENTRY FORM (DIRECT D1 PUBLISHING) */}
                    {adminHubTab === 'lessons' && (
                      <div className="space-y-6 animate-fade-in text-left" id="admin-lessons-tab-view">
                        <div className="bg-gradient-to-r from-brand-purple via-indigo-900 to-purple-950 p-6 rounded-2xl border border-purple-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <span className="text-[9.5px] font-black uppercase tracking-widest text-purple-200 block">
                              CLOUDFLARE D1 DATABASE INGESTION ENGINE
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-yellow-300 tracking-tight flex items-center gap-2 mt-0.5">
                              ✍️ Manual Lesson Entry Form • သင်ခန်းစာအသစ်ထည့်သွင်းခြင်း
                            </h3>
                            <p className="text-xs text-purple-100 font-medium max-w-2xl mt-1">
                              Manually insert new syllabus lessons directly into the Cloudflare D1 database (<code className="text-yellow-200 font-mono">lessons</code> table). Published lessons become available instantly to all students.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                              D1 Table: lessons ({lessons.length})
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Form Entry Panel */}
                          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-4">
                            <h4 className="text-xs font-sans font-black text-slate-800 uppercase tracking-wider border-b pb-2 text-brand-purple flex items-center gap-2">
                              <Plus className="w-4 h-4 text-brand-purple" />
                              Lesson Ingestion Entry Form
                            </h4>

                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!adminLessonId.trim() || !adminLessonTitleThai.trim() || !adminLessonTitleMyanmar.trim()) {
                                  alert("Lesson ID/Number, Thai Title, and Myanmar Title are required.");
                                  return;
                                }

                                setIsPublishingLessonD1(true);

                                const cleanId = adminLessonId.trim().toLowerCase().replace(/\s+/g, '-');
                                const lessonPayload = {
                                  id: cleanId,
                                  lesson_id: cleanId,
                                  course_id: adminLessonCourseId,
                                  courseId: adminLessonCourseId,
                                  title_thai: adminLessonTitleThai.trim(),
                                  titleThai: adminLessonTitleThai.trim(),
                                  title_phonetic: adminLessonTitlePhonetic.trim(),
                                  titlePhonetic: adminLessonTitlePhonetic.trim(),
                                  title_english: adminLessonTitleEnglish.trim(),
                                  titleEnglish: adminLessonTitleEnglish.trim(),
                                  title_myanmar: adminLessonTitleMyanmar.trim(),
                                  titleMyanmar: adminLessonTitleMyanmar.trim(),
                                  description_english: adminLessonDescription.trim(),
                                  description_myanmar: adminLessonDescription.trim(),
                                  description: adminLessonDescription.trim()
                                };

                                try {
                                  let res = await sessionCachedFetch('/api/lessons', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
                                    body: JSON.stringify(lessonPayload)
                                  });

                                  if (!res.ok) {
                                    res = await sessionCachedFetch('/api/insert-lesson', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'X-Static-Admin': 'true' },
                                      body: JSON.stringify(lessonPayload)
                                    });
                                  }

                                  const newLessonObj: Lesson = {
                                    id: cleanId,
                                    courseId: adminLessonCourseId,
                                    titleThai: adminLessonTitleThai.trim(),
                                    titlePhonetic: adminLessonTitlePhonetic.trim(),
                                    titleEnglish: adminLessonTitleEnglish.trim(),
                                    titleMyanmar: adminLessonTitleMyanmar.trim(),
                                    description: adminLessonDescription.trim()
                                  };

                                  setLessons(prev => sortLessonsNaturally([newLessonObj, ...prev.filter(l => String(l.id) !== String(cleanId))]));
                                  addSystemLog('admin', `Published new lesson "${adminLessonTitleThai}" (${cleanId}) directly to Cloudflare D1.`);
                                  alert(`Success! Lesson "${adminLessonTitleThai}" (#${cleanId}) published directly to Cloudflare D1 database.`);

                                  setAdminLessonId('');
                                  setAdminLessonTitleThai('');
                                  setAdminLessonTitlePhonetic('');
                                  setAdminLessonTitleEnglish('');
                                  setAdminLessonTitleMyanmar('');
                                  setAdminLessonDescription('');
                                } catch (err: any) {
                                  console.error("D1 lesson publishing failed:", err);
                                  alert(`Error publishing lesson to Cloudflare D1: ${err?.message || err}`);
                                } finally {
                                  setIsPublishingLessonD1(false);
                                }
                              }}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                    Assigned Target Course
                                  </label>
                                  <select
                                    value={adminLessonCourseId}
                                    onChange={(e) => setAdminLessonCourseId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-purple focus:border-brand-purple focus:outline-none cursor-pointer"
                                  >
                                    {courses.map(c => (
                                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                    Lesson ID / Code (e.g. 41 or lesson-41)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. lesson-41 or 41"
                                    value={adminLessonId}
                                    onChange={(e) => setAdminLessonId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-brand-purple focus:outline-none"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                    Thai Title (ခေါင်းစဉ် ထိုင်းစာ)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. บทที่ 41: การพูดคุยทางธุรกิจ"
                                    value={adminLessonTitleThai}
                                    onChange={(e) => setAdminLessonTitleThai(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-brand-purple focus:outline-none"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                    Phonetic Pronunciation (အသံထွက်လမ်းညွှန်)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. bòt thîi 41: kaan phûut khuy"
                                    value={adminLessonTitlePhonetic}
                                    onChange={(e) => setAdminLessonTitlePhonetic(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:border-brand-purple focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                    English Title (အင်္ဂလိပ်ခေါင်းစဉ်)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Lesson 41: Business Dialogue & Terms"
                                    value={adminLessonTitleEnglish}
                                    onChange={(e) => setAdminLessonTitleEnglish(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-brand-purple focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-sans font-black text-[#583092] uppercase tracking-wider">
                                    Myanmar Title (မြန်မာခေါင်းစဉ်)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. သင်ခန်းစာ ၄၁: စီးပွားရေး စကားပြော"
                                    value={adminLessonTitleMyanmar}
                                    onChange={(e) => setAdminLessonTitleMyanmar(e.target.value)}
                                    className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-extrabold text-[#583092] focus:border-brand-purple focus:outline-none"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-sans font-black text-slate-700 uppercase tracking-wider">
                                  Lesson Description / Detailed Instructions
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder="Enter lesson description, objective, and translation guidelines..."
                                  value={adminLessonDescription}
                                  onChange={(e) => setAdminLessonDescription(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-brand-purple focus:outline-none"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isPublishingLessonD1}
                                className="w-full py-3.5 bg-gradient-to-r from-brand-purple to-purple-800 hover:brightness-105 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl border-b-4 border-purple-950 shadow-md cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2"
                              >
                                {isPublishingLessonD1 ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Publishing to Cloudflare D1 Database...
                                  </>
                                ) : (
                                  <>
                                    🚀 SAVE & PUBLISH LESSON TO D1 DATABASE
                                  </>
                                )}
                              </button>
                            </form>
                          </div>

                          {/* D1 Database Existing Lessons Table View */}
                          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-sans font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-brand-purple" />
                                D1 Lessons Directory ({lessons.length})
                              </h4>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                              {lessons.map((les) => (
                                <div key={les.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-purple bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                      #{les.id} • {les.courseId || 'course-basic'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm(`Permanently delete lesson #${les.id} (${les.titleThai}) from Cloudflare D1?`)) {
                                          try {
                                            const res = await sessionCachedFetch(`/api/lessons?id=${encodeURIComponent(les.id)}`, { method: 'DELETE' });
                                            if (res.ok) {
                                              setLessons(prev => prev.filter(l => String(l.id) !== String(les.id)));
                                              addSystemLog('admin', `Deleted lesson #${les.id} from Cloudflare D1.`);
                                            }
                                          } catch (err) {
                                            console.error("Failed to delete lesson:", err);
                                          }
                                        }
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50 border-none cursor-pointer"
                                      title="Delete Lesson from D1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-xs font-black text-slate-900">{les.titleThai}</p>
                                  {les.titleMyanmar && <p className="text-[10px] text-purple-900 font-bold">{les.titleMyanmar}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 4: STUDY STORE MANAGER */}
                    {adminHubTab === 'store' && (
                      <div className="space-y-6 animate-fade-in" id="admin-store-tab-view">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                          {/* Store Item List Panel */}
                          <div className="lg:col-span-5 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                <ShoppingBag className="w-4 h-4 shrink-0 text-brand-purple" />
                                Store Catalog ({storeItems.length})
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setStoreIsNew(true);
                                  setStoreNewIdStr('');
                                  setStoreFormName('');
                                  setStoreFormNameMm('');
                                  setStoreFormType('e-book');
                                  setStoreFormDescription('');
                                  setStoreFormDescriptionMm('');
                                  setStoreFormPrice(25000);
                                  setStoreFormCurrency('MMK');
                                  setStoreFormPopular(false);
                                  setStoreFormCourseId('');
                                  setStoreFormPdfFileName('');
                                  setStoreFormPdfDownloadUrl('');
                                }}
                                className="px-2.5 py-1 bg-brand-purple hover:bg-brand-purple/95 text-white text-[9px] font-black uppercase rounded-lg hover:brightness-105 active:translate-y-0.5 cursor-pointer flex items-center gap-1 shadow-3xs font-sans"
                              >
                                <Plus className="w-3 h-3" />
                                CREATE NEW
                              </button>
                            </div>

                            <p className="text-[10px] text-brand-muted font-sans font-semibold leading-relaxed">
                              Configure premium eBook resources, practice guides, zoom speak tutoring, or VIP system packages that students can purchase.
                            </p>

                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                              {storeItems.map((item) => {
                                const isSelected = !storeIsNew && adminSelectedStoreId === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => {
                                      setStoreIsNew(false);
                                      setAdminSelectedStoreId(item.id);
                                      setStoreFormName(item.name);
                                      setStoreFormNameMm(item.nameMm);
                                      setStoreFormType(item.type);
                                      setStoreFormDescription(item.description || '');
                                      setStoreFormDescriptionMm(item.descriptionMm || '');
                                      setStoreFormPrice(item.price);
                                      setStoreFormCurrency(item.currency);
                                      setStoreFormPopular(!!item.popular);
                                      setStoreFormCourseId(item.courseId || '');
                                      setStoreFormPdfFileName(item.pdfFileName || '');
                                      setStoreFormPdfDownloadUrl(item.pdfDownloadUrl || '');
                                    }}
                                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-3xs ${
                                      isSelected
                                        ? 'bg-brand-purple/5 border-brand-purple'
                                        : 'bg-white border-gray-150 hover:border-gray-250'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[13px]">
                                          {item.type === 'e-book' && '📕'}
                                          {item.type === 'tutoring' && '🗣️'}
                                          {item.type === 'certificate' && '🎖️'}
                                          {item.type === 'vip-package' && '⭐'}
                                        </span>
                                        <h6 className="font-sans font-black text-brand-dark text-[11px] leading-snug">
                                          {item.name}
                                        </h6>
                                      </div>
                                      <p className="text-[9px] text-[#583092] font-bold italic pl-4">
                                        {item.nameMm}
                                      </p>
                                      <div className="text-[9px] text-brand-muted font-sans font-bold flex flex-wrap gap-x-2 pl-4">
                                        <span className="uppercase text-amber-700 font-extrabold">{item.type}</span>
                                        <span>•</span>
                                        <span className="text-brand-purple font-mono">{item.price.toLocaleString()} {item.currency}</span>
                                        {item.popular && (
                                          <>
                                            <span>•</span>
                                            <span className="text-orange-600 font-extrabold">POPULAR</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const confirmDel = window.confirm(`Permanently delete the study product "${item.name}" from your catalog store?`);
                                          if (confirmDel) {
                                            const updated = storeItems.filter(s => s.id !== item.id);
                                            setStoreItems(updated);
                                            addSystemLog('admin', `Permanently deleted product/resource "${item.name}"`);
                                            
                                            if (adminSelectedStoreId === item.id) {
                                              if (updated.length > 0) {
                                                setAdminSelectedStoreId(updated[0].id);
                                              } else {
                                                setAdminSelectedStoreId('');
                                              }
                                              setStoreIsNew(false);
                                            }
                                          }
                                        }}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-red-100 placeholder-transparent"
                                        title="Delete Product"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Store Item Form Editor Panel */}
                          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border-2 border-gray-100 space-y-4">
                            <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 text-brand-purple font-sans">
                              <Pencil className="w-4 h-4 text-brand-purple" />
                              {storeIsNew ? "Upload & Create New eBook / Product" : `Edit Study Store product`}
                            </h5>
                            
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!storeFormName.trim() || !storeFormDescription.trim()) {
                                  alert("Please fill in name and description outline before publishing.");
                                  return;
                                }

                                if (storeIsNew) {
                                  const rawId = storeNewIdStr.trim();
                                  if (!rawId) {
                                    alert("Product ID is required.");
                                    return;
                                  }
                                  const cleanId = rawId.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
                                  if (storeItems.some(i => i.id === cleanId)) {
                                    alert(`Duplicate ID Error: "${cleanId}" is already taken.`);
                                    return;
                                  }
                                  
                                  const newItem: StoreItem = {
                                    id: cleanId,
                                    name: storeFormName.trim(),
                                    nameMm: storeFormNameMm.trim() || storeFormName.trim(),
                                    type: storeFormType,
                                    description: storeFormDescription.trim(),
                                    descriptionMm: storeFormDescriptionMm.trim(),
                                    price: storeFormPrice,
                                    currency: storeFormCurrency,
                                    popular: storeFormPopular,
                                    courseId: storeFormCourseId || undefined,
                                    pdfFileName: storeFormPdfFileName.trim() || undefined,
                                    pdfDownloadUrl: storeFormPdfDownloadUrl.trim() || undefined
                                  };

                                  const updated = [...storeItems, newItem];
                                  setStoreItems(updated);
                                  addSystemLog('admin', `Uploaded new eBook / Resource: "${newItem.name}" (${newItem.price} ${newItem.currency})`);
                                  
                                  setStoreIsNew(false);
                                  setAdminSelectedStoreId(cleanId);
                                  alert(`Successfully published resource item "${newItem.name}"!`);
                                } else {
                                  // Edit Mode
                                  const updated = storeItems.map(item => {
                                    if (item.id === adminSelectedStoreId) {
                                      return {
                                        ...item,
                                        name: storeFormName.trim(),
                                        nameMm: storeFormNameMm.trim() || storeFormName.trim(),
                                        type: storeFormType,
                                        description: storeFormDescription.trim(),
                                        descriptionMm: storeFormDescriptionMm.trim(),
                                        price: storeFormPrice,
                                        currency: storeFormCurrency,
                                        popular: storeFormPopular,
                                        courseId: storeFormCourseId || undefined,
                                        pdfFileName: storeFormPdfFileName.trim() || undefined,
                                        pdfDownloadUrl: storeFormPdfDownloadUrl.trim() || undefined
                                      };
                                    }
                                    return item;
                                  });
                                  setStoreItems(updated);
                                  addSystemLog('admin', `Synced updates for product "${storeFormName}"`);
                                  alert("Product information successfully updated!");
                                }
                              }}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            >
                              {storeIsNew && (
                                <div className="space-y-1 text-left sm:col-span-2">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                    Target Item URL/ID String (Must be unique, e.g. ebook-thai-advanced)
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. ebook-travel-myanmar"
                                    value={storeNewIdStr}
                                    onChange={(e) => setStoreNewIdStr(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    required
                                  />
                                </div>
                              )}

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Product Name (English / Romanized)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Everyday Thai Phrases E-Book v2"
                                  value={storeFormName}
                                  onChange={(e) => setStoreFormName(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  ကုန်ပစ္စည်းအမည် (မြန်မာဘာသာ)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. နေ့စဉ်သုံး ထိုင်းဝါကျများ အီးဘုခ်"
                                  value={storeFormNameMm}
                                  onChange={(e) => setStoreFormNameMm(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Resource Product Category
                                </label>
                                <select
                                  value={storeFormType}
                                  onChange={(e) => setStoreFormType(e.target.value as any)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                >
                                  <option value="e-book">📕 E-Book (Digital Manual)</option>
                                  <option value="tutoring">🗣️ Tutoring / Speaking Zoom Session</option>
                                  <option value="certificate">🎖️ Verified Certificate Token</option>
                                  <option value="vip-package">⭐ VIP System Premium Study Access</option>
                                </select>
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Price Amount &amp; Currency Value
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 15000"
                                    value={storeFormPrice}
                                    onChange={(e) => setStoreFormPrice(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    required
                                  />
                                  <select
                                    value={storeFormCurrency}
                                    onChange={(e) => setStoreFormCurrency(e.target.value as any)}
                                    className="px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  >
                                    <option value="MMK">MMK (Kyat)</option>
                                    <option value="XP">XP (Points)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Link to Language Course (Course Filter)
                                </label>
                                <select
                                  value={storeFormCourseId}
                                  onChange={(e) => setStoreFormCourseId(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                >
                                  <option value="">General / None (No Course Filter)</option>
                                  {Array.isArray(courses) ? courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                      📚 {course.name}
                                    </option>
                                  )) : null}
                                </select>
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  eBook PDF File Name for Auto-Generator
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Basic_Reading_Manual.pdf"
                                  value={storeFormPdfFileName}
                                  onChange={(e) => setStoreFormPdfFileName(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1">
                                  <span>🔗 eBook Download / Web Resource URL</span>
                                  <span className="text-[8px] bg-[#e1f5fe] text-[#0288d1] px-1 rounded font-bold uppercase select-none">Direct File / Remote Link</span>
                                </label>
                                <input
                                  type="url"
                                  placeholder="e.g. https://drive.google.com/file/d/..."
                                  value={storeFormPdfDownloadUrl}
                                  onChange={(e) => setStoreFormPdfDownloadUrl(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-2 text-left sm:col-span-2 py-1.5 px-3 bg-brand-purple/5 border border-brand-purple/10 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <span className="block text-[10px] font-sans font-black text-brand-purple uppercase tracking-wider leading-none">
                                    Feature as Best Seller / Popular?
                                  </span>
                                  <span className="block text-[9.5px] text-brand-muted font-sans font-semibold">
                                    Places an eye-catching orange 'POPULAR' flag on the student store card.
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={storeFormPopular}
                                  onChange={(e) => setStoreFormPopular(e.target.checked)}
                                  className="w-4 h-4 text-brand-purple rounded border-gray-300 focus:ring-brand-purple"
                                />
                              </div>

                              <div className="space-y-1 text-left sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  Product Description (English Outline info)
                                </label>
                                <textarea
                                  placeholder="Outline the content of this eBook resource (e.g. 120 vocabulary items with high-fidelity pronunciation guides)..."
                                  value={storeFormDescription}
                                  onChange={(e) => setStoreFormDescription(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                  required
                                />
                              </div>

                              <div className="space-y-1 text-left sm:col-span-2">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                  ကုန်ပစ္စည်း အသေးစိတ် ရှင်းလင်းချက် (မြန်မာဘာသာ)
                                </label>
                                <textarea
                                  placeholder="ကျောင်းသားများ မြင်တွေ့ရမည့် မြန်မာဘာသာ အီးဘုတ်အကြောင်းအရာ ရှင်းလင်းချက်..."
                                  value={storeFormDescriptionMm}
                                  onChange={(e) => setStoreFormDescriptionMm(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                />
                              </div>

                              <div className="sm:col-span-2 pt-2 text-left">
                                <button
                                  type="submit"
                                  className="w-full py-3 bg-brand-purple hover:bg-brand-purple/95 text-white border-b-4 border-brand-purple-shadow text-[11px] font-sans font-black tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs font-sans"
                                >
                                  <CheckSquare className="w-4 h-4 shrink-0" />
                                  {storeIsNew ? "Publish Product to Store" : "Sync Product Changes"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 5: DYNAMIC ORIENTATION BOOK CONTEXT MANAGER */}
                    {adminHubTab === 'orientation' && (
                      <div className="space-y-6 animate-fade-in text-left" id="admin-orientation-tab-view">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* Left Panel: Available Articles Switcher */}
                          <div className="lg:col-span-4 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150 space-y-4">
                            <h5 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="w-4 h-4 shrink-0 text-brand-purple" />
                              ORIENTATION MATERIALS ({orientationData.length})
                            </h5>
                            <p className="text-[10px] text-brand-muted font-sans font-semibold leading-relaxed">
                              Select a public Orientation Guide article to edit headings, custom sections, paragraphs, and language lookup highlights.
                            </p>
                            <div className="space-y-2">
                              {orientationData.map((article) => {
                                const isSelected = adminSelectedOrientId === article.id;
                                return (
                                  <button
                                    key={article.id}
                                    type="button"
                                    onClick={() => setAdminSelectedOrientId(article.id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-white border-brand-purple/50 shadow-xs'
                                        : 'bg-white/40 hover:bg-white border-gray-200'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-xs font-bold font-sans text-brand-dark flex items-center gap-1.5 font-sans">
                                        <span>📚 {article.titleEnglish}</span>
                                      </div>
                                      <div className="text-[10px] text-brand-muted font-sans font-medium mt-0.5">
                                        ID: {article.id} • {article.sections.length} Sections
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-brand-dark shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-brand-purple' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Panel: Selected Article Editor Form */}
                          <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-gray-150 space-y-6">
                            {!orientEditArticle ? (
                              <p className="text-xs text-brand-muted py-8 text-center font-semibold">
                                Select an article from the left side panel to edit its details.
                              </p>
                            ) : (
                              <div className="space-y-6 col-span-1">
                                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                                  <div>
                                    <h4 className="font-sans font-black text-sm uppercase text-brand-dark">
                                      📝 Edit: {orientEditArticle.titleEnglish}
                                    </h4>
                                    <span className="text-[10px] text-brand-muted font-bold font-mono">
                                      Database ID: {orientEditArticle.id}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleSaveOrientation}
                                    className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/95 text-white text-[10.5px] font-sans font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer hover:brightness-105 transition-all font-sans"
                                  >
                                    💾 Save Article changes
                                  </button>
                                </div>

                                {/* Article Global Titles */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Article Main Title (English)
                                    </label>
                                    <input
                                      type="text"
                                      value={orientEditArticle.titleEnglish || ''}
                                      onChange={(e) => updateOrientField('titleEnglish', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      ဆောင်းပါးခေါင်းစဉ် (မြန်မာဘာသာ)
                                    </label>
                                    <input
                                      type="text"
                                      value={orientEditArticle.titleMyanmar || ''}
                                      onChange={(e) => updateOrientField('titleMyanmar', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Section Accompanying Rules */}
                                <div className="space-y-4 pt-3 text-left">
                                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                    <h5 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Article Content Sections ({orientEditArticle.sections.length})
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={addOrientSection}
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-sans font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer font-sans"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      ADD SECTION
                                    </button>
                                  </div>

                                  {orientEditArticle.sections.map((section, sIdx) => (
                                    <div key={sIdx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 text-left space-y-4 relative">
                                      <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => deleteOrientSection(sIdx)}
                                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                                          title="Delete entire section"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="pr-12 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                        <div className="space-y-1">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            Section Heading {sIdx + 1} (English)
                                          </label>
                                          <input
                                            type="text"
                                            value={section.headingEnglish}
                                            onChange={(e) => updateOrientSectionHeading(sIdx, e.target.value, section.headingMyanmar)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            ခေါင်းစဉ်ငယ် {sIdx + 1} (မြန်မာဘာသာ)
                                          </label>
                                          <input
                                            type="text"
                                            value={section.headingMyanmar}
                                            onChange={(e) => updateOrientSectionHeading(sIdx, section.headingEnglish, e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>
                                      </div>

                                      {/* Paras section code */}
                                      <div className="space-y-2 border-t border-gray-150/60 pt-3 text-left">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9.5px] font-sans font-black text-brand-purple uppercase tracking-wider">
                                            Paragraph Blocks ({section.paragraphs.length})
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => addOrientParagraph(sIdx)}
                                            className="px-2 py-0.5 bg-white hover:bg-gray-50 text-brand-purple hover:text-brand-purple border border-brand-purple/20 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer"
                                          >
                                            + Add paragraph
                                          </button>
                                        </div>

                                        {section.paragraphs.map((para, pIdx) => (
                                          <div key={pIdx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 relative pr-10 text-left">
                                            <button
                                              type="button"
                                              onClick={() => deleteOrientParagraph(sIdx, pIdx)}
                                              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 cursor-pointer"
                                              title="Remove Paragraph block"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                                              <textarea
                                                rows={2}
                                                placeholder="English Paragraph Text..."
                                                value={para.en}
                                                onChange={(e) => updateOrientParagraph(sIdx, pIdx, 'en', e.target.value)}
                                                className="w-full p-2 border border-gray-150 rounded text-[11px] font-medium font-sans text-brand-dark focus:outline-none focus:border-brand-purple"
                                              />
                                              <textarea
                                                rows={2}
                                                placeholder="မြန်မာဘာသာပြန် စာစု..."
                                                value={para.mm}
                                                onChange={(e) => updateOrientParagraph(sIdx, pIdx, 'mm', e.target.value)}
                                                className="w-full p-2 border border-gray-150 rounded text-[11.5px] font-semibold font-sans text-brand-dark focus:outline-none focus:border-brand-purple"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Vocabulary highlights in that section */}
                                      <div className="space-y-2 border-t border-gray-150/60 pt-3 text-left">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9.5px] font-sans font-black text-[#0288d1] uppercase tracking-wider">
                                            Vocabulary Highlights &amp; Lookup Terms ({section.highlights ? section.highlights.length : 0})
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => addOrientHighlight(sIdx)}
                                            className="px-2 py-0.5 bg-white hover:bg-gray-50 text-[#0288d1] border border-[#0288d1]/20 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer font-sans"
                                          >
                                            + Add word highlight
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-left">
                                          {(section.highlights || []).map((hl, hIdx) => (
                                            <div key={hIdx} className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-2 items-center relative pr-10 text-left">
                                              <button
                                                type="button"
                                                onClick={() => deleteOrientHighlight(sIdx, hIdx)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 md:top-auto md:right-3 cursor-pointer"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>

                                              <input
                                                type="text"
                                                placeholder="Thai Script (e.g. ภาษา)"
                                                value={hl.termThai}
                                                onChange={(e) => updateOrientHighlight(sIdx, hIdx, 'termThai', e.target.value)}
                                                className="w-full md:w-1/4 px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-bold"
                                              />
                                              <input
                                                type="text"
                                                placeholder="Phonetic (e.g. phaa-saa)"
                                                value={hl.termPhonetic}
                                                onChange={(e) => updateOrientHighlight(sIdx, hIdx, 'termPhonetic', e.target.value)}
                                                className="w-full md:w-1/4 px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-mono text-[10px]"
                                              />
                                              <input
                                                type="text"
                                                placeholder="English Meaning"
                                                value={hl.meaningEnglish}
                                                onChange={(e) => updateOrientHighlight(sIdx, hIdx, 'meaningEnglish', e.target.value)}
                                                className="w-full md:w-1/4 px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-medium"
                                              />
                                              <input
                                                type="text"
                                                placeholder="Myanmar Meaning"
                                                value={hl.meaningMyanmar}
                                                onChange={(e) => updateOrientHighlight(sIdx, hIdx, 'meaningMyanmar', e.target.value)}
                                                className="w-full md:w-1/4 px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-semibold"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleSaveOrientation}
                                    className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/95 text-white text-xs font-sans font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:brightness-105 transition-all text-center flex items-center justify-center gap-1.5 font-sans"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                    Save entire orientation article details
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 6: DYNAMIC GRAMMAR HANDBOOK CONTEXT MANAGER */}
                    {adminHubTab === 'grammar' && (
                      <div className="space-y-6 animate-fade-in text-left" id="admin-grammar-tab-view">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* Left Panel: Chapters Switcher */}
                          <div className="lg:col-span-4 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-150 space-y-4 text-left">
                            <h5 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 shrink-0 text-brand-purple" />
                              GRAMMAR HANDBOOK CHAPTERS ({grammarChapters.length})
                            </h5>
                            <p className="text-[10px] text-brand-muted font-sans font-semibold leading-relaxed">
                              Select a grammar handbook chapter (Chapters 1 to 15+) or review higher content chapters to dynamically edit explanations, rules, structure concepts, and examples.
                            </p>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                              {grammarChapters.map((chapter) => {
                                const isSelected = adminSelectedGrammarChId === chapter.id;
                                return (
                                  <button
                                    key={chapter.id}
                                    type="button"
                                    onClick={() => setAdminSelectedGrammarChId(chapter.id)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-white border-brand-purple/50 shadow-xs'
                                        : 'bg-white/40 hover:bg-white border-gray-200'
                                    }`}
                                  >
                                    <div>
                                      <div className="text-xs font-bold font-sans text-brand-dark flex items-center gap-1 font-sans">
                                        <span>📖 Chapter {chapter.chapterNumber}: {chapter.titleEnglish}</span>
                                      </div>
                                      <div className="text-[10px] text-brand-muted font-sans font-semibold mt-0.5">
                                        Core Concept: {chapter.thaiCoreConcept || 'General'}
                                      </div>
                                      <div className="text-[9px] text-brand-purple font-sans font-black mt-0.5">
                                        {chapter.rules.length} Grammar Rules
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-brand-dark shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-brand-purple' : ''}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Panel: Selected Chapter Editor Form */}
                          <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-gray-150 space-y-6 text-left">
                            {!grammarEditChapter ? (
                              <p className="text-xs text-brand-muted py-8 text-center font-semibold">
                                Select a grammar chapter from the left side panel to edit its details.
                              </p>
                            ) : (
                              <div className="space-y-6 text-left">
                                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                                  <div>
                                    <h4 className="font-sans font-black text-sm uppercase text-brand-dark">
                                      📝 Edit: Chapter {grammarEditChapter.chapterNumber} - {grammarEditChapter.titleEnglish}
                                    </h4>
                                    <span className="text-[10px] text-brand-muted font-bold font-mono">
                                      Database Chapter Key: {grammarEditChapter.id}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleSaveGrammarChapter}
                                    className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/95 text-white text-[10.5px] font-sans font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer hover:brightness-105 transition-all font-sans"
                                  >
                                    💾 Save Chapter Changes
                                  </button>
                                </div>

                                {/* Chapter Basic Meta Info */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left">
                                  <div className="md:col-span-3 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Chapter #
                                    </label>
                                    <input
                                      type="number"
                                      value={grammarEditChapter.chapterNumber}
                                      onChange={(e) => updateGrammarChField('chapterNumber', Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                  <div className="md:col-span-9 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Thai Core Concept (e.g. คำนาม / ကတ္တားများ)
                                    </label>
                                    <input
                                      type="text"
                                      value={grammarEditChapter.thaiCoreConcept || ''}
                                      onChange={(e) => updateGrammarChField('thaiCoreConcept', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>

                                  <div className="md:col-span-6 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Chapter Title (English)
                                    </label>
                                    <input
                                      type="text"
                                      value={grammarEditChapter.titleEnglish}
                                      onChange={(e) => updateGrammarChField('titleEnglish', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                  <div className="md:col-span-6 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      အခန်းခေါင်းစဉ် (မြန်မာဘာသာ)
                                    </label>
                                    <input
                                      type="text"
                                      value={grammarEditChapter.titleMyanmar || ''}
                                      onChange={(e) => updateGrammarChField('titleMyanmar', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>

                                  <div className="md:col-span-6 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Introductory Outline Description (English)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={grammarEditChapter.descriptionEnglish || ''}
                                      onChange={(e) => updateGrammarChField('descriptionEnglish', e.target.value)}
                                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                  <div className="md:col-span-6 space-y-1 text-left">
                                    <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      မိတ်ဆက် ရှင်းလင်းချက်များ (မြန်မာဘာသာ)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={grammarEditChapter.descriptionMyanmar || ''}
                                      onChange={(e) => updateGrammarChField('descriptionMyanmar', e.target.value)}
                                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Rule lists */}
                                <div className="space-y-4 pt-3 border-t border-gray-100 mt-4 text-left">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                      Rules &amp; Syntactical Explanations ({grammarEditChapter.rules.length})
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={addGrammarRule}
                                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[9.5px] font-sans font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer font-sans"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      ADD RULE
                                    </button>
                                  </div>

                                  {grammarEditChapter.rules.map((rule, rIdx) => (
                                    <div key={rIdx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 text-left space-y-4 relative">
                                      <button
                                        type="button"
                                        onClick={() => deleteGrammarRule(rIdx)}
                                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 cursor-pointer"
                                        title="Delete Rule"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="pr-10 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                                        <div className="space-y-1 text-left">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            Rule {rIdx + 1} Title (English)
                                          </label>
                                          <input
                                            type="text"
                                            value={rule.title}
                                            onChange={(e) => updateGrammarRuleField(rIdx, 'title', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1 text-left">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            စည်းမျဉ်းခေါင်းစဉ် (မြန်မာဘာသာ)
                                          </label>
                                          <input
                                            type="text"
                                            value={rule.titleMyanmar || ''}
                                            onChange={(e) => updateGrammarRuleField(rIdx, 'titleMyanmar', e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>

                                        <div className="space-y-1 sm:col-span-2 text-left">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            Grammar Rule Explanation (English)
                                          </label>
                                          <textarea
                                            rows={2}
                                            value={rule.explanation}
                                            onChange={(e) => updateGrammarRuleField(rIdx, 'explanation', e.target.value)}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-medium font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2 text-left">
                                          <label className="block text-[9px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                            မြန်မာဘာသာဖြင့် သဒ္ဒါစည်းမျဉ်း ရှင်းလင်းချက်
                                          </label>
                                          <textarea
                                            rows={2}
                                            value={rule.explanationMyanmar || ''}
                                            onChange={(e) => updateGrammarRuleField(rIdx, 'explanationMyanmar', e.target.value)}
                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold font-sans text-brand-dark focus:border-brand-purple focus:outline-none transition-all"
                                          />
                                        </div>
                                      </div>

                                      {/* Examples row */}
                                      <div className="space-y-2 border-t border-gray-150/60 pt-3 text-left">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9.5px] font-sans font-black text-brand-purple uppercase tracking-wider">
                                            Thai Example Sentences ({rule.examples ? rule.examples.length : 0})
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => addGrammarExample(rIdx)}
                                            className="px-2 py-0.5 bg-white hover:bg-gray-50 text-brand-purple border border-brand-purple/20 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer"
                                          >
                                            + Add example
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-left">
                                          {(rule.examples || []).map((ex, eIdx) => (
                                            <div key={eIdx} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 relative pr-10 text-left">
                                              <button
                                                type="button"
                                                onClick={() => deleteGrammarExample(rIdx, eIdx)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>

                                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-left">
                                                <div>
                                                  <label className="block text-[8px] font-sans font-black uppercase text-brand-dark mb-0.5 leading-none">Thai Text</label>
                                                  <input
                                                    type="text"
                                                    placeholder="thai text"
                                                    value={ex.thai}
                                                    onChange={(e) => updateGrammarExampleField(rIdx, eIdx, 'thai', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-bold"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[8px] font-sans font-black uppercase text-brand-dark mb-0.5 leading-none">Phonetic</label>
                                                  <input
                                                    type="text"
                                                    placeholder="phonetic spelling"
                                                    value={ex.phonetic}
                                                    onChange={(e) => updateGrammarExampleField(rIdx, eIdx, 'phonetic', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-mono text-[10px]"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[8px] font-sans font-black uppercase text-brand-dark mb-0.5 leading-none">English Meaning</label>
                                                  <input
                                                    type="text"
                                                    placeholder="english meaning"
                                                    value={ex.english}
                                                    onChange={(e) => updateGrammarExampleField(rIdx, eIdx, 'english', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-medium"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[8px] font-sans font-black uppercase text-brand-dark mb-0.5 leading-none">Myanmar Translation</label>
                                                  <input
                                                    type="text"
                                                    placeholder="မြန်မာအနက်အဓိပ္ပာယ်"
                                                    value={ex.myanmar}
                                                    onChange={(e) => updateGrammarExampleField(rIdx, eIdx, 'myanmar', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-150 rounded text-xs text-brand-dark font-sans font-semibold"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={handleSaveGrammarChapter}
                                    className="px-6 py-3 bg-brand-purple hover:bg-brand-purple/95 text-white text-xs font-sans font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:brightness-105 transition-all text-center flex items-center justify-center gap-1.5 font-sans"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                    Save current grammar chapter details
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-SECTION 7: BRAND & THEME SETTINGS (DYNAMIC CONFIG) */}
                    {adminHubTab === 'brand' && (
                      <div className="space-y-6 animate-fade-in text-left">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                          <h5 className="text-xs font-sans font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-sans">
                            <Palette className="w-4 h-4 text-brand-purple animate-pulse" />
                            Live Branding Customization
                          </h5>
                          <p className="text-[11px] text-slate-500 font-sans font-medium mb-4 leading-relaxed font-sans">
                            Easily redefine the identity of your tuition system. Altering the brand color triggers dynamic math calculation models to shift shades, borders, shadows, highlights, and active state styles automatically over all student screens in real-time.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Left Panel: Inputs */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[9px] font-sans font-black uppercase text-slate-700 mb-1.5">
                                  App Logo Initials / Short text (2-3 chars)
                                </label>
                                <input
                                  type="text"
                                  maxLength={3}
                                  value={brandLogoText}
                                  onChange={(e) => setBrandLogoText(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-brand-purple rounded-xl font-sans font-extrabold text-sm text-slate-800 tracking-wider shadow-2xs leading-none uppercase"
                                  placeholder="e.g. TH"
                                />
                              </div>

                              {/* New PNG Image Logo Uploader element */}
                              <div>
                                <label className="block text-[9px] font-sans font-black uppercase text-slate-700 mb-1.5 flex items-center justify-between">
                                  <span>System Logo Image (PNG / JPG)</span>
                                  {brandLogoImg && (
                                    <button 
                                      type="button" 
                                      onClick={() => setBrandLogoImg('')}
                                      className="text-rose-600 hover:text-rose-700 font-sans font-extrabold text-[8.5px] uppercase cursor-pointer transition-colors"
                                    >
                                      Remove Logo Image
                                    </button>
                                  )}
                                </label>
                                
                                {brandLogoImg ? (
                                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border-2 border-slate-200">
                                    <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center p-0.5 border border-slate-300">
                                      <img src={brandLogoImg} alt="Logotype" className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[10px] font-sans font-black text-emerald-700 uppercase flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Custom image active
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-sans font-medium truncate">Saved locally and synchronized dynamically</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative border-2 border-dashed border-slate-250 hover:border-brand-purple rounded-xl p-4 bg-white/50 text-center transition-all cursor-pointer group">
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg, image/gif, image/webp"
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 2 * 1024 * 1024) {
                                            alert("Notice: Image file size must be less than 2MB for high-performance LocalStorage buffer storage!");
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result && typeof event.target.result === 'string') {
                                              setBrandLogoImg(event.target.result);
                                              addSystemLog('admin', `Custom logo image uploaded successfully (${file.name})`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    <div className="flex flex-col items-center gap-1">
                                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-brand-purple transition-colors" />
                                      <span className="text-[9.5px] font-sans font-black text-slate-600 group-hover:text-brand-purple uppercase tracking-wide">Upload PNG Logo</span>
                                      <span className="text-[8.5px] text-slate-400 font-sans font-medium">Click or Drag & Drop to attach image file</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-[9px] font-sans font-black uppercase text-slate-700 mb-1.5">
                                  App Brand Name / Institution Title
                                </label>
                                <input
                                  type="text"
                                  value={brandName}
                                  onChange={(e) => setBrandName(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 focus:border-brand-purple rounded-xl font-sans font-extrabold text-sm text-slate-800 shadow-2xs leading-none"
                                  placeholder="e.g. SIRI Thai Language"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-sans font-black uppercase text-slate-700 mb-2">
                                  Select Brand Base Color
                                </label>
                                {/* Quick Color Presets */}
                                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 mb-3.5">
                                  {[
                                    { name: "Royal Purple", hex: "#8234ea" },
                                    { name: "Emerald Green", hex: "#10b981" },
                                    { name: "Ocean Blue", hex: "#3b82f6" },
                                    { name: "Sly Blue", hex: "#06b6d4" },
                                    { name: "Sunset Red", hex: "#ef4444" },
                                    { name: "Mandarin Orange", hex: "#f97316" },
                                    { name: "Charcoal", hex: "#1e293b" }
                                  ].map((pColor) => (
                                    <button
                                      key={pColor.hex}
                                      type="button"
                                      onClick={() => setBrandColor(pColor.hex)}
                                      className={`h-9 w-full rounded-xl border-2 transition-all relative flex items-center justify-center cursor-pointer p-0 shadow-2xs ${
                                        brandColor.toLowerCase() === pColor.hex.toLowerCase()
                                          ? 'scale-105 border-slate-800 ring-2 ring-slate-800/10'
                                          : 'border-white hover:scale-102 hover:opacity-90'
                                      }`}
                                      style={{ backgroundColor: pColor.hex }}
                                      title={pColor.name}
                                    >
                                      {brandColor.toLowerCase() === pColor.hex.toLowerCase() && (
                                        <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                                      )}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex gap-3 items-center">
                                  <div className="relative shrink-0 select-none">
                                    <input
                                      type="color"
                                      value={brandColor}
                                      onChange={(e) => setBrandColor(e.target.value)}
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    />
                                    <div className="w-10 h-10 rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer" style={{ backgroundColor: brandColor }} />
                                  </div>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      value={brandColor}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.startsWith('#') && val.length <= 7) {
                                          setBrandColor(val);
                                        }
                                      }}
                                      className="w-full px-3 py-2 bg-white border-2 border-slate-200 focus:border-brand-purple rounded-xl font-mono text-xs text-slate-800 select-all"
                                      placeholder="#8234ea"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Panel: Live Dynamic Preview card */}
                            <div className="space-y-4">
                              <label className="block text-[9px] font-sans font-black uppercase text-slate-700 leading-none">
                                Real-time Header & Card Preview
                              </label>

                              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-4 shadow-3xs overflow-hidden">
                                
                                {/* Top Banner Simulation */}
                                <div className="border border-slate-100/80 p-2.5 rounded-xl bg-slate-50/50">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-11 h-11 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden p-0.5">
                                      {brandLogoImg ? (
                                        <img 
                                          src={brandLogoImg} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover relative z-10 rounded-lg" 
                                          referrerPolicy="no-referrer" 
                                        />
                                      ) : (
                                        <PeacockLogo className="w-9 h-9 relative z-10" />
                                      )}
                                    </div>
                                    <div className="min-w-0 text-left">
                                      <h6 className="text-[10px] font-sans font-black text-slate-800 leading-none uppercase truncate">
                                        {brandName || 'SIRI Thai Language'}
                                      </h6>
                                      <span className="text-[7px] text-slate-400 font-sans font-bold uppercase mt-0.5 block tracking-wider">PREVIEW COMPONENT</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Active Selection Element simulation */}
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div className="p-3 rounded-2xl border-2 transition-all flex flex-col justify-between h-20 text-left bg-white border-slate-200">
                                    <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">Inactive element</span>
                                    <span className="text-[10px] font-sans font-black text-slate-600">STANDARD TAB</span>
                                  </div>
                                  <div className="p-3 rounded-2xl border-2 transition-all flex flex-col justify-between h-20 text-left shadow-3xs" 
                                    style={{ 
                                      backgroundColor: adjustHexBrightness(brandColor, 90),
                                      borderColor: brandColor,
                                    }}>
                                    <span className="text-[9px] font-sans font-bold uppercase" style={{ color: brandColor }}>Active state</span>
                                    <span className="text-[10px] font-sans font-black" style={{ color: adjustHexBrightness(brandColor, -30) }}>DYNAMIC TINT</span>
                                  </div>
                                </div>

                                {/* Buttons Simulation */}
                                <div className="flex gap-2">
                                  <button type="button" className="flex-1 py-2 text-[9px] font-sans font-extrabold uppercase tracking-wide rounded-xl text-white shadow-xs transition-transform active:translate-y-0.5 cursor-pointer text-center" 
                                    style={{ 
                                      backgroundColor: brandColor, 
                                      borderBottom: `3px solid ${adjustHexBrightness(brandColor, -15)}`
                                    }}>
                                    Primary duo-btn
                                  </button>
                                  <button type="button" className="flex-1 py-2 text-[9px] font-sans font-extrabold uppercase tracking-wide rounded-xl border border-slate-300 bg-white transition-none text-center" style={{ color: brandColor, borderColor: adjustHexBrightness(brandColor, 40) }}>
                                    Border outline
                                  </button>
                                </div>

                              </div>

                              <div className="p-3 bg-slate-100 border border-slate-250 rounded-xl">
                                <span className="block text-[8px] font-sans font-black uppercase text-slate-700 tracking-wider mb-0.5 leading-none">Pro tip</span>
                                <span className="text-[9.5px] text-slate-600 font-sans font-medium leading-normal">
                                  The base color picker updates live instantly. There is no need to manually deploy css code. Changes persist dynamically across client browser reloads.
                                </span>
                              </div>
                            </div>

                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                addSystemLog('admin', `Customized look and feel: title="${brandName}", initials="${brandLogoText}", hex="${brandColor}"`);
                                alert("Success! Brand Identity updated and propagated successfully across all panels. All changes persist automatically.");
                              }}
                              className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/95 text-white text-xs font-sans font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer hover:brightness-105 transition-all text-center flex items-center justify-center gap-1.5 font-sans"
                            >
                              <CheckSquare className="w-4 h-4" />
                              Save branding properties
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PREMIUM SYSTEM ANNOUNCEMENT BANNER */}
                <div id="system-broadcast-config-card" className="bg-white rounded-2xl border-2 border-gray-100 p-5 sm:p-6 text-left space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                        <Megaphone className="w-4 h-4 text-brand-purple shrink-0 animate-pulse" />
                        📢 Public Student Announcement Banner Configuration (စနစ်အလံထုတ်ပြန်ချက်)
                      </h4>
                      <p className="text-[10px] text-brand-muted font-sans font-semibold mt-1">
                        Compose and update the global scrolling dynamic announcement marquee bar displayed instantly on all students' dashboards.
                      </p>
                    </div>

                    {/* Miniature live status indicator badge */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto select-none">
                      {activeBroadcast ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8.5px] font-sans font-black uppercase text-brand-green bg-gradient-to-r from-green-50 to-emerald-50 text-brand-green border border-brand-green/30 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-brand-green text-transparent inline-block">●</span> LIVE STREAMING
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[8.5px] font-sans font-black uppercase text-brand-muted bg-gray-50 border border-gray-200">
                          ○ HIDDEN / OFFLINE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Split Visual Layout for Announcement Banner */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Form & Template Pills */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[9.5px] font-sans font-black text-brand-dark uppercase tracking-wider">
                            Compose Marquee Text (မြန်မာ/အင်္ဂလိပ်/ထိုင်း)
                          </label>
                          <span className="text-[9px] font-mono text-brand-muted font-bold block select-none">
                            {activeBroadcastInput.length} characters
                          </span>
                        </div>
                        <textarea
                          placeholder="Welcome students! Enter the update notification marquee bar text here..."
                          value={activeBroadcastInput}
                          onChange={(e) => setActiveBroadcastInput(e.target.value)}
                          rows={3}
                          className="w-full px-3.5 py-3 border-2 border-gray-200 rounded-xl text-xs sm:text-sm font-semibold font-sans focus:border-brand-purple focus:outline-none transition-colors text-brand-dark placeholder-gray-400 bg-gray-50/30 font-sans"
                        />
                      </div>

                      {/* Quick Template Pills */}
                      <div className="space-y-2 bg-[#fcfbfe] border border-brand-purple/10 p-3 rounded-xl">
                        <span className="block text-[9px] font-sans font-black text-brand-purple uppercase tracking-wider select-none">
                          ⚡ Quick Pre-configured Templates:
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {[
                            {
                              label: "Maintenance 🛠️",
                              text: "System maintenance is scheduled for tonight at 11:30 PM (MMT). The application database will be updated for roughly 20 mins. 🛠️"
                            },
                            {
                              label: "New Lesson Content 📚",
                              text: "Exciting News! Level 10 dialogues and vocabulary list with native speed audio clips are now added! Check them out in learning path! 📚"
                            },
                            {
                              label: "Handbook Sale 📕",
                              text: "Exclusive promo active! Get access code for advanced Thai-Myanmar Grammar Manual with worksheets for 50% off! 📕"
                            },
                            {
                              label: "Double XP Boost ⚡",
                              text: "Supercharge weekend is here! Earn double XP (+2x score multiplier) on all translation quizzes until Sunday midnight. Go go go! ⚡"
                            }
                          ].map((pill, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveBroadcastInput(pill.text)}
                              className="px-2 py-1 bg-white hover:bg-brand-purple/5 text-brand-dark hover:text-brand-purple border border-gray-250 hover:border-brand-purple/30 rounded-lg text-[9.5px] font-semibold font-sans transition-all cursor-pointer text-left shadow-3xs"
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (!activeBroadcastInput.trim()) {
                              alert("Please enter message body before broadcasting.");
                              return;
                            }
                            setActiveBroadcast(activeBroadcastInput);
                            localStorage.setItem('thai_active_broadcast', activeBroadcastInput);
                            addSystemLog('admin', `Updated system broadcast marquee alert`);
                          }}
                          className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/95 border-b-4 border-brand-purple-shadow text-white rounded-xl text-xs font-sans font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                        >
                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                          Publish Live Broadcast
                        </button>
                        <button
                          onClick={() => {
                            setActiveBroadcast('');
                            localStorage.removeItem('thai_active_broadcast');
                            setActiveBroadcastInput('');
                            addSystemLog('admin', 'Disabled system broadcast marquee');
                          }}
                          className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200/60 font-sans font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Clear banner and hide"
                        >
                          <X className="w-4 h-4 shrink-0" />
                          Disable Banner
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Live Broadcast Simulator Display Container */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-[#1d232a] to-brand-dark rounded-2xl border-2 border-[#12161a] p-4.5 text-white flex flex-col justify-between items-stretch shadow-md select-none relative overflow-hidden text-left">
                      {/* Grid background effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                      <div className="z-10 flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="text-[9px] font-mono font-black text-brand-purple-light uppercase tracking-widest flex items-center gap-1.5_wrap">
                          <Activity className="w-3 h-3 text-brand-purple-light shrink-0" />
                          Broadcast Monitor Simulator
                        </span>
                        {activeBroadcast ? (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                            <span className="text-[8px] font-mono text-brand-green font-extrabold uppercase">TX TRANSMITTING</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono text-gray-500 font-extrabold uppercase">STBY OFFLINE</span>
                        )}
                      </div>

                      {/* Display Screen */}
                      <div className="z-10 my-4 py-6 px-4 bg-black/45 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[90px]">
                        {activeBroadcast ? (
                          <div className="w-full space-y-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
                              📡 Global Active Marquee Banner
                            </span>
                            <div className="bg-brand-purple text-white py-2 px-3 rounded-xl shadow-inner text-[10px] font-sans font-bold text-left border-l-4 border-amber-300 relative overflow-hidden w-full">
                              <p className="truncate uppercase tracking-wide leading-normal text-white">
                                {activeBroadcast}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-gray-400 font-mono text-xs font-bold uppercase tracking-wide">○ Digital Display Empty</p>
                            <p className="text-gray-500 text-[10px] leading-relaxed max-w-xs font-sans font-semibold">
                              Compose marquee notification text on the left and click "Publish Live Broadcast" to activate.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Simulator Telemetry Footing */}
                      <div className="z-10 border-t border-white/5 pt-2 flex items-center justify-between text-[8.5px] font-mono text-gray-400 font-semibold">
                        <span>Device: Student Client Frame</span>
                        <span>Update: Instant Sync</span>
                      </div>
                    </div>
                  </div>
                </div>






                {/* Curriculum & Lesson Database Manager */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 space-y-6" id="admin-curriculum-manager">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5 text-brand-purple">
                        <BookOpen className="w-4 h-4 shrink-0 text-brand-purple" />
                        📚 Curriculum & Lesson Database Manager • သင်ရိုးညွှန်းတမ်း တည်းဖြတ်ခြင်း
                      </h4>
                      <p className="text-[10px] font-sans font-bold text-brand-muted mt-1">
                        Add, delete or modify metadata, vocabularies, sentences, grammars, and quizzes for all lessons. All edits persist instantly.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const nextId = lessons.length > 0 ? Math.max(...lessons.map(l => l.id)) + 1 : 1;
                          const newLesson: Lesson = {
                            id: nextId,
                            courseId: adminCurriculumCourseFilter !== 'all' ? adminCurriculumCourseFilter : 'course-basic',
                            titleThai: "บทเรียนใหม่",
                            titlePhonetic: "Bot-riian mai",
                            titleEnglish: "New Custom Lesson " + nextId,
                            titleMyanmar: "သင်ခန်းစာသစ် " + nextId,
                            descriptionEnglish: "This is an interactive custom-created lesson from the Admin console.",
                            descriptionMyanmar: "ဤသင်ခန်းစာကို စီမံခန့်ခွဲသူမှ တိုက်ရိုက်ဖန်တီးထားပါသည်။",
                            dialogue: [
                              {
                                speaker: "A",
                                thai: "สวัสดีครับ",
                                phonetic: "sa-wat-dee khráp",
                                english: "Hello (male)",
                                myanmar: "မင်္ဂလာပါခင်ဗျာ",
                                words: [{ thai: "สวัสดี", phonetic: "sa-wat-dee", english: "Hello", myanmar: "မင်္ဂလာပါ", partOfSpeech: "interjection" }]
                              }
                            ],
                            grammarNotes: [
                              {
                                title: "Polite Particles",
                                titleMyanmar: "ယဉ်ကျေးမှုဆိုင်ရာ အဆုံးသတ်စကားလုံးများ",
                                explanation: "Use khráp for male speakers.",
                                explanationMyanmar: "အမျိုးသားများအတွက် ယဉ်ကျေးစွာ ပြောဆိုရာတွင် khráp ကို ထည့်သွင်းသုံးစွဲရမည်ဖြစ်ပါသည်။",
                                examples: [
                                  { thai: "สวัสดีครับ", phonetic: "sa-wat-dee khráp", english: "Hello (male)", myanmar: "မင်္ဂလာပါခင်ဗျာ" },
                                  { thai: "สบายดีครับ", phonetic: "sa-baai-dee khráp", english: "I am fine (male)", myanmar: "နေကောင်းပါတယ်ခင်ဗျာ" },
                                  { thai: "ขอบคุณครับ", phonetic: "khòop-khun khráp", english: "Thank you (male)", myanmar: "ကျေးဇူးတင်ပါတယ်ခင်ဗျာ" },
                                  { thai: "ขอโทษครับ", phonetic: "khǎaw-thôot khráp", english: "Excuse me (male)", myanmar: "တောင်းပန်ပါတယ်ခင်ဗျာ" },
                                  { thai: "ยินดีครับ", phonetic: "yin-dee khráp", english: "My pleasure", myanmar: "ဝမ်းသာပါတယ်ခင်ဗျာ" },
                                  { thai: "ဟုတ်ကဲ့ပါခင်ဗျာ", phonetic: "khrap", english: "Yes", myanmar: "ဟုတ်ကဲ့ပါခင်ဗျာ" }
                                ]
                              }
                            ],
                            quiz: [
                              {
                                id: "quiz-" + Date.now() + "-1",
                                type: "translate-thai-to-mm",
                                prompt: "What does สวัสดี mean?",
                                promptThai: "สวัสดี",
                                options: ["နေကောင်းလား", "မင်္ဂလာပါ", "ကျေးဇူးတင်ပါတယ်", "သွားတော့မယ်"],
                                correctAnswer: "မင်္ဂလာပါ",
                                explanation: "Sawatdee is the common Thai greeting meaning 'Hello'",
                                explanationMyanmar: "Sawatdee သည် ထိုင်းနှုတ်ဆက်စကား 'မင်္ဂလာပါ' ဖြစ်သည်။"
                              }
                            ]
                          };
                          setLessons([...lessons, newLesson]);
                          setAdminSelectedLessonId(newLesson.id);
                          addSystemLog('admin', `Created a brand-new customized Lesson ${newLesson.id}`);
                        }}
                        className="px-3 py-1.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        CREATE LESSON
                      </button>

                      <button
                        onClick={() => {
                          const name = window.prompt("Enter new Vocabulary List/Category Name (e.g. 'Useful Phrases'):");
                          if (!name || !name.trim()) return;
                          const icon = window.prompt("Enter an Emoji Icon for this category (e.g. '💬'):") || '📙';
                          
                          const newCat: VocabCategory = {
                            name: name.trim(),
                            icon: icon.trim(),
                            items: []
                          };
                          const updated = [...vocabBookCategories, newCat];
                          handleSaveVocabBookCategories(updated);
                          setAdminSelectedVocabCategory(newCat.name);
                          setAdminSelectedLessonId(null);
                          addSystemLog('admin', `Created new customized Vocabulary List: "${name}"`);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-colors"
                        title="Create custom vocabulary book list category"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        CREATE VOCAB LIST
                      </button>

                      <button
                        onClick={() => {
                          const ok = window.confirm("Are you absolutely sure you want to reset all curriculum contents back to factory defaults? Custom lessons and word edits will be permanently wiped.");
                          if (ok) {
                            localStorage.removeItem('thai_lessons_curriculum');
                            localStorage.removeItem('thai_vocab_book_categories');
                            lessons.forEach(l => {
                              localStorage.removeItem(`thai_custom_vocab_${l.id}`);
                            });
                            setLessons([]);
                            setVocabBookCategories([]);
                            setAdminSelectedLessonId(null);
                            setAdminSelectedVocabCategory(null);
                            window.dispatchEvent(new Event('thai_vocab_updated'));
                            window.dispatchEvent(new Event('thai_vocab_book_categories_updated'));
                            addSystemLog('admin', "Perform full factory reset of curriculum database");
                            alert("System curriculum reset to factory baseline!");
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-colors border border-red-200"
                        title="Reset back to factory template curriculum"
                      >
                        <RefreshCw className="w-3 h-3" />
                        RESET ALL TO FACTORY
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop Lesson Ordering Deck */}
                  <div className="bg-amber-50/25 border border-amber-200/60 rounded-xl overflow-hidden transition-all duration-200 select-none">
                    {/* Clickable Header for Collapse/Expand toggle */}
                    <button
                      onClick={() => setIsDragReorderExpanded(!isDragReorderExpanded)}
                      className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-amber-100/30 transition-colors text-left"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h5 className="text-[11px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5 text-brand-purple">
                          🔀 DRAG & REORDER SYLLABUS LESSONS • သင်ခန်းစာများ အစီအစဉ် ပြောင်းလဲရန်
                        </h5>
                        <p className="text-[9.5px] font-sans font-medium text-brand-muted sm:ml-2">
                          {!isDragReorderExpanded ? '(Click to expand drag panel • တည်းဖြတ်ရန် နှိပ်ပါ)' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
                          {lessons.length} LESSONS
                        </span>
                        {isDragReorderExpanded ? (
                          <ChevronUp className="w-4 h-4 text-brand-purple" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-brand-purple" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Section Body */}
                    {isDragReorderExpanded && (
                      <div className="p-4 pt-0 border-t border-gray-150/50 space-y-3.5 bg-white/40">
                        <div className="pt-3.5">
                          <p className="text-[9.5px] font-sans font-medium text-brand-muted">
                            Drag and drop any lesson box below to change the syllabus sequence for students. Click a box to select it for edits.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {sortLessonsNaturally(lessons).map((l, index) => {
                            const isSelected = l.id === adminSelectedLessonId;
                            const isOver = draggedItemType === 'lessons' && dragOverTargetIndex === index;
                            const isDragging = draggedItemType === 'lessons' && draggedItemIndex === index;
                            return (
                              <div
                                key={l.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index, 'lessons')}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, index, 'lessons')}
                                onClick={() => setAdminSelectedLessonId(l.id)}
                                className={`p-2 rounded-xl border-2 flex items-center gap-2 select-none cursor-grab active:cursor-grabbing transition-all text-xs font-semibold ${
                                  isSelected
                                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm ring-1 ring-brand-purple/20'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs text-brand-dark'
                                } ${isOver ? 'border-brand-purple border-dashed scale-95 bg-brand-purple/5' : ''} ${
                                  isDragging ? 'opacity-45 scale-95' : ''
                                }`}
                              >
                                <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0 pointer-events-none" />
                                <span className="pointer-events-none">
                                  L-{l.id}: <span className="font-extrabold">{l.titleEnglish}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dedicated Syllabus Lessons CSV Bulk Upload Card */}
                  <div className="bg-brand-purple/[0.02] border-2 border-brand-purple/10 p-4 sm:p-5 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h5 className="font-sans font-black text-brand-dark text-xs uppercase tracking-wider flex items-center gap-1.5 text-brand-purple">
                          <FileText className="w-4 h-4 shrink-0 text-brand-purple" />
                          📂 Excel/CSV Bulk Syllabus Importer • သင်ခန်းစာများ ဖိုင်ဖြင့်အမြန်ထည့်ရန်
                        </h5>
                        <p className="text-[10px] font-sans font-semibold text-brand-muted mt-1 leading-relaxed text-left">
                          Busy users can download our sample lesson format below, fill in your lesson ids, titles, and descriptions, then drop it here to upload multiple lessons at once instead of manually entering them.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSyllabusImportExpanded(!isSyllabusImportExpanded)}
                        className="px-3 py-1.5 border-2 border-brand-purple/35 bg-[#fbfaff] hover:bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      >
                        {isSyllabusImportExpanded ? "CLOSE IMPORTER • ပိတ်ရန်" : "OPEN IMPORTER • ဖိုင်တင်ရန်"}
                      </button>
                    </div>

                    {isSyllabusImportExpanded && (
                      <div className="space-y-4 animate-fade-in border-t border-brand-purple/10 pt-4 text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left column: Template Downloader */}
                          <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-2.5 flex flex-col justify-between">
                            <div>
                              <h6 className="text-[10.5px] font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1">
                                📋 DOWNLOAD SAMPLE TEMPLATE
                              </h6>
                              <p className="text-[10px] font-sans font-medium text-brand-muted leading-relaxed">
                                Get our structured template to fill on Excel, Google Sheets or Numbers. Save as CSV prior to uploading.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadCsvTemplate('lessons')}
                              className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10.5px] font-black font-sans px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                            >
                              <Download className="w-4 h-4 text-amber-700 animate-pulse" />
                              Download Lesson Template (.csv)
                            </button>
                          </div>

                          {/* Right column: Drag and Drop upload block */}
                          <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-2">
                            <h6 className="text-[10.5px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1">
                              📤 UPLOAD & PARSE CSV FILE
                            </h6>
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsSyllabusCsvDragOver(true);
                              }}
                              onDragLeave={() => setIsSyllabusCsvDragOver(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsSyllabusCsvDragOver(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  processSyllabusCsvFile(file);
                                }
                              }}
                              onClick={() => {
                                const input = document.getElementById('syllabus-csv-file-selector');
                                if (input) input.click();
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
                                isSyllabusCsvDragOver ? 'border-brand-purple bg-brand-purple/5 scale-98' : 'border-gray-200 hover:border-brand-purple bg-gray-50/50 hover:bg-white'
                              }`}
                            >
                              <input
                                type="file"
                                id="syllabus-csv-file-selector"
                                accept=".csv"
                                onChange={handleSyllabusCsvFileSelection}
                                className="hidden"
                              />
                              <Upload className="w-5 h-5 text-brand-purple/60 mb-2" />
                              <span className="text-[10.5px] font-sans font-black text-brand-dark text-center truncate max-w-full">
                                {syllabusCsvFileName ? `✓ Selected: ${syllabusCsvFileName}` : "Drag CSV file or Click here to Browse"}
                              </span>
                              <span className="text-[9px] text-brand-muted mt-1">Accepts standard lesson schema CSV file</span>
                            </div>
                          </div>
                        </div>

                        {/* Parsed Output Details */}
                        {syllabusCsvFile && (
                          <div className="bg-white border border-brand-purple/20 rounded-xl p-4 space-y-3.5 animate-fade-in text-brand-dark text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                              <div>
                                <h6 className="text-[10.5px] font-sans font-black uppercase text-brand-dark flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4 text-brand-green" />
                                  PARSED LESSONS PREVIEW • အရေအတွက် စစ်ဆေးရန်
                                </h6>
                                <p className="text-[9px] text-brand-muted font-medium">
                                  Check parsed row values below. If IDs match an existing lesson, its english/myanmar values will be updated while preserving all vocab/quizzes inside.
                                </p>
                              </div>
                              <div className="text-[10px] font-mono font-black text-brand-purple bg-brand-purple/5 px-2.5 py-1 rounded-full shrink-0">
                                {syllabusCsvParsedData.length} Lessons Found
                              </div>
                            </div>

                            {/* Syllabus errors list */}
                            {syllabusCsvErrors.length > 0 && (
                              <div className="bg-red-50 border border-red-150 p-3 rounded-lg text-[10px] space-y-1 max-h-[120px] overflow-y-auto font-sans text-red-700">
                                <span className="font-extrabold flex items-center gap-1">⚠ Parsing Errors Detected:</span>
                                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                                  {syllabusCsvErrors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Table of read results */}
                            <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-lg overflow-x-auto">
                              <table className="w-full text-[10px] text-left border-collapse font-sans font-semibold">
                                <thead className="bg-gray-50 text-brand-muted font-black border-b border-gray-200">
                                  <tr>
                                    <th className="p-2 border-r border-gray-200 w-12 text-center">ID</th>
                                    <th className="p-2 border-r border-gray-200">ENGLISH TITLE</th>
                                    <th className="p-2 border-r border-gray-200">MYANMAR TITLE</th>
                                    <th className="p-2">THAI / PHONETIC</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {syllabusCsvParsedData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-brand-purple/5 transition-colors">
                                      <td className="p-2 border-r border-gray-200 font-mono font-extrabold text-brand-purple text-center">{row.id}</td>
                                      <td className="p-2 border-r border-gray-200 font-bold text-brand-dark">{row.titleEnglish}</td>
                                      <td className="p-2 border-r border-gray-200 text-brand-dark">
                                        <span>{row.titleMyanmar}</span>
                                        {row.titleMyanmarPhonetic && (
                                          <span className="text-[9px] text-emerald-600 block leading-tight font-black">[{row.titleMyanmarPhonetic}]</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-brand-muted font-sans font-medium">{row.titleThai} ({row.titlePhonetic})</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={submitSyllabusCsvImport}
                                className="flex-1 bg-brand-purple hover:bg-brand-purple/95 text-white font-sans font-black text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 uppercase cursor-pointer"
                              >
                                <CheckSquare className="w-4 h-4" />
                                CONFIRM SYLLABUS IMPORT • တင်သွင်းမှု လျှောက်ထားမည်
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSyllabusCsvFile(null);
                                  setSyllabusCsvParsedData([]);
                                  setSyllabusCsvErrors([]);
                                  setSyllabusCsvFileName('');
                                }}
                                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-dark rounded-xl font-sans font-extrabold text-xs transition-colors cursor-pointer"
                              >
                                Clear File
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Course dropdown filter above select lesson to edit */}
                  <div className="p-3 bg-brand-purple/[0.03] rounded-xl border border-brand-purple/15 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <label className="text-[10px] font-sans font-black text-brand-purple uppercase tracking-wider shrink-0 flex items-center gap-1">
                        Filter Lessons by Course:
                      </label>
                      <select
                        value={adminCurriculumCourseFilter}
                        onChange={(e) => {
                          setAdminCurriculumCourseFilter(e.target.value);
                          setAdminSelectedLessonId(null);
                          setAdminSelectedVocabCategory(null);
                        }}
                        className="bg-white border-2 border-brand-purple/20 px-3 py-1.5 rounded-lg text-xs font-black font-sans text-brand-purple focus:border-brand-purple focus:outline-none cursor-pointer"
                      >
                        <option value="all">⚡ ALL COURSES (သင်တန်းအားလုံး)</option>
                        {Array.isArray(courses) ? courses.map(c => (
                          <option key={c.id} value={c.id}>
                            🎓 {c.name}
                          </option>
                        )) : null}
                      </select>
                    </div>
                    <div className="text-[9.5px] font-sans font-semibold text-brand-muted sm:ml-auto">
                      Only displays lessons matching the selected course filter above.
                    </div>
                  </div>

                  {/* Lesson selection query dropdown */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <label className="text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider shrink-0">
                        SELECT LESSON TO EDIT:
                      </label>
                      <select
                        value={adminSelectedVocabCategory ? `vocab-${adminSelectedVocabCategory}` : adminSelectedLessonId ? `lesson-${adminSelectedLessonId}` : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith('vocab-')) {
                            setAdminSelectedVocabCategory(val.substring(6));
                            setAdminSelectedLessonId(null);
                          } else if (val.startsWith('lesson-')) {
                            setAdminSelectedLessonId(Number(val.substring(7)));
                            setAdminSelectedVocabCategory(null);
                          } else {
                            setAdminSelectedLessonId(null);
                            setAdminSelectedVocabCategory(null);
                          }
                        }}
                        className="bg-white border-2 border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Choose a Lesson --</option>
                        <optgroup label="📖 SYLLABUS LESSONS (သင်ခန်းစာများ)">
                          {sortLessonsNaturally(
                            lessons.filter(l => {
                              if (adminCurriculumCourseFilter === 'all') return true;
                              const lessonCourseId = l.courseId || 'course-basic';
                              return lessonCourseId === adminCurriculumCourseFilter;
                            })
                          ).map(l => (
                              <option key={l.id} value={`lesson-${l.id}`}>
                                Lesson {l.id}: {l.titleEnglish} ({l.titleThai})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="📙 VOCAB BOOK LISTS / CATEGORIES (ဝေါဟာရ အုပ်စုများ)">
                          {vocabBookCategories.map(cat => (
                            <option key={cat.name} value={`vocab-${cat.name}`}>
                              📙 Vocab List: {cat.icon && !/^[A-Za-z0-9_-]+$/.test(cat.icon) ? cat.icon : '📖'} {cat.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {adminSelectedLessonId && (
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(`Are you absolutely sure you want to delete Lesson ${adminSelectedLessonId} and all its structural contexts?`);
                          if (confirmed) {
                            const updated = lessons.filter(l => l.id !== adminSelectedLessonId);
                            setLessons(updated);
                            addSystemLog('admin', `Permanently deleted Lesson ${adminSelectedLessonId} from curriculums`);
                            setAdminSelectedLessonId(updated[0]?.id || null);
                          }
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-sans font-black flex items-center gap-1 sm:ml-auto cursor-pointer border border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        DELETE LESSON [${adminSelectedLessonId}]
                      </button>
                    )}

                    {adminSelectedVocabCategory && (
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(`Are you absolutely sure you want to delete Vocabulary List "${adminSelectedVocabCategory}" and all its internal words?`);
                          if (confirmed) {
                            const updated = vocabBookCategories.filter(c => c.name !== adminSelectedVocabCategory);
                            handleSaveVocabBookCategories(updated);
                            addSystemLog('admin', `Permanently deleted Vocabulary List "${adminSelectedVocabCategory}" from database`);
                            setAdminSelectedVocabCategory(updated[0]?.name || null);
                          }
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-sans font-black flex items-center gap-1 sm:ml-auto cursor-pointer border border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        DELETE VOCAB LIST
                      </button>
                    )}
                  </div>

                  {/* Selected vocab category edits section */}
                  {adminSelectedVocabCategory && (() => {
                    const selectedCategory = vocabBookCategories.find(c => c.name === adminSelectedVocabCategory);
                    const idxInArray = vocabBookCategories.findIndex(c => c.name === adminSelectedVocabCategory);
                    if (!selectedCategory) return <p className="text-xs text-brand-muted font-bold font-sans">Selected vocabulary list corrupt.</p>;

                    const currentItems = selectedCategory.items || [];
                    
                    return (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white p-6 space-y-6 animate-fade-in text-left">
                        {/* 1. Category metadata update form */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                          <h4 className="text-xs font-sans font-black text-brand-purple uppercase tracking-wider">
                            📝 CATEGORY DETAILS • အုပ်စုအချက်အလက်
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-sans font-black text-brand-muted uppercase mb-1">List Name</label>
                              <input
                                type="text"
                                value={selectedCategory.name}
                                onChange={(e) => {
                                  let newName = e.target.value;
                                  if (!newName) return;
                                  const updated = [...vocabBookCategories];
                                  updated[idxInArray].name = newName;
                                  handleSaveVocabBookCategories(updated);
                                  setAdminSelectedVocabCategory(newName);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-brand-dark focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-sans font-black text-brand-muted uppercase mb-1">Category Icon / Emoji</label>
                              <input
                                type="text"
                                value={selectedCategory.icon}
                                onChange={(e) => {
                                  const updated = [...vocabBookCategories];
                                  updated[idxInArray].icon = e.target.value || '📙';
                                  handleSaveVocabBookCategories(updated);
                                }}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-brand-dark focus:border-brand-purple focus:outline-none bg-white font-mono text-black"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Add item form */}
                        <div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const th = (form.elements.namedItem('cat_th') as HTMLInputElement).value.trim();
                              const ph = (form.elements.namedItem('cat_ph') as HTMLInputElement).value.trim();
                              const phMm = (form.elements.namedItem('cat_phMm') as HTMLInputElement).value.trim();
                              const en = (form.elements.namedItem('cat_en') as HTMLInputElement).value.trim();
                              const mm = (form.elements.namedItem('cat_mm') as HTMLInputElement).value.trim();
                              const ill = (form.elements.namedItem('cat_ill') as HTMLInputElement).value.trim();
                              const url = (form.elements.namedItem('cat_url') as HTMLInputElement).value.trim();
                              const pdfDriveUrl = (form.elements.namedItem('cat_pdf_drive_url') as HTMLInputElement).value.trim();

                              if (!th || !mm) {
                                alert("Please specify at least Thai Characters and Myanmar translation!");
                                return;
                              }

                              const newItem: VocabItem = {
                                thai: th,
                                phonetic: ph,
                                phoneticMm: phMm,
                                english: en,
                                myanmar: mm,
                                illustration: ill || '📙',
                                pdf_drive_url: pdfDriveUrl || undefined,
                                ...((url) ? { url } : {})
                              } as any;

                              // Pipe straight via Fetch API to D1 serverless functions
                              const fetchHeaders2 = {
                                 'Content-Type': 'application/json',
                                 'X-Static-Admin': 'true'
                               };
                               fetch('/api/d1-admin-deploy', {
                                 method: 'POST',
                                 headers: fetchHeaders2,
                                body: JSON.stringify({
                                   thai_text: th,
                                   thai: th,
                                   phonetic: ph,
                                   phoneticMm: phMm,
                                   english_text: en,
                                   english: en,
                                   myanmar_text: mm,
                                   myanmar: mm,
                                  audio_url: url || null,
                                  pdf_drive_url: pdfDriveUrl || null,
                                  illustration: ill || null
                                })
                              }).catch(err => console.error("D1 sync failed:", err));

                              const updatedCats = [...vocabBookCategories];
                              updatedCats[idxInArray].items = [...currentItems, newItem];
                              handleSaveVocabBookCategories(updatedCats);
                              form.reset();
                              addSystemLog('admin', `Added word "${th}" to custom Vocabulary List "${selectedCategory.name}"`);
                            }}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3"
                          >
                            <div className="sm:col-span-6 border-b border-gray-200 pb-1.5 flex items-center justify-between">
                              <span className="text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                ➕ Add Word to Vocab List: {selectedCategory.name}
                              </span>
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Thai Character *</label>
                              <input
                                name="cat_th"
                                type="text"
                                placeholder="สวัสดี"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                                required
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Phonetic [ENG]</label>
                              <input
                                name="cat_ph"
                                type="text"
                                placeholder="sawaatdee"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Phonetic [MM] / အသံထွက်</label>
                              <input
                                name="cat_phMm"
                                type="text"
                                placeholder="ဆဝပ်ဒီ"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">ENG English Translation</label>
                              <input
                                name="cat_en"
                                type="text"
                                placeholder="Hello"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">MM Myanmar Translation *</label>
                              <input
                                name="cat_mm"
                                type="text"
                                placeholder="မင်္ဂလာပါ"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                                required
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Audio / Sound URL</label>
                              <input
                                name="cat_url"
                                type="text"
                                placeholder="https://example.com/audio.mp3"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Illustration (Emoji or Image URL / base64)</label>
                              <input
                                id="new_cat_ill_value"
                                name="cat_ill"
                                type="text"
                                placeholder="🍎 or https://example.com/apple.png"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black mb-1"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Google Drive PDF URL</label>
                              <input
                                name="cat_pdf_drive_url"
                                type="text"
                                placeholder="https://drive.google.com/..."
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none bg-white text-black"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2 text-left">
                              <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Illustration Upload</label>
                              <div className="relative border border-dashed border-gray-300 hover:border-brand-purple rounded p-1 text-center cursor-pointer bg-white transition-all h-8 flex items-center justify-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        alert("Image file must be less than 2MB for high-performance LocalStorage storage.");
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target?.result && typeof event.target.result === 'string') {
                                          const inputElem = document.getElementById('new_cat_ill_value') as HTMLInputElement;
                                          if (inputElem) {
                                            inputElem.value = event.target.result;
                                          }
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <span className="text-[9px] font-sans font-bold text-gray-500 uppercase">📁 Choose File</span>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="sm:col-span-6 w-full bg-brand-purple text-white text-[11px] font-sans font-black py-2 rounded-lg mt-2 cursor-pointer hover:bg-brand-purple/90 transition-colors uppercase tracking-wider"
                            >
                              ➕ ADD WORD TO VOCAB LIST "${selectedCategory.name}"
                            </button>
                          </form>
                        </div>

                        {/* 3. Items list with inline editor */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="text-xs font-sans font-black text-brand-dark uppercase tracking-wide">
                              ⭐ List words in "${selectedCategory.name}" (${currentItems.length} words)
                            </span>
                            <span className="text-[9.5px] text-brand-muted font-sans font-bold">In-line Editing supported below</span>
                          </div>

                          <div className="space-y-2.5 max-h-[500px] overflow-y-auto border border-gray-150 rounded-xl p-3 bg-gray-50/30">
                            {currentItems.length === 0 ? (
                              <p className="text-center py-8 text-xs text-brand-muted font-bold font-sans">No vocabulary rows registered. Add some above!</p>
                            ) : (
                              currentItems.map((item, index) => {
                                const isEditing = editingCatItemIndex === index;
                                return (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans transition-all ${
                                      isEditing
                                        ? 'bg-amber-50/40 border-amber-200 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-gray-250 hover:shadow-xs'
                                    }`}
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 flex-1">
                                      {isEditing ? (
                                        <>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Thai Chars *</span>
                                            <input
                                              type="text"
                                              value={editingCatItemThai}
                                              onChange={(e) => setEditingCatItemThai(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Phonetic [ENG]</span>
                                            <input
                                              type="text"
                                              value={editingCatItemPhonetic}
                                              onChange={(e) => setEditingCatItemPhonetic(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Phonetic [MM]</span>
                                            <input
                                              type="text"
                                              value={editingCatItemPhoneticMm}
                                              onChange={(e) => setEditingCatItemPhoneticMm(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">ENG English</span>
                                            <input
                                              type="text"
                                              value={editingCatItemEnglish}
                                              onChange={(e) => setEditingCatItemEnglish(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">MM Myanmar *</span>
                                            <input
                                              type="text"
                                              value={editingCatItemMyanmar}
                                              onChange={(e) => setEditingCatItemMyanmar(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Sound Audio URL</span>
                                            <input
                                              type="text"
                                              value={editingCatItemUrl}
                                              onChange={(e) => setEditingCatItemUrl(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-2 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Illustration Text</span>
                                            <input
                                              type="text"
                                              value={editingCatItemIllustration}
                                              onChange={(e) => setEditingCatItemIllustration(e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-2 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Google Drive PDF URL</span>
                                            <input
                                              type="text"
                                              value={(item as any).pdf_drive_url || ''}
                                              onChange={(e) => {
                                                const updatedItems = [...currentItems];
                                                updatedItems[index] = {
                                                  ...updatedItems[index],
                                                  pdf_drive_url: e.target.value || undefined
                                                };
                                                const updatedCategories = [...vocabBookCategories];
                                                updatedCategories[idxInArray].items = updatedItems;
                                                handleSaveVocabBookCategories(updatedCategories);
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-black focus:border-brand-purple focus:outline-none bg-white"
                                            />
                                          </div>
                                          <div className="sm:col-span-2 text-left">
                                            <span className="text-[8px] font-black text-amber-600 block mb-0.5 uppercase">Replace Illus File</span>
                                            <div className="relative border border-dashed border-amber-300 hover:border-brand-purple rounded text-center cursor-pointer bg-white transition-all h-7 flex items-center justify-center">
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                      alert("Image file must be less than 2MB for high-performance LocalStorage storage.");
                                                      return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                      if (event.target?.result && typeof event.target.result === 'string') {
                                                        setEditingCatItemIllustration(event.target.result);
                                                      }
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                              />
                                              <span className="text-[9px] font-sans font-bold text-amber-600 uppercase">📁 Choose File</span>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">Thai Chars</span>
                                            <strong className="text-black text-sm">{item.thai}</strong>
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">Phonetic [ENG]</span>
                                            <span className="text-black italic">{item.phonetic || "-"}</span>
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">Phonetic [MM]</span>
                                            <span className="text-rose-600 font-bold">{item.phoneticMm || "-"}</span>
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">ENG English</span>
                                            <span className="text-black">{item.english || "-"}</span>
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">MM Myanmar</span>
                                            <span className="text-black font-semibold">{item.myanmar || "-"}</span>
                                          </div>
                                          <div className="sm:col-span-1 text-left">
                                            <span className="text-[8px] font-black text-brand-muted uppercase block">Illustration</span>
                                            {item.illustration && item.illustration.startsWith('data:') ? (
                                              <img src={item.illustration} referrerPolicy="no-referrer" alt={item.thai} className="w-8 h-8 rounded border object-contain bg-slate-50" />
                                            ) : item.illustration && item.illustration.startsWith('http') ? (
                                              <img src={item.illustration} referrerPolicy="no-referrer" alt={item.thai} className="w-8 h-8 rounded border object-contain bg-slate-50" />
                                            ) : (
                                              <span className="text-lg">{item.illustration || "📙"}</span>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Action buttons inside list entries */}
                                    <div className="flex md:flex-col lg:flex-row items-center gap-1.5 shrink-0 self-start md:self-center">
                                      {isEditing ? (
                                        <>
                                          <button
                                            onClick={() => {
                                              if (!editingCatItemThai.trim() || !editingCatItemMyanmar.trim()) {
                                                alert("Please specify at least Thai characters and Myanmar translation!");
                                                return;
                                              }
                                              const updatedItems = [...currentItems];
                                              const updatedVoiceUrl = editingCatItemUrl.trim();
                                              updatedItems[index] = {
                                                thai: editingCatItemThai.trim(),
                                                phonetic: editingCatItemPhonetic.trim(),
                                                phoneticMm: editingCatItemPhoneticMm.trim(),
                                                english: editingCatItemEnglish.trim(),
                                                myanmar: editingCatItemMyanmar.trim(),
                                                illustration: editingCatItemIllustration.trim() || '📙',
                                                pdf_drive_url: updatedItems[index].pdf_drive_url,
                                                ...((updatedVoiceUrl) ? { url: updatedVoiceUrl } : {})
                                              } as any;
                                              const updatedCategories = [...vocabBookCategories];
                                              updatedCategories[idxInArray].items = updatedItems;
                                              handleSaveVocabBookCategories(updatedCategories);
                                              setEditingCatItemIndex(null);
                                              addSystemLog('admin', `Updated details for word "${editingCatItemThai}" in vocabulary list`);
                                            }}
                                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-sans font-black text-[10px] rounded uppercase cursor-pointer transition-colors"
                                          >
                                            💾 Save
                                          </button>
                                          <button
                                            onClick={() => setEditingCatItemIndex(null)}
                                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-sans font-black text-[10px] rounded uppercase cursor-pointer transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {(item.audio_url || (item as any).url) && (
                                            <button
                                              onClick={() => {
                                                const audioUrl = item.audio_url || (item as any).url;
                                                playGlobalAudio(audioUrl);
                                              }}
                                              className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-brand-purple rounded text-[10px] uppercase font-bold cursor-pointer"
                                              title="Test Pronunciation Voice Audio"
                                            >
                                              🔊 Play
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setEditingCatItemIndex(index);
                                              setEditingCatItemThai(item.thai);
                                              setEditingCatItemPhonetic(item.phonetic || '');
                                              setEditingCatItemPhoneticMm(item.phoneticMm || '');
                                              setEditingCatItemEnglish(item.english || '');
                                              setEditingCatItemMyanmar(item.myanmar || '');
                                              setEditingCatItemIllustration(item.illustration || '📙');
                                              setEditingCatItemUrl(item.audio_url || (item as any).url || '');
                                            }}
                                            className="p-1 px-2 border border-gray-200 hover:bg-slate-50 text-blue-600 rounded text-[10px] uppercase font-bold cursor-pointer"
                                          >
                                            ✏️ Edit
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (window.confirm(`Are you sure you want to remove word "${item.thai}" from this Vocabulary List?`)) {
                                                const updatedItems = currentItems.filter((_, i) => i !== index);
                                                const updatedCategories = [...vocabBookCategories];
                                                updatedCategories[idxInArray].items = updatedItems;
                                                handleSaveVocabBookCategories(updatedCategories);
                                                addSystemLog('admin', `Removed word "${item.thai}" from custom Vocabulary List "${selectedCategory.name}"`);
                                              }
                                            }}
                                            className="p-1 px-2 border border-red-200 hover:bg-red-50 text-red-600 rounded text-[10px] uppercase font-bold cursor-pointer"
                                          >
                                            🗑️ Del
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Selected lesson edits section */}
                  {adminSelectedLessonId && (() => {
                    const selectedLesson = lessons.find(l => l.id === adminSelectedLessonId);
                    if (!selectedLesson) return <p className="text-xs text-brand-muted font-bold font-sans">Selected lesson metadata corrupt.</p>;

                    return (
                      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                        {/* Sub-tab navigation bar */}
                        <div className="flex flex-wrap bg-gray-50 border-b border-gray-200">
                          {([
                            { id: 'metadata', label: '📝 METADATA' },
                            { id: 'vocabulary', label: '📖 VOCABULARY ({wordsCount})' },
                            { id: 'dialogue', label: '💬 DIALOGUE' },
                            { id: 'grammar', label: '🧠 GRAMMAR ({grammarCount})' },
                            { id: 'quiz', label: '⚡ QUIZZES ({quizCount})' }
                          ] as const).map((tab) => {
                            let labelText: string = tab.label;
                            if (tab.id === 'vocabulary') {
                              const wordsList = getCustomVocabList(selectedLesson.id);
                              labelText = tab.label.replace('{wordsCount}', String(wordsList.length));
                            } else if (tab.id === 'grammar') {
                              labelText = tab.label.replace('{grammarCount}', String((selectedLesson.grammarNotes || []).length));
                            } else if (tab.id === 'quiz') {
                              labelText = tab.label.replace('{quizCount}', String((selectedLesson.quiz || []).length));
                            }
                            const isActive = adminEditTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setAdminEditTab(tab.id)}
                                className={`px-4 py-2.5 text-[10px] font-sans font-black tracking-wider transition-all border-r border-gray-200 cursor-pointer ${
                                  isActive
                                    ? 'bg-white text-brand-purple border-t-2 border-t-brand-purple font-extrabold focus:outline-none'
                                    : 'text-brand-muted hover:bg-gray-100 hover:text-brand-dark'
                                }`}
                              >
                                {labelText}
                              </button>
                            );
                          })}
                        </div>

                        {curriculumToast && (
                          <div className={`p-3.5 mx-4 mt-3 rounded-xl border text-xs font-sans font-bold flex items-center justify-between shadow-sm animate-fade-in ${
                            curriculumToast.type === 'success' 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                              : 'bg-rose-50 border-rose-300 text-rose-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-base">{curriculumToast.type === 'success' ? '✅' : '❌'}</span>
                              <span>{curriculumToast.message}</span>
                            </div>
                            <button 
                              onClick={() => setCurriculumToast(null)} 
                              className="text-xs text-gray-500 hover:text-gray-700 font-black cursor-pointer px-1"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <div className="p-4 sm:p-5 space-y-4">
                          
                          {/* SUB-TAB 1: METADATA */}
                          {adminEditTab === 'metadata' && (
                            <div className="space-y-4 animate-fade-in">
                              <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider border-b pb-1.5 text-brand-purple">
                                Basic Metadata Configuration • အခြေခံအချက်အလက်များ ပြင်ဆင်ရန်
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">English Title</label>
                                  <input
                                    type="text"
                                    value={selectedLesson.titleEnglish}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'titleEnglish', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">Thai Title</label>
                                  <input
                                    type="text"
                                    value={selectedLesson.titleThai}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'titleThai', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">Phonetic Title (Pronunciation)</label>
                                  <input
                                    type="text"
                                    value={selectedLesson.titlePhonetic}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'titlePhonetic', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">Myanmar Title</label>
                                  <input
                                    type="text"
                                    value={selectedLesson.titleMyanmar}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'titleMyanmar', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">Myanmar Title Phonetic</label>
                                  <input
                                    type="text"
                                    value={selectedLesson.titleMyanmarPhonetic || ''}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'titleMyanmarPhonetic', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                    placeholder="e.g. အသံထွက် ညွှန်းလှန်ချက်"
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="block text-[10px] font-sans font-black text-brand-purple uppercase tracking-wider">Assigned Language Course</label>
                                  <select
                                    value={selectedLesson.courseId || 'course-basic'}
                                    onChange={(e) => updateLessonField(selectedLesson.id, 'courseId', e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-brand-purple/20 rounded-lg text-xs font-black font-sans text-brand-purple focus:border-brand-purple focus:outline-none cursor-pointer bg-white"
                                  >
                                    {Array.isArray(courses) ? courses.map(c => (
                                      <option key={c.id} value={c.id}>
                                        🎓 {c.name} ({c.id})
                                      </option>
                                    )) : null}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">English Short Description</label>
                                <textarea
                                  value={selectedLesson.descriptionEnglish}
                                  onChange={(e) => updateLessonField(selectedLesson.id, 'descriptionEnglish', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">Myanmar Short Description</label>
                                <textarea
                                  value={selectedLesson.descriptionMyanmar}
                                  onChange={(e) => updateLessonField(selectedLesson.id, 'descriptionMyanmar', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none"
                                />
                              </div>

                              <button
                                onClick={() => handleSaveLessonMetadata(selectedLesson.id)}
                                className="w-full bg-brand-purple text-white text-[11px] font-sans font-black py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-brand-purple/90 transition-colors shadow-xs"
                              >
                                💾 SAVE LESSON METADATA TO D1
                              </button>
                            </div>
                          )}

                          {/* SUB-TAB 2: VOCABULARY */}
                          {adminEditTab === 'vocabulary' && (() => {
                            const currentVocab = getCustomVocabList(selectedLesson.id);
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                  <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider border-b pb-1.5 text-brand-purple">
                                    Vocabulary Drills Database • ဝေါဟာရပြင်ဆင်ရန်
                                  </h5>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-brand-muted font-bold">
                                      {currentVocab.length} words registered
                                    </span>
                                    <button
                                      onClick={() => handleSaveVocabList(selectedLesson.id, currentVocab)}
                                      className="px-3 py-1.5 bg-brand-green text-white text-[10px] font-sans font-black rounded-lg uppercase tracking-wider cursor-pointer hover:bg-brand-green/90 transition-colors shadow-2xs"
                                    >
                                      💾 SAVE VOCABULARY TO D1
                                    </button>
                                  </div>
                                </div>

                                {/* Add vocabulary word helper inline card */}
                                <form
                                   onSubmit={(e) => {
                                     e.preventDefault();
                                     const form = e.currentTarget;
                                     const thai = (form.elements.namedItem('th') as HTMLInputElement).value.trim();
                                     const phonetic = (form.elements.namedItem('ph') as HTMLInputElement).value.trim();
                                     const english = (form.elements.namedItem('en') as HTMLInputElement).value.trim();
                                     const myanmar = (form.elements.namedItem('mm') as HTMLInputElement).value.trim();
                                     const mPhonetic = (form.elements.namedItem('mpp') as HTMLInputElement).value.trim();
                                     const pos = (form.elements.namedItem('pos') as HTMLSelectElement).value;
                                     const url = (form.elements.namedItem('url') as HTMLInputElement).value.trim();
                                     const pdfDriveUrl = (form.elements.namedItem('pdf_drive_url') as HTMLInputElement).value.trim();
                                     const categoryStr = (form.elements.namedItem('category') as HTMLInputElement).value.trim() || `Lesson ${selectedLesson.id}`;

                                     if (!thai || !myanmar) {
                                       alert("Please specify at least Thai Characters and Myanmar translation!");
                                       return;
                                     }

                                     const newWord: WordBreakdown = { 
                                       thai, 
                                       phonetic, 
                                       english, 
                                       myanmar, 
                                       myanmarPhonetic: mPhonetic || undefined, 
                                       partOfSpeech: pos,
                                       audioUrl: url || undefined,
                                       pdf_drive_url: pdfDriveUrl || undefined
                                     };

                                     // Pipe straight via Fetch API to integrated D1 serverless routing functions
                                     const fetchHeaders3 = {
                                        'Content-Type': 'application/json',
                                        'X-Static-Admin': 'true'
                                      };
                                      fetch('/api/d1-admin-deploy', {
                                        method: 'POST',
                                        headers: fetchHeaders3,
                                       body: JSON.stringify({
                                         thai_text: thai,
                                         phonetic: phonetic,
                                         phonetic_mm: mPhonetic || null,
                                         english_text: english,
                                         myanmar_text: myanmar,
                                         category: categoryStr,
                                         audio_url: url || null,
                                         pdf_drive_url: pdfDriveUrl || null,
                                         illustration: null
                                       })
                                     }).catch(err => console.error("D1 sync failed:", err));

                                     const updated = [...currentVocab, newWord];
                                     handleSaveVocabList(selectedLesson.id, updated);
                                     form.reset();
                                   }}
                                   className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-6 gap-3"
                                 >
                                   <div className="sm:col-span-6 border-b border-gray-200 pb-1.5 mb-1 flex items-center justify-between">
                                     <span className="text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                                       ➕ Add Word to Lesson Vocabulary List
                                     </span>
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Thai Word</label>
                                     <input
                                       name="th"
                                       type="text"
                                       placeholder="สวัสดี"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                       required
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Phonetic</label>
                                     <input
                                       name="ph"
                                       type="text"
                                       placeholder="sa-wat-dee"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">English</label>
                                     <input
                                       name="en"
                                       type="text"
                                       placeholder="Hello"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Myanmar</label>
                                     <input
                                       name="mm"
                                       type="text"
                                       placeholder="မင်္ဂလာပါ"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                       required
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Myan Phonetic</label>
                                     <input
                                       name="mpp"
                                       type="text"
                                       placeholder="မင်-ဂလာ-ပါ"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Part of Speech</label>
                                     <select name="pos" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold bg-white cursor-pointer focus:border-brand-purple focus:outline-none">
                                       <option value="noun">noun (နာမ်)</option>
                                       <option value="verb">verb (ကြိယာ)</option>
                                       <option value="adjective">adjective (နာမဝိသေသန)</option>
                                       <option value="pronoun">pronoun (နာမ်စား)</option>
                                       <option value="particle">particle (စကားလုံးနောက်ဆက်)</option>
                                       <option value="phrase">phrase (စကားစု)</option>
                                       <option value="interjection">interjection (အာမေဍိတ်)</option>
                                     </select>
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Audio / Sound URL</label>
                                     <input
                                       name="url"
                                       type="text"
                                       placeholder="https://example.com/audio.mp3"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>

                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Google Drive PDF URL</label>
                                     <input
                                       name="pdf_drive_url"
                                       type="text"
                                       placeholder="https://drive.google.com/..."
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>
                                   
                                   <div className="space-y-1">
                                     <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Category / Tag</label>
                                     <input
                                       name="category"
                                       type="text"
                                       placeholder="e.g. Basic Greetings"
                                       className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs font-semibold focus:border-brand-purple focus:outline-none"
                                     />
                                   </div>

                                   <button
                                     type="submit"
                                     className="sm:col-span-6 w-full bg-brand-purple text-white text-[11px] font-sans font-black py-2 rounded-lg mt-2 cursor-pointer hover:bg-brand-purple/90 transition-colors uppercase tracking-wider"
                                   >
                                     ➕ ADD WORD TO LESSON {selectedLesson.id}
                                   </button>
                                 </form>

                                 {/* List of current word database */}
                                 <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2.5 bg-gray-50/20">
                                   {currentVocab.length === 0 ? (
                                     <p className="text-center py-6 text-xs text-brand-muted font-bold font-sans">No vocabulary entries. Add some above!</p>
                                   ) : (
                                     currentVocab.map((w, index) => {
                                       const isEditing = editingVocabIndex === index;
                                       return (
                                         <div
                                           key={index}
                                           draggable={!isEditing}
                                           onDragStart={(e) => handleDragStart(e, index, 'vocab')}
                                           onDragOver={(e) => handleDragOver(e, index)}
                                           onDragEnd={handleDragEnd}
                                           onDrop={(e) => handleDrop(e, index, 'vocab')}
                                           className={`p-2.5 rounded-lg border-2 flex items-center justify-between gap-4 text-xs font-sans transition-all ${
                                             isEditing
                                               ? 'bg-amber-50/40 border-amber-200 shadow-md'
                                               : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs cursor-grab active:cursor-grabbing'
                                           } ${
                                             draggedItemType === 'vocab' && dragOverTargetIndex === index
                                               ? 'border-brand-purple border-dashed bg-brand-purple-light/10 scale-[0.98]'
                                               : ''
                                           } ${
                                             draggedItemType === 'vocab' && draggedItemIndex === index ? 'opacity-40 scale-[0.98]' : ''
                                           }`}
                                         >
                                           {!isEditing && (
                                             <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0 select-none cursor-grab active:cursor-grabbing hover:text-brand-purple" />
                                           )}
                                           <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 flex-1">
                                             {isEditing ? (
                                               <>
                                                 <div>
                                                   <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">Thai *</span>
                                                   <input
                                                     type="text"
                                                     value={editingVocabThai}
                                                     onChange={(e) => setEditingVocabThai(e.target.value)}
                                                     className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none bg-white"
                                                   />
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">Phonetic</span>
                                                   <input
                                                     type="text"
                                                     value={editingVocabPhonetic}
                                                     onChange={(e) => setEditingVocabPhonetic(e.target.value)}
                                                     className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-brand-dark focus:border-brand-purple focus:outline-none bg-white font-semibold"
                                                   />
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">English</span>
                                                   <input
                                                     type="text"
                                                     value={editingVocabEnglish}
                                                     onChange={(e) => setEditingVocabEnglish(e.target.value)}
                                                     className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-brand-dark focus:border-brand-purple focus:outline-none bg-white"
                                                   />
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">Myanmar // POS *</span>
                                                   <input
                                                     type="text"
                                                     value={editingVocabMyanmar}
                                                     onChange={(e) => setEditingVocabMyanmar(e.target.value)}
                                                     className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none bg-white mb-1.5"
                                                   />
                                                   <select
                                                     value={editingVocabPos}
                                                     onChange={(e) => setEditingVocabPos(e.target.value)}
                                                     className="w-full px-1.5 py-1 border border-gray-300 rounded text-[9px] uppercase font-bold font-sans text-brand-purple focus:border-brand-purple focus:outline-none bg-white"
                                                   >
                                                     <option value="noun">noun (နာမ်)</option>
                                                     <option value="verb">verb (ကြိယာ)</option>
                                                     <option value="adjective">adjective (နာမဝိသေသန)</option>
                                                     <option value="pronoun">pronoun (နာမ်စား)</option>
                                                     <option value="particle">particle (စကားလုံးနောက်ဆက်)</option>
                                                     <option value="phrase">phrase (စကားစု)</option>
                                                     <option value="interjection">interjection (အာမေဍိတ်)</option>
                                                   </select>
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-amber-600 uppercase block mb-0.5">Myan Phonetic</span>
                                                   <input
                                                     type="text"
                                                     value={editingVocabMyanmarPhonetic}
                                                     onChange={(e) => setEditingVocabMyanmarPhonetic(e.target.value)}
                                                     className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-sans text-brand-dark focus:border-brand-purple focus:outline-none bg-white font-semibold"
                                                   />
                                                 </div>
                                               </>
                                             ) : (
                                               <>
                                                 <div>
                                                   <span className="text-[8px] font-black text-brand-muted uppercase block">Thai</span>
                                                   <strong className="text-brand-dark text-sm">{w.thai}</strong>
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-brand-muted uppercase block">Phonetic</span>
                                                   <span className="text-brand-dark italic">{w.phonetic || "-"}</span>
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-brand-muted uppercase block">English Meaning</span>
                                                   <span className="text-brand-dark">{w.english || "-"}</span>
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-brand-muted uppercase block">Myanmar // POS</span>
                                                   <span className="text-brand-dark block font-bold">{w.myanmar}</span>
                                                   <span className="text-[9px] uppercase font-bold text-brand-purple bg-brand-purple-light/40 px-1 py-0.5 rounded w-fit block mt-0.5">{w.partOfSpeech}</span>
                                                 </div>
                                                 <div>
                                                   <span className="text-[8px] font-black text-brand-muted uppercase block">Myan Phonetic</span>
                                                   <span className="text-emerald-600 font-bold block">{w.myanmarPhonetic || getMyanmarPhonetic(w.phonetic || '')}</span>
                                                 </div>
                                               </>
                                             )}
                                           </div>

                                           <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                                             {isEditing ? (
                                               <>
                                                 <button
                                                   onClick={() => {
                                                     if (!editingVocabThai.trim() || !editingVocabMyanmar.trim()) {
                                                       alert("Please specify at least Thai characters and Myanmar translation!");
                                                       return;
                                                     }
                                                     const updated = [...currentVocab];
                                                     updated[index] = {
                                                       thai: editingVocabThai.trim(),
                                                       phonetic: editingVocabPhonetic.trim(),
                                                       english: editingVocabEnglish.trim(),
                                                       myanmar: editingVocabMyanmar.trim(),
                                                       myanmarPhonetic: editingVocabMyanmarPhonetic.trim() || undefined,
                                                       partOfSpeech: editingVocabPos as any
                                                     };
                                                     handleSaveVocabList(selectedLesson.id, updated);
                                                     setEditingVocabIndex(null);
                                                   }}
                                                   className="p-1.5 bg-brand-green hover:bg-brand-green/90 text-white rounded cursor-pointer transition-colors"
                                                   title="Keep Edits"
                                                 >
                                                   <Check className="w-3.5 h-3.5" />
                                                 </button>
                                                 <button
                                                   onClick={() => setEditingVocabIndex(null)}
                                                   className="p-1.5 bg-gray-150 hover:bg-gray-200 text-gray-600 rounded cursor-pointer transition-colors"
                                                   title="Discard Edits"
                                                 >
                                                   <X className="w-3.5 h-3.5" />
                                                 </button>
                                               </>
                                             ) : (
                                               <>
                                                 <button
                                                   onClick={() => {
                                                     setEditingVocabIndex(index);
                                                     setEditingVocabThai(w.thai);
                                                     setEditingVocabPhonetic(w.phonetic || '');
                                                     setEditingVocabEnglish(w.english || '');
                                                     setEditingVocabMyanmar(w.myanmar);
                                                     setEditingVocabMyanmarPhonetic(w.myanmarPhonetic || '');
                                                     setEditingVocabPos(w.partOfSpeech || 'noun');
                                                   }}
                                                   className="p-1.5 hover:bg-gray-100 text-brand-purple rounded cursor-pointer transition-colors"
                                                   title="Edit word entry"
                                                 >
                                                   <Pencil className="w-3.5 h-3.5" />
                                                 </button>
                                                 <button
                                                   onClick={() => {
                                                     const confirmed = window.confirm(`Are you sure you want to delete the word "${w.thai}"?`);
                                                     if (confirmed) {
                                                       const updated = currentVocab.filter((_, i) => i !== index);
                                                       handleSaveVocabList(selectedLesson.id, updated);
                                                     }
                                                   }}
                                                   className="p-1.5 hover:bg-red-50 text-red-500 rounded cursor-pointer transition-colors"
                                                   title="Delete Word"
                                                 >
                                                   <Trash2 className="w-3.5 h-3.5" />
                                                 </button>
                                               </>
                                             )}
                                           </div>
                                         </div>
                                       );
                                     })
                                   )}
                                 </div>
                              </div>
                            );
                          })()}

                          {/* SUB-TAB 3: DIALOGUE */}
                          {adminEditTab === 'dialogue' && (() => {
                            const currentDialogue = [...(selectedLesson.dialogue || [])];
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between gap-4">
                                  <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider border-b pb-1.5 text-brand-purple">
                                    Dialogue Configuration Builder • စကားပြောခန်းများ ပြင်ဆင်ရန်
                                  </h5>
                                  <button
                                    onClick={() => {
                                      const newLine: DialogueLine = {
                                        speaker: "A",
                                        thai: "สบายดีครับ",
                                        phonetic: "sa-baai-dee khráp",
                                        english: "I am fine.",
                                        myanmar: "နေကောင်းပါတယ်ခင်ဗျာ",
                                        words: []
                                      };
                                      handleSaveDialogue(selectedLesson.id, [...currentDialogue, newLine]);
                                    }}
                                    className="px-3 py-1 bg-brand-purple text-white text-[10px] font-sans font-black rounded-lg flex items-center gap-1 cursor-pointer hover:bg-brand-purple/90"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    ADD LINE
                                  </button>
                                </div>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 bg-gray-50/50 rounded-xl border p-2">
                                  {/* Dialogue Video Practice URL (Optional) whole lesson practice input before any dialogue cards */}
                                  <div className="bg-white p-3.5 rounded-xl border border-brand-purple/20 hover:border-brand-purple/40 transition-colors space-y-2 shadow-2xs">
                                    <label className="block text-[10px] font-sans font-black text-brand-purple uppercase tracking-wider flex items-center gap-1.5">
                                      <span>🎥 Dialogue Video Practice URL (Optional)</span>
                                      <span className="text-[8px] bg-brand-purple-light text-brand-purple px-1.5 py-0.5 rounded font-bold uppercase select-none">Whole Lesson Practice</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={selectedLesson.wholeDialogueVideoUrl || ''}
                                      onChange={(e) => updateLessonField(selectedLesson.id, 'wholeDialogueVideoUrl', e.target.value)}
                                      placeholder="e.g. YouTube embed URL (https://www.youtube.com/embed/...)"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none placeholder-gray-400"
                                    />
                                    <p className="text-[8.5px] font-sans text-brand-muted font-medium">
                                      Provide a video URL (e.g. YouTube iframe embed version) to play a full conversational practice sequence of the active dialogue.
                                    </p>
                                  </div>

                                  {currentDialogue.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-brand-muted font-bold font-sans">No dialogue lines configured. Click Add above!</p>
                                  ) : (
                                    currentDialogue.map((dl, index) => (
                                      <div
                                        key={index}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'dialogue')}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, index, 'dialogue')}
                                        className={`bg-white border-2 rounded-xl p-4 space-y-3 relative shadow-xs cursor-grab active:cursor-grabbing transition-all ${
                                          draggedItemType === 'dialogue' && dragOverTargetIndex === index
                                            ? 'border-brand-purple border-dashed bg-brand-purple-light/10 scale-[0.98]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${
                                          draggedItemType === 'dialogue' && draggedItemIndex === index ? 'opacity-40 scale-[0.98]' : ''
                                        }`}
                                      >
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                          <div className="text-[9px] font-sans font-black text-brand-muted uppercase bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 select-none pointer-events-none">
                                            <GripVertical className="w-3 h-3 text-gray-400" />
                                            LINE {index + 1}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updated = currentDialogue.filter((_, i) => i !== index);
                                              handleSaveDialogue(selectedLesson.id, updated);
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Delete line"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                          <div className="space-y-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Speaker</label>
                                            <input
                                              type="text"
                                              value={dl.speaker}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].speaker = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Thai text</label>
                                            <input
                                              type="text"
                                              value={dl.thai}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].thai = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Phonetic</label>
                                            <input
                                              type="text"
                                              value={dl.phonetic}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].phonetic = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">English Meaning</label>
                                            <input
                                              type="text"
                                              value={dl.english}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].english = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-3">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Myanmar Translation</label>
                                            <input
                                              type="text"
                                              value={dl.myanmar}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].myanmar = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-5 border-t border-gray-100 pt-2 mt-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-purple uppercase flex items-center gap-1.5">
                                              <span>📹 Line Speaker Video URL (Optional)</span>
                                              <span className="text-[8px] bg-brand-purple-light text-brand-purple px-1 py-0.2 rounded font-bold uppercase select-none">Dual-Speaker Line Video</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={dl.videoUrl || ''}
                                              onChange={(e) => {
                                                const updated = [...currentDialogue];
                                                updated[index].videoUrl = e.target.value || undefined;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, dialogue: updated } : l));
                                              }}
                                              placeholder="e.g. video URL (direct .mp4 link)"
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none placeholder-gray-400"
                                            />
                                            <p className="text-[8px] font-sans text-brand-muted mt-0.5 font-medium leading-none">
                                              Specify a custom speaker-specific loop or demonstration video for this dialogue line.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <button
                                  onClick={() => handleSaveDialogue(selectedLesson.id, currentDialogue)}
                                  className="w-full bg-brand-green text-white text-[11px] font-sans font-black py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-brand-green/90 transition-colors"
                                >
                                  💾 SAVE DIALOGUE CONFIGURATION
                                </button>
                              </div>
                            );
                          })()}

                          {/* SUB-TAB 4: GRAMMAR */}
                          {adminEditTab === 'grammar' && (() => {
                            const currentGrammar = [...(selectedLesson.grammarNotes || [])];
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between gap-4">
                                  <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider border-b pb-1.5 text-brand-purple">
                                    Grammar Notes Rules Engine • သဒ္ဒါစည်းမျဉ်းများ ပြင်ဆင်ရန်
                                  </h5>
                                  <button
                                    onClick={() => {
                                      const newGrammar: GrammarNote = {
                                        title: "New Grammar Point",
                                        titleMyanmar: "သဒ္ဒါအချက်အလတ်သစ်",
                                        explanation: "Explanation in English context.",
                                        explanationMyanmar: "မြန်မာလိုရှင်းလင်းချက် အကျဉ်းချုပ်။",
                                        examples: []
                                      };
                                      handleSaveGrammarNotes(selectedLesson.id, [...currentGrammar, newGrammar]);
                                    }}
                                    className="px-3 py-1 bg-brand-purple text-white text-[10px] font-sans font-black rounded-lg flex items-center gap-1 cursor-pointer hover:bg-brand-purple/90"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    ADD GRAMMAR POINT
                                  </button>
                                </div>

                                <div className="space-y-6 max-h-[500px] overflow-y-auto p-1 bg-gray-50/50 border rounded-xl p-2">
                                  {currentGrammar.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-brand-muted font-bold font-sans">No grammar notes configured. Click Add above!</p>
                                  ) : (
                                    currentGrammar.map((gn, index) => (
                                      <div
                                        key={index}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'grammar')}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, index, 'grammar')}
                                        className={`bg-white border-2 rounded-xl p-4 space-y-4 relative shadow-sm cursor-grab active:cursor-grabbing transition-all ${
                                          draggedItemType === 'grammar' && dragOverTargetIndex === index
                                            ? 'border-brand-purple border-dashed bg-brand-purple-light/10 scale-[0.98]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${
                                          draggedItemType === 'grammar' && draggedItemIndex === index ? 'opacity-40 scale-[0.98]' : ''
                                        }`}
                                      >
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                          <div className="text-[9px] font-sans font-black text-brand-muted uppercase bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 select-none pointer-events-none">
                                            <GripVertical className="w-3 h-3 text-gray-400" />
                                            RULE {index + 1}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updated = currentGrammar.filter((_, i) => i !== index);
                                              handleSaveGrammarNotes(selectedLesson.id, updated);
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Grammar Notes"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Grammar Title (English)</label>
                                            <input
                                              type="text"
                                              value={gn.title}
                                              onChange={(e) => {
                                                const updated = [...currentGrammar];
                                                updated[index].title = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Grammar Title (Myanmar)</label>
                                            <input
                                              type="text"
                                              value={gn.titleMyanmar}
                                              onChange={(e) => {
                                                const updated = [...currentGrammar];
                                                updated[index].titleMyanmar = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">English Explanation</label>
                                            <textarea
                                              value={gn.explanation}
                                              onChange={(e) => {
                                                const updated = [...currentGrammar];
                                                updated[index].explanation = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                              }}
                                              rows={2}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Myanmar Explanation</label>
                                            <textarea
                                              value={gn.explanationMyanmar}
                                              onChange={(e) => {
                                                const updated = [...currentGrammar];
                                                updated[index].explanationMyanmar = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                              }}
                                              rows={2}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>
                                        </div>

                                        {/* Examples for this Grammar Note */}
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                                          <div className="flex items-center justify-between gap-2 border-b border-gray-250 pb-1.5">
                                            <span className="text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider flex items-center gap-1">
                                              <CheckCircle className="w-3.5 h-3.5 text-brand-green" />
                                              Grammar Examples ({gn.examples?.length || 0}) (Must include exactly 6 for best performance!)
                                            </span>
                                            <button
                                              onClick={() => {
                                                const updated = [...currentGrammar];
                                                if (!updated[index].examples) updated[index].examples = [];
                                                updated[index].examples.push({
                                                  thai: "ไทย",
                                                  phonetic: "thai",
                                                  english: "Thai language",
                                                  myanmar: "ထိုင်းစကား"
                                                });
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                              }}
                                              className="px-2 py-1 bg-brand-purple-light text-brand-purple text-[9px] font-sans font-black rounded cursor-pointer hover:bg-brand-purple/10"
                                            >
                                              ➕ ADD EXAMPLE ROW
                                            </button>
                                          </div>

                                          <div className="space-y-2">
                                            {(!gn.examples || gn.examples.length === 0) ? (
                                              <p className="text-[10px] text-brand-muted font-bold block text-center">No grammatical examples defined.</p>
                                            ) : (
                                              gn.examples.map((ex, exIdx) => (
                                                <div key={exIdx} className="bg-white p-2 rounded border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-2 relative">
                                                  <button
                                                    onClick={() => {
                                                      const updated = [...currentGrammar];
                                                      updated[index].examples = updated[index].examples.filter((_, i) => i !== exIdx);
                                                      setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                                    }}
                                                    className="absolute -top-1 -right-1 bg-red-100 text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black cursor-pointer shadow-xs hover:bg-red-200"
                                                    title="Delete Example"
                                                  >
                                                    ×
                                                  </button>

                                                  <div>
                                                    <span className="text-[7.5px] font-black text-brand-muted uppercase block">Thai</span>
                                                    <input
                                                      type="text"
                                                      placeholder="Thai"
                                                      value={ex.thai}
                                                      onChange={(e) => {
                                                        const updated = [...currentGrammar];
                                                        updated[index].examples[exIdx].thai = e.target.value;
                                                        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                                      }}
                                                      className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs text-brand-dark font-semibold mt-0.5"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-[7.5px] font-black text-brand-muted uppercase block">Phonetic</span>
                                                    <input
                                                      type="text"
                                                      placeholder="Phonetic"
                                                      value={ex.phonetic}
                                                      onChange={(e) => {
                                                        const updated = [...currentGrammar];
                                                        updated[index].examples[exIdx].phonetic = e.target.value;
                                                        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                                      }}
                                                      className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs text-brand-dark font-semibold mt-0.5"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-[7.5px] font-black text-brand-muted uppercase block">English</span>
                                                    <input
                                                      type="text"
                                                      placeholder="English"
                                                      value={ex.english}
                                                      onChange={(e) => {
                                                        const updated = [...currentGrammar];
                                                        updated[index].examples[exIdx].english = e.target.value;
                                                        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                                      }}
                                                      className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs text-brand-dark font-semibold mt-0.5"
                                                    />
                                                  </div>
                                                  <div>
                                                    <span className="text-[7.5px] font-black text-brand-muted uppercase block">Myanmar</span>
                                                    <input
                                                      type="text"
                                                      placeholder="Myanmar"
                                                      value={ex.myanmar}
                                                      onChange={(e) => {
                                                        const updated = [...currentGrammar];
                                                        updated[index].examples[exIdx].myanmar = e.target.value;
                                                        setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, grammarNotes: updated } : l));
                                                      }}
                                                      className="w-full px-1.5 py-0.5 border border-gray-200 rounded text-xs text-brand-dark font-semibold mt-0.5"
                                                    />
                                                  </div>
                                                </div>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <button
                                  onClick={() => handleSaveGrammarNotes(selectedLesson.id, currentGrammar)}
                                  className="w-full bg-brand-green text-white text-[11px] font-sans font-black py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-brand-green/90 transition-colors"
                                >
                                  💾 SAVE GRAMMAR RULES
                                </button>
                              </div>
                            );
                          })()}

                          {/* SUB-TAB 5: QUIZZES */}
                          {adminEditTab === 'quiz' && (() => {
                            const currentQuiz = [...(selectedLesson.quiz || [])];
                            return (
                              <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between gap-4">
                                  <h5 className="text-xs font-sans font-black text-brand-dark uppercase tracking-wider border-b pb-1.5 text-brand-purple">
                                    Interactive Quizzes Database • ပဟေဠိမေးခွန်းများ ပြင်ဆင်ရန်
                                  </h5>
                                  <button
                                    onClick={() => {
                                      const newQuiz: QuizQuestion = {
                                        id: "quiz-" + Date.now() + "-" + (currentQuiz.length + 1),
                                        type: "translate-thai-to-mm",
                                        prompt: "What is the correct translation?",
                                        options: ["Choice A", "Choice B", "Choice C", "Choice D"],
                                        correctAnswer: "Choice A",
                                        explanation: "Explanation",
                                        explanationMyanmar: "ရှင်းလင်းချက်"
                                      };
                                      handleSaveQuizzes(selectedLesson.id, [...currentQuiz, newQuiz]);
                                    }}
                                    className="px-3 py-1 bg-brand-purple text-white text-[10px] font-sans font-black rounded-lg flex items-center gap-1 cursor-pointer hover:bg-brand-purple/90"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    ADD QUIZ QUESTION
                                  </button>
                                </div>

                                <div className="space-y-6 max-h-[500px] overflow-y-auto p-1 bg-gray-50/50 border rounded-xl p-2">
                                  {currentQuiz.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-brand-muted font-bold font-sans">No quizzes configured. Click Add above!</p>
                                  ) : (
                                    currentQuiz.map((qz, index) => (
                                      <div
                                        key={qz.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index, 'quiz')}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, index, 'quiz')}
                                        className={`bg-white border-2 rounded-xl p-4 space-y-3 relative shadow-xs cursor-grab active:cursor-grabbing transition-all ${
                                          draggedItemType === 'quiz' && dragOverTargetIndex === index
                                            ? 'border-brand-purple border-dashed bg-brand-purple-light/10 scale-[0.98]'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } ${
                                          draggedItemType === 'quiz' && draggedItemIndex === index ? 'opacity-40 scale-[0.98]' : ''
                                        }`}
                                      >
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                          <div className="text-[9px] font-sans font-black text-brand-muted uppercase bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg flex items-center gap-1 select-none pointer-events-none">
                                            <GripVertical className="w-3 h-3 text-gray-400" />
                                            QUIZ {index + 1}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updated = currentQuiz.filter((_, i) => i !== index);
                                              handleSaveQuizzes(selectedLesson.id, updated);
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Quiz"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Question Type</label>
                                            <select
                                              value={qz.type}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].type = e.target.value as any;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-200 rounded text-xs font-semibold bg-white cursor-pointer focus:border-brand-purple focus:outline-none"
                                            >
                                              <option value="translate-thai-to-mm">Thai to Myanmar</option>
                                              <option value="translate-mm-to-thai">Myanmar to Thai</option>
                                              <option value="listening-match">Listening audio match</option>
                                              <option value="fill-gap">Fill in the missing gap</option>
                                            </select>
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Prompt (The Question Text)</label>
                                            <input
                                              type="text"
                                              value={qz.prompt}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].prompt = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Prompt Thai segment (audio query)</label>
                                            <input
                                              type="text"
                                              value={qz.promptThai || ""}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].promptThai = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold bg-white focus:border-brand-purple focus:outline-none"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-2">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Correct Answer Value (MUST MATCH EXACT OPTION STRING)</label>
                                            <input
                                              type="text"
                                              value={qz.correctAnswer}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].correctAnswer = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-brand-green/30 rounded text-xs font-bold bg-brand-green-light/20 text-brand-green focus:outline-none"
                                              placeholder="Must match one of the options exactly"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-3">
                                            <span className="block text-[9px] font-sans font-black text-brand-muted uppercase mb-1">
                                              Multiple Choice Options (Exactly 4 Choices)
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                              {[0, 1, 2, 3].map((optIdx) => (
                                                <input
                                                  key={optIdx}
                                                  type="text"
                                                  placeholder={`Choice ${optIdx + 1}`}
                                                  value={qz.options[optIdx] || ""}
                                                  onChange={(e) => {
                                                    const updated = [...currentQuiz];
                                                    const opts = [...(updated[index].options || [])];
                                                    opts[optIdx] = e.target.value;
                                                    updated[index].options = opts;
                                                    setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                                  }}
                                                  className="px-2 py-1.5 border border-gray-300 rounded text-xs font-bold focus:border-brand-purple"
                                                />
                                              ))}
                                            </div>
                                          </div>

                                          <div className="space-y-1 sm:col-span-1.5">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">English Explanation</label>
                                            <input
                                              type="text"
                                              value={qz.explanation || ""}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].explanation = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:border-brand-purple"
                                            />
                                          </div>

                                          <div className="space-y-1 sm:col-span-1.5">
                                            <label className="block text-[9px] font-sans font-black text-brand-muted uppercase">Myanmar Explanation</label>
                                            <input
                                              type="text"
                                              value={qz.explanationMyanmar || ""}
                                              onChange={(e) => {
                                                const updated = [...currentQuiz];
                                                updated[index].explanationMyanmar = e.target.value;
                                                setLessons(prev => prev.map(l => l.id === selectedLesson.id ? { ...l, quiz: updated } : l));
                                              }}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-semibold focus:border-brand-purple"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <button
                                  onClick={() => handleSaveQuizzes(selectedLesson.id, currentQuiz)}
                                  className="w-full bg-brand-green text-white text-[11px] font-sans font-black py-2.5 rounded-xl uppercase tracking-wider cursor-pointer hover:bg-brand-green/90 transition-colors"
                                >
                                  💾 SAVE QUIZ DATABASE
                                </button>
                              </div>
                            );
                          })()}

                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* CSV Excel Database Import Sync Hub */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5 text-brand-purple">
                        <FileText className="w-4 h-4 shrink-0 text-brand-purple" />
                        📂 CSV & Excel Data Import Hub • သင်ခန်းစာများ ဖိုင်ဖြင့်ထည့်သွင်းရန်
                      </h4>
                      <p className="text-[10px] font-sans font-semibold text-brand-muted mt-1 leading-relaxed">
                        Import vocabulary rows, dialogue lines, grammar rules, quizzes, or whole lessons in bulk with standard Excel CSV files. All changes persist instantly to students.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCsvImportExpanded(!isCsvImportExpanded)}
                      className="px-3 py-1.5 border-2 border-brand-purple/20 bg-[#fbfaff] hover:bg-brand-purple/10 text-brand-purple rounded-xl text-[10px] font-sans font-black flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isCsvImportExpanded ? "COLLAPSE PANEL • ပိတ်ပါ" : "EXPAND IMPORT ENGINE • ဖွင့်ပါ"}
                    </button>
                  </div>

                  {isCsvImportExpanded && (
                    <div className="space-y-6 animate-fade-in shadow-xs">
                      {/* Step 1: Download Templates */}
                      <div className="bg-amber-50/25 border border-amber-200/55 p-4 rounded-xl space-y-3.5">
                        <h5 className="text-[11px] font-sans font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                          📊 STEP 1: DOWNLOAD EXCEL / CSV TEMPLATES • စံနမူနာ ဒေါင်းလုဒ် ရယူရန်
                        </h5>
                        <p className="text-[10.5px] font-sans font-medium text-brand-dark leading-relaxed">
                          Click any button below to download the official structural CSV template. Open in Microsoft Excel or Google Sheets, fill in your lesson data, click export/save as CSV, and upload in Step 2.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => downloadCsvTemplate('vocabulary')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark text-[10.5px] font-black font-sans px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                            Vocabulary Template (.csv)
                          </button>
                          <button
                            onClick={() => downloadCsvTemplate('dialogue')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark text-[10.5px] font-black font-sans px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                            Dialogue Lines Template (.csv)
                          </button>
                          <button
                            onClick={() => downloadCsvTemplate('grammar')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark text-[10.5px] font-black font-sans px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                            Grammar Notes Template (.csv)
                          </button>
                          <button
                            onClick={() => downloadCsvTemplate('quiz')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark text-[10.5px] font-black font-sans px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                            Quiz Questions Template (.csv)
                          </button>
                          <button
                            onClick={() => downloadCsvTemplate('lessons')}
                            className="bg-white hover:bg-gray-50 border border-gray-200 text-brand-dark text-[10.5px] font-black font-sans px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                          >
                            <Download className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                            Lessons Metadata Template (.csv)
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Upload Configurator */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-gray-50 p-4.5 border border-gray-150 rounded-xl">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                            1. Select Import Content type
                          </label>
                          <select
                            value={csvImportType}
                            onChange={(e) => {
                              const type = e.target.value as any;
                              setCsvImportType(type);
                              setCsvFile(null);
                              setCsvParsedData([]);
                              setCsvErrors([]);
                              setCsvFileName('');
                            }}
                            className="w-full bg-white border-2 border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold font-sans text-brand-dark focus:border-brand-purple focus:outline-none cursor-pointer"
                          >
                            <option value="vocabulary">Vocabulary List • ဝေါဟာရအသစ်များ</option>
                            <option value="dialogue">Dialogue Conversational Lines • စကားပြောများ</option>
                            <option value="grammar">Grammar Notes & Examples • သဒ္ဒါစည်းမျဉ်း</option>
                            <option value="quiz">Quiz Questions & Choices • ပဟေဠိများ</option>
                            <option value="lessons">Bulk Syllabus Lessons (Metadata) • သင်ခန်းစာအသစ်များ</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                            2. SELECT TARGET LESSON
                          </label>
                          <select
                            disabled={csvImportType === 'lessons'}
                            value={csvImportTargetLesson}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCsvImportTargetLesson(val === 'all' ? 'all' : Number(val));
                            }}
                            className="w-full bg-white border-2 border-gray-200 px-3.5 py-2 rounded-xl text-xs font-bold font-sans text-[#3c3c3c] focus:border-brand-purple focus:outline-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="all">-- Active Selected Lesson ({adminSelectedLessonId || 'None'}) --</option>
                            {lessons.map(l => (
                              <option key={l.id} value={l.id}>
                                Lesson {l.id}: {l.titleEnglish}
                              </option>
                            ))}
                          </select>
                          {csvImportType === 'lessons' && (
                            <p className="text-[9px] text-brand-muted font-bold block pt-1">
                              * Entire curriculum directory mode
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-sans font-black text-brand-dark uppercase tracking-wider">
                            3. CHOOSE FILE • ဖိုင်ရွေးချယ်ရန်
                          </label>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsCsvDragOver(true);
                            }}
                            onDragLeave={() => setIsCsvDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsCsvDragOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                processCsvFile(file);
                              }
                            }}
                            className={`border-2 border-dashed rounded-xl px-4 py-2 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                              isCsvDragOver ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                            onClick={() => {
                              const input = document.getElementById('csv-file-selector-input');
                              if (input) input.click();
                            }}
                          >
                            <input
                              type="file"
                              id="csv-file-selector-input"
                              accept=".csv"
                              onChange={handleCsvFileSelection}
                              className="hidden"
                            />
                            <Upload className="w-4 h-4 text-gray-400 mb-1 animate-bounce" />
                            <span className="text-[10px] font-sans font-black text-brand-dark text-center truncate max-w-full">
                              {csvFileName ? `✓ ${csvFileName}` : "Click/Drag CSV here"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Parse Status Preview & Merging */}
                      {csvFile && (
                        <div className="bg-white border-2 border-brand-purple/20 rounded-xl p-4.5 space-y-4 shadow-3xs animate-fade-in text-brand-dark">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div>
                              <h6 className="text-[11px] font-sans font-black uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-brand-purple" />
                                CSV PARSED PREVIEW DETAILS • သွင်းယူမည့် ဒေတာ အကျဉ်းချုပ်
                              </h6>
                              <p className="text-[9.5px] font-sans font-medium text-brand-muted mt-0.5">
                                Verify that column headers and structures align before finalizing the synchronization update.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {csvErrors.length === 0 ? (
                                <span className="bg-brand-green-light border border-brand-green/30 text-brand-green font-mono font-black text-[9.5px] px-3 py-1 rounded-full uppercase">
                                  ✓ Valid Format
                                </span>
                              ) : (
                                <span className="bg-red-50 border border-red-200 text-red-600 font-mono font-black text-[9.5px] px-3 py-1 rounded-full uppercase">
                                  ⚠ {csvErrors.length} Warning(s)
                                </span>
                              )}
                            </div>
                          </div>

                          {csvErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-150 p-3.5 rounded-xl text-[10.5px] font-sans font-semibold text-red-700 space-y-1.5 max-h-[150px] overflow-y-auto">
                              <p className="font-sans font-black">Warning Warnings found in lines/headers structure:</p>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {csvErrors.map((err, idx) => (
                                  <li key={idx}>{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-brand-muted">
                                Content Type: <strong className="text-brand-dark font-black uppercase">{csvImportType}</strong>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-brand-muted">
                                Row Count: <strong className="text-brand-dark font-black">{csvParsedData.length} records found</strong>
                              </span>
                            </div>

                            <div className="max-h-[180px] overflow-y-auto border border-gray-150 rounded-xl overflow-x-auto">
                              <table className="w-full text-[10px] text-left border-collapse font-sans">
                                <thead>
                                  <tr className="bg-gray-100/80 border-b border-gray-200 text-brand-dark font-black tracking-wide uppercase select-none">
                                    <th className="p-2 border-r border-gray-200">#</th>
                                    {csvImportType === 'vocabulary' && (
                                      <>
                                        <th className="p-2 border-r border-gray-200">Thai Word</th>
                                        <th className="p-2 border-r border-gray-200">Phonetic</th>
                                        <th className="p-2 border-r border-gray-200">English</th>
                                        <th className="p-2">Myanmar</th>
                                      </>
                                    )}
                                    {csvImportType === 'dialogue' && (
                                      <>
                                        <th className="p-2 border-r border-gray-200">Speaker</th>
                                        <th className="p-2 border-r border-gray-200">Thai Sentence</th>
                                        <th className="p-2 border-r border-gray-200">English</th>
                                        <th className="p-2">Myanmar</th>
                                      </>
                                    )}
                                    {csvImportType === 'grammar' && (
                                      <>
                                        <th className="p-2 border-r border-gray-200">Title</th>
                                        <th className="p-2 border-r border-gray-200">Title (MM)</th>
                                        <th className="p-2 border-r border-gray-200">Explanation</th>
                                        <th className="p-2">Example Count</th>
                                      </>
                                    )}
                                    {csvImportType === 'quiz' && (
                                      <>
                                        <th className="p-2 border-r border-gray-200">Type</th>
                                        <th className="p-2 border-r border-gray-200">Prompt</th>
                                        <th className="p-2 border-r border-gray-200">Options</th>
                                        <th className="p-2">Correct Answer</th>
                                      </>
                                    )}
                                    {csvImportType === 'lessons' && (
                                      <>
                                        <th className="p-2 border-r border-gray-200">ID</th>
                                        <th className="p-2 border-r border-gray-200">English Title</th>
                                        <th className="p-2 border-r border-gray-200">Myanmar Title</th>
                                        <th className="p-2">Description</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="bg-white/50 text-brand-dark font-semibold">
                                  {csvParsedData.slice(0, 5).map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-brand-purple/5 transition-colors">
                                      <td className="p-2 border-r border-gray-200 font-mono text-brand-muted text-center">{idx + 1}</td>
                                      {csvImportType === 'vocabulary' && (
                                        <>
                                          <td className="p-2 border-r border-gray-200 text-brand-purple font-bold text-xs">{row.thai}</td>
                                          <td className="p-2 border-r border-gray-200 italic font-mono text-brand-green">{row.phonetic}</td>
                                          <td className="p-2 border-r border-gray-200">{row.english}</td>
                                          <td className="p-2">{row.myanmar}</td>
                                        </>
                                      )}
                                      {csvImportType === 'dialogue' && (
                                        <>
                                          <td className="p-2 border-r border-gray-200 font-mono text-center font-black">{row.speaker}</td>
                                          <td className="p-2 border-r border-gray-200 text-brand-purple font-bold text-xs">{row.thai}</td>
                                          <td className="p-2 border-r border-gray-200">{row.english}</td>
                                          <td className="p-2">{row.myanmar}</td>
                                        </>
                                      )}
                                      {csvImportType === 'grammar' && (
                                        <>
                                          <td className="p-2 border-r border-gray-200 text-brand-purple font-bold">{row.title}</td>
                                          <td className="p-2 border-r border-gray-200">{row.titleMyanmar}</td>
                                          <td className="p-2 border-r border-gray-200 truncate max-w-xs">{row.explanation}</td>
                                          <td className="p-2 font-mono text-center">{row.examples?.length || 0} examples</td>
                                        </>
                                      )}
                                      {csvImportType === 'quiz' && (
                                        <>
                                          <td className="p-2 border-r border-gray-200 font-mono text-[9px] uppercase">{row.type}</td>
                                          <td className="p-2 border-r border-gray-200 truncate max-w-xs">{row.prompt}</td>
                                          <td className="p-2 border-r border-gray-200 truncate max-w-xs">{row.options?.join(' | ')}</td>
                                          <td className="p-2 text-brand-green font-bold">{row.correctAnswer}</td>
                                        </>
                                      )}
                                      {csvImportType === 'lessons' && (
                                        <>
                                          <td className="p-2 border-r border-gray-200 font-mono font-bold text-center">{row.id}</td>
                                          <td className="p-2 border-r border-gray-200">{row.titleEnglish}</td>
                                          <td className="p-2 border-r border-gray-200">
                                            <span>{row.titleMyanmar}</span>
                                            {row.titleMyanmarPhonetic && (
                                              <span className="text-[9px] text-emerald-600 block leading-tight font-black">[{row.titleMyanmarPhonetic}]</span>
                                            )}
                                          </td>
                                          <td className="p-2 truncate max-w-xs">{row.descriptionEnglish}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                  {csvParsedData.length > 5 && (
                                    <tr className="bg-gray-50/50">
                                      <td colSpan={10} className="p-2 text-center text-brand-muted font-mono italic">
                                        ... and {csvParsedData.length - 5} more rows parsed and ready ...
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            <div className="pt-3 flex gap-3">
                              <button
                                type="button"
                                onClick={submitCsvImport}
                                className="flex-1 duo-btn duo-btn-purple text-xs font-black py-3 select-none uppercase tracking-wide flex items-center justify-center gap-1.5"
                              >
                                <CheckSquare className="w-4 h-4" />
                                IMPORT NOW • ဒေတာထည့်သွင်းပါ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCsvFile(null);
                                  setCsvParsedData([]);
                                  setCsvErrors([]);
                                  setCsvFileName('');
                                }}
                                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-sans font-black text-xs transition-colors cursor-pointer"
                              >
                                Clear File
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit Logs feed */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 space-y-4">
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-100">
                    <h4 className="font-sans font-black text-brand-dark text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-brand-purple shrink-0" />
                      Live Server Audit Log Feed
                    </h4>
                    <button
                      onClick={() => setSystemLogs([])}
                      className="text-xs text-brand-muted hover:text-red-500 font-sans font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3" />
                      Clear log traces
                    </button>
                  </div>

                  {systemLogs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-brand-muted font-sans font-semibold">No recent server actions logged.</div>
                  ) : (
                    <div className="space-y-1.5 h-64 overflow-y-auto pr-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                      {systemLogs.map((log) => (
                        <div key={log.id} className="text-[11px] leading-tight py-1.5 px-2 bg-white rounded border border-gray-50 font-mono text-[#444] flex items-center justify-between gap-6 flex-wrap">
                          <p>
                            <span className="text-brand-purple font-black">[@{log.user}]</span>
                            <span className="text-brand-dark font-semibold ml-2">{log.action}</span>
                          </p>
                          <span className="text-brand-muted text-[10px] font-sans font-bold shrink-0">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </StaticAdminGuard>
          )}

          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Context Header */}
            <div className="duo-card bg-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  onClick={() => setActiveLessonId(null)}
                  className="duo-btn duo-btn-white text-xs px-3.5 py-2.5 flex items-center mb-4 font-bold"
                  id="btn-back-dashboard"
                >
                  ← Back to Dashboard • မူလစာမျက်နှာသို့ပြန်သွားရန်
                </button>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-sans text-[#fff] bg-brand-purple px-2.5 py-1 rounded-full border-b-2 border-brand-purple-shadow font-extrabold select-none">
                    LESSON {activeLesson?.id}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-sans font-black text-[#3c3c3c] tracking-tight mt-2 flex flex-wrap items-baseline gap-2">
                  <span>{activeLesson?.titleEnglish}</span>
                  <span className="text-sm font-extrabold text-brand-green">({activeLesson?.titleThai} - <span className="italic">{activeLesson?.titlePhonetic}</span>)</span>
                  {(activeLesson?.titleMyanmarPhonetic || activeLesson?.titlePhonetic) && (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                      အသံထွက်: {activeLesson?.titleMyanmarPhonetic || getMyanmarPhonetic(activeLesson.titlePhonetic || '')}
                    </span>
                  )}
                </h2>
              </div>

              {/* High Score rating badge & Lesson Completion Trigger */}
              <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                {progress.completedLessons.some((id: any) => String(id) === String(activeLesson?.id)) ? (
                  <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-300 rounded-2xl text-xs font-sans font-black flex items-center gap-1.5 shadow-3xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    Lesson Completed • ပြီးမြောက်ပြီး
                  </span>
                ) : (
                  <button
                    onClick={() => activeLesson && handleLessonCompleted(activeLesson.id)}
                    className="px-4 py-2.5 bg-brand-green hover:bg-emerald-600 text-white rounded-2xl border-b-4 border-emerald-700 font-sans font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    Complete Lesson • သင်ခန်းစာပြီးမြောက်ပြီ (+150 XP)
                  </button>
                )}

                <div className="duo-card p-3.5 shrink-0 text-center md:text-right min-w-36 bg-gradient-to-br from-[#f2eefc]/40 to-transparent">
                  <div className="text-[10px] font-sans text-brand-purple uppercase tracking-wider font-extrabold">CHAPTER PROGRESS</div>
                  <div className="text-2xl font-sans font-black text-[#583092] mt-0.5">
                    {(progress.quizHighScores[activeLesson?.id || 0] || 0)}%
                  </div>
                  <div className="text-[10px] font-sans text-brand-muted mt-0.5 font-bold">Highest Exam Score</div>
                </div>
              </div>
            </div>

            {/* Sub modules study tabs */}
            <div className="flex items-center overflow-x-auto scrollbar-none border-b-2 border-gray-100 gap-2 py-2 select-none flex-nowrap">
              <button
                onClick={() => setActiveTab('vocabulary')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[105px] sm:min-w-0 px-3 py-3 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'vocabulary'
                    ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                    : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
                }`}
                id="tab-vocabulary"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Vocab<span className="hidden xs:inline"> • ဝေါဟာရ</span></span>
              </button>

              <button
                onClick={() => setActiveTab('sentence')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[105px] sm:min-w-0 px-3 py-3 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'sentence'
                    ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                    : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
                }`}
                id="tab-sentence"
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sentence<span className="hidden xs:inline"> • ဝါကျ</span></span>
              </button>

              <button
                onClick={() => setActiveTab('grammar')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[105px] sm:min-w-0 px-3 py-3 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'grammar'
                    ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                    : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
                }`}
                id="tab-grammar"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Grammar<span className="hidden xs:inline"> • သဒ္ဒါ</span></span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 shrink-0 whitespace-nowrap min-w-[105px] sm:min-w-0 px-3 py-3 rounded-2xl font-sans font-black text-xs transition-transform active:translate-y-0.5 text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'quiz'
                    ? 'bg-brand-purple text-white border-b-4 border-brand-purple-shadow'
                    : 'bg-white border-2 border-[#e5e5e5] border-b-4 hover:bg-gray-50 text-brand-dark'
                }`}
                id="tab-quiz"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Quiz<span className="hidden xs:inline"> • စစ်ဆေးခြင်း</span></span>
              </button>
            </div>

            {/* Active Tab Screen Render */}
            <div className="mt-4">
              {activeTab === 'vocabulary' && activeLesson && (
                <VocabularyView
                  key={`vocab-lesson-${activeLesson.id}`}
                  lessonId={activeLesson.id}
                  activeLesson={activeLesson}
                  onWordMastered={handleToggleMasteredWord}
                  masteredWords={progress.masteredWords}
                  audioSpeedIndex={audioSpeedIndex}
                  setAudioSpeedIndex={setAudioSpeedIndex}
                />
              )}

              {activeTab === 'sentence' && activeLesson && (
                <SentenceView
                  sentences={activeLesson.dialogue || []}
                  onWordMastered={handleToggleMasteredWord}
                  masteredWords={progress.masteredWords}
                  audioSpeedIndex={audioSpeedIndex}
                  setAudioSpeedIndex={setAudioSpeedIndex}
                />
              )}

              {activeTab === 'grammar' && activeLesson && (
                activeLesson.id === 2 ? (
                  <SentenceStructureLesson onBack={() => setActiveLessonId(null)} />
                ) : (() => {
                  const grammarNotesList = activeLesson.grammarNotes || [];
                  return (
                    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                    {/* Grammar Notes Pagination Header with Dropdown */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border-2 border-gray-100/80 shadow-xs">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 bg-brand-purple rounded-full shrink-0" />
                        <span className="text-xs font-sans text-brand-dark font-black uppercase tracking-wider">
                          Lesson {activeLesson.id} Grammar Guide • သဒ္ဒါလမ်းညွှန်
                        </span>
                      </div>

                      {/* Filter Dropdown */}
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <label htmlFor="grammar-select" className="sr-only">Choose grammar point</label>
                        <select
                          id="grammar-select"
                          value={currentGrammarPageIndex}
                          onChange={(e) => setCurrentGrammarPageIndex(parseInt(e.target.value))}
                          className="bg-gray-50 border-2 border-gray-200 text-brand-dark text-xs rounded-xl focus:ring-brand-purple focus:border-brand-purple block w-full md:w-72 p-2 font-bold font-sans outline-none cursor-pointer shadow-2xs hover:bg-gray-100 transition-colors"
                        >
                          {grammarNotesList.map((note, idx) => (
                            <option key={idx} value={idx}>
                              Goal {idx + 1}: {note.title ? (note.title.length > 35 ? note.title.substring(0, 35) + '...' : note.title) : `Rule ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs font-sans text-brand-muted font-bold shrink-0">
                        Page {currentGrammarPageIndex + 1} of {grammarNotesList.length}
                      </div>
                    </div>

                    {/* Active Grammar Note */}
                    {grammarNotesList[currentGrammarPageIndex] ? (() => {
                    const currentLessonMode = exampleModeForRules[`lesson-${activeLesson.id}-${currentGrammarPageIndex}`] || 'standard';
                    const activeLessonExamples = currentLessonMode === 'standard' 
                      ? (activeLesson.grammarNotes[currentGrammarPageIndex].examples || []) 
                      : getAdditionalPhrases(activeLesson.id * 100, currentGrammarPageIndex, currentLessonMode);

                    const examplesPerPage = 4;
                    const totalExamplePages = Math.ceil(activeLessonExamples.length / examplesPerPage);
                    const paginatedExamples = activeLessonExamples.slice(
                      currentGrammarExamplePage * examplesPerPage,
                      (currentGrammarExamplePage + 1) * examplesPerPage
                    );

                    return (
                      <motion.div
                        key={currentGrammarPageIndex}
                        className="duo-card p-6 bg-white shadow-xs"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-brand-purple text-white rounded-2xl border-b-4 border-brand-purple-shadow shrink-0 select-none">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-sans font-black text-[#583092] text-base uppercase">
                              {activeLesson.grammarNotes[currentGrammarPageIndex].title}
                            </h3>
                          </div>
                        </div>

                        {/* Explanation */}
                        {isSingleSentenceEnglish(activeLesson.grammarNotes[currentGrammarPageIndex].explanation) && (
                          <p className="text-sm font-sans text-brand-dark font-semibold leading-relaxed">
                            {activeLesson.grammarNotes[currentGrammarPageIndex].explanation}
                          </p>
                        )}
                        <p className="text-sm font-sans text-brand-muted leading-relaxed font-semibold italic mt-2 border-l-4 border-brand-purple/20 pl-3">
                          {activeLesson.grammarNotes[currentGrammarPageIndex].explanationMyanmar}
                        </p>



                        {/* Examples Grid */}
                        {activeLessonExamples && activeLessonExamples.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <span className="text-[10px] font-sans text-brand-muted uppercase tracking-widest block font-black">
                              Grammatical Examples • ဥပမာဝါကျများ
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {paginatedExamples.map((ex, exIdx) => (
                                <div key={exIdx} className="duo-card p-4.5 bg-brand-purple-light/10 border-brand-purple/10 flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-center gap-4 mb-1">
                                      <span className="font-sans font-black text-brand-dark text-[15px]">{ex.thai}</span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <GrammarVocabDropdown sentence={ex.thai} allLessons={lessons} />
                                        <button
                                          onClick={() => speakText(ex.thai)}
                                          className="px-2 h-7 rounded-xl bg-white border-2 border-b-4 border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1 font-bold transition-all active:translate-y-0.5 shadow-xs"
                                          title={`Listen (${audioSpeedIndex === 0 ? "Normal" : audioSpeedIndex === 1 ? "Slow 0.7x" : "Slower 0.5x"})`}
                                        >
                                          {audioSpeedIndex === 0 ? (
                                            <>
                                              <Volume2 className="w-3.5 h-3.5 text-brand-purple" />
                                              <span className="text-[8px] font-sans font-black text-brand-purple bg-brand-purple-light px-1 py-0.5 rounded-md select-none leading-none">1.0x</span>
                                            </>
                                          ) : audioSpeedIndex === 1 ? (
                                            <>
                                              <Volume1 className="w-3.5 h-3.5 text-indigo-500" />
                                              <span className="text-[8px] font-sans font-black text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded-md select-none leading-none">0.7x</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume className="w-3.5 h-3.5 text-orange-500" />
                                              <span className="text-[8px] font-sans font-black text-orange-500 bg-orange-50 px-1 py-0.5 rounded-md select-none leading-none">0.5x</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                      <div className="text-xs font-sans text-brand-green font-extrabold italic">{ex.phonetic}</div>
                                      {ex.phonetic && (
                                        <div className="text-[11px] font-sans text-emerald-600 font-extrabold">အသံထွက်: {getMyanmarPhonetic(ex.phonetic)}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="text-xs text-brand-muted font-sans font-bold">{ex.english}</div>
                                    <div className="text-xs text-brand-dark font-sans font-bold leading-normal mt-0.5">{ex.myanmar}</div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Examples Pagination Footer */}
                            {totalExamplePages > 1 && (
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-border/60 select-none">
                                <button
                                  onClick={() => setCurrentGrammarExamplePage(prev => Math.max(0, prev - 1))}
                                  disabled={currentGrammarExamplePage === 0}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-black tracking-wide transition-all cursor-pointer ${
                                    currentGrammarExamplePage === 0
                                      ? 'opacity-30 cursor-not-allowed text-slate-400'
                                      : 'text-brand-purple hover:bg-brand-purple/5'
                                  }`}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span>PREVIOUS EXAMPLES</span>
                                </button>
                                
                                <span className="text-[10px] font-mono text-brand-muted font-black uppercase">
                                  Example Page {currentGrammarExamplePage + 1} of {totalExamplePages}
                                </span>

                                <button
                                  onClick={() => setCurrentGrammarExamplePage(prev => Math.min(totalExamplePages - 1, prev + 1))}
                                  disabled={currentGrammarExamplePage === totalExamplePages - 1}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-black tracking-wide transition-all cursor-pointer ${
                                    currentGrammarExamplePage === totalExamplePages - 1
                                      ? 'opacity-30 cursor-not-allowed text-slate-400'
                                      : 'text-brand-purple hover:bg-brand-purple/5'
                                  }`}
                                >
                                  <span>NEXT EXAMPLES</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })() : null}

                  {/* Grammar Note Pagination Footer Controls */}
                  {grammarNotesList.length > 1 && (
                    <div className="flex items-center justify-between mt-6 bg-white px-6 py-4 rounded-2xl border-2 border-gray-100/80 shadow-xs select-none">
                      <button
                        onClick={() => setCurrentGrammarPageIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentGrammarPageIndex === 0}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-black tracking-wider transition-all cursor-pointer border border-gray-100 ${
                          currentGrammarPageIndex === 0
                            ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400'
                            : 'bg-white hover:bg-gray-50 text-brand-purple active:translate-y-0.5 shadow-3xs'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>PREVIOUS GOAL</span>
                      </button>
                      
                      <div className="flex items-center gap-1.5">
                        {grammarNotesList.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentGrammarPageIndex(idx)}
                            className={`w-8 h-8 rounded-full text-xs font-sans font-black flex items-center justify-center transition-all cursor-pointer ${
                              currentGrammarPageIndex === idx
                                ? 'bg-brand-purple text-white shadow-md'
                                : 'bg-gray-150 text-brand-dark hover:bg-gray-200'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentGrammarPageIndex(prev => Math.min(grammarNotesList.length - 1, prev + 1))}
                        disabled={currentGrammarPageIndex === grammarNotesList.length - 1}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-black tracking-wider transition-all cursor-pointer border border-gray-100 ${
                          currentGrammarPageIndex === grammarNotesList.length - 1
                            ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400'
                            : 'bg-white hover:bg-gray-50 text-brand-purple active:translate-y-0.5 shadow-3xs'
                        }`}
                      >
                        <span>NEXT GOAL</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  </div>
                );
              })()
            )}

              {activeTab === 'quiz' && activeLesson && (
                <QuizView
                  questions={activeLesson.quiz || []}
                  lessonId={activeLesson.id}
                  dialogue={activeLesson.dialogue || []}
                  onWordMastered={handleToggleMasteredWord}
                  masteredWords={progress.masteredWords}
                  onQuizFinished={(score, xp) => handleQuizFinished(activeLesson.id, score, xp)}
                  audioSpeedIndex={audioSpeedIndex}
                  setAudioSpeedIndex={setAudioSpeedIndex}
                />
              )}
            </div>
          </div>
        )}

        {isGatewayOpen && (
          <CheckoutGateway
            isGatewayOpen={isGatewayOpen}
            setIsGatewayOpen={setIsGatewayOpen}
            gatewayCourse={gatewayCourse}
            checkoutName={checkoutName}
            setCheckoutName={setCheckoutName}
            gatewayEmail={gatewayEmail}
            setGatewayEmail={setGatewayEmail}
            gatewayPhone={gatewayPhone}
            setGatewayPhone={setGatewayPhone}
            gatewayStep={gatewayStep}
            setGatewayStep={setGatewayStep}
            gatewayPaymentMethod={gatewayPaymentMethod}
            setGatewayPaymentMethod={setGatewayPaymentMethod}
            gatewayOtp={gatewayOtp}
            setGatewayOtp={setGatewayOtp}
            gatewayTimer={gatewayTimer}
            setGatewayTimer={setGatewayTimer}
            gatewayProcessing={gatewayProcessing}
            setGatewayProcessing={setGatewayProcessing}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            setIsLoggedIn={setIsLoggedIn}
            addSystemLog={addSystemLog}
            orders={orders}
            setOrders={setOrders}
            setIsCourseStoreExpanded={setIsCourseStoreExpanded}
            registeredUsers={registeredUsers}
            setRegisteredUsers={setRegisteredUsers}
          />
        )}

        {selectedDetailOrder && (
          <OrderDetailModal
            order={selectedDetailOrder}
            onClose={() => setSelectedDetailOrder(null)}
            isAdmin={isAdmin}
            onUpdateOrder={(updatedOrder) => {
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
              setSelectedDetailOrder(updatedOrder);
            }}
            onDeleteOrder={(deletedId) => {
              setOrders(prev => prev.filter(o => o.id !== deletedId));
              setSelectedDetailOrder(null);
            }}
            addSystemLog={addSystemLog}
            storeItems={storeItems}
            triggerPdfDownload={triggerPdfDownload}
          />
        )}

        {/* CREATE NEW PURCHASE ORDER MODAL (D1 SUPPORTED) */}
        {showCreateOrderModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-sans font-black text-brand-dark text-base uppercase tracking-wide flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-purple" />
                  Create New Student Purchase Order (D1)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateOrderModal(false)}
                  className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewOrder} className="space-y-3.5 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Student Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ko_nay_min"
                      value={newOrderUsername}
                      onChange={(e) => setNewOrderUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Item Type
                    </label>
                    <select
                      value={newOrderItemType}
                      onChange={(e: any) => setNewOrderItemType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark bg-white"
                    >
                      <option value="e-book">e-Book Workbook</option>
                      <option value="tutoring">1-on-1 Practice Tutoring</option>
                      <option value="vip-package">VIP Course Package</option>
                      <option value="certificate">Official Certificate</option>
                      <option value="course">Course Module Access</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                    Package Description / Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 📕 Advanced Thai-Myanmar Grammar Manual (Printed E-Book)"
                    value={newOrderItemName}
                    onChange={(e) => setNewOrderItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Price Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newOrderPrice}
                      onChange={(e) => setNewOrderPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-bold text-brand-dark font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Currency
                    </label>
                    <select
                      value={newOrderCurrency}
                      onChange={(e: any) => setNewOrderCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark bg-white"
                    >
                      <option value="MMK">MMK (Kyats)</option>
                      <option value="THB">THB (Baht)</option>
                      <option value="XP">XP Points</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Status
                    </label>
                    <select
                      value={newOrderStatus}
                      onChange={(e: any) => setNewOrderStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark bg-white"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="completed">Completed / Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Student Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09-771234567"
                      value={newOrderPhone}
                      onChange={(e) => setNewOrderPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                      Student Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. student@gmail.com"
                      value={newOrderEmail}
                      onChange={(e) => setNewOrderEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-semibold text-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-brand-muted mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional transaction reference or activation notes..."
                    value={newOrderNotes}
                    onChange={(e) => setNewOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple text-xs font-medium text-brand-dark"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    Save & Create Order in D1
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateOrderModal(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {activeReadingResource && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-[9999] overflow-hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    <span className="text-[10px] font-sans font-black bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Interactive eBook Companion
                    </span>
                  </div>
                  <h3 className="font-sans font-black text-slate-800 text-lg uppercase tracking-tight">
                    {activeReadingResource.name}
                  </h3>
                  {activeReadingResource.nameMm && (
                    <p className="text-xs text-brand-purple font-sans font-bold italic">
                      {activeReadingResource.nameMm}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReadingResource(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-xl border-none cursor-pointer text-[10px] font-sans font-black uppercase tracking-wider"
                >
                  ✕ CLOSE
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-5 py-3 border-b border-gray-100 bg-white flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {(['vocab', 'sentence', 'dialogue', 'conversation'] as const).map((tab) => {
                    const available = 
                      (tab === 'vocab' && activeReadingResource.vocabEntries?.length > 0) ||
                      (tab === 'sentence' && activeReadingResource.sentenceEntries?.length > 0) ||
                      (tab === 'dialogue' && activeReadingResource.dialogueEntries?.length > 0) ||
                      (tab === 'conversation' && activeReadingResource.conversationEntries?.length > 0);

                    if (!available) return null;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStudentReadingTab(tab)}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-sans font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                          studentReadingTab === tab
                            ? 'bg-[#5a3194] text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                      >
                        {tab === 'vocab' && `📝 Vocab Flashcards (${activeReadingResource.vocabEntries?.length})`}
                        {tab === 'sentence' && `💬 Practice Sentences (${activeReadingResource.sentenceEntries?.length})`}
                        {tab === 'dialogue' && `🗣️ Dialogues (${activeReadingResource.dialogueEntries?.length})`}
                        {tab === 'conversation' && `📖 Reading Topics (${activeReadingResource.conversationEntries?.length})`}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[9px] text-slate-400 font-bold font-sans hidden sm:block">
                  💡 Tap speaker icon to play Thai pronunciation audios.
                </div>
              </div>

              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
                {studentReadingTab === 'vocab' && activeReadingResource.vocabEntries?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                    {activeReadingResource.vocabEntries.map((item: any, idx: number) => (
                      <div key={idx}>
                        <VocabularyCard item={item} />
                      </div>
                    ))}
                  </div>
                )}

                {studentReadingTab === 'sentence' && activeReadingResource.sentenceEntries?.length > 0 && (
                  <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
                    {activeReadingResource.sentenceEntries.map((item: any, idx: number) => (
                      <div key={idx}>
                        <SentenceCard item={item} />
                      </div>
                    ))}
                  </div>
                )}

                {studentReadingTab === 'dialogue' && activeReadingResource.dialogueEntries?.length > 0 && (
                  <div className="space-y-4 max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-150 shadow-3xs animate-fade-in">
                    <span className="text-[9px] text-[#5a3194] font-black uppercase tracking-widest block mb-4 border-b pb-2">
                      🗣️ Interactive Dialogue roleplay
                    </span>
                    <div className="space-y-4">
                      {activeReadingResource.dialogueEntries.map((item: any, idx: number) => (
                        <div key={idx}>
                          <DialogueBubble item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {studentReadingTab === 'conversation' && activeReadingResource.conversationEntries?.length > 0 && (
                  <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                    {activeReadingResource.conversationEntries.map((item: any, idx: number) => (
                      <div key={idx}>
                        <ConversationBlock item={item} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}




      </main>

      {/* Primary mobile navigation; floats as the existing compact navigator on wider screens. */}
      <nav id="bottom-tab-bar" aria-label={activeLessonId !== null ? 'Lesson navigation' : 'Primary navigation'} className={`fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[500px] sm:rounded-2xl sm:border sm:border-gray-150 sm:shadow-xl bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 mobile-bottom-nav items-start sm:items-center justify-around px-2 sm:px-3 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${activeLessonId === null ? 'flex lg:hidden' : 'flex'}`}>
        {activeLessonId !== null ? (
          <>
            {/* Back Arrow / Exit */}
            <button
              onClick={() => setActiveLessonId(null)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative text-brand-muted hover:text-brand-dark"
              id="tab-btn-back"
            >
              <div className="relative">
                <ChevronLeft className="w-5 h-5 transition-transform duration-200" />
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">Exit</span>
            </button>

            {/* Vocab Module */}
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                activeTab === 'vocabulary' ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-vocab"
            >
              <div className="relative">
                <Sparkles className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'vocabulary' ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {activeTab === 'vocabulary' && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.vocabulary')}</span>
            </button>

            {/* Sentence Module */}
            <button
              onClick={() => setActiveTab('sentence')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                activeTab === 'sentence' ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-sentence"
            >
              <div className="relative">
                <BookOpen className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'sentence' ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {activeTab === 'sentence' && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.sentences')}</span>
            </button>

            {/* Grammar Module */}
            <button
              onClick={() => setActiveTab('grammar')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                activeTab === 'grammar' ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-grammar"
            >
              <div className="relative">
                <FileText className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'grammar' ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {activeTab === 'grammar' && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.grammar')}</span>
            </button>

            {/* Quiz Module */}
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                activeTab === 'quiz' ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-quiz"
            >
              <div className="relative">
                <Award className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'quiz' ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {activeTab === 'quiz' && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.quiz')}</span>
            </button>
          </>
        ) : (
          <>
            {/* Learning Path */}
            <button
              onClick={() => handleTabClick('lessons')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                isLessonsActive ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-lessons"
            >
              <div className="relative">
                <MapPin className={`w-5 h-5 transition-transform duration-200 ${isLessonsActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {isLessonsActive && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.path')}</span>
            </button>

            {/* Notebook */}
            <button
              onClick={() => handleTabClick('notebook')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                isNotebookActive ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-notebook"
            >
              <div className="relative">
                <FileText className={`w-5 h-5 transition-transform duration-200 ${isNotebookActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {isNotebookActive && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.notebook')}</span>
            </button>

            {/* Courses */}
            <button
              onClick={() => handleTabClick('courses')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                isCoursesActive ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-courses"
            >
              <div className="relative">
                <BookOpen className={`w-5 h-5 transition-transform duration-200 ${isCoursesActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {isCoursesActive && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.courses')}</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => handleTabClick('profile')}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                isProfileActive ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
              }`}
              id="tab-btn-profile"
            >
              <div className="relative">
                <User className={`w-5 h-5 transition-transform duration-150 ${isProfileActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                {isProfileActive && (
                  <motion.span 
                    layoutId="activeTabIndicatorDot" 
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">{t('navbar.profile')}</span>
            </button>

            {/* Conditional Admin Hub */}
            {isAdmin && (
              <button
                onClick={() => handleTabClick('admin')}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer relative ${
                  isAdminActive ? 'text-brand-purple' : 'text-brand-muted hover:text-brand-dark'
                }`}
                id="tab-btn-admin"
              >
                <div className="relative">
                  <Shield className={`w-5 h-5 transition-transform duration-200 ${isAdminActive ? 'scale-110 stroke-[2.5px]' : 'scale-100'}`} />
                  {isAdminActive && (
                    <motion.span 
                      layoutId="activeTabIndicatorDot" 
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-brand-purple rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-sans font-black tracking-tight mt-1 leading-none uppercase">Admin</span>
              </button>
            )}
          </>
        )}
      </nav>

      <SyncDashboard />
    </div>
  );
}

// Interactive reader sub-components
function VocabularyCard({ item }: { item: any }) {
  const [revealed, setRevealed] = useState(false);

  const speak = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(item.word);
      u.lang = 'th-TH';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div 
      onClick={() => setRevealed(!revealed)}
      className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex flex-col justify-between gap-3 shadow-3xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="space-y-1 text-left">
        <div className="flex justify-between items-start gap-2">
          <span className="text-xl font-bold font-sans text-slate-800 tracking-tight">{item.word}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speak();
            }}
            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-brand-purple rounded-lg transition-colors border-none cursor-pointer"
            title="Listen Pronunciation"
          >
            🔊
          </button>
        </div>
        
        {/* Phonetics in deep blue color */}
        <p className="text-[11.5px] font-mono font-semibold text-sky-700 tracking-wide">
          IPA: {item.pronunciation}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-2.5 mt-1">
        {revealed ? (
          <div className="space-y-0.5 text-left animate-fade-in">
            <span className="text-[8px] font-sans font-black text-emerald-600 uppercase tracking-widest block">Translation / Meaning</span>
            <p className="text-xs font-sans font-bold text-slate-800">{item.translation}</p>
            {item.meaning && <p className="text-[10px] text-slate-500 font-semibold">{item.meaning}</p>}
          </div>
        ) : (
          <div className="py-2.5 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200/60 text-[9.5px] font-sans font-black uppercase text-slate-400 tracking-wider hover:bg-slate-50 select-none">
            💡 Tap to Reveal Translation
          </div>
        )}
      </div>
    </div>
  );
}

function SentenceCard({ item }: { item: any }) {
  const speak = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(item.sentence);
      u.lang = 'th-TH';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs hover:shadow-xs transition-all flex items-start gap-4">
      <button
        type="button"
        onClick={speak}
        className="p-2.5 bg-brand-purple/5 hover:bg-brand-purple/10 text-brand-purple rounded-xl transition-all border-none cursor-pointer shrink-0 text-sm"
        title="Play Audio"
      >
        🔊
      </button>
      <div className="space-y-1.5 flex-1 text-left">
        <h5 className="font-sans font-bold text-sm text-slate-800 leading-snug">{item.sentence}</h5>
        
        {/* Phonetics in deep blue color */}
        <p className="text-xs font-mono font-bold text-sky-700">
          Pronunciation: {item.transcription}
        </p>
        
        <p className="text-xs font-sans font-semibold text-slate-600 pt-1 border-t border-gray-100">
          Translation: <b className="text-slate-800">{item.translation}</b>
        </p>
      </div>
    </div>
  );
}

function DialogueBubble({ item }: { item: any }) {
  const speak = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = 'th-TH';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-colors">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/40 pb-1.5">
        <span className="text-[10px] font-sans font-black text-[#583092] uppercase tracking-wider">
          🗣️ {item.speaker}
        </span>
        <button
          type="button"
          onClick={speak}
          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-brand-purple rounded-lg transition-colors border-none cursor-pointer text-xs"
          title="Play Line"
        >
          🔊 Play line
        </button>
      </div>
      <div className="space-y-1 text-left pt-1">
        <p className="font-sans font-bold text-slate-800 text-sm tracking-wide">{item.text}</p>
        
        {/* Phonetics in deep blue color */}
        <p className="text-[11px] font-mono font-bold text-sky-700">
          Pronunciation: {item.transcription}
        </p>
        
        <p className="text-[11.5px] font-sans font-bold text-brand-muted mt-1">
          → {item.translation}
        </p>
      </div>
    </div>
  );
}

function ConversationBlock({ item }: { item: any }) {
  const speak = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(item.content);
      u.lang = 'th-TH';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs hover:shadow-xs transition-all space-y-3.5 text-left">
      <div className="flex justify-between items-center border-b pb-2">
        <h4 className="font-sans font-black text-sm text-[#583092] uppercase tracking-tight">
          📖 {item.title}
        </h4>
        <button
          type="button"
          onClick={speak}
          className="px-2.5 py-1 bg-brand-purple/5 hover:bg-brand-purple/10 text-brand-purple text-[10px] font-sans font-black uppercase rounded-lg border-none cursor-pointer flex items-center gap-1"
        >
          🔊 Listen Full Paragraph
        </button>
      </div>
      <div className="space-y-2">
        <p className="font-sans font-bold text-slate-800 text-sm leading-relaxed tracking-wide bg-slate-50 p-3 rounded-xl border border-slate-100">
          {item.content}
        </p>
        
        {item.transcription && (
          <p className="text-xs font-mono font-bold text-sky-700">
            {item.transcription}
          </p>
        )}
        
        <div className="pt-2 border-t border-gray-100">
          <span className="text-[8px] font-sans font-black text-slate-400 uppercase tracking-widest block mb-1">Translation (ဘာသာပြန်)</span>
          <p className="text-xs font-sans font-semibold text-slate-700 leading-relaxed">
            {item.translation}
          </p>
        </div>
      </div>
    </div>
  );
}
