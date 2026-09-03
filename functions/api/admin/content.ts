import { getDB, handleOptions, jsonResponse } from '../dbHelper';

interface CountRow {
  entity: string;
  total: number;
}

const ENTITY_LABELS: Record<string, string> = {
  courses: 'Courses',
  lessons: 'Lessons',
  'lesson-dialogues': 'Lesson dialogue',
  'lesson-grammar': 'Lesson grammar',
  'lesson-quizzes': 'Lesson quizzes',
  'vocab-categories': 'Vocabulary categories',
  vocabulary: 'Vocabulary',
  'grammar-chapters': 'Grammar chapters',
  orientation: 'Orientation',
  'grammar-rules': 'Grammar rules',
  dialogue: 'Dialogue',
  conversation: 'Conversation',
  alphabet: 'Alphabet',
  'store-items': 'Store items',
  'audio-ebooks': 'Audio eBooks',
  'audio-tracks': 'Audio tracks',
  'ebook-chapters': 'eBook chapters',
  'ebook-chapter-sections': 'eBook chapter tabs',
  'ebook-chapter-vocabulary': 'eBook vocabulary',
  'ebook-chapter-verbs': 'eBook verb patterns',
  'ebook-chapter-qa': 'eBook Q&A',
  'ebook-chapter-conversations': 'eBook conversations',
  settings: 'App settings'
};

const ENTITY_TABLES: Record<string, string> = {
  courses: 'courses',
  lessons: 'lessons',
  'lesson-dialogues': 'lesson_dialogues',
  'lesson-grammar': 'lesson_grammar',
  'lesson-quizzes': 'lesson_quizzes',
  'vocab-categories': 'vocab_categories',
  vocabulary: 'vocab_items',
  'grammar-chapters': 'grammar_chapters',
  orientation: 'orientation',
  'grammar-rules': 'grammar_ext',
  dialogue: 'dialogue',
  conversation: 'conversation',
  alphabet: 'alphabet',
  'store-items': 'store_items',
  'audio-ebooks': 'audio_ebooks',
  'audio-tracks': 'audio_tracks',
  'ebook-chapters': 'ebook_chapters',
  'ebook-chapter-sections': 'ebook_chapter_sections',
  'ebook-chapter-vocabulary': 'ebook_chapter_vocabulary',
  'ebook-chapter-verbs': 'ebook_chapter_verbs',
  'ebook-chapter-qa': 'ebook_chapter_qa',
  'ebook-chapter-conversations': 'ebook_chapter_conversations',
  settings: 'app_data'
};

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const request = context.request;
  if (request.method === 'OPTIONS') return handleOptions();
  if (request.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);

  const authorized = request.headers.get('x-static-admin') === 'true'
    || request.headers.get('authorization') === 'Bearer admin-local-session';
  if (!authorized) return jsonResponse({ success: false, error: 'Administrator credentials are required.' }, 403);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding is missing.' }, 500);

  try {
    // D1 enforces a lower compound-SELECT term limit than desktop SQLite in
    // some production configurations. Batch the independent count statements
    // instead of building a large UNION ALL query.
    const countResults = await db.batch<CountRow>(
      Object.entries(ENTITY_TABLES).map(([entity, table]) =>
        db.prepare(`SELECT ? AS entity, COUNT(*) AS total FROM ${table}`).bind(entity)
      )
    );
    const counts = Object.fromEntries(
      countResults.flatMap((result) => result.results).map((row) => [row.entity, Number(row.total)])
    );
    return jsonResponse({
      success: true,
      entities: Object.entries(ENTITY_LABELS).map(([id, label]) => ({ id, label, count: counts[id] ?? 0 })),
      total: Object.values(counts).reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: 'cms_summary_error', message }));
    return jsonResponse({ success: false, error: message }, 500);
  }
};
