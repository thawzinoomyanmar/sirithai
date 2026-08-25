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
    // 1. Fetch orientation entries stored in app_data
    const { results } = await db.prepare("SELECT key, value FROM app_data WHERE key LIKE '%orientation%'").all();
    const rows = results || [];
    let migratedCount = 0;

    for (const row of rows) {
      const key = String(row.key);
      let items: any[] = [];
      try {
        items = JSON.parse(String(row.value));
      } catch (e) {
        continue;
      }

      if (!Array.isArray(items)) {
        if (typeof items === 'object' && items !== null) {
          items = [items];
        } else {
          continue;
        }
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const id = crypto.randomUUID();
        const courseId = item.courseId || item.course_id || 'course-basic';
        const title = item.title || item.titleEnglish || 'Course Orientation';
        const titleMm = item.titleMyanmar || item.title_myanmar || item.titleMm || null;
        const content = typeof item.sections === 'object' ? JSON.stringify(item.sections) : (item.content || '');
        const contentMm = item.content_myanmar || item.contentMyanmar || null;
        const videoUrl = item.video_url || item.videoUrl || null;
        const orderIdx = i;

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
        `).bind(id, courseId, title, titleMm, content, contentMm, videoUrl, orderIdx).run();

        migratedCount++;
      }

      // Delete migrated key from app_data
      await db.prepare("DELETE FROM app_data WHERE key = ?").bind(key).run();
    }

    // Also check if app_data has column named 'orientation' and drop if present (via clean SQLite handler)
    try {
      await db.prepare("ALTER TABLE app_data DROP COLUMN orientation").run();
    } catch (e) {
      // Column might not exist or already dropped
    }

    return jsonResponse({
      success: true,
      message: 'Orientation relational migration completed successfully',
      migratedCount,
      sqlCleanup: 'ALTER TABLE app_data DROP COLUMN orientation;'
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || String(err) }, 500);
  }
};
