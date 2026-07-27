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

    const body = JSON.parse(event.body || '{}');
    const id = body.id || null;
    const course_id = body.course_id || 'course-basic';
    const title_thai = body.title_thai || '';
    const title_phonetic = body.title_phonetic || '';
    const title_english = body.title_english || '';
    const title_myanmar = body.title_myanmar || '';
    
    // Safely serialize structured arrays
    const dialogue = body.dialogue ? (typeof body.dialogue === 'string' ? body.dialogue : JSON.stringify(body.dialogue)) : '[]';
    const grammar = body.grammar ? (typeof body.grammar === 'string' ? body.grammar : JSON.stringify(body.grammar)) : '[]';
    const quizzes = body.quizzes || body.quizzesState || body.quizQuestions ? (typeof (body.quizzes || body.quizzesState || body.quizQuestions) === 'string' ? (body.quizzes || body.quizzesState || body.quizQuestions) : JSON.stringify(body.quizzes || body.quizzesState || body.quizQuestions)) : '[]';

    const sql = `
      INSERT OR REPLACE INTO lessons (id, course_id, title_thai, title_phonetic, title_english, title_myanmar, dialogue, grammar, quizzes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.prepare(sql).bind(
      id,
      course_id,
      title_thai,
      title_phonetic,
      title_english,
      title_myanmar,
      dialogue,
      grammar,
      quizzes
    ).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Lesson inserted into Cloudflare D1 successfully.', result }),
    };
  } catch (err: any) {
    console.error("D1 insert lesson failed:", err);
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
