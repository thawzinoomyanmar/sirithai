import useSWR from 'swr';
import { Lesson, Course, GrammarChapter } from '../types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useLessons() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Lesson[] }>('/api/lessons', fetcher);
  return {
    lessons: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useCourses() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: Course[] }>('/api/courses', fetcher);
  return {
    courses: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useVocabulary() {
  // Vocabulary items across all categories
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>('/api/vocabulary', fetcher);
  return {
    vocabulary: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useGrammarChapters() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: GrammarChapter[] }>('/api/grammar-chapters', fetcher);
  return {
    grammarChapters: data?.data || [],
    isLoading,
    isError: error
  };
}

export function useAlphabet() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any[] }>('/api/alphabet', fetcher);
  return {
    alphabet: data?.data || [],
    isLoading,
    isError: error
  };
}

// Fetch all dynamic data structure in one go (similar to what App.tsx does)
export function useDynamicData() {
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any }>('/api/dynamic-data', fetcher);
  return {
    dynamicData: data?.data || null,
    isLoading,
    isError: error
  };
}
