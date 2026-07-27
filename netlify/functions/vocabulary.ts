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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Auth gate check
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  const staticAdminHeader = event.headers['x-static-admin'] || event.headers['X-Static-Admin'];
  
  const isAuthorized = staticAdminHeader === 'true' || authHeader === 'Bearer admin-local-session';
  
  if (!isAuthorized) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: '403 Forbidden Access: Invalid or missing administrator session credentials.' }),
    };
  }

  // Audit D1 connection binding
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
    const thai_text = (body.thai_text || body.thai || body.thaiText || '').trim();
    const english_text = (body.english_text || body.english || body.englishText || '').trim();
    const myanmar_text = (body.myanmar_text || body.myanmar || body.myanmarText || body.mm || '').trim();
    const phonetic = (body.phonetic || '').trim();
    const phonetic_mm = (body.phonetic_mm || body.phoneticMm || body.myanmarPhonetic || '').trim();
    const category = body.category || body.pos || 'general';
    const audio_url = body.audio_url || body.url || null;
    const pdf_drive_url = body.pdf_drive_url || null;

    if (!thai_text || !myanmar_text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Bad Request: Missing required fields (thai_text, myanmar_text).' }),
      };
    }

    const sql = `
      INSERT INTO words_phrases (thai_text, english_text, myanmar_text, phonetic, phonetic_mm, category, audio_url, pdf_drive_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // SQLite statement processing: prepare(...).bind(...).run()
    const result = await db.prepare(sql).bind(
      thai_text,
      english_text,
      myanmar_text,
      phonetic,
      phonetic_mm,
      category,
      audio_url,
      pdf_drive_url
    ).run();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Vocabulary inserted into Cloudflare D1 successfully.', result }),
    };
  } catch (err: any) {
    console.error("D1 Insert failed inside Netlify function:", err);
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
