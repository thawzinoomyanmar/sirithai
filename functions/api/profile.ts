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

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || url.searchParams.get('user_id') || url.searchParams.get('id');

    if (!userId) {
      return jsonResponse({ success: false, error: 'userId parameter is required' }, 400);
    }

    // Query 1: Fetch user profile details
    const userProfile = await db.prepare(
      `SELECT id, full_name, email, avatar_url, role, created_at FROM users_profile WHERE id = ?`
    ).bind(userId).first();

    // Query 2: Count purchased courses from transactions table
    const countResult = await db.prepare(
      `SELECT COUNT(DISTINCT course_id) as total_purchased_courses FROM transactions WHERE user_id = ? AND status = 'approved'`
    ).bind(userId).first();

    const totalPurchasedCourses = countResult
      ? Number(countResult.total_purchased_courses ?? countResult['COUNT(DISTINCT course_id)'] ?? 0)
      : 0;

    return jsonResponse({
      success: true,
      data: {
        profile: userProfile || null,
        totalPurchasedCourses,
        userId
      }
    });
  } catch (err: any) {
    console.error('[Profile API Error]:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
