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
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  const db = getDB(context);
  if (!db) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: 'D1 Binding Missing' }) };
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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: results || [],
        count: (results || []).length
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err?.message || String(err) })
    };
  }
};
