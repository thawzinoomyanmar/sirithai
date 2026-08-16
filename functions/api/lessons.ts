import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    if (method === 'GET') {
      const url = new URL(req.url);
      const courseId = url.searchParams.get('courseId');

      let lessons: any[] = [];
      let query = 'SELECT * FROM lessons ORDER BY rowid ASC';
      let params: any[] = [];

      if (courseId) {
        query = 'SELECT * FROM lessons WHERE course_id = ? ORDER BY rowid ASC';
        params = [courseId];
      }

      try {
        const stmt = db.prepare(query);
        const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

        if (results && results.length > 0) {
          lessons = results.map((row: any) => ({
            id: row.id,
            courseId: row.course_id || 'course-basic',
            titleThai: row.title_thai,
            titlePhonetic: row.title_phonetic || '',
            titleEnglish: row.title_english || '',
            titleMyanmar: row.title_myanmar || '',
            dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
            grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
            quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
          }));
        }
      } catch (dbErr: any) {
        console.warn("Direct D1 lessons query note:", dbErr?.message || dbErr);
      }

      // Fallback to app_data key = 'lessons' if lessons table returned empty
      if (lessons.length === 0) {
        try {
          const appDataRow = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind('lessons').first();
          if (appDataRow && appDataRow.value) {
            const parsed = typeof appDataRow.value === 'string' ? JSON.parse(appDataRow.value) : appDataRow.value;
            if (Array.isArray(parsed)) {
              lessons = parsed;
              if (courseId) {
                lessons = lessons.filter((l: any) => (l.courseId || 'course-basic') === courseId);
              }
            }
          }
        } catch (appDataErr: any) {
          console.warn("app_data lessons fallback note:", appDataErr?.message || appDataErr);
        }
      }

      return jsonResponse({ success: true, data: lessons });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { id, courseId, titleThai, titlePhonetic, titleEnglish, titleMyanmar, dialogue, grammar, quizzes } = body;

      const lessonId = id || `lesson-${Date.now()}`;

      await db.prepare(`
        INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          course_id=excluded.course_id,
          title_thai=excluded.title_thai,
          title_phonetic=excluded.title_phonetic,
          title_english=excluded.title_english,
          title_myanmar=excluded.title_myanmar,
          dialogue=excluded.dialogue,
          grammar=excluded.grammar,
          quizzes=excluded.quizzes
      `).bind(
        lessonId,
        courseId || 'course-basic',
        titleThai || '',
        titlePhonetic || '',
        titleEnglish || '',
        titleMyanmar || '',
        dialogue ? JSON.stringify(dialogue) : '[]',
        grammar ? JSON.stringify(grammar) : '[]',
        quizzes ? JSON.stringify(quizzes) : '[]'
      ).run();

      return jsonResponse({ success: true, message: 'Lesson saved successfully', id: lessonId });
    }

    if (method === 'PUT') {
      const body = await req.json() as any;
      const { id, courseId, titleThai, titlePhonetic, titleEnglish, titleMyanmar, dialogue, grammar, quizzes } = body;

      if (!id) {
        return jsonResponse({ success: false, error: 'Lesson id is required' }, 400);
      }

      await db.prepare(`
        UPDATE lessons SET
          course_id = COALESCE(?, course_id),
          title_thai = COALESCE(?, title_thai),
          title_phonetic = COALESCE(?, title_phonetic),
          title_english = COALESCE(?, title_english),
          title_myanmar = COALESCE(?, title_myanmar),
          dialogue = COALESCE(?, dialogue),
          grammar = COALESCE(?, grammar),
          quizzes = COALESCE(?, quizzes)
        WHERE id = ?
      `).bind(
        courseId || null,
        titleThai || null,
        titlePhonetic || null,
        titleEnglish || null,
        titleMyanmar || null,
        dialogue ? JSON.stringify(dialogue) : null,
        grammar ? JSON.stringify(grammar) : null,
        quizzes ? JSON.stringify(quizzes) : null,
        id
      ).run();

      return jsonResponse({ success: true, message: 'Lesson updated successfully', id });
    }

    if (method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return jsonResponse({ success: false, error: 'Lesson id search param is required' }, 400);
      }

      await db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: 'Lesson deleted successfully', id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
