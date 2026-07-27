export interface WordBreakdown {
  thai: string;
  phonetic: string;
  english: string;
  myanmar: string;
  myanmarPhonetic?: string;
  partOfSpeech: string;
  notes?: string;
  audioUrl?: string;
  pdf_drive_url?: string;
}

export interface DialogueLine {
  speaker: string; // 'A' or 'B' or human name like 'Prabas', 'John'
  thai: string;
  phonetic: string;
  english: string;
  myanmar: string;
  words: WordBreakdown[];
  videoUrl?: string; // Optional Speaker line preview video (GIF, MP4 or YouTube)
}

export interface GrammarNote {
  title: string;
  titleMyanmar: string;
  explanation: string;
  explanationMyanmar: string;
  examples: {
    thai: string;
    phonetic: string;
    english: string;
    myanmar: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  type: 'translate-thai-to-mm' | 'translate-mm-to-thai' | 'listening-match' | 'fill-gap';
  prompt: string; // the question prompt (e.g. "What does สบายดี (sabaajdii) mean?")
  promptThai?: string; // used for listening questions or fill-gaps
  options: string[]; // 4 multiple choice options
  correctAnswer: string;
  explanation?: string;
  explanationMyanmar?: string;
}

export interface Lesson {
  id: number;
  courseId?: string; // Links lesson to specific course (e.g. 'course-basic', 'course-business', 'course-workspace')
  titleThai: string;
  titlePhonetic: string;
  titleEnglish: string;
  titleMyanmar: string;
  titleMyanmarPhonetic?: string;
  descriptionEnglish: string;
  descriptionMyanmar: string;
  dialogue: DialogueLine[];
  wholeDialogueVideoUrl?: string; // Optional Lesson-wide full video for whole dialogue practice
  grammarNotes: GrammarNote[];
  quiz: QuizQuestion[];
}

export interface ProgressState {
  completedLessons: number[]; // Lesson IDs
  masteredWords: string[]; // List of Thai words marked mastered
  totalXp: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  quizHighScores: { [lessonId: number]: number }; // Lesson ID -> highest score percentage
}

export interface RegisteredUser {
  username: string;
  password?: string;
  role: 'admin' | 'student';
  xp: number;
  dateJoined: string;
  lessonsDone?: number; // total completed lessons count
  streakCount?: number;
  fullName?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface PurchaseOrder {
  id: string;
  username: string;
  itemName: string;
  itemType: 'e-book' | 'tutoring' | 'vip-package' | 'certificate' | 'course';
  priceAmount: number;
  currency: 'MMK' | 'THB' | 'XP';
  status: 'pending' | 'completed' | 'cancelled';
  orderDate: string;
  evidenceImage?: string;
  adminNotes?: string;
  studentPhone?: string;
  studentEmail?: string;
}

export interface EBookVocabEntry {
  word: string;
  pronunciation: string;
  translation: string;
  meaning: string;
}

export interface EBookSentenceEntry {
  sentence: string;
  transcription: string;
  translation: string;
}

export interface EBookDialogueEntry {
  speaker: string;
  text: string;
  transcription: string;
  translation: string;
}

export interface EBookConversationEntry {
  title: string;
  content: string;
  transcription?: string;
  translation: string;
}

export interface CourseResource {
  id: string;
  name: string;
  nameMm?: string;
  downloadUrl: string;
  priceAmount: number; // 0 for free download, > 0 for premium purchase
  currency: 'MMK';
  vocabEntries?: EBookVocabEntry[];
  sentenceEntries?: EBookSentenceEntry[];
  dialogueEntries?: EBookDialogueEntry[];
  conversationEntries?: EBookConversationEntry[];
}

export interface Course {
  id: string;
  name: string;
  nameMm: string;
  priceAmount: number;
  currency: 'MMK';
  duration: string;
  description: string;
  descriptionMm: string;
  instructor: string;
  resources?: CourseResource[];
}

export interface StoreItem {
  id: string;
  name: string;
  nameMm: string;
  type: 'e-book' | 'tutoring' | 'certificate' | 'vip-package';
  description: string;
  descriptionMm: string;
  price: number;
  currency: 'MMK' | 'XP';
  popular?: boolean;
  courseId?: string; // Optional links to filter lessons by course
  pdfFileName?: string; // Optional pdf filename for download
  pdfDownloadUrl?: string; // Optional direct website or PDF download resource URL
  googleDriveLink?: string; // Dynamic Google Drive link after approval
  vocabEntries?: EBookVocabEntry[];
  sentenceEntries?: EBookSentenceEntry[];
  dialogueEntries?: EBookDialogueEntry[];
  conversationEntries?: EBookConversationEntry[];
}


