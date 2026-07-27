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

  const db = getDB(context);

  if (!db) {
    console.warn("[User Access API Netlify] D1 database binding missing.");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'D1 Binding Missing'
      }),
    };
  }

  try {
    const { username, itemId } = event.queryStringParameters || {};

    if (!username || !itemId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing username or itemId'
        }),
      };
    }

    // Admins always have access
    if (username === 'admin') {
       return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
             success: true,
             status: 'approved'
          }),
       };
    }
    
    // Some basic items are unlocked for everyone. "course-basic" is handled in frontend but checking just in case.

    // Using COLLATE NOCASE or lower() to match user and item ids case-insensitively
    // We order by created_at DESC to get the latest transaction if there are multiple attempts
    const sql = `
      SELECT status 
      FROM transactions 
      WHERE LOWER(user_id) = LOWER(?) 
        AND (LOWER(id) = LOWER(?) OR LOWER(item_name) LIKE '%' || LOWER(?) || '%')
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await db.prepare(sql).bind(username, itemId, itemId).first();

    let accessStatus = 'locked';

    if (result) {
      if (result.status === 'completed' || result.status === 'approved') {
        accessStatus = 'approved';
      } else if (result.status === 'pending') {
        accessStatus = 'pending';
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: accessStatus
      }),
    };

  } catch (err: any) {
    console.error('[User Access API Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Database operation failed',
        details: err?.message || String(err),
      }),
    };
  }
};
