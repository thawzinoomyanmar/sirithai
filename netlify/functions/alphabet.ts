import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const db = getDB(context);
  if (!db) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database connection failed' }) };
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

    const { results } = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results),
    };
  } catch (err: any) {
    console.error("D1 get alphabet failed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
