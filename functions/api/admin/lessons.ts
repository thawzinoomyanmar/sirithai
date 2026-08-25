import { getDB, jsonResponse, handleOptions } from '../dbHelper';
import { getStableLessonId, sortLessonsNaturally } from '../lessonOrdering';

async function syncRelationalLessonData(db: D1Database, lessonId: string, record: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_dialogues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      speaker TEXT, thai TEXT, phonetic TEXT, english TEXT, myanmar TEXT, words TEXT, video_url TEXT, order_index INTEGER DEFAULT 0
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_grammar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT, title_myanmar TEXT, explanation TEXT, explanation_myanmar TEXT, examples TEXT, order_index INTEGER DEFAULT 0
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      quiz_id TEXT, type TEXT, prompt TEXT, prompt_thai TEXT, options TEXT, correct_answer TEXT, explanation TEXT, explanation_myanmar TEXT, order_index INTEGER DEFAULT 0
    )
  `).run();

  await db.prepare('DELETE FROM lesson_dialogues WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
  await db.prepare('DELETE FROM lesson_grammar WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
  await db.prepare('DELETE FROM lesson_quizzes WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});

  const dialogues = Array.isArray(record.dialogue) ? record.dialogue : [];
  for (let idx = 0; idx < dialogues.length; idx++) {
    const d = dialogues[idx];
    await db.prepare(`
      INSERT INTO lesson_dialogues (lesson_id, speaker, thai, phonetic, english, myanmar, words, video_url, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      d.speaker || 'A',
      d.thai || '',
      d.phonetic || '',
      d.english || '',
      d.myanmar || '',
      JSON.stringify(d.words || []),
      d.videoUrl || d.video_url || null,
      idx
    ).run();
  }

  const grammarList = Array.isArray(record.grammar || record.grammarNotes) ? (record.grammar || record.grammarNotes) : [];
  for (let idx = 0; idx < grammarList.length; idx++) {
    const g = grammarList[idx];
    await db.prepare(`
      INSERT INTO lesson_grammar (lesson_id, title, title_myanmar, explanation, explanation_myanmar, examples, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      g.title || '',
      g.titleMyanmar || g.title_myanmar || '',
      g.explanation || '',
      g.explanationMyanmar || g.explanation_myanmar || '',
      JSON.stringify(g.examples || []),
      idx
    ).run();
  }

  const quizList = Array.isArray(record.quizzes || record.quiz) ? (record.quizzes || record.quiz) : [];
  for (let idx = 0; idx < quizList.length; idx++) {
    const q = quizList[idx];
    await db.prepare(`
      INSERT INTO lesson_quizzes (lesson_id, quiz_id, type, prompt, prompt_thai, options, correct_answer, explanation, explanation_myanmar, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lessonId,
      q.id || q.quiz_id || `q-${idx}`,
      q.type || 'translate-thai-to-mm',
      q.prompt || '',
      q.promptThai || q.prompt_thai || null,
      JSON.stringify(q.options || []),
      q.correctAnswer || q.correct_answer || '',
      q.explanation || null,
      q.explanationMyanmar || q.explanation_myanmar || null,
      idx
    ).run();
  }
}

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const staticAdminHeader = req.headers.get('x-static-admin');
  const authHeader = req.headers.get('authorization');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Administrator credentials required.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  try {
    const url = new URL(req.url);

    if (method === 'GET') {
      const courseIdFilter = url.searchParams.get('course_id') || url.searchParams.get('courseId');
      
      let query = `
        SELECT 
          l.rowid AS lesson_rowid,
          l.id,
          l.course_id,
          l.title_thai,
          l.title_phonetic,
          l.title_english,
          l.title_myanmar,
          l.description_english,
          l.description_myanmar,
          l.created_at,
          c.name AS course_name
        FROM lessons l
        LEFT JOIN courses c ON l.course_id = c.id
      `;
      const params: any[] = [];

      if (courseIdFilter) {
        query += ` WHERE l.course_id = ?`;
        params.push(courseIdFilter);
      }

      query += `
        GROUP BY l.id
        ORDER BY
          CASE WHEN l.id GLOB '[0-9]*' THEN CAST(l.id AS INTEGER) ELSE 999999 END ASC,
          CAST(l.id AS INTEGER) ASC,
          l.id ASC
      `;

      const stmt = db.prepare(query);
      const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

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
          titleEnglish: row.title_english || '',
          titleMyanmar: row.title_myanmar || '',
          title_myanmar: row.title_myanmar || '',
          description: descText,
          descriptionEnglish: row.description_english || descText,
          descriptionMyanmar: row.description_myanmar || descText,
        });
      }

      const sortedLessons = sortLessonsNaturally(lessons);
      return jsonResponse({ success: true, count: sortedLessons.length, type: 'lessons', data: sortedLessons });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const record = body.record || body;

      const title_thai = record.title_thai || record.titleThai;
      if (!title_thai || String(title_thai).trim() === '') {
        return jsonResponse({ success: false, error: 'Thai title (title_thai) is required for creating a lesson' }, 400);
      }

      const course_id = record.course_id || record.courseId || 'course-basic';
      const id = String(record.id || `lesson-${Date.now()}`);
      const title_phonetic = record.title_phonetic || record.titlePhonetic || '';
      const title_english = record.title_english || record.titleEnglish || '';
      const title_myanmar = record.title_myanmar || record.titleMyanmar || '';
      const description_english = record.description_english || record.descriptionEnglish || record.description || '';
      const description_myanmar = record.description_myanmar || record.descriptionMyanmar || record.description || '';

      await db.prepare(`
        INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          course_id=excluded.course_id,
          title_thai=excluded.title_thai,
          title_phonetic=excluded.title_phonetic,
          title_english=excluded.title_english,
          title_myanmar=excluded.title_myanmar,
          description_english=excluded.description_english,
          description_myanmar=excluded.description_myanmar
      `).bind(id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar).run();

      await syncRelationalLessonData(db, id, record);

      return jsonResponse({
        success: true,
        message: 'Lesson created and saved into Cloudflare D1 successfully',
        id
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;
      const id = String(record.id || body.id || '');

      if (!id) {
        return jsonResponse({ success: false, error: 'Lesson ID is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE lessons SET
          course_id = COALESCE(?, course_id),
          title_thai = COALESCE(?, title_thai),
          title_phonetic = COALESCE(?, title_phonetic),
          title_english = COALESCE(?, title_english),
          title_myanmar = COALESCE(?, title_myanmar),
          description_english = COALESCE(?, description_english),
          description_myanmar = COALESCE(?, description_myanmar)
        WHERE id = ?
      `).bind(
        record.course_id || record.courseId || null,
        record.title_thai || record.titleThai || null,
        record.title_phonetic || record.titlePhonetic || null,
        record.title_english || record.titleEnglish || null,
        record.title_myanmar || record.titleMyanmar || null,
        record.description_english || record.descriptionEnglish || record.description || null,
        record.description_myanmar || record.descriptionMyanmar || record.description || null,
        id
      ).run();

      await syncRelationalLessonData(db, id, record);

      return jsonResponse({ success: true, message: `Lesson '${id}' updated successfully in D1`, id });
    }

    if (method === 'DELETE') {
      let id = url.searchParams.get('id');
      if (!id) {
        try {
          const body = await req.json() as any;
          id = body?.id;
        } catch {}
      }

      if (!id) {
        return jsonResponse({ success: false, error: 'Lesson ID is required for deletion' }, 400);
      }

      await db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();

      return jsonResponse({ success: true, message: `Lesson '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('Cloudflare D1 Admin Lessons API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
