import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      success: false,
      error: 'D1 Binding Missing',
      database_id: process.env.CLOUDFLARE_DATABASE_ID || 'ceba9320-4b75-46b5-8077-d96c4c627176',
      details: 'D1 binding (env.DB) is not attached to function context.'
    }, 500);
  }

  try {
    const query = await db.prepare("SELECT id, user_id, amount, payment_method, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 10;").all();
    
    return jsonResponse({
      success: true,
      count: query.results ? query.results.length : 0,
      transactions: query.results || [],
      meta: query.meta || {}
    });
  } catch (err: any) {
    console.error("Check Transactions API Query Error:", err);
    return jsonResponse({
      success: false,
      error: 'Failed to query transactions table',
      details: err?.message || String(err)
    }, 500);
  }
};
