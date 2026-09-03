import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { getStableLessonId, LESSON_ORDER_BY_SQL, sortLessonsNaturally } from './lessonOrdering';

async function readLessons(db: D1Database) {
  const sql = `
    SELECT 
      l.rowid AS lesson_rowid,
      l.id,
      l.course_id,
      l.title_thai,
      l.title_phonetic,
      l.title_myanmar_phonetic,
      l.title_english,
      l.title_myanmar,
      l.description_english,
      l.description_myanmar,
      l.created_at,
      c.name AS course_name
    FROM lessons l
    LEFT JOIN courses c ON l.course_id = c.id
    GROUP BY l.id
    ORDER BY
      CASE WHEN l.id GLOB '[0-9]*' THEN CAST(l.id AS INTEGER) ELSE 999999 END ASC,
      CAST(l.id AS INTEGER) ASC,
      l.id ASC
  `;
  let results: any[] = [];
  try {
    const res = await db.prepare(sql).all();
    results = res.results || [];
  } catch (err1) {
    try {
      const res = await db.prepare('SELECT id, course_id, title_thai, title_phonetic, title_myanmar_phonetic, title_english, title_myanmar, created_at FROM lessons').all();
      results = res.results || [];
    } catch (err2) {
      console.error("D1 readLessons error:", err2);
      return [];
    }
  }

  const seenIds = new Set<string | number>();
  const lessons: any[] = [];

  for (const row of (results || [])) {
    const stableId = getStableLessonId(row);
    if (seenIds.has(stableId)) continue;
    seenIds.add(stableId);

    const descText = row.description_myanmar || row.description || row.detail_description || row.description_english || '';
    lessons.push({
      id: stableId,
      courseId: row.course_id || 'course-basic',
      titleThai: row.title_thai || '',
      titlePhonetic: row.title_phonetic || '',
      titleMyanmarPhonetic: row.title_myanmar_phonetic || '',
      title_myanmar_phonetic: row.title_myanmar_phonetic || '',
      titleEnglish: row.title_english || '',
      titleMyanmar: row.title_myanmar || '',
      title_myanmar: row.title_myanmar || '',
      description: descText,
      descriptionEnglish: row.description_english || descText,
      descriptionMyanmar: row.description_myanmar || descText,
      createdAt: row.created_at,
    });
  }

  return sortLessonsNaturally(lessons);
}

