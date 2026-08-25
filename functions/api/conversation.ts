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
    const courseId = url.searchParams.get('courseId') || url.searchParams.get('course_id');
    const chapterNumberStr = url.searchParams.get('chapterNumber') || url.searchParams.get('chapter_number') || url.searchParams.get('chapterId') || url.searchParams.get('chapter_id') || url.searchParams.get('lessonId') || url.searchParams.get('lesson_id');

    let query = `SELECT * FROM conversation`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (courseId) {
      conditions.push(`course_id = ?`);
      params.push(courseId);
    }

    if (chapterNumberStr) {
      const parsedNum = parseInt(chapterNumberStr, 10);
      if (!isNaN(parsedNum)) {
        conditions.push(`chapter_number = ?`);
        params.push(parsedNum);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY chapter_number ASC, order_index ASC, id ASC`;

    const res = await db.prepare(query).bind(...params).all();
    const rows = res.results || [];

    return jsonResponse({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
