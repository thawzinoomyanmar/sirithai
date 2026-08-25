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

  const url = new URL(req.url);
  const section = url.searchParams.get('section') || 'orientation'; // orientation | grammar_ext | dialogue | conversation
  const courseId = url.searchParams.get('courseId');

  const validSections = ['orientation', 'grammar_ext', 'dialogue', 'conversation'];
  if (!validSections.includes(section)) {
    return jsonResponse({ success: false, error: `Invalid section parameter. Must be one of: ${validSections.join(', ')}` }, 400);
  }

  try {
    if (method === 'GET') {
      const chapterNumberParam = url.searchParams.get('chapterNumber') || url.searchParams.get('chapter_number');

      let query = `SELECT * FROM ${section}`;
      const params: any[] = [];
      const conditions: string[] = [];

      if (courseId) {
        conditions.push(`course_id = ?`);
        params.push(courseId);
      }

      if (chapterNumberParam && (section === 'grammar_ext' || section === 'dialogue' || section === 'conversation')) {
        conditions.push(`chapter_number = ?`);
        params.push(parseInt(chapterNumberParam, 10));
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }

      if (section === 'grammar_ext' || section === 'dialogue' || section === 'conversation') {
        query += ` ORDER BY chapter_number ASC, order_index ASC, id ASC`;
      } else {
        query += ` ORDER BY order_index ASC, created_at ASC`;
      }

      const res = await db.prepare(query).bind(...params).all();
      const rawRows = res.results || [];

      const formattedData = rawRows.map((row: any) => {
        if (section === 'grammar_ext' || row.examples_json) {
          let parsedExamples: any = [];
          if (row.examples_json) {
            try {
              parsedExamples = typeof row.examples_json === 'string' ? JSON.parse(row.examples_json) : row.examples_json;
            } catch (e) {
              parsedExamples = [];
            }
          }
          return {
            ...row,
            examples: parsedExamples,
            examples_json: row.examples_json
          };
        }
        return row;
      });

      return jsonResponse({
        success: true,
        section,
        count: formattedData.length,
        data: formattedData
      });
    }

    if (method === 'POST') {
      const body = await req.json() as any;
      const {
        id,
        course_id,
        courseId: bodyCourseId,
        title,
        title_myanmar,
        content,
        content_myanmar,
        video_url,
        chapter_number,
        explanation,
        explanation_myanmar,
        examples_json,
        lesson_id,
        speaker,
        text_thai,
        text_phonetic,
        text_myanmar,
        text_english,
        audio_url,
        order_index
      } = body;

      const targetCourseId = course_id || bodyCourseId;
      if (!targetCourseId) {
        return jsonResponse({ success: false, error: 'course_id is required' }, 400);
      }

      const itemId = id || `${section}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const orderIdx = order_index || 0;
      const chNum = chapter_number || 1;

      if (section === 'orientation') {
        await db.prepare(`
          INSERT INTO orientation (id, course_id, title, title_myanmar, content, content_myanmar, video_url, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            course_id=excluded.course_id,
            title=excluded.title,
            title_myanmar=excluded.title_myanmar,
            content=excluded.content,
            content_myanmar=excluded.content_myanmar,
            video_url=excluded.video_url,
            order_index=excluded.order_index
        `).bind(
          itemId,
          targetCourseId,
          title || '',
          title_myanmar || null,
          content || '',
          content_myanmar || null,
          video_url || null,
          orderIdx
        ).run();
      } else if (section === 'grammar_ext') {
        await db.prepare(`
          INSERT INTO grammar_ext (id, course_id, chapter_number, title, title_myanmar, explanation, explanation_myanmar, examples_json, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            course_id=excluded.course_id,
            chapter_number=excluded.chapter_number,
            title=excluded.title,
            title_myanmar=excluded.title_myanmar,
            explanation=excluded.explanation,
            explanation_myanmar=excluded.explanation_myanmar,
            examples_json=excluded.examples_json,
            order_index=excluded.order_index
        `).bind(
          itemId,
          targetCourseId,
          chNum,
          title || '',
          title_myanmar || null,
          explanation || '',
          explanation_myanmar || null,
          typeof examples_json === 'object' ? JSON.stringify(examples_json) : (examples_json || '[]'),
          orderIdx
        ).run();
      } else if (section === 'dialogue') {
        await db.prepare(`
          INSERT INTO dialogue (id, course_id, chapter_number, speaker, text_thai, text_myanmar, audio_url, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            course_id=excluded.course_id,
            chapter_number=excluded.chapter_number,
            speaker=excluded.speaker,
            text_thai=excluded.text_thai,
            text_myanmar=excluded.text_myanmar,
            audio_url=excluded.audio_url,
            order_index=excluded.order_index
        `).bind(
          itemId,
          targetCourseId,
          chNum,
          speaker || '',
          text_thai || '',
          text_myanmar || null,
          audio_url || null,
          orderIdx
        ).run();
      } else if (section === 'conversation') {
        await db.prepare(`
          INSERT INTO conversation (id, course_id, lesson_id, speaker, text_thai, text_phonetic, text_myanmar, text_english, audio_url, video_url, order_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            course_id=excluded.course_id,
            lesson_id=excluded.lesson_id,
            speaker=excluded.speaker,
            text_thai=excluded.text_thai,
            text_phonetic=excluded.text_phonetic,
            text_myanmar=excluded.text_myanmar,
            text_english=excluded.text_english,
            audio_url=excluded.audio_url,
            video_url=excluded.video_url,
            order_index=excluded.order_index
        `).bind(
          itemId,
          targetCourseId,
          lesson_id || null,
          speaker || '',
          text_thai || '',
          text_phonetic || null,
          text_myanmar || null,
          text_english || null,
          audio_url || null,
          video_url || null,
          orderIdx
        ).run();
      }

      return jsonResponse({ success: true, message: `Saved item into ${section}`, id: itemId, section });
    }

    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return jsonResponse({ success: false, error: 'id search param is required for DELETE' }, 400);
      }

      await db.prepare(`DELETE FROM ${section} WHERE id = ?`).bind(id).run();
      return jsonResponse({ success: true, message: `Deleted item from ${section}`, id, section });
    }

    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
