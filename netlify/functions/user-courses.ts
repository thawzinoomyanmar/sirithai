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

  try {
    const params = event.queryStringParameters || {};
    const userId = params.userId || params.user_id || params.id || '';

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'userId parameter is required' }),
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: coursesList,
        userId,
        count: coursesList.length
      }),
    };
  } catch (err: any) {
    console.error('[Netlify user-courses Error]:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err?.message || 'Failed to fetch purchased courses',
      }),
    };
  }
};
