import useSWR from 'swr';
import { Lesson, Course, GrammarChapter } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any>);

const lessonsFetcher = async (endpoint: string): Promise<{ success: boolean; data: Lesson[] }> => {
  const fullUrl = `${API_BASE}${endpoint}`;
  console.log("Fetching user lessons...", fullUrl);
  try {
    const res = await fetch(fullUrl);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${res.statusText || errText}`);
    }
    const rawData: any = await res.json();
    console.log("User lessons received:", rawData);
    const parsedData: Lesson[] = Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []);
    return { success: rawData?.success ?? true, data: parsedData };
  } catch (err: any) {
    console.error("Error fetching user lessons:", err?.message || err);
    throw err;
  }
};

export function useLessons() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Lesson[] }>('/api/lessons', lessonsFetcher);
  return {
    lessons: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useCourses() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Course[] }>(`${API_BASE}/api/courses`, fetcher);
  return {
    courses: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useVocabulary() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>(`${API_BASE}/api/vocabulary`, fetcher);
  return {
    vocabulary: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useGrammarChapters() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: GrammarChapter[] }>(`${API_BASE}/api/grammar-chapters`, fetcher);
  return {
    grammarChapters: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useAlphabet() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>(`${API_BASE}/api/alphabet`, fetcher);
  return {
    alphabet: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useDynamicData() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any }>(`${API_BASE}/api/dynamic-data`, fetcher);
  return {
    dynamicData: data?.data || null,
    isLoading,
    isError: error
  };
}
