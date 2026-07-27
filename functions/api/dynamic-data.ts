import { getDB, jsonResponse, handleOptions } from './dbHelper';

async function reconstructVocabCategories(db: any) {
  const { results } = await db.prepare('SELECT * FROM words_phrases ORDER BY id ASC').all();
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

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;

  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const url = new URL(req.url);
    const requestedKey = url.searchParams.get('key');

    if (requestedKey) {
      if (requestedKey === 'lessons') {
        const { results } = await db.prepare('SELECT * FROM lessons ORDER BY rowid ASC').all();
        const lessons = (results || []).map((row: any) => ({
          id: row.id,
          courseId: row.course_id || 'course-basic',
          titleThai: row.title_thai,
          titlePhonetic: row.title_phonetic,
          titleEnglish: row.title_english,
          titleMyanmar: row.title_myanmar,
          dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
          grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
          quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
        }));
        return jsonResponse({ success: true, data: lessons });
      }

      if (requestedKey === 'courses') {
        const { results } = await db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all();
        const courses = (results || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          nameMm: row.name_mm || row.name,
          description: row.description,
          priceAmount: row.price_amount || 0,
          currency: row.currency || 'MMK',
          duration: row.duration || '',
          instructor: row.instructor || '',
          resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
        }));
        return jsonResponse({ success: true, data: courses });
      }

      if (requestedKey === 'grammar_chapters') {
        const { results } = await db.prepare('SELECT * FROM grammar_chapters ORDER BY chapter_number ASC').all();
        const grammar = (results || []).map((row: any) => ({
          chapterNumber: row.chapter_number,
          titleEnglish: row.title_english,
          titleMyanmar: row.title_myanmar,
          content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
        }));
        return jsonResponse({ success: true, data: grammar });
      }

      if (requestedKey === 'alphabet') {
        const { results } = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
        return jsonResponse({ success: true, data: results || [] });
      }

      if (requestedKey === 'vocab_categories') {
        const vocabCategories = await reconstructVocabCategories(db);
        return jsonResponse({ success: true, data: vocabCategories });
      }

      const result = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind(requestedKey).first();
      if (!result) {
        return jsonResponse({ success: false, error: `Key '${requestedKey}' not found.` }, 404);
      }

      let parsed = result.value;
      try {
        parsed = JSON.parse(result.value);
      } catch (e) {
        // keep string
      }
      return jsonResponse({ success: true, data: parsed });
    }

    // Return complete application bootstrap dictionary
    const dataDictionary: Record<string, any> = {};

    const { results: lessonsRows } = await db.prepare('SELECT * FROM lessons ORDER BY rowid ASC').all();
    dataDictionary.lessons = (lessonsRows || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id || 'course-basic',
      titleThai: row.title_thai,
      titlePhonetic: row.title_phonetic,
      titleEnglish: row.title_english,
      titleMyanmar: row.title_myanmar,
      dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
      grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
      quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
    }));

    const { results: grammarRows } = await db.prepare('SELECT * FROM grammar_chapters ORDER BY chapter_number ASC').all();
    dataDictionary.grammar_chapters = (grammarRows || []).map((row: any) => ({
      chapterNumber: row.chapter_number,
      titleEnglish: row.title_english,
      titleMyanmar: row.title_myanmar,
      content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
    }));

    const { results: coursesRows } = await db.prepare('SELECT * FROM courses ORDER BY created_at ASC').all();
    dataDictionary.courses = (coursesRows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      nameMm: row.name_mm || row.name,
      description: row.description,
      priceAmount: row.price_amount || 0,
      currency: row.currency || 'MMK',
      duration: row.duration || '',
      instructor: row.instructor || '',
      resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
    }));

    const { results: alphabetRows } = await db.prepare('SELECT * FROM alphabet ORDER BY id ASC').all();
    dataDictionary.alphabet = alphabetRows || [];

    dataDictionary.vocab_categories = await reconstructVocabCategories(db);

    const orientationRes = await db.prepare('SELECT value FROM app_data WHERE key = ?').bind('orientation').first();
    dataDictionary.orientation = orientationRes ? JSON.parse(orientationRes.value) : [];

    return jsonResponse({ success: true, data: dataDictionary });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
