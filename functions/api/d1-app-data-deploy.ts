export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS preflight check
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
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Auth gate check
  const staticAdminHeader = event.headers['x-static-admin'] || event.headers['X-Static-Admin'];
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';
  
  if (!isAuthorized) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: '403 Forbidden Access: Invalid or missing administrator credentials.' }),
    };
  }

  const db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  
  if (!db) {
    console.error("Database connection binding (env.DB) is not bound or initialized.");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database connection failed',
        details: 'D1 database binding (env.DB) is not bound in Netlify function context.',
        code: 'D1_BINDING_MISSING'
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { key, value } = body;

    if (!key || !value) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Bad Request: Missing key or value.' }),
      };
    }

    const sql = `
      INSERT OR REPLACE INTO app_data (key, value)
      VALUES (?, ?)
    `;
    
    const result = await db.prepare(sql).bind(key, value).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `App data key '${key}' deployed successfully.`, 
        result 
      }),
    };
  } catch (err: any) {
    console.error("D1 app data deployment failed inside Netlify function:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Database query execution failed',
        details: err.message || err,
        code: 'D1_QUERY_FAILED'
      }),
    };
  }
};
