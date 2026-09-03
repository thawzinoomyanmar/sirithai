import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);

  const lessonId = params.id || new URL(request.url).searchParams.get('id');
  if (!lessonId) return jsonResponse({ success: false, error: 'Lesson ID is required' }, 400);

  try {
    // 1. Fetch core lesson metadata
    const lessonRow = await db.prepare('SELECT * FROM lessons WHERE id = ?').bind(lessonId).first<any>();
    if (!lessonRow) {
      return jsonResponse({ success: false, error: `Lesson '${lessonId}' not found` }, 404);
    }

    // 2. Ensure relational tables exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS lesson_dialogues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        speaker TEXT,
        thai TEXT,
        phonetic TEXT,
        english TEXT,
        myanmar TEXT,
        words TEXT,
        video_url TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS lesson_grammar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        title TEXT,
        title_myanmar TEXT,
        explanation TEXT,
        explanation_myanmar TEXT,
        examples TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS lesson_quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        quiz_id TEXT,
        type TEXT,
        prompt TEXT,
        prompt_thai TEXT,
        options TEXT,
        correct_answer TEXT,
        explanation TEXT,
        explanation_myanmar TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 3. Fetch relational tables for this lesson
    const [dialogueRes, grammarRes, quizzesRes] = await Promise.all([
      db.prepare('SELECT * FROM lesson_dialogues WHERE lesson_id = ? ORDER BY order_index ASC, id ASC').bind(lessonId).all<any>().catch(() => ({ results: [] })),
      db.prepare('SELECT * FROM lesson_grammar WHERE lesson_id = ? ORDER BY order_index ASC, id ASC').bind(lessonId).all<any>().catch(() => ({ results: [] })),
      db.prepare('SELECT * FROM lesson_quizzes WHERE lesson_id = ? ORDER BY order_index ASC, id ASC').bind(lessonId).all<any>().catch(() => ({ results: [] })),
    ]);

    const parseJson = (val: any) => {
      if (!val) return [];
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    };

    let dialogue: any[] = (dialogueRes.results || []).map((d: any) => ({
      speaker: d.speaker || 'A',
      thai: d.thai || '',
      phonetic: d.phonetic || '',
      english: d.english || '',
      myanmar: d.myanmar || '',
      words: parseJson(d.words),
      videoUrl: d.video_url || undefined,
    }));

    let grammarNotes: any[] = (grammarRes.results || []).map((g: any) => ({
      title: g.title || '',
      titleMyanmar: g.title_myanmar || '',
      explanation: g.explanation || '',
      explanationMyanmar: g.explanation_myanmar || '',
      examples: parseJson(g.examples),
    }));

    let quizzes: any[] = (quizzesRes.results || []).map((q: any) => ({
      id: q.quiz_id || String(q.id),
      type: q.type || 'translate-thai-to-mm',
      prompt: q.prompt || '',
      promptThai: q.prompt_thai || undefined,
      options: parseJson(q.options),
      correctAnswer: q.correct_answer || '',
      explanation: q.explanation || undefined,
      explanationMyanmar: q.explanation_myanmar || undefined,
    }));

    // Fallback: If relational tables returned 0 rows, check if legacy columns exist on the lesson row
    if (dialogue.length === 0 && lessonRow.dialogue) {
      try { dialogue = JSON.parse(String(lessonRow.dialogue)); } catch {}
    }
    if (grammarNotes.length === 0 && lessonRow.grammar) {
      try { grammarNotes = JSON.parse(String(lessonRow.grammar)); } catch {}
    }
    if (quizzes.length === 0 && lessonRow.quizzes) {
      try { quizzes = JSON.parse(String(lessonRow.quizzes)); } catch {}
    }

    const descText = lessonRow.description_myanmar || lessonRow.description || lessonRow.detail_description || lessonRow.description_english || '';

    const lesson = {
      id: lessonRow.id,
      courseId: lessonRow.course_id || 'course-basic',
      titleThai: lessonRow.title_thai || '',
      titlePhonetic: lessonRow.title_phonetic || '',
      titleMyanmarPhonetic: lessonRow.title_myanmar_phonetic || '',
      title_myanmar_phonetic: lessonRow.title_myanmar_phonetic || '',
      titleEnglish: lessonRow.title_english || '',
      titleMyanmar: lessonRow.title_myanmar || '',
      title_myanmar: lessonRow.title_myanmar || '',
      description: descText,
      descriptionEnglish: lessonRow.description_english || descText,
      descriptionMyanmar: lessonRow.description_myanmar || descText,
      dialogue,
      grammarNotes,
      grammar: grammarNotes,
      quiz: quizzes,
      quizzes,
      createdAt: lessonRow.created_at,
    };

    return jsonResponse({ success: true, data: lesson });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
