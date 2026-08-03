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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  const db = getDB(context);
  if (!db) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Database Binding Missing' }),
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const userId = params.userId || params.user_id || params.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'userId parameter is required' }),
      };
    }

    // Query 1: User Profile
    const userProfile = await db.prepare(
      `SELECT id, full_name, email, avatar_url, role, created_at FROM users_profile WHERE id = ?`
    ).bind(userId).first();

    // Query 2: Total Purchased Courses
    const countResult = await db.prepare(
      `SELECT COUNT(DISTINCT course_id) as total_purchased_courses FROM transactions WHERE user_id = ? AND status = 'approved'`
    ).bind(userId).first();

    const totalPurchasedCourses = countResult
      ? Number(countResult.total_purchased_courses ?? countResult['COUNT(DISTINCT course_id)'] ?? 0)
      : 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          profile: userProfile || null,
          totalPurchasedCourses,
          userId
        }
      }),
    };
  } catch (err: any) {
    console.error('[Netlify Profile API Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || String(err) }),
    };
  }
};
