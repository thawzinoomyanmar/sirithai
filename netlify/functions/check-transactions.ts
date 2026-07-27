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

  const db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;

  if (!db) {
    console.warn("Check Transactions API: D1 database binding (env.DB) is missing.");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'D1 Binding Missing',
        database_id: process.env.CLOUDFLARE_DATABASE_ID || 'ceba9320-4b75-46b5-8077-d96c4c627176',
        details: 'D1 binding (env.DB) is not attached to function context.'
      }),
    };
  }

  try {
    const query = await db.prepare("SELECT id, user_id, amount, payment_method, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 10;").all();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: query.results ? query.results.length : 0,
        transactions: query.results || [],
        meta: query.meta || {}
      }),
    };
  } catch (err: any) {
    console.error("Check Transactions API Query Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to query transactions table',
        details: err?.message || String(err)
      }),
    };
  }
};
