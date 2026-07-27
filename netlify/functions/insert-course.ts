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
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )
    `).run();

    const body = JSON.parse(event.body || '{}');
    const id = body.id;
    const name = body.name || '';
    const description = body.description || '';

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Bad Request: Missing course id.' }),
      };
    }

    const sql = `
      INSERT INTO courses (id, name, description)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description
    `;

    const result = await db.prepare(sql).bind(
      id,
      name,
      description
    ).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Course inserted into Cloudflare D1 successfully.', result }),
    };
  } catch (err: any) {
    console.error("D1 insert course failed:", err);
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
