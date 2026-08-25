import { execSync } from 'child_process';

/**
 * Migration Script: Extract orientation JSON array from app_data (key = 'orientation')
 * and insert each item as a relational row into the 'orientation' table in Cloudflare D1.
 */
async function runOrientationKVMigration() {
  console.log("🚀 Starting Key-Value orientation migration for Cloudflare D1...");

  try {
    // 1. Fetch the row from app_data where key = 'orientation'
    console.log("📥 Querying app_data table for key = 'orientation'...");
    const rawResult = execSync(
      `npx wrangler d1 execute sirithai-db --remote --command="SELECT key, value FROM app_data WHERE key = 'orientation'" --json`,
      { encoding: 'utf-8' }
    );

    const parsedResponse = JSON.parse(rawResult);
    const rows = parsedResponse[0]?.results || [];

    if (rows.length === 0) {
      console.log("ℹ️ Key 'orientation' not found in app_data. Database is clean or already migrated.");
      return;
    }

    const rowValue = rows[0].value;
    let items: any[] = [];
    try {
      items = JSON.parse(rowValue);
    } catch (err) {
      console.error("❌ Failed to parse JSON value from app_data for key='orientation':", err);
      return;
    }

    if (!Array.isArray(items)) {
      if (typeof items === 'object' && items !== null) {
        items = [items];
      } else {
        console.error("❌ Stored value is not an array or object.");
        return;
      }
    }

    console.log(`📦 Found ${items.length} orientation records. Migrating into relational 'orientation' table...`);

    // 2. Loop through each item & insert into relational table
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const recordId = item.id || `orient-${crypto.randomUUID()}`;
      const courseId = item.course_id || item.courseId || 'course-basic';
      const title = item.title || item.titleEnglish || item.title_english || item.name || 'Course Orientation';
      const titleMm = item.title_myanmar || item.titleMyanmar || item.titleMm || null;
      
      // Store full sections/content structure safely as TEXT
      let content = item.content || '';
      if (!content && item.sections) {
        content = typeof item.sections === 'object' ? JSON.stringify(item.sections) : String(item.sections);
      }
      
      const contentMm = item.content_myanmar || item.contentMyanmar || item.contentMm || null;
      const videoUrl = item.video_url || item.videoUrl || null;
      const orderIndex = item.order_index ?? item.orderIndex ?? index;

      // Escape single quotes for SQL string literal safety
      const safeTitle = String(title).replace(/'/g, "''");
      const safeTitleMm = titleMm ? `'${String(titleMm).replace(/'/g, "''")}'` : 'NULL';
      const safeContent = String(content).replace(/'/g, "''");
      const safeContentMm = contentMm ? `'${String(contentMm).replace(/'/g, "''")}'` : 'NULL';
      const safeVideoUrl = videoUrl ? `'${String(videoUrl).replace(/'/g, "''")}'` : 'NULL';

      const insertSQL = `INSERT INTO orientation (id, course_id, title, title_myanmar, content, content_myanmar, video_url, order_index) VALUES ('${recordId}', '${courseId}', '${safeTitle}', ${safeTitleMm}, '${safeContent}', ${safeContentMm}, ${safeVideoUrl}, ${orderIndex}) ON CONFLICT(id) DO UPDATE SET title=excluded.title, title_myanmar=excluded.title_myanmar, content=excluded.content, content_myanmar=excluded.content_myanmar, video_url=excluded.video_url, order_index=excluded.order_index;`;

      console.log(`  └─ Inserting item #${index + 1}: "${title}" (ID: ${recordId})`);
      execSync(
        `npx wrangler d1 execute sirithai-db --remote --command="${insertSQL.replace(/"/g, '\\"')}"`,
        { stdio: 'pipe' }
      );
    }

    // 3. Cleanup: Delete the old KV record from app_data
    console.log("🧹 Cleaning up old record from app_data (WHERE key = 'orientation')...");
    execSync(
      `npx wrangler d1 execute sirithai-db --remote --command="DELETE FROM app_data WHERE key = 'orientation'"`,
      { stdio: 'pipe' }
    );

    console.log("🎉 SUCCESS: Orientation KV migration finished and old app_data record deleted!");
  } catch (err: any) {
    console.error("❌ Migration error:", err.message || err);
  }
}

runOrientationKVMigration();
