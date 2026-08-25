/**
 * Forces strict numeric ordering (1, 2, 3... 10, 11... 21) instead of alphabetical string sorting.
 */
export const LESSON_ORDER_BY_SQL = `
  ORDER BY
    CASE WHEN id GLOB '[0-9]*' THEN CAST(id AS INTEGER) ELSE 999999 END ASC,
    CAST(id AS INTEGER) ASC,
    id ASC
`;

export function getStableLessonId(row: Record<string, unknown>): number | string {
  const rawId = String(row.id ?? '').trim();

  if (/^\d+$/.test(rawId)) {
    return Number(rawId);
  }

  if (rawId) {
    return rawId;
  }

  return `lesson-row-${String(row.lesson_rowid || row.id || '1')}`;
}

export function sortLessonsNaturally<T extends Record<string, any>>(lessons: T[]): T[] {
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
    const aStr = String(a.titleEnglish || a.title_english || a.titleThai || a.title_thai || a.id || '');
    const bStr = String(b.titleEnglish || b.title_english || b.titleThai || b.title_thai || b.id || '');
    return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
  });
}

