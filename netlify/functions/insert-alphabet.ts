import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const staticAdminHeader = event.headers['x-static-admin'] || event.headers['X-Static-Admin'];
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';

  if (!isAuthorized) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: '403 Forbidden Access: Invalid or missing administrator credentials.' }),
    };
  }

  const db = getDB(context);

  if (!db) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database connection failed',
        details: 'D1 database binding (env.DB) is not bound in Netlify function context.',
      }),
    };
  }

  try {
    // Ensure table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS alphabet (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        character TEXT,
        name_thai TEXT,
        name_phonetic TEXT
      )
    `).run();

    const body = JSON.parse(event.body || '{}');
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Alphabet record inserted into Cloudflare D1 successfully.', result }),
    };
  } catch (err: any) {
    console.error("D1 insert alphabet failed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database query execution failed',
        details: err.message || err,
      }),
    };
  }
};
