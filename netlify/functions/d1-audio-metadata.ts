export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Audit D1 binding (using process.env or netlify env if bound)
  const db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  
  if (!db) {
    // If not bound, log and return informative structured JSON instead of 403
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
    // Using prepare / bind syntax
    const { results } = await db.prepare('SELECT * FROM audio_resources').all();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(results),
    };
  } catch (err: any) {
    console.error("D1 Query failed inside Netlify function:", err);
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
