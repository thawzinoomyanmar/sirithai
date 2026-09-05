import useSWR from 'swr';
import { Lesson, Course, GrammarChapter, VocabCategory, VocabItem } from '../types';
import { sessionCachedFetch } from '../utils/apiCache';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const fetcher = (url: string) => sessionCachedFetch(url).then(res => res.json() as Promise<any>);

const lessonsFetcher = async (endpoint: string): Promise<{ success: boolean; data: Lesson[] }> => {
  const fullUrl = `${API_BASE}${endpoint}`;
  console.log("Fetching user lessons...", fullUrl);
  try {
    const res = await sessionCachedFetch(fullUrl);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${res.statusText || errText}`);
    }
    const rawData: any = await res.json();
    console.log("User lessons received:", rawData);
    const parsedData: Lesson[] = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
    const sortedData = [...parsedData].sort((a, b) => {
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
      const aTitle = String(a.titleEnglish || a.titleThai || a.id || '');
      const bTitle = String(b.titleEnglish || b.titleThai || b.id || '');
      return aTitle.localeCompare(bTitle, undefined, { numeric: true, sensitivity: 'base' });
    });
    return { success: rawData?.success ?? true, data: sortedData };
  } catch (err: any) {
    console.error("Error fetching user lessons:", err?.message || err);
    throw err;
  }
};

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 10000,
};

export function useLessons() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Lesson[] }>('/api/lessons', lessonsFetcher, swrOptions);
  return {
    lessons: data?.data || [],
    isLoading,
    isError: error
  };
}

export async function fetchLessonDetail(lessonId: string | number): Promise<Lesson | null> {
  const cleanId = String(lessonId);
  const fullUrl = `${API_BASE}/api/lessons/${encodeURIComponent(cleanId)}`;
  try {
    const res = await sessionCachedFetch(fullUrl);
    if (!res.ok) {
      const fallbackUrl = `${API_BASE}/api/lessons?id=${encodeURIComponent(cleanId)}`;
      const res2 = await sessionCachedFetch(fallbackUrl);
      if (!res2.ok) return null;
      const data2: any = await res2.json();
      return data2.data || data2.lesson || null;
    }
    const rawData: any = await res.json();
    return rawData.data || rawData.lesson || null;
  } catch (err) {
    console.error(`Error fetching lesson detail #${lessonId}:`, err);
    return null;
  }
}

export function useLessonDetail(lessonId: string | number | null) {
  const key = lessonId ? `/api/lessons/${encodeURIComponent(String(lessonId))}` : null;
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Lesson }>(key, fetcher, swrOptions);
  return {
    lesson: data?.data || null,
    isLoading,
    isError: error
  };
}

export function useCourses() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Course[] }>(`${API_BASE}/api/courses`, fetcher, swrOptions);
  return {
    courses: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useVocabulary(categoryId?: string | null) {
  const url = categoryId
    ? `${API_BASE}/api/vocabulary?category=${encodeURIComponent(categoryId)}`
    : `${API_BASE}/api/vocabulary`;
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>(url, fetcher, swrOptions);
  return {
    vocabulary: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useVocabCategories() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: VocabCategory[] }>(`${API_BASE}/api/vocab-categories`, fetcher, swrOptions);
  return {
    categories: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useVocabItems(categoryId: string | null) {
  const key = categoryId ? `${API_BASE}/api/vocabulary?category=${encodeURIComponent(categoryId)}` : null;
  const { data, error, isLoading } = useSWR<{ success: boolean; data: VocabItem[] }>(key, fetcher, swrOptions);
  return {
    items: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useGrammarChapters() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: GrammarChapter[] }>(`${API_BASE}/api/grammar-chapters`, fetcher, swrOptions);
  return {
    grammarChapters: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useAlphabet() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>(`${API_BASE}/api/alphabet`, fetcher, swrOptions);
  return {
    alphabet: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useDynamicData() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any }>(`${API_BASE}/api/dynamic-data`, fetcher, swrOptions);
  return {
    dynamicData: data?.data || null,
    isLoading,
    isError: error
  };
}

export function useGrammarExt(courseId?: string, chapterNumber?: number) {
  let url = `${API_BASE}/api/grammar`;
  const params = [];
  if (courseId) params.push(`courseId=${encodeURIComponent(courseId)}`);
  if (chapterNumber !== undefined && chapterNumber !== null) params.push(`chapterNumber=${encodeURIComponent(chapterNumber)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>(url, fetcher, swrOptions);
  return {
    grammarList: data?.data || [],
    isLoading,
    isError: error
  };
}
