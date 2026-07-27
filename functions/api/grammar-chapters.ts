import { getDB, jsonResponse, handleOptions } from './dbHelper';

export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const req = context.request;
  const method = req.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const db = getDB(context);
  if (!db) {
    return jsonResponse({ success: false, error: 'D1 database binding missing' }, 500);
  }

  try {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT * FROM grammar_chapters ORDER BY chapter_number ASC').all();
      const grammar = (results || []).map((row: any) => ({
        chapterNumber: row.chapter_number,
        titleEnglish: row.title_english,
        titleMyanmar: row.title_myanmar,
        content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
      }));
      return jsonResponse({ success: true, data: grammar });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const { chapterNumber, titleEnglish, titleMyanmar, content } = body;

      if (!chapterNumber || !titleEnglish || !titleMyanmar) {
        return jsonResponse({ success: false, error: 'chapterNumber, titleEnglish, titleMyanmar are required' }, 400);
      }

      await db.prepare(`
        INSERT INTO grammar_chapters (chapter_number, title_english, title_myanmar, content)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(chapter_number) DO UPDATE SET
          title_english=excluded.title_english,
          title_myanmar=excluded.title_myanmar,
          content=excluded.content
      `).bind(chapterNumber, titleEnglish, titleMyanmar, content ? JSON.stringify(content) : null).run();

      return jsonResponse({ success: true, message: 'Grammar chapter saved successfully', chapterNumber });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || err }, 500);
  }
};
