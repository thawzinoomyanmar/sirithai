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
    // 1. Fetch row from app_data where key = 'grammar_ext'
    const row = await db.prepare("SELECT value FROM app_data WHERE key = 'grammar_ext'").first<{ value: string }>();

    if (!row || !row.value) {
      return jsonResponse({ success: false, error: "No 'grammar_ext' entry found in app_data table" }, 404);
    }

    // 2. Parse the value string into a JSON object
    let parsedData: Record<string, any> = {};
    try {
      parsedData = JSON.parse(row.value);
    } catch (err: any) {
      return jsonResponse({ success: false, error: `Failed to parse grammar_ext JSON: ${err.message}` }, 400);
    }

    // Pre-fetch titles/descriptions from grammar_chapters for default metadata fallback
    const chaptersRes = await db.prepare("SELECT chapter_number, title_english, title_myanmar FROM grammar_chapters").all();
    const chapterMap = new Map<number, { title_english: string; title_myanmar: string }>();
    if (chaptersRes.results) {
      for (const ch of chaptersRes.results as any[]) {
        chapterMap.set(Number(ch.chapter_number), {
          title_english: ch.title_english || '',
          title_myanmar: ch.title_myanmar || ''
        });
      }
    }

    let insertedCount = 0;
    const insertedRecords = [];

    // 3. Iterate over entries keyed by chapter numbers
    for (const [key, entry] of Object.entries(parsedData)) {
      const chapterNumber = parseInt(key, 10) || 1;
      const id = crypto.randomUUID();
      const courseId = (entry as any).course_id || (entry as any).courseId || 'course-basic';

      const chapMeta = chapterMap.get(chapterNumber);

      const title = (entry as any).title || (entry as any).title_english || chapMeta?.title_english || `Grammar Chapter ${chapterNumber}`;
      const titleMyanmar = (entry as any).title_myanmar || (entry as any).titleMyanmar || chapMeta?.title_myanmar || null;
      const explanation = (entry as any).explanation || (entry as any).description || (entry as any).explanation_english || null;
      const explanationMyanmar = (entry as any).explanation_myanmar || (entry as any).explanationMyanmar || null;

      // Extract nested arrays (vocab, qa, conversation) into examples_json
      let examplesData = (entry as any).examples_json || (entry as any).examples || null;
      if (!examplesData) {
        const payload: Record<string, any> = {};
        if ((entry as any).vocab) payload.vocab = (entry as any).vocab;
        if ((entry as any).qa) payload.qa = (entry as any).qa;
        if ((entry as any).conversation) payload.conversation = (entry as any).conversation;

        examplesData = Object.keys(payload).length > 0 ? payload : entry;
      }

      const examplesJsonStr = typeof examplesData === 'string' ? examplesData : JSON.stringify(examplesData);

      // 4. Insert into grammar_ext
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
        id,
        courseId,
        chapterNumber,
        title,
        titleMyanmar,
        explanation,
        explanationMyanmar,
        examplesJsonStr,
        chapterNumber
      ).run();

      insertedCount++;
      insertedRecords.push({ id, chapterNumber, title, titleMyanmar });
    }

    return jsonResponse({
      success: true,
      message: `Successfully migrated ${insertedCount} chapters into grammar_ext table`,
      insertedCount,
      records: insertedRecords
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
