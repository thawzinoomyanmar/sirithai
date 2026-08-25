import { getDB, jsonResponse, handleOptions } from './dbHelper';
import { getStableLessonId, sortLessonsNaturally } from './lessonOrdering';

async function syncRelationalLessonData(db: D1Database, lessonId: string, body: any) {
  // 1. Ensure relational tables exist
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_dialogues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      speaker TEXT,
      thai TEXT,
      phonetic TEXT,
      english TEXT,
      myanmar TEXT,
      words TEXT,
      video_url TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_grammar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT,
      title_myanmar TEXT,
      explanation TEXT,
      explanation_myanmar TEXT,
      examples TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS lesson_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      quiz_id TEXT,
      type TEXT,
      prompt TEXT,
      prompt_thai TEXT,
      options TEXT,
      correct_answer TEXT,
      explanation TEXT,
      explanation_myanmar TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2. Clear previous relational items for this lesson
  await db.prepare('DELETE FROM lesson_dialogues WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
  await db.prepare('DELETE FROM lesson_grammar WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
  await db.prepare('DELETE FROM lesson_quizzes WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});

  // 3. Insert Dialogues
  const dialogues = Array.isArray(body.dialogue) ? body.dialogue : [];
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

  // 4. Insert Grammar Notes
  const grammarList = Array.isArray(body.grammar || body.grammarNotes) ? (body.grammar || body.grammarNotes) : [];
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

  // 5. Insert Quizzes
  const quizList = Array.isArray(body.quizzes || body.quiz) ? (body.quizzes || body.quiz) : [];
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
  const { request } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    if (request.method === 'GET') {
      const courseId = new URL(request.url).searchParams.get('courseId') || new URL(request.url).searchParams.get('course_id');
      
      let sql = `
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
      if (courseId) {
        sql += ` WHERE l.course_id = ?`;
        params.push(courseId);
      }

      sql += `
        GROUP BY l.id
        ORDER BY
          CASE WHEN l.id GLOB '[0-9]*' THEN CAST(l.id AS INTEGER) ELSE 999999 END ASC,
          CAST(l.id AS INTEGER) ASC,
          l.id ASC
      `;

      let results: any[] = [];
      try {
        const statement = db.prepare(sql);
        const res = params.length > 0 ? await statement.bind(...params).all() : await statement.all();
        results = res.results || [];
      } catch (err1) {
        try {
          const res = await db.prepare('SELECT id, course_id, title_thai, title_phonetic, title_english, title_myanmar, created_at FROM lessons').all();
          results = res.results || [];
        } catch (err2: any) {
          console.error("D1 GET lessons error:", err2);
          return jsonResponse({ success: false, error: err2?.message || String(err2) }, 500);
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
          titleEnglish: row.title_english || '',
          titleMyanmar: row.title_myanmar || '',
          title_myanmar: row.title_myanmar || '',
          description: descText,
          descriptionEnglish: row.description_english || descText,
          descriptionMyanmar: row.description_myanmar || descText,
          createdAt: row.created_at,
        });
      }

      const sortedLessons = sortLessonsNaturally(lessons);
      return jsonResponse({ success: true, count: sortedLessons.length, data: sortedLessons });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;

    if (request.method === 'POST') {
      const id = String(body.id || body.lesson_id || `lesson-${Date.now()}`);
      const courseId = body.courseId ?? body.course_id ?? 'course-basic';
      const titleThai = body.titleThai ?? body.title_thai ?? '';
      const titlePhonetic = body.titlePhonetic ?? body.title_phonetic ?? '';
      const titleEnglish = body.titleEnglish ?? body.title_english ?? '';
      const titleMyanmar = body.titleMyanmar ?? body.title_myanmar ?? '';
      const descriptionEnglish = body.descriptionEnglish ?? body.description_english ?? body.description ?? '';
      const descriptionMyanmar = body.descriptionMyanmar ?? body.description_myanmar ?? body.description ?? '';

      await db.prepare(`
        INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, description_english, description_myanmar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          course_id = excluded.course_id,
          title_thai = excluded.title_thai,
          title_phonetic = excluded.title_phonetic,
          title_english = excluded.title_english,
          title_myanmar = excluded.title_myanmar,
          description_english = excluded.description_english,
          description_myanmar = excluded.description_myanmar
      `).bind(
        id,
        courseId,
        titleThai,
        titlePhonetic,
        titleEnglish,
        titleMyanmar,
        descriptionEnglish,
        descriptionMyanmar
      ).run();

      await syncRelationalLessonData(db, id, body);
      return jsonResponse({ success: true, id }, 201);
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const id = String(body.id || body.lesson_id || '');
      if (!id) return jsonResponse({ success: false, error: 'Lesson id is required' }, 400);

      const courseId = body.courseId ?? body.course_id ?? 'course-basic';
      const titleThai = body.titleThai ?? body.title_thai ?? '';
      const titlePhonetic = body.titlePhonetic ?? body.title_phonetic ?? '';
      const titleEnglish = body.titleEnglish ?? body.title_english ?? '';
      const titleMyanmar = body.titleMyanmar ?? body.title_myanmar ?? '';
      const descriptionEnglish = body.descriptionEnglish ?? body.description_english ?? body.description ?? '';
      const descriptionMyanmar = body.descriptionMyanmar ?? body.description_myanmar ?? body.description ?? '';

      await db.prepare(`
        UPDATE lessons SET 
          course_id = ?, 
          title_thai = ?, 
          title_phonetic = ?, 
          title_english = ?, 
          title_myanmar = ?, 
          description_english = ?, 
          description_myanmar = ?
        WHERE id = ?
      `).bind(
        courseId,
        titleThai,
        titlePhonetic,
        titleEnglish,
        titleMyanmar,
        descriptionEnglish,
        descriptionMyanmar,
        id
      ).run();

      await syncRelationalLessonData(db, id, body);
      return jsonResponse({ success: true, id });
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || String(body.id || '');
      if (!id) return jsonResponse({ success: false, error: 'Lesson id is required' }, 400);
      await db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, id });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
