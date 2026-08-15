import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const sql = `
      SELECT 
        t.*,
        u.full_name as student_full_name,
        u.email as student_profile_email,
        c.name as course_name,
        c.name_mm as course_name_mm
      FROM transactions t
      LEFT JOIN users_profile u ON t.user_id = u.id
      LEFT JOIN courses c ON t.course_id = c.id
      ORDER BY t.created_at DESC
    `;
    const { results } = await db.prepare(sql).all();
    return jsonResponse({
      success: true,
      data: results || [],
      count: (results || []).length
    });
  } catch (err: any) {
    console.error('[Admin Transactions API Error]:', err);
    return jsonResponse({ success: false, error: err?.message || String(err) }, 500);
  }
};
