import { getDB } from './dbHelper';

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const db = getDB(context);

  if (!db) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ success: false, error: 'D1 Binding Missing' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    let body: any = {};
    if (event.body) {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    }

    const { id, status } = body;

    if (!id || !status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing id or status' }),
      };
    }

    if (status !== 'approved' && status !== 'rejected') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid status. Must be approved or rejected.' }),
      };
    }

    const sql = `UPDATE transactions SET status = ? WHERE id = ?`;
    await db.prepare(sql).bind(status, id).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Order ${id} updated to ${status}`,
      }),
    };

  } catch (err: any) {
    console.error('[Admin Update Status Error]', err);
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
