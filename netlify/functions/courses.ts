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
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )
    `).run();

    const { results } = await db.prepare('SELECT * FROM courses').all();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results),
    };
  } catch (err: any) {
    console.error("D1 get courses failed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
