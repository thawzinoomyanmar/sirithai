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
    console.error("API ERROR: D1 database binding missing");
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    console.log("1. API Hit with params:", queryParams);

    const courseId = url.searchParams.get('courseId') || url.searchParams.get('course_id');
    const chapterNumberStr = url.searchParams.get('chapterNumber') || url.searchParams.get('chapter_number') || url.searchParams.get('chapterId') || url.searchParams.get('chapter_id') || url.searchParams.get('lessonId') || url.searchParams.get('lesson_id');

    let query = `SELECT * FROM grammar_ext`;
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

    query += ` ORDER BY chapter_number ASC, order_index ASC`;

    console.log("2. Executing SQL Query:", query, "Params:", params);

    const res = await db.prepare(query).bind(...params).all();
    console.log("3. Database Result:", res);

    const rows = res.results || [];

    const formattedData = rows.map((row: any) => {
      let parsedExamples: any = [];
      if (row.examples_json) {
        try {
          parsedExamples = typeof row.examples_json === 'string' ? JSON.parse(row.examples_json) : row.examples_json;
        } catch (e) {
          parsedExamples = [];
        }
      }
      return {
        id: row.id,
        course_id: row.course_id,
        chapter_number: row.chapter_number,
        title: row.title,
        title_myanmar: row.title_myanmar,
        explanation: row.explanation,
        explanation_myanmar: row.explanation_myanmar,
        examples_json: row.examples_json,
        examples: parsedExamples,
        order_index: row.order_index,
        created_at: row.created_at
      };
    });

    return jsonResponse({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
