import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET' && method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({
      error: 'Database connection failed',
      details: 'D1 database binding (env.DB) is not bound in function context.',
      code: 'D1_BINDING_MISSING'
    }, 500);
  }

  try {
    const { results } = await db.prepare('SELECT * FROM audio_resources').all();
    return jsonResponse(results || []);
  } catch (err: any) {
    console.error("D1 Query failed inside d1-audio-metadata:", err);
    return jsonResponse({
      error: 'Database query execution failed',
      details: err.message || String(err),
      code: 'D1_QUERY_FAILED'
    }, 500);
  }
};