async function safeAll(db: D1Database, primarySql: string, fallbackSql?: string): Promise<any[]> {
  try {
    const res = await db.prepare(primarySql).all();
    return res.results || [];
  } catch (err1) {
    if (fallbackSql) {
      try {
        const res = await db.prepare(fallbackSql).all();
        return res.results || [];
      } catch (err2) {
        console.error(`D1 safeAll fallback failed for '${fallbackSql}':`, err2);
      }
    } else {
      console.error(`D1 safeAll primary failed for '${primarySql}':`, err1);
    }
    return [];
  }
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    const requestedKey = new URL(context.request.url).searchParams.get('key');
    if (requestedKey) {
      if (requestedKey === 'lessons') return jsonResponse({ success: true, data: await readLessons(db) });
      if (requestedKey === 'courses') {
        const results = await safeAll(db, 'SELECT * FROM courses ORDER BY created_at ASC', 'SELECT * FROM courses');
        return jsonResponse({ success: true, data: results });
      }
      if (requestedKey === 'grammar_chapters') {
        const results = await safeAll(db, 'SELECT * FROM grammar_chapters ORDER BY chapter_number ASC', 'SELECT * FROM grammar_chapters');
        return jsonResponse({ success: true, data: results });
      }
      if (requestedKey === 'alphabet') {
        const results = await safeAll(db, 'SELECT * FROM alphabet ORDER BY id ASC', 'SELECT * FROM alphabet');
        return jsonResponse({ success: true, data: results });
      }
      if (requestedKey === 'vocab_categories') {
        const results = await safeAll(db, 'SELECT * FROM vocab_categories ORDER BY order_index ASC, id ASC');
        return jsonResponse({ success: true, data: results });
      }
      if (requestedKey === 'vocabulary') {
        const results = await safeAll(db, 'SELECT * FROM vocab_items ORDER BY order_index ASC, id ASC', 'SELECT * FROM words_phrases ORDER BY id ASC');
        return jsonResponse({ success: true, data: results });
      }

      try {
        const row = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind(requestedKey).first<{ value: string }>();
        if (!row) return jsonResponse({ success: false, error: `D1 key '${requestedKey}' not found` }, 404);
        return jsonResponse({ success: true, data: JSON.parse(row.value) });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || String(err) }, 500);
      }
    }

    const [lessons, courses, grammar, alphabet, vocabulary, vocabCategories, appData, rawOrientation, rawGrammarExt, rawDialogue, rawConversation, rawStoreItems, audioEbooks, audioTracks] = await Promise.all([
      readLessons(db).catch(() => []),
      safeAll(db, 'SELECT * FROM courses ORDER BY created_at ASC', 'SELECT * FROM courses'),
      safeAll(db, 'SELECT * FROM grammar_chapters ORDER BY chapter_number ASC', 'SELECT * FROM grammar_chapters'),
      safeAll(db, 'SELECT * FROM alphabet ORDER BY id ASC', 'SELECT * FROM alphabet'),
      safeAll(db, 'SELECT * FROM vocab_items ORDER BY order_index ASC, id ASC', 'SELECT * FROM words_phrases ORDER BY id ASC'),
      safeAll(db, 'SELECT * FROM vocab_categories ORDER BY order_index ASC, id ASC'),
      safeAll(db, 'SELECT key, value FROM app_data ORDER BY key ASC', 'SELECT key, value FROM app_data'),
      safeAll(db, 'SELECT * FROM orientation ORDER BY order_index ASC, created_at ASC'),
      safeAll(db, 'SELECT * FROM grammar_ext ORDER BY chapter_number ASC, order_index ASC'),
      safeAll(db, 'SELECT * FROM dialogue ORDER BY chapter_number ASC, order_index ASC'),
      safeAll(db, 'SELECT * FROM conversation ORDER BY chapter_number ASC, order_index ASC'),
      safeAll(db, 'SELECT * FROM store_items ORDER BY order_index ASC, created_at DESC'),
      safeAll(db, 'SELECT * FROM audio_ebooks ORDER BY created_at DESC'),
      safeAll(db, 'SELECT * FROM audio_tracks ORDER BY order_index ASC, track_number ASC', 'SELECT * FROM audio_tracks ORDER BY track_number ASC'),
    ]);

    const storeItems = rawStoreItems.map((row: any) => {
      let content: any = {};
      if (row.content_json) {
        try { content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json; } catch { content = {}; }
      }
      return {
        id: row.id,
        name: row.name,
        nameMm: row.name_mm || row.name,
        type: row.type || 'e-book',
        description: row.description || '',
        descriptionMm: row.description_mm || '',
        price: Number(row.price || 0),
        currency: row.currency || 'MMK',
        popular: Boolean(row.popular),
        courseId: row.course_id || undefined,
        pdfFileName: row.pdf_file_name || undefined,
        pdfDownloadUrl: row.pdf_download_url || undefined,
        googleDriveLink: row.google_drive_link || undefined,
        ...content
      };
    });

    const orientation = (rawOrientation || []).map((row: any) => {
      let parsedSections = [];
      if (row.content) {
        try {
          parsedSections = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        } catch (e) {
          parsedSections = [];
        }
      }
      return {
        id: row.id,
        courseId: row.course_id || 'course-basic',
        titleEnglish: row.title || row.title_english || '',
        titleMyanmar: row.title_myanmar || row.title_mm || '',
        sections: Array.isArray(parsedSections) ? parsedSections : [],
        videoUrl: row.video_url || null
      };
    });

    const grammar_ext = (rawGrammarExt || []).map((row: any) => {
      let parsedExamples: any = [];
      if (row.examples_json) {
        try {
          parsedExamples = typeof row.examples_json === 'string' ? JSON.parse(row.examples_json) : row.examples_json;
        } catch (e) {
          parsedExamples = [];
        }
      }
      return {
        id: row.id,
        courseId: row.course_id || 'course-basic',
        chapterNumber: row.chapter_number,
        chapter_number: row.chapter_number,
        title: row.title || '',
        title_myanmar: row.title_myanmar || '',
        explanation: row.explanation || '',
        explanation_myanmar: row.explanation_myanmar || '',
        examples: parsedExamples,
        examples_json: row.examples_json
      };
    });

    const dialogue = (rawDialogue || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id || 'course-basic',
      chapterNumber: row.chapter_number || 1,
      chapter_number: row.chapter_number || 1,
      speaker: row.speaker || '',
      textThai: row.text_thai || '',
      text_thai: row.text_thai || '',
      textMyanmar: row.text_myanmar || '',
      text_myanmar: row.text_myanmar || '',
      audioUrl: row.audio_url || null,
      orderIndex: row.order_index || 0
    }));

    const conversation = (rawConversation || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id || 'course-basic',
      chapterNumber: row.chapter_number || 1,
      chapter_number: row.chapter_number || 1,
      speaker: row.speaker || '',
      textThai: row.text_thai || '',
      text_thai: row.text_thai || '',
      textPhonetic: row.text_phonetic || row.phonetic || '',
      text_phonetic: row.text_phonetic || row.phonetic || '',
      textMyanmar: row.text_myanmar || '',
      text_myanmar: row.text_myanmar || '',
      textEnglish: row.text_english || row.english || '',
      text_english: row.text_english || row.english || '',
      audioUrl: row.audio_url || null,
      orderIndex: row.order_index || 0
    }));

    return jsonResponse({
      success: true,
      data: {
        lessons,
        courses,
        grammar_chapters: grammar,
        orientation,
        grammar_ext,
        dialogue,
        conversation,
        alphabet,
        vocabulary,
        vocab_categories: vocabCategories,
        app_data: appData,
        store_items: storeItems,
        audio_ebooks: audioEbooks,
        audio_tracks: audioTracks,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
