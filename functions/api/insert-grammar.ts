import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const staticAdminHeader = req.headers.get('x-static-admin') || req.headers.get('X-Static-Admin');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session' || process.env.NODE_ENV !== 'production';

  if (!isAuthorized) {
    return jsonResponse({ error: '403 Forbidden Access: Invalid or missing administrator credentials.' }, 403);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      error: 'Database connection failed',
      details: 'D1 database binding (env.DB) is not bound in function context.',
    }, 500);
  }

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS grammar_chapters (
        chapter_number INTEGER PRIMARY KEY,
        title_english TEXT,
        title_myanmar TEXT
      )
    `).run();

    const body: any = await req.json().catch(() => ({}));
    const chapter_number = body.chapter_number;
    const title_english = body.title_english || '';
    const title_myanmar = body.title_myanmar || '';

    if (chapter_number === undefined) {
      return jsonResponse({ error: 'Bad Request: Missing chapter_number.' }, 400);
    }

    const sql = `
      INSERT OR REPLACE INTO grammar_chapters (chapter_number, title_english, title_myanmar)
      VALUES (?, ?, ?)
    `;

    const result = await db.prepare(sql).bind(
      chapter_number,
      title_english,
      title_myanmar
    ).run();

    return jsonResponse({ success: true, message: 'Grammar chapter inserted into Cloudflare D1 successfully.', result });
  } catch (err: any) {
    console.error("D1 insert grammar failed:", err);
    return jsonResponse({
      error: 'Database query execution failed',
      details: err.message || String(err),
    }, 500);
  }
};
