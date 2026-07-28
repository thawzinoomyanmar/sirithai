import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const staticAdminHeader = req.headers.get('x-static-admin');
  const authHeader = req.headers.get('authorization');
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';

  if (!isAuthorized) {
    return jsonResponse({ success: false, error: '403 Forbidden Access: Invalid or missing administrator credentials.' }, 403);
  }

  const db = getDB(context);

  if (!db) {
    return jsonResponse({
      success: false, 
      error: 'Database connection failed',
      details: 'D1 database binding (env.DB) is not bound in Cloudflare Pages function context.'
    }, 500);
  }

  try {
    const body = await req.json() as any;
    
    // Check against expected schema
    const id = body.id || null;
    const course_id = body.course_id || 'course-basic';
    const title_thai = body.title_thai || '';
    const title_phonetic = body.title_phonetic || '';
    const title_english = body.title_english || '';
    const title_myanmar = body.title_myanmar || '';
    
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

    return jsonResponse({ success: true, message: 'Lesson inserted into Cloudflare D1 successfully.', result });
  } catch (err: any) {
    console.error("Backend Error:", err);
    return jsonResponse({ 
      success: false, 
      error: 'Database query execution failed', 
      details: err.message || err 
    }, 500);
  }
};
