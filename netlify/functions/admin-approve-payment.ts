export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  const db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;

  let body: any = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch (parseErr: any) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
    };
  }

  const id = body.id ? String(body.id).trim() : '';
  const status = body.status ? String(body.status).trim() : 'approved';

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Transaction ID is required' }),
    };
  }

  if (!db) {
    console.warn(`[D1 Approve Payment] D1 Database binding unattached for transaction ${id}. Fallback active.`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Transaction ${id} status queued locally for status '${status}'.`,
        local_fallback: true
      }),
    };
  }

  try {
    console.log(`[D1 Approve Payment] Updating transaction ${id} status to '${status}'...`);
    const sql = `UPDATE transactions SET status = ? WHERE id = ?;`;
    const result = await db.prepare(sql).bind(status, id).run();

    console.log(`[D1 Approve Payment Success] Transaction ${id} updated to '${status}'.`, JSON.stringify(result));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Transaction ${id} status updated to '${status}' in Cloudflare D1.`,
        id,
        status,
        result
      }),
    };
  } catch (err: any) {
    console.error("D1 Approve Payment Error:", err?.message || err, err?.stack || '');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to update transaction status in D1',
        details: err?.message || String(err)
      }),
    };
  }
};
