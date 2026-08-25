import { execSync } from 'child_process';

/**
 * Migration Script: Move orientation array from app_data to relational orientation table in Cloudflare D1
 */
async function migrateOrientationData() {
  console.log("🚀 Starting orientation relational table migration...");

  try {
    // 1. Fetch orientation JSON array from app_data or courses
    console.log("📥 Fetching orientation records from D1 app_data...");
    const rawData = execSync(
      `npx wrangler d1 execute sirithai-db --remote --command="SELECT key, value FROM app_data WHERE key LIKE '%orientation%'" --json`,
      { encoding: 'utf-8' }
    );

    const parsed = JSON.parse(rawData);
    const rows = parsed[0]?.results || [];

    if (rows.length === 0) {
      console.log("ℹ️ No legacy orientation rows found in app_data. Database is clean.");
    }

    for (const row of rows) {
      const key = row.key;
      let items: any[] = [];
      try {
        items = JSON.parse(row.value);
      } catch (e) {
        console.warn(`Could not parse JSON for key ${key}:`, e);
        continue;
      }

      if (!Array.isArray(items)) {
        if (typeof items === 'object' && items !== null) {
          items = [items];
        } else {
          continue;
        }
      }

      console.log(`📦 Migrating ${items.length} items from key "${key}" into relational orientation table...`);

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

        // Escape string values for SQL execution
        const sql = `INSERT INTO orientation (id, course_id, title, title_myanmar, content, content_myanmar, video_url, order_index) VALUES ('${id}', '${courseId}', '${title.replace(/'/g, "''")}', ${titleMm ? `'${titleMm.replace(/'/g, "''")}'` : 'NULL'}, '${content.replace(/'/g, "''")}', ${contentMm ? `'${contentMm.replace(/'/g, "''")}'` : 'NULL'}, ${videoUrl ? `'${videoUrl}'` : 'NULL'}, ${orderIdx});`;

        execSync(
          `npx wrangler d1 execute sirithai-db --remote --command="${sql.replace(/"/g, '\\"')}"`,
          { stdio: 'inherit' }
        );
      }

      // Remove migrated array row from app_data
      console.log(`🧹 Cleaning up old orientation key "${key}" from app_data...`);
      execSync(
        `npx wrangler d1 execute sirithai-db --remote --command="DELETE FROM app_data WHERE key = '${key}'"`,
        { stdio: 'inherit' }
      );
    }

    console.log("✅ Orientation relational migration completed successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message || err);
  }
}

migrateOrientationData();
