import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST' && method !== 'PUT' && method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const staticAdminHeader = req.headers.get('x-static-admin') || req.headers.get('X-Static-Admin');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ error: '403 Forbidden Access: Missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      error: 'Database connection failed',
      details: 'D1 database binding (env.DB) is not bound in function context.',
      code: 'D1_BINDING_MISSING'
    }, 500);
  }

  try {
    const url = new URL(req.url);
    let body: any = {};
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const table = (url.searchParams.get('table') || body.table || 'lessons').toLowerCase();
    const lessonId = body.lesson_id || body.lessonId || body.id || url.searchParams.get('lessonId') || url.searchParams.get('id');

    // Ensure core tables exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id TEXT,
        title_thai TEXT,
        title_phonetic TEXT,
        title_english TEXT,
        title_myanmar TEXT,
        dialogue TEXT,
        grammar TEXT,
        quizzes TEXT
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS words_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thai_text TEXT,
        english_text TEXT,
        myanmar_text TEXT,
        phonetic TEXT,
        phonetic_mm TEXT,
        category TEXT,
        audio_url TEXT,
        pdf_drive_url TEXT,
        illustration TEXT
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS app_data (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();

    // GET handler
    if (method === 'GET') {
      if (table === 'lessons' && lessonId) {
        const row = await db.prepare(`SELECT * FROM lessons WHERE id = ?`).bind(lessonId).first();
        return jsonResponse({ success: true, lesson: row });
      }
      return jsonResponse({ success: true, message: 'D1 API Curriculum ready.' });
    }

    // POST / PUT handlers
    if (table === 'lessons') {
      const id = body.id || body.lesson_id;
      const course_id = body.course_id || body.courseId || 'course-basic';
      const title_thai = body.title_thai || body.titleThai || '';
      const title_phonetic = body.title_phonetic || body.titlePhonetic || '';
      const title_english = body.title_english || body.titleEnglish || '';
      const title_myanmar = body.title_myanmar || body.titleMyanmar || '';
      const dialogue = body.dialogue ? (typeof body.dialogue === 'string' ? body.dialogue : JSON.stringify(body.dialogue)) : '[]';
      const grammar = body.grammar || body.grammarNotes ? (typeof (body.grammar || body.grammarNotes) === 'string' ? (body.grammar || body.grammarNotes) : JSON.stringify(body.grammar || body.grammarNotes)) : '[]';
      const quizzes = body.quizzes || body.quiz ? (typeof (body.quizzes || body.quiz) === 'string' ? (body.quizzes || body.quiz) : JSON.stringify(body.quizzes || body.quiz)) : '[]';

      if (id) {
        const existing = await db.prepare(`SELECT id FROM lessons WHERE id = ?`).bind(id).first();
        if (existing) {
          await db.prepare(`
            UPDATE lessons 
            SET course_id = ?, title_thai = ?, title_phonetic = ?, title_english = ?, title_myanmar = ?, dialogue = ?, grammar = ?, quizzes = ?
            WHERE id = ?
          `).bind(course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes, id).run();
        } else {
          await db.prepare(`
            INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes).run();
        }
      } else {
        await db.prepare(`
          INSERT INTO lessons (course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes).run();
      }

      return jsonResponse({
        success: true,
        message: `Lesson metadata ${id ? '#' + id : ''} saved to Cloudflare D1 successfully.`,
        table: 'lessons',
        lessonId: id
      });
    }

    if (table === 'vocab' || table === 'vocabulary') {
      const vocabList = Array.isArray(body.vocab) ? body.vocab : (body.words || (body.thai_text ? [body] : []));
      const categoryTag = body.category || (lessonId ? `Lesson ${lessonId}` : 'general');

      if (lessonId && Array.isArray(body.vocab)) {
        const key = `thai_custom_vocab_${lessonId}`;
        await db.prepare(`INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)`).bind(key, JSON.stringify(body.vocab)).run();
      }

      for (const item of vocabList) {
        const thai = item.thai || item.thai_text || '';
        const english = item.english || item.english_text || '';
        const myanmar = item.myanmar || item.myanmar_text || '';
        const phonetic = item.phonetic || '';
        const phoneticMm = item.phoneticMm || item.phonetic_mm || item.myanmarPhonetic || '';
        const audioUrl = item.audioUrl || item.audio_url || item.url || null;
        const pdfDriveUrl = item.pdf_drive_url || null;
        const illustration = item.illustration || null;

        if (thai) {
          await db.prepare(`
            INSERT INTO words_phrases (thai_text, english_text, myanmar_text, phonetic, phonetic_mm, category, audio_url, pdf_drive_url, illustration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(thai, english, myanmar, phonetic, phoneticMm, categoryTag, audioUrl, pdfDriveUrl, illustration).run();
        }
      }

      return jsonResponse({
        success: true,
        message: `Vocabulary dataset for Lesson ${lessonId || 'general'} saved to Cloudflare D1 successfully.`,
        table: 'vocab',
        count: vocabList.length
      });
    }

    if (table === 'dialogue') {
      const dialogueStr = typeof body.dialogue === 'string' ? body.dialogue : JSON.stringify(body.dialogue || []);
      
      if (lessonId) {
        const existing = await db.prepare(`SELECT id FROM lessons WHERE id = ?`).bind(lessonId).first();
        if (existing) {
          await db.prepare(`UPDATE lessons SET dialogue = ? WHERE id = ?`).bind(dialogueStr, lessonId).run();
        } else {
          await db.prepare(`
            INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
            VALUES (?, 'course-basic', '', '', '', '', ?, '[]', '[]')
          `).bind(lessonId, dialogueStr).run();
        }

        await db.prepare(`INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)`).bind(`thai_custom_dialogue_${lessonId}`, dialogueStr).run();
      }

      return jsonResponse({
        success: true,
        message: `Dialogue configuration for Lesson ${lessonId} saved to Cloudflare D1 successfully.`,
        table: 'dialogue',
        lessonId
      });
    }

    if (table === 'grammar') {
      const grammarStr = typeof (body.grammar || body.grammarNotes) === 'string' ? (body.grammar || body.grammarNotes) : JSON.stringify(body.grammar || body.grammarNotes || []);

      if (lessonId) {
        const existing = await db.prepare(`SELECT id FROM lessons WHERE id = ?`).bind(lessonId).first();
        if (existing) {
          await db.prepare(`UPDATE lessons SET grammar = ? WHERE id = ?`).bind(grammarStr, lessonId).run();
        } else {
          await db.prepare(`
            INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
            VALUES (?, 'course-basic', '', '', '', '', '[]', ?, '[]')
          `).bind(lessonId, grammarStr).run();
        }

        await db.prepare(`INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)`).bind(`thai_custom_grammar_${lessonId}`, grammarStr).run();
      }

      return jsonResponse({
        success: true,
        message: `Grammar rules configuration for Lesson ${lessonId} saved to Cloudflare D1 successfully.`,
        table: 'grammar',
        lessonId
      });
    }

    if (table === 'quizzes' || table === 'quiz') {
      const quizzesStr = typeof (body.quizzes || body.quiz) === 'string' ? (body.quizzes || body.quiz) : JSON.stringify(body.quizzes || body.quiz || []);

      if (lessonId) {
        const existing = await db.prepare(`SELECT id FROM lessons WHERE id = ?`).bind(lessonId).first();
        if (existing) {
          await db.prepare(`UPDATE lessons SET quizzes = ? WHERE id = ?`).bind(quizzesStr, lessonId).run();
        } else {
          await db.prepare(`
            INSERT INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
            VALUES (?, 'course-basic', '', '', '', '', '[]', '[]', ?)
          `).bind(lessonId, quizzesStr).run();
        }

        await db.prepare(`INSERT OR REPLACE INTO app_data (key, value) VALUES (?, ?)`).bind(`thai_custom_quizzes_${lessonId}`, quizzesStr).run();
      }

      return jsonResponse({
        success: true,
        message: `Interactive quizzes dataset for Lesson ${lessonId} saved to Cloudflare D1 successfully.`,
        table: 'quizzes',
        lessonId
      });
    }

    return jsonResponse({ error: `Invalid table parameter '${table}'. Supported: lessons, vocab, dialogue, grammar, quizzes` }, 400);

  } catch (err: any) {
    console.error("D1 API Curriculum operation failed:", err);
    return jsonResponse({
      error: 'D1 Database operation failed',
      details: err.message || String(err),
    }, 500);
  }
};
