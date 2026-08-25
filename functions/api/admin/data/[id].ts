import { getDB, jsonResponse, handleOptions } from '../../dbHelper';

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
    return jsonResponse({ success: false, error: '403 Forbidden Access: Missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'Database connection failed' }, 500);
  }

  const id = context.params.id as string;
  const url = new URL(req.url);
  const type = (url.searchParams.get('type') || (id && id.startsWith('course') ? 'courses' : 'lessons')).toLowerCase();

  try {
    if (method === 'GET') {
      if (type === 'courses') {
        const row = await db.prepare('SELECT * FROM courses WHERE id = ?').bind(id).first();
        if (!row) return jsonResponse({ success: false, error: `Course '${id}' not found` }, 404);
        return jsonResponse({
          success: true,
          data: {
            id: row.id,
            name: row.name,
            nameMm: row.name_mm || row.name,
            description: row.description || '',
            priceAmount: row.price_amount || 0,
            currency: row.currency || 'MMK',
            duration: row.duration || '',
            instructor: row.instructor || '',
            resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
          }
        });
      }

      const row = await db.prepare('SELECT * FROM lessons WHERE id = ?').bind(id).first();
      if (!row) return jsonResponse({ success: false, error: `Lesson '${id}' not found` }, 404);
      return jsonResponse({
        success: true,
        data: {
          id: row.id,
          courseId: row.course_id,
          titleThai: row.title_thai || '',
          titlePhonetic: row.title_phonetic || '',
          titleEnglish: row.title_english || '',
          titleMyanmar: row.title_myanmar || '',
          dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
          grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
          quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
        }
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;

      if (type === 'courses') {
        await db.prepare(`
          UPDATE courses SET
            name = COALESCE(?, name),
            name_mm = COALESCE(?, name_mm),
            description = COALESCE(?, description),
            price_amount = COALESCE(?, price_amount),
            currency = COALESCE(?, currency),
            duration = COALESCE(?, duration),
            instructor = COALESCE(?, instructor),
            resources = COALESCE(?, resources)
          WHERE id = ?
        `).bind(
          record.name || record.title || null,
          record.name_mm || record.nameMm || null,
          record.description || null,
          record.price_amount ?? record.priceAmount ?? null,
          record.currency || null,
          record.duration || null,
          record.instructor || null,
          record.resources ? (typeof record.resources === 'string' ? record.resources : JSON.stringify(record.resources)) : null,
          id
        ).run();

        return jsonResponse({ success: true, message: `Course '${id}' updated successfully in D1`, id });
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
        record.course_id || record.courseId || null,
        record.title_thai || record.titleThai || null,
        record.title_phonetic || record.titlePhonetic || null,
        record.title_english || record.titleEnglish || null,
        record.title_myanmar || record.titleMyanmar || null,
        record.dialogue ? (typeof record.dialogue === 'string' ? record.dialogue : JSON.stringify(record.dialogue)) : null,
        record.grammar || record.grammarNotes ? (typeof (record.grammar || record.grammarNotes) === 'string' ? (record.grammar || record.grammarNotes) : JSON.stringify(record.grammar || record.grammarNotes)) : null,
        record.quizzes || record.quiz ? (typeof (record.quizzes || record.quiz) === 'string' ? (record.quizzes || record.quiz) : JSON.stringify(record.quizzes || record.quiz)) : null,
        id
      ).run();

      return jsonResponse({ success: true, message: `Lesson '${id}' updated successfully in D1`, id });
    }

    if (method === 'DELETE') {
      if (type === 'courses') {
        await db.prepare('UPDATE lessons SET course_id = NULL WHERE course_id = ?').bind(id).run();
        await db.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: `Course '${id}' deleted successfully from D1`, id });
      }

      await db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true, message: `Lesson '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error(`Dynamic ID endpoint error for ${id}:`, err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
