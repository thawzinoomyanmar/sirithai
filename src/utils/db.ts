/// <reference types="vite/client" />

import Dexie, { type Table } from 'dexie';

// ----------------------------------------------------
// IndexedDB Local Store Interfaces
// ----------------------------------------------------
export interface LocalAuthCache {
  id: string;
  full_name: string;
  email: string;
  last_login: string;
}

export interface LocalWordAndAudio {
  id: number;
  thai_text?: string;
  english_text: string;
  myanmar_text: string;
  phonetic?: string;
  phonetic_mm?: string;
  category?: string;
  pdf_drive_url?: string;
  audio_url: string | null;
  audio_blob?: Blob | null;
  is_synced: number; // 0 = unsynced, 1 = synced
}

export interface LocalUserProfile {
  id: string;
  full_name: string;
  email: string;
}

export interface LocalTransaction {
  id: string;
  user_id: string;
  course_id?: string;
  item_name?: string;
  item_type?: string;
  amount: number;
  status: string; // 'pending' | 'success' | 'failed'
  transaction_proof_url: string | null;
  is_synced: number; // 0 = unsynced, 1 = synced
}

export interface LocalGrammarChapter {
  chapter_number: number;
  title_english: string;
  title_myanmar: string;
}

export interface LocalCourse {
  id: string;
  name: string;
  description: string;
}

export interface LocalLesson {
  id?: number;
  course_id: string;
  title_thai: string;
  title_phonetic: string;
  title_english: string;
  title_myanmar: string;
}

export interface LocalAlphabet {
  id?: number;
  type: string;
  character: string;
  name_thai: string;
  name_phonetic: string;
}

// Instantiating Dexie directly
export const localDB = new Dexie('OfflineLanguageApp') as Dexie & {
  auth_cache: Table<LocalAuthCache, string>;
  words_and_audio: Table<LocalWordAndAudio, number>;
  user_profiles: Table<LocalUserProfile, string>;
  transactions: Table<LocalTransaction, string>;
  grammar_chapters: Table<LocalGrammarChapter, number>;
  courses: Table<LocalCourse, string>;
  lessons: Table<LocalLesson, number>;
  alphabet: Table<LocalAlphabet, number>;
};

localDB.version(1).stores({
  auth_cache: 'id, full_name, email, last_login',
  words_and_audio: 'id, thai_text, english_text, myanmar_text, audio_url, audio_blob, is_synced',
  user_profiles: 'id, full_name, email',
  transactions: 'id, user_id, amount, status, is_synced'
});

localDB.version(2).stores({
  words_and_audio: 'id, thai_text, english_text, myanmar_text, phonetic, phonetic_mm, category, pdf_drive_url, audio_url, audio_blob, is_synced'
});

localDB.version(3).stores({
  grammar_chapters: 'chapter_number, title_english, title_myanmar',
  courses: 'id, name, description',
  lessons: '++id, course_id, title_thai, title_phonetic, title_english, title_myanmar',
  alphabet: '++id, type, character, name_thai, name_phonetic'
});
