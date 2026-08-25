import { execSync } from 'child_process';
import crypto from 'crypto';

/**
 * Standalone Migration Script: Extract trapped 'grammar_ext' JSON object from app_data
 * and insert structured chapter rows into Cloudflare D1 'grammar_ext' table.
 */
async function runGrammarExtMigration() {
  console.log("🚀 Starting grammar_ext migration to relational Cloudflare D1 table...");

  try {
    // 1. Fetch trapped key from D1 app_data
    console.log("📥 Fetching key='grammar_ext' from D1 app_data...");
    const rawOutput = execSync(
      `npx wrangler d1 execute sirithai-db --remote --command="SELECT key, value FROM app_data WHERE key = 'grammar_ext'" --json`,
      { encoding: 'utf-8' }
    );

    const parsedRes = JSON.parse(rawOutput);
    const rows = parsedRes[0]?.results || [];

    if (rows.length === 0) {
      console.log("⚠️ No 'grammar_ext' record found in app_data table.");
      return;
    }

    const jsonString = rows[0].value;
    const parsedData = JSON.parse(jsonString);

    // Fetch existing grammar_chapters to supplement titles if needed
    let chapterMetaMap: Record<number, { title_english: string; title_myanmar: string }> = {};
    try {
      const rawChapters = execSync(
        `npx wrangler d1 execute sirithai-db --remote --command="SELECT chapter_number, title_english, title_myanmar FROM grammar_chapters" --json`,
        { encoding: 'utf-8' }
      );
      const chParsed = JSON.parse(rawChapters);
      const chRows = chParsed[0]?.results || [];
      for (const ch of chRows) {
        chapterMetaMap[Number(ch.chapter_number)] = {
          title_english: ch.title_english || '',
          title_myanmar: ch.title_myanmar || ''
        };
      }
    } catch (e) {
      console.log("Notice: Could not pre-fetch chapter metadata, proceeding with default titles.");
    }

    const entries = Object.entries(parsedData);
    console.log(`📦 Found ${entries.length} chapter entries in JSON object. Processing...`);

    let migratedCount = 0;

    for (const [key, entry] of entries) {
      const chapterNumber = parseInt(key, 10) || 1;
      const id = crypto.randomUUID();
      const courseId = (entry as any).course_id || (entry as any).courseId || 'course-basic';

      const meta = chapterMetaMap[chapterNumber];

      const title = (entry as any).title || (entry as any).title_english || meta?.title_english || `Grammar Chapter ${chapterNumber}`;
      const titleMm = (entry as any).title_myanmar || (entry as any).titleMyanmar || meta?.title_myanmar || null;
      const explanation = (entry as any).explanation || (entry as any).description || (entry as any).explanation_english || null;
      const explanationMm = (entry as any).explanation_myanmar || (entry as any).explanationMyanmar || null;

      // Bundle nested objects (vocab, qa, conversation, etc.) into examples_json
      let examplesData = (entry as any).examples_json || (entry as any).examples || null;
      if (!examplesData) {
        const payload: Record<string, any> = {};
        if ((entry as any).vocab) payload.vocab = (entry as any).vocab;
        if ((entry as any).qa) payload.qa = (entry as any).qa;
        if ((entry as any).conversation) payload.conversation = (entry as any).conversation;

        examplesData = Object.keys(payload).length > 0 ? payload : entry;
      }

      const examplesJsonStr = typeof examplesData === 'string' ? examplesData : JSON.stringify(examplesData);

      // Escape single quotes for SQL insertion
      const esc = (val: string | null) => val ? `'${val.replace(/'/g, "''")}'` : 'NULL';

      const sql = `INSERT INTO grammar_ext (id, course_id, chapter_number, title, title_myanmar, explanation, explanation_myanmar, examples_json, order_index) VALUES ('${id}', '${courseId}', ${chapterNumber}, ${esc(title)}, ${esc(titleMm)}, ${esc(explanation)}, ${esc(explanationMm)}, ${esc(examplesJsonStr)}, ${chapterNumber});`;

      console.log(`⏳ Inserting Chapter ${chapterNumber} ("${title}")...`);

      execSync(
        `npx wrangler d1 execute sirithai-db --remote --command="${sql.replace(/"/g, '\\"')}"`,
        { stdio: 'pipe' }
      );

      migratedCount++;
    }

    console.log(`\n🎉 Success! Migrated ${migratedCount} rows into 'grammar_ext' table.`);
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message || err);
  }
}

runGrammarExtMigration();
