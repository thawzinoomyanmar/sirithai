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
    // 1. Fetch row from app_data where key = 'orientation'
    const row = await db.prepare("SELECT key, value FROM app_data WHERE key = 'orientation'").first();

    if (!row || !row.value) {
      return jsonResponse({
        success: true,
        message: "No 'orientation' key found in app_data. Database is clean or already migrated.",
        count: 0
      });
    }

    let items: any[] = [];
    try {
      items = JSON.parse(String(row.value));
    } catch (e) {
      return jsonResponse({ success: false, error: 'Failed to parse orientation JSON value from app_data' }, 400);
    }

    if (!Array.isArray(items)) {
      if (typeof items === 'object' && items !== null) {
        items = [items];
      } else {
        return jsonResponse({ success: false, error: 'Stored value is not a JSON array or object' }, 400);
      }
    }

    let insertedCount = 0;

    // 2. Loop through array items and insert into orientation table
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const recordId = item.id || `orient-${crypto.randomUUID()}`;
      const courseId = item.course_id || item.courseId || 'course-basic';
      const title = item.title || item.titleEnglish || item.title_english || item.name || 'Course Orientation';
      const titleMm = item.title_myanmar || item.titleMyanmar || item.titleMm || null;

      let content = item.content || '';
      if (!content && item.sections) {
        content = typeof item.sections === 'object' ? JSON.stringify(item.sections) : String(item.sections);
      }

      const contentMm = item.content_myanmar || item.contentMyanmar || item.contentMm || null;
      const videoUrl = item.video_url || item.videoUrl || null;
      const orderIndex = item.order_index ?? item.orderIndex ?? index;

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
      `).bind(recordId, courseId, title, titleMm, content, contentMm, videoUrl, orderIndex).run();

      insertedCount++;
    }

    // 3. Cleanup: Delete old key from app_data
    await db.prepare("DELETE FROM app_data WHERE key = 'orientation'").run();

    return jsonResponse({
      success: true,
      message: `Successfully migrated ${insertedCount} orientation records into relational table and cleaned up app_data.`,
      insertedCount
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
