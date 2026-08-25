import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleOptions();
  if (context.request.method !== 'GET') return jsonResponse({ success: false, error: 'Method not allowed' }, 405);

  const userId = new URL(context.request.url).searchParams.get('userId');
  if (!userId) return jsonResponse({ success: false, error: 'userId parameter is required' }, 400);

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  try {
    const { results } = await db.prepare(`
      SELECT c.*, uc.created_at AS purchased_at, uc.id AS enrollment_id, uc.status AS enrollment_status
      FROM user_courses uc
      INNER JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = ? AND LOWER(uc.status) IN ('approved', 'completed', 'active')
      ORDER BY uc.created_at DESC
    `).bind(userId).all();
    return jsonResponse({ success: true, data: results || [], userId, count: results?.length || 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
