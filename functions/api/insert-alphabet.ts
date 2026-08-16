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
      CREATE TABLE IF NOT EXISTS alphabet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        character TEXT,
        name_thai TEXT,
        name_phonetic TEXT
      )
    `).run();

    const body: any = await req.json().catch(() => ({}));
    const id = body.id || null;
    const type = body.type || 'consonant';
    const character = body.character || '';
    const name_thai = body.name_thai || '';
    const name_phonetic = body.name_phonetic || '';

    const sql = `
      INSERT OR REPLACE INTO alphabet (id, type, character, name_thai, name_phonetic)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await db.prepare(sql).bind(
      id,
      type,
      character,
      name_thai,
      name_phonetic
    ).run();

    return jsonResponse({ success: true, message: 'Alphabet record inserted into Cloudflare D1 successfully.', result });
  } catch (err: any) {
    console.error("D1 insert alphabet failed:", err);
    return jsonResponse({
      error: 'Database query execution failed',
      details: err.message || String(err),
    }, 500);
  }
};
