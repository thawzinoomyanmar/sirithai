import { getDB, jsonResponse, handleOptions } from '../dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  if (req.method === 'OPTIONS') return handleOptions();

  const db = getDB(context);
  if (!db) return jsonResponse({ success: false, error: 'Database connection failed' }, 500);

  try {
    // 1. Ensure target relational tables exist
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
        order_index INTEGER DEFAULT 0
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
        order_index INTEGER DEFAULT 0
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
        order_index INTEGER DEFAULT 0
      )
    `).run();

    // 2. Fetch all lesson records
    let rows: any[] = [];
    try {
      const res = await db.prepare('SELECT id, dialogue, grammar, quizzes FROM lessons').all();
      rows = res.results || [];
    } catch (err) {
      return jsonResponse({ success: false, error: 'Failed to fetch lessons. Columns may already have been dropped.', details: String(err) }, 400);
    }

    let insertedDialoguesCount = 0;
    let insertedGrammarCount = 0;
    let insertedQuizzesCount = 0;
    let processedLessonsCount = 0;

    for (const row of rows) {
      const lessonId = String(row.id);
      processedLessonsCount++;

      // Clear previous entries for this lesson to prevent duplicates
      await db.prepare('DELETE FROM lesson_dialogues WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
      await db.prepare('DELETE FROM lesson_grammar WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});
      await db.prepare('DELETE FROM lesson_quizzes WHERE lesson_id = ?').bind(lessonId).run().catch(() => {});

      // Migrate dialogue
      if (row.dialogue) {
        try {
          const dialogues = typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue;
          if (Array.isArray(dialogues)) {
            for (let idx = 0; idx < dialogues.length; idx++) {
              const d = dialogues[idx];
              await db.prepare(`
                INSERT INTO lesson_dialogues (lesson_id, speaker, thai, phonetic, english, myanmar, words, video_url, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                lessonId,
                d.speaker || 'A',
                d.thai || '',
                d.phonetic || '',
                d.english || '',
                d.myanmar || '',
                JSON.stringify(d.words || []),
                d.videoUrl || d.video_url || null,
                idx
              ).run();
              insertedDialoguesCount++;
            }
          }
        } catch (e) {
          console.error(`Error parsing dialogue for lesson ${lessonId}:`, e);
        }
      }

      // Migrate grammar
      if (row.grammar) {
        try {
          const grammarList = typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar;
          if (Array.isArray(grammarList)) {
            for (let idx = 0; idx < grammarList.length; idx++) {
              const g = grammarList[idx];
              await db.prepare(`
                INSERT INTO lesson_grammar (lesson_id, title, title_myanmar, explanation, explanation_myanmar, examples, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).bind(
                lessonId,
                g.title || '',
                g.titleMyanmar || g.title_myanmar || '',
                g.explanation || '',
                g.explanationMyanmar || g.explanation_myanmar || '',
                JSON.stringify(g.examples || []),
                idx
              ).run();
              insertedGrammarCount++;
            }
          }
        } catch (e) {
          console.error(`Error parsing grammar for lesson ${lessonId}:`, e);
        }
      }

      // Migrate quizzes
      if (row.quizzes) {
        try {
          const quizList = typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes;
          if (Array.isArray(quizList)) {
            for (let idx = 0; idx < quizList.length; idx++) {
              const q = quizList[idx];
              await db.prepare(`
                INSERT INTO lesson_quizzes (lesson_id, quiz_id, type, prompt, prompt_thai, options, correct_answer, explanation, explanation_myanmar, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                lessonId,
                q.id || q.quiz_id || `q-${idx}`,
                q.type || 'translate-thai-to-mm',
                q.prompt || '',
                q.promptThai || q.prompt_thai || null,
                JSON.stringify(q.options || []),
                q.correctAnswer || q.correct_answer || '',
                q.explanation || null,
                q.explanationMyanmar || q.explanation_myanmar || null,
                idx
              ).run();
              insertedQuizzesCount++;
            }
          }
        } catch (e) {
          console.error(`Error parsing quizzes for lesson ${lessonId}:`, e);
        }
      }
    }

    return jsonResponse({
      success: true,
      message: 'Migration completed successfully!',
      stats: {
        processedLessons: processedLessonsCount,
        insertedDialogues: insertedDialoguesCount,
        insertedGrammar: insertedGrammarCount,
        insertedQuizzes: insertedQuizzesCount
      }
    });
  } catch (err: any) {
    console.error('Migration API Error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
