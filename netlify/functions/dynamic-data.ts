import { getDB } from './dbHelper';

// Helper to reconstruct vocab book categories from words_phrases
async function reconstructVocabCategories(db: any) {
  const { results } = await db.prepare('SELECT * FROM words_phrases').all();
  const categoriesMap = new Map<string, any[]>();
  for (const row of results || []) {
    const catName = row.category || 'General';
    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, []);
    }
    categoriesMap.get(catName)!.push({
      id: row.id,
      thai: row.thai_text,
      phonetic: row.phonetic || '',
      phoneticMm: row.phonetic_mm || '',
      english: row.english_text || '',
      myanmar: row.myanmar_text || '',
      illustration: row.illustration || '📙',
      audio_url: row.audio_url || null,
      pdf_drive_url: row.pdf_drive_url || null
    });
  }

  const icons: Record<string, string> = {
    'Numbers': '🔢',
    'Common Verbs': '🏃‍♂️',
    'Food & Drinks': '🍲',
    'People & Family': '👨‍👩‍👧‍👦',
    'Everyday Things': '📱',
    'Places': '🏫',
    'Time & Dates': '📅',
    'Transportation': '🚗',
    'Work & Shopping': '🛍️',
  };

  return Array.from(categoriesMap.entries()).map(([name, items]) => ({
    name,
    icon: icons[name] || '📙',
    items
  }));
}

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const db = getDB(context);
  
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
    const queryParams = event.queryStringParameters || {};
    const requestedKey = queryParams.key;

    if (requestedKey) {
      if (requestedKey === 'lessons') {
        const { results } = await db.prepare('SELECT * FROM lessons').all();
        const lessons = (results || []).map((row: any) => ({
          id: row.id,
          courseId: row.course_id || 'course-basic',
          titleThai: row.title_thai,
          titlePhonetic: row.title_phonetic,
          titleEnglish: row.title_english,
          titleMyanmar: row.title_myanmar,
          dialogue: row.dialogue ? JSON.parse(row.dialogue) : [],
          grammar: row.grammar ? JSON.parse(row.grammar) : [],
          quizzes: row.quizzes ? JSON.parse(row.quizzes) : []
        }));
        return { statusCode: 200, headers, body: JSON.stringify(lessons) };
      }
      
      if (requestedKey === 'courses') {
        const { results } = await db.prepare('SELECT * FROM courses').all();
        const courses = (results || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          nameMm: row.name_mm || row.name,
          description: row.description,
          priceAmount: row.price_amount || 0,
          currency: row.currency || 'MMK',
          duration: row.duration || '',
          instructor: row.instructor || '',
          resources: row.resources ? JSON.parse(row.resources) : []
        }));
        return { statusCode: 200, headers, body: JSON.stringify(courses) };
      }

      if (requestedKey === 'grammar_chapters') {
        const { results } = await db.prepare('SELECT * FROM grammar_chapters').all();
        const grammar = (results || []).map((row: any) => ({
          chapterNumber: row.chapter_number,
          titleEnglish: row.title_english,
          titleMyanmar: row.title_myanmar
        }));
        return { statusCode: 200, headers, body: JSON.stringify(grammar) };
      }

      if (requestedKey === 'alphabet') {
        const { results } = await db.prepare('SELECT * FROM alphabet').all();
        return { statusCode: 200, headers, body: JSON.stringify(results || []) };
      }

      if (requestedKey === 'vocab_categories') {
        const vocabCategories = await reconstructVocabCategories(db);
        return { statusCode: 200, headers, body: JSON.stringify(vocabCategories) };
      }

      if (requestedKey === 'orientation') {
        const result = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind('orientation').first();
        const orientation = result ? JSON.parse(result.value) : [];
        return { statusCode: 200, headers, body: JSON.stringify(orientation) };
      }

      // Legacy fallback
      const sql = `SELECT value FROM app_data WHERE key = ?`;
      const result = await db.prepare(sql).bind(requestedKey).first();

      if (!result) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `Key '${requestedKey}' not found.` }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: result.value,
      };
    } else {
      // Return all keys in a unified dictionary
      const dataDictionary: Record<string, any> = {};

      // 1. Fetch lessons
      const { results: lessonsRows } = await db.prepare('SELECT * FROM lessons').all();
      dataDictionary.lessons = (lessonsRows || []).map((row: any) => ({
        id: row.id,
        courseId: row.course_id || 'course-basic',
        titleThai: row.title_thai,
        titlePhonetic: row.title_phonetic,
        titleEnglish: row.title_english,
        titleMyanmar: row.title_myanmar,
        dialogue: row.dialogue ? JSON.parse(row.dialogue) : [],
        grammar: row.grammar ? JSON.parse(row.grammar) : [],
        quizzes: row.quizzes ? JSON.parse(row.quizzes) : []
      }));

      // 2. Fetch grammar chapters
      const { results: grammarRows } = await db.prepare('SELECT * FROM grammar_chapters').all();
      dataDictionary.grammar_chapters = (grammarRows || []).map((row: any) => ({
        chapterNumber: row.chapter_number,
        titleEnglish: row.title_english,
        titleMyanmar: row.title_myanmar
      }));

      // 3. Fetch courses
      const { results: coursesRows } = await db.prepare('SELECT * FROM courses').all();
      dataDictionary.courses = (coursesRows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        nameMm: row.name_mm || row.name,
        description: row.description,
        priceAmount: row.price_amount || 0,
        currency: row.currency || 'MMK',
        duration: row.duration || '',
        instructor: row.instructor || '',
        resources: row.resources ? JSON.parse(row.resources) : []
      }));

      // 4. Fetch alphabet
      const { results: alphabetRows } = await db.prepare('SELECT * FROM alphabet').all();
      dataDictionary.alphabet = alphabetRows || [];

      // 5. Fetch vocab categories reconstructed from words_phrases
      dataDictionary.vocab_categories = await reconstructVocabCategories(db);

      // 6. Fetch orientation from app_data (legacy)
      const orientationRes = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind('orientation').first();
      dataDictionary.orientation = orientationRes ? JSON.parse(orientationRes.value) : [];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: dataDictionary }),
      };
    }
  } catch (err: any) {
    console.error("Failed fetching dynamic app data inside Netlify function:", err);
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
