import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  if (method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId') || url.searchParams.get('course_id') || 'course-basic';
    const chapterNumberStr = url.searchParams.get('chapterNumber') || url.searchParams.get('chapter_number') || url.searchParams.get('chapter') || '1';
    const chapterNumber = parseInt(chapterNumberStr, 10) || 1;

    // Parallel D1 queries for relational table hierarchy
    const [grammarRes, dialogueRes, conversationRes] = await Promise.all([
      db.prepare(`
        SELECT * FROM grammar_ext 
        WHERE (course_id = ? OR course_id = 'course-1' OR course_id = 'course-basic') 
          AND chapter_number = ? 
        ORDER BY order_index ASC, id ASC
      `).bind(courseId, chapterNumber).all().catch(() => ({ results: [] })),

      db.prepare(`
        SELECT * FROM dialogue 
        WHERE (course_id = ? OR course_id = 'course-1' OR course_id = 'course-basic') 
          AND chapter_number = ? 
        ORDER BY order_index ASC, id ASC
      `).bind(courseId, chapterNumber).all().catch(() => ({ results: [] })),

      db.prepare(`
        SELECT * FROM conversation 
        WHERE (course_id = ? OR course_id = 'course-1' OR course_id = 'course-basic') 
          AND chapter_number = ? 
        ORDER BY order_index ASC, id ASC
      `).bind(courseId, chapterNumber).all().catch(() => ({ results: [] }))
    ]);

    const grammarResults = (grammarRes.results || []).map((row: any) => {
      let examples = [];
      if (row.examples_json) {
        try {
          examples = typeof row.examples_json === 'string' ? JSON.parse(row.examples_json) : row.examples_json;
        } catch {}
      }
      return {
        ...row,
        examples
      };
    });

    return jsonResponse({
      success: true,
      courseId,
      chapterNumber,
      grammar: grammarResults,
      dialogues: dialogueRes.results || [],
      conversations: conversationRes.results || []
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
