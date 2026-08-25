import { execSync } from 'child_process';
import fs from 'fs';

const maxBuffer = 50 * 1024 * 1024;

async function runVocabMigration() {
  console.log('🚀 Starting D1 Vocabulary Data Normalization Migration...');

  // 1. Ensure target relational tables exist
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS vocab_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_myanmar TEXT,
      description TEXT,
      icon TEXT,
      cover_color TEXT,
      is_free INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vocab_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL REFERENCES vocab_categories(id) ON DELETE CASCADE,
      thai TEXT NOT NULL,
      phonetic TEXT,
      phonetic_mm TEXT,
      english TEXT,
      myanmar TEXT,
      audio_url TEXT,
      pdf_drive_url TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('📌 Creating vocab_categories and vocab_items tables...');
  fs.writeFileSync('/tmp/create_vocab_tables.sql', createTablesSql);
  execSync('npx wrangler d1 execute sirithai-db --remote --file=/tmp/create_vocab_tables.sql', { stdio: 'inherit', maxBuffer });

  // 2. Fetch categories from app_data
  console.log('📥 Fetching vocab_categories JSON from app_data...');
  let appDataCategories = [];
  try {
    const rawAppData = execSync(
      `npx wrangler d1 execute sirithai-db --remote --command="SELECT value FROM app_data WHERE key = 'vocab_categories';" --json`,
      { encoding: 'utf-8', maxBuffer }
    );
    const parsedAppData = JSON.parse(rawAppData);
    const val = parsedAppData[0]?.results?.[0]?.value;
    if (val) {
      appDataCategories = JSON.parse(val);
    }
  } catch (e) {
    console.warn('Could not fetch vocab_categories from app_data:', e.message);
  }

  // 3. Fetch words_phrases
  console.log('📥 Fetching words_phrases records from D1...');
  let wordsRows = [];
  try {
    const rawWords = execSync(
      'npx wrangler d1 execute sirithai-db --remote --command="SELECT * FROM words_phrases;" --json',
      { encoding: 'utf-8', maxBuffer }
    );
    const parsedWords = JSON.parse(rawWords);
    wordsRows = parsedWords[0]?.results || [];
  } catch (e) {
    console.warn('Could not fetch words_phrases:', e.message);
  }

  console.log(`Found ${appDataCategories.length} categories in app_data and ${wordsRows.length} words in words_phrases.`);

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    return "'" + String(val).replace(/'/g, "''") + "'";
  }

  const categoryMap = new Map();

  // Populate map with app_data categories
  appDataCategories.forEach((cat, idx) => {
    const catId = String(cat.id || cat.name || `cat-${idx}`).trim();
    categoryMap.set(catId.toLowerCase(), {
      id: catId,
      name: cat.name || cat.title || catId,
      name_myanmar: cat.nameMyanmar || cat.name_myanmar || cat.myanmar || '',
      description: cat.description || '',
      icon: cat.icon || 'BookOpen',
      cover_color: cat.coverColor || cat.cover_color || 'purple',
      is_free: cat.isFree !== false && cat.is_free !== 0 ? 1 : 0,
      order_index: idx
    });
    // Map items attached to category object if present
    if (Array.isArray(cat.words || cat.items)) {
      (cat.words || cat.items).forEach(w => {
        wordsRows.push({
          category: catId,
          thai_text: w.thai || w.thai_text,
          english_text: w.english || w.english_text,
          myanmar_text: w.myanmar || w.myanmar_text,
          phonetic: w.phonetic,
          phonetic_mm: w.phoneticMm || w.phonetic_mm,
          audio_url: w.audioUrl || w.audio_url,
          pdf_drive_url: w.pdfDriveUrl || w.pdf_drive_url
        });
      });
    }
  });

  // Check categories referenced in wordsRows
  wordsRows.forEach(w => {
    const cName = String(w.category || 'general').trim();
    const key = cName.toLowerCase();
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        id: cName,
        name: cName,
        name_myanmar: cName,
        description: `${cName} Vocabulary Category`,
        icon: 'BookOpen',
        cover_color: 'purple',
        is_free: 1,
        order_index: categoryMap.size
      });
    }
  });

  const categories = Array.from(categoryMap.values());
  console.log(`Extracted ${categories.length} unique categories.`);

  // Write SQL for inserting categories & items
  const sqlStatements = [];
  sqlStatements.push('DELETE FROM vocab_categories;');
  sqlStatements.push('DELETE FROM vocab_items;');

  categories.forEach((cat, idx) => {
    sqlStatements.push(`
      INSERT INTO vocab_categories (id, name, name_myanmar, description, icon, cover_color, is_free, order_index)
      VALUES (${escapeSql(cat.id)}, ${escapeSql(cat.name)}, ${escapeSql(cat.name_myanmar)}, ${escapeSql(cat.description)}, ${escapeSql(cat.icon)}, ${escapeSql(cat.cover_color)}, ${cat.is_free}, ${idx})
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        name_myanmar = excluded.name_myanmar,
        description = excluded.description,
        icon = excluded.icon,
        cover_color = excluded.cover_color,
        is_free = excluded.is_free,
        order_index = excluded.order_index;
    `);
  });

  let itemInsertCount = 0;
  const seenWordCategory = new Set();

  wordsRows.forEach((w, idx) => {
    const thaiText = String(w.thai_text || w.thai || '').trim();
    if (!thaiText) return;

    const rawCat = String(w.category || 'general').trim();
    const catObj = categoryMap.get(rawCat.toLowerCase());
    const catId = catObj ? catObj.id : rawCat;

    const dedupKey = `${catId}::${thaiText}`;
    if (seenWordCategory.has(dedupKey)) return;
    seenWordCategory.add(dedupKey);

    sqlStatements.push(`
      INSERT INTO vocab_items (category_id, thai, phonetic, phonetic_mm, english, myanmar, audio_url, pdf_drive_url, order_index)
      VALUES (${escapeSql(catId)}, ${escapeSql(thaiText)}, ${escapeSql(w.phonetic || '')}, ${escapeSql(w.phonetic_mm || w.phoneticMm || '')}, ${escapeSql(w.english_text || w.english || '')}, ${escapeSql(w.myanmar_text || w.myanmar || '')}, ${escapeSql(w.audio_url || w.audioUrl || null)}, ${escapeSql(w.pdf_drive_url || w.pdfDriveUrl || null)}, ${idx});
    `);
    itemInsertCount++;
  });

  console.log(`Generated SQL for ${categories.length} categories and ${itemInsertCount} items.`);

  const chunkSize = 200;
  for (let i = 0; i < sqlStatements.length; i += chunkSize) {
    const chunk = sqlStatements.slice(i, i + chunkSize).join('\n');
    const batchFile = `/tmp/vocab_batch_${i}.sql`;
    fs.writeFileSync(batchFile, chunk);
    console.log(`Executing batch ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(sqlStatements.length / chunkSize)}...`);
    execSync(`npx wrangler d1 execute sirithai-db --remote --file=${batchFile}`, { stdio: 'inherit', maxBuffer });
    fs.unlinkSync(batchFile);
  }

  console.log('✅ Vocabulary Relational Data Migration Complete!');
}

runVocabMigration().catch(err => {
  console.error('❌ Vocab Migration Failed:', err);
  process.exit(1);
});
