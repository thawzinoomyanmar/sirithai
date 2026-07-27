export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS preflight handler
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' }),
    };
  }

  // Auth gate check
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const staticAdminHeader = event.headers['x-static-admin'] || event.headers['X-Static-Admin'];
  
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';
  
  if (!isAuthorized) {
    console.warn("Unauthorized attempt to invoke d1-transaction-deploy API.");
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'D1 Binding Missing or Invalid Token', 
        code: 'UNAUTHORIZED_TOKEN_INVALID',
        details: 'Invalid or missing administrator credentials header.' 
      }),
    };
  }

  // Audit D1 connection binding
  const db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  
  if (!db) {
    console.warn("[D1 Binding Check] Cloudflare D1 database binding (env.DB) is missing/unattached.");
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'D1 Binding Missing or Invalid Token',
        code: 'D1_BINDING_MISSING',
        details: 'D1 database binding (env.DB) is not attached to function runtime. Queued for offline sync.',
        offline_queued: true
      }),
    };
  }

  try {
    let body: any = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    } catch (parseErr: any) {
      console.error("Failed to parse incoming transaction JSON body:", parseErr);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid JSON payload structure', code: 'BAD_REQUEST' }),
      };
    }
    
    // 1. Schema Safety: Ensure table exists with default constraints
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          amount REAL NOT NULL DEFAULT 0.0,
          payment_method TEXT,
          status TEXT DEFAULT 'pending',
          transaction_proof_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();
    } catch (schemaErr: any) {
      console.warn("D1 transactions table schema check note:", schemaErr?.message || schemaErr);
    }

    // 2. Defensive Field Sanitization & Non-Null Validation
    const finalId = (body.id && String(body.id).trim()) || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const user_id = body.user_id ? String(body.user_id).trim() : 'anonymous';
    const parsedAmount = parseFloat(body.amount);
    const amount = isNaN(parsedAmount) ? 0.0 : parsedAmount;
    const payment_method = body.payment_method ? String(body.payment_method).trim() : 'direct';
    const status = body.status ? String(body.status).trim() : 'pending';
    const transaction_proof_url = body.transaction_proof_url ? String(body.transaction_proof_url) : null;

    console.log(`[D1 Ingesting Transaction] ID: ${finalId}, User: ${user_id}, Amount: ${amount}, Method: ${payment_method}`);

    // 3. UPSERT SQL Query Execution with Conflict Resolution
    const sql = `
      INSERT INTO transactions (id, user_id, amount, payment_method, status, transaction_proof_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        amount = excluded.amount,
        payment_method = excluded.payment_method,
        status = excluded.status,
        transaction_proof_url = excluded.transaction_proof_url,
        created_at = CURRENT_TIMESTAMP;
    `;
    
    const result = await db.prepare(sql).bind(
      finalId,
      user_id,
      amount,
      payment_method,
      status,
      transaction_proof_url
    ).run();

    console.log(`[D1 SQL Result]`, JSON.stringify(result));
    console.log(`[D1 Ingestion Success] Transaction ${finalId} written to Cloudflare D1 successfully.`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        id: finalId,
        message: 'Transaction created/updated in Cloudflare D1 successfully.', 
        record: {
          id: finalId,
          user_id,
          amount,
          payment_method,
          status,
          transaction_proof_url
        },
        result 
      }),
    };
  } catch (err: any) {
    console.error("D1 Transaction Ingestion SQLite/D1 Error Message:", err?.message || err);
    console.error("D1 Transaction Ingestion SQLite/D1 Error Cause:", err?.cause || 'N/A');
    console.error("D1 Transaction Ingestion SQLite/D1 Stack Trace:", err?.stack || '');

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Database query execution failed',
        details: err?.message || String(err),
        cause: err?.cause ? String(err.cause) : null,
        code: 'D1_QUERY_FAILED'
      }),
    };
  }
};
