import { execSync } from 'child_process';
import fs from 'fs';

const maxBuffer = 50 * 1024 * 1024;

async function runMigration() {
  console.log('🚀 Starting D1 Lesson Data Normalization Migration...');

  // 1. Ensure target tables exist
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS lesson_dialogues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      speaker TEXT,
      thai TEXT,
      phonetic TEXT,
      english TEXT,
      myanmar TEXT,
      words TEXT,
      video_url TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lesson_grammar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT,
      title_myanmar TEXT,
      explanation TEXT,
      explanation_myanmar TEXT,
      examples TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lesson_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      quiz_id TEXT,
      type TEXT,
      prompt TEXT,
      prompt_thai TEXT,
      options TEXT,
      correct_answer TEXT,
      explanation TEXT,
      explanation_myanmar TEXT,
      order_index INTEGER DEFAULT 0
    );
  `;

  console.log('📌 Creating relational tables if they do not exist...');
  fs.writeFileSync('/tmp/create_tables.sql', createTablesSql);
  execSync('npx wrangler d1 execute sirithai-db --remote --file=/tmp/create_tables.sql', { stdio: 'inherit', maxBuffer });

  // 2. Fetch list of lesson IDs
  console.log('📥 Fetching list of lesson IDs...');
  const idsOutput = execSync(
    'npx wrangler d1 execute sirithai-db --remote --command="SELECT id FROM lessons;" --json',
    { encoding: 'utf-8', maxBuffer }
  );

  const parsedIdsResult = JSON.parse(idsOutput);
  const lessonRows = parsedIdsResult[0]?.results || [];
  console.log(`Found ${lessonRows.length} lessons to process.`);

  let totalDialogues = 0;
  let totalGrammar = 0;
  let totalQuizzes = 0;

  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    return "'" + String(val).replace(/'/g, "''") + "'";
  }

  for (let index = 0; index < lessonRows.length; index++) {
    const lessonId = String(lessonRows[index].id);
    console.log(`Processing lesson ${index + 1}/${lessonRows.length} (ID: ${lessonId})...`);

    let detailOutput;
    try {
      detailOutput = execSync(
        `npx wrangler d1 execute sirithai-db --remote --command="SELECT id, dialogue, grammar, quizzes FROM lessons WHERE id = '${lessonId}';" --json`,
        { encoding: 'utf-8', maxBuffer }
      );
    } catch (e) {
      console.warn(`Failed to fetch lesson ${lessonId}, skipping...`);
      continue;
    }

    const detailParsed = JSON.parse(detailOutput);
    const row = detailParsed[0]?.results?.[0];
    if (!row) continue;

    const sqlStatements = [];
    sqlStatements.push(`DELETE FROM lesson_dialogues WHERE lesson_id = ${escapeSql(lessonId)};`);
    sqlStatements.push(`DELETE FROM lesson_grammar WHERE lesson_id = ${escapeSql(lessonId)};`);
    sqlStatements.push(`DELETE FROM lesson_quizzes WHERE lesson_id = ${escapeSql(lessonId)};`);

    // Dialogue migration
    if (row.dialogue) {
      try {
        const dialogues = typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue;
        if (Array.isArray(dialogues)) {
          dialogues.forEach((d, idx) => {
            sqlStatements.push(`
              INSERT INTO lesson_dialogues (lesson_id, speaker, thai, phonetic, english, myanmar, words, video_url, order_index)
              VALUES (${escapeSql(lessonId)}, ${escapeSql(d.speaker || 'A')}, ${escapeSql(d.thai || '')}, ${escapeSql(d.phonetic || '')}, ${escapeSql(d.english || '')}, ${escapeSql(d.myanmar || '')}, ${escapeSql(JSON.stringify(d.words || []))}, ${escapeSql(d.videoUrl || d.video_url || null)}, ${idx});
            `);
            totalDialogues++;
          });
        }
      } catch (e) {
        console.warn(`Could not parse dialogue for lesson ${lessonId}:`, e.message);
      }
    }

    // Grammar migration
    if (row.grammar) {
      try {
        const grammarList = typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar;
        if (Array.isArray(grammarList)) {
          grammarList.forEach((g, idx) => {
            sqlStatements.push(`
              INSERT INTO lesson_grammar (lesson_id, title, title_myanmar, explanation, explanation_myanmar, examples, order_index)
              VALUES (${escapeSql(lessonId)}, ${escapeSql(g.title || '')}, ${escapeSql(g.titleMyanmar || g.title_myanmar || '')}, ${escapeSql(g.explanation || '')}, ${escapeSql(g.explanationMyanmar || g.explanation_myanmar || '')}, ${escapeSql(JSON.stringify(g.examples || []))}, ${idx});
            `);
            totalGrammar++;
          });
        }
      } catch (e) {
        console.warn(`Could not parse grammar for lesson ${lessonId}:`, e.message);
      }
    }

    // Quizzes migration
    if (row.quizzes) {
      try {
        const quizList = typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes;
        if (Array.isArray(quizList)) {
          quizList.forEach((q, idx) => {
            sqlStatements.push(`
              INSERT INTO lesson_quizzes (lesson_id, quiz_id, type, prompt, prompt_thai, options, correct_answer, explanation, explanation_myanmar, order_index)
              VALUES (${escapeSql(lessonId)}, ${escapeSql(q.id || q.quiz_id || 'q-' + idx)}, ${escapeSql(q.type || 'translate-thai-to-mm')}, ${escapeSql(q.prompt || '')}, ${escapeSql(q.promptThai || q.prompt_thai || null)}, ${escapeSql(JSON.stringify(q.options || []))}, ${escapeSql(q.correctAnswer || q.correct_answer || '')}, ${escapeSql(q.explanation || null)}, ${escapeSql(q.explanationMyanmar || q.explanation_myanmar || null)}, ${idx});
            `);
            totalQuizzes++;
          });
        }
      } catch (e) {
        console.warn(`Could not parse quizzes for lesson ${lessonId}:`, e.message);
      }
    }

    if (sqlStatements.length > 0) {
      const batchFile = `/tmp/migration_lesson_${index}.sql`;
      fs.writeFileSync(batchFile, sqlStatements.join('\n'));
      execSync(`npx wrangler d1 execute sirithai-db --remote --file=${batchFile}`, { stdio: 'ignore', maxBuffer });
      fs.unlinkSync(batchFile);
    }
  }

  console.log(`\n🎉 Migration Complete!`);
  console.log(`- Migrated Dialogues: ${totalDialogues}`);
  console.log(`- Migrated Grammar Rules: ${totalGrammar}`);
  console.log(`- Migrated Quizzes: ${totalQuizzes}`);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
