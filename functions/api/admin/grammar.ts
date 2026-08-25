import { getDB, jsonResponse, handleOptions } from '../dbHelper';

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
      const { results } = await db.prepare('SELECT * FROM grammar_chapters ORDER BY chapter_number ASC').all();
      return jsonResponse({ success: true, type: 'grammar', data: results || [] });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const record = body.record || body;

      const title_english = record.title_english || record.titleEnglish;
      if (!title_english || String(title_english).trim() === '') {
        return jsonResponse({ success: false, error: 'English chapter title (title_english) is required' }, 400);
      }

      const chapter_number = record.chapter_number || record.chapterNumber || 1;
      const title_myanmar = record.title_myanmar || record.titleMyanmar || title_english;
      const content = record.content ? (typeof record.content === 'string' ? record.content : JSON.stringify(record.content)) : '';

      const res = await db.prepare(`
        INSERT INTO grammar_chapters (chapter_number, title_english, title_myanmar, content)
        VALUES (?, ?, ?, ?)
      `).bind(chapter_number, title_english, title_myanmar, content).run();

      const lastId = res.meta?.lastRowId;

      return jsonResponse({
        success: true,
        message: 'Grammar chapter created in D1 successfully',
        id: lastId,
        grammar: {
          id: lastId,
          chapter_number,
          title_english,
          title_myanmar,
          content
        }
      });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = await req.json() as any;
      const record = body.record || body;
      const id = record.id || body.id;

      if (!id) {
        return jsonResponse({ success: false, error: 'Grammar chapter ID is required for update' }, 400);
      }

      await db.prepare(`
        UPDATE grammar_chapters SET
          chapter_number = COALESCE(?, chapter_number),
          title_english = COALESCE(?, title_english),
          title_myanmar = COALESCE(?, title_myanmar),
          content = COALESCE(?, content)
        WHERE id = ?
      `).bind(
        record.chapter_number || record.chapterNumber || null,
        record.title_english || record.titleEnglish || null,
        record.title_myanmar || record.titleMyanmar || null,
        record.content ? (typeof record.content === 'string' ? record.content : JSON.stringify(record.content)) : null,
        id
      ).run();

      return jsonResponse({ success: true, message: `Grammar chapter '${id}' updated successfully in D1`, id });
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
        return jsonResponse({ success: false, error: 'Grammar chapter ID is required for deletion' }, 400);
      }

      await db.prepare('DELETE FROM grammar_chapters WHERE id = ?').bind(id).run();

      return jsonResponse({ success: true, message: `Grammar chapter '${id}' deleted successfully from D1`, id });
    }

    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    console.error('Cloudflare D1 Admin Grammar API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
