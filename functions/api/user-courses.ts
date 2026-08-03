import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || url.searchParams.get('user_id') || url.searchParams.get('id') || '';

    if (!userId) {
      return jsonResponse({ success: false, error: 'userId parameter is required' }, 400);
    }

    const db = getDB(context);
    if (!db) {
      return jsonResponse({ success: false, error: 'D1 Database binding missing' }, 500);
    }

    const sql = `
      SELECT 
        c.*, 
        t.created_at as purchased_at,
        t.id as transaction_id,
        t.status as transaction_status
      FROM transactions t
      JOIN courses c ON t.course_id = c.id
      WHERE t.user_id = ? AND t.status = 'approved'
      ORDER BY t.created_at DESC
    `;

    const { results } = await db.prepare(sql).bind(userId).all();
    const coursesList = results || [];

    return jsonResponse({
      success: true,
      data: coursesList,
      userId,
      count: coursesList.length
    });
  } catch (err: any) {
    console.error('[user-courses API Error]:', err);
    return jsonResponse({
      success: false,
      error: err?.message || 'Failed to fetch purchased courses'
    }, 500);
  }
};
