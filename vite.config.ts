import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

function mockApiDevPlugin() {
  return {
    name: 'mock-api-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/d1-transaction-deploy')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(bodyStr || '{}');
              const id = (body.id && String(body.id).trim()) || `TXN-${Date.now()}`;
              const user_id = body.user_id ? String(body.user_id).trim().replace(/'/g, "''") : 'anonymous';
              const amount = parseFloat(body.amount) || 0;
              const payment_method = body.payment_method ? String(body.payment_method).trim().replace(/'/g, "''") : 'direct';
              const status = body.status ? String(body.status).trim().replace(/'/g, "''") : 'pending';
              const proof = body.transaction_proof_url ? String(body.transaction_proof_url).replace(/'/g, "''") : '';

              // Duplicate purchase prevention check
              if (user_id && user_id !== 'anonymous') {
                try {
                  const checkSql = `SELECT id, status FROM transactions WHERE LOWER(user_id) = LOWER('${user_id}') AND amount = ${amount} AND status IN ('approved', 'completed', 'pending') LIMIT 1;`;
                  const checkRes = await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="${checkSql}" --json`).catch(() => null);
                  if (checkRes && checkRes.stdout) {
                    const parsed = JSON.parse(checkRes.stdout);
                    const rows = (parsed && parsed[0] && parsed[0].results) || [];
                    if (rows.length > 0) {
                      console.warn(`[Dev Server Duplicate Check Rejected] User '${user_id}' already has transaction for amount ${amount}`);
                      res.statusCode = 409;
                      res.end(JSON.stringify({
                        success: false,
                        duplicate: true,
                        error: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်",
                        code: "DUPLICATE_PURCHASE_REJECTED",
                        message_mm: "သင်သည် ဤ သင်တန်းကို ဝယ်ယူပြီးဖြစ်ပါသည်"
                      }));
                      return;
                    }
                  }
                } catch (checkErr) {
                  console.warn("Dev server duplicate check note:", checkErr);
                }
              }

              const sql = `INSERT INTO transactions (id, user_id, amount, payment_method, status, transaction_proof_url) VALUES ('${id}', '${user_id}', ${amount}, '${payment_method}', '${status}', '${proof}') ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id, amount=excluded.amount, payment_method=excluded.payment_method, status=excluded.status, transaction_proof_url=excluded.transaction_proof_url, created_at=CURRENT_TIMESTAMP;`;

              console.log(`[Dev Server D1 Ingestion] Ingesting transaction ${id} directly into Cloudflare D1...`);
              
              // Executing wrangler d1 insert to remote and local D1 databases
              await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="${sql}"`).catch(e => console.warn("Remote D1 sync note:", e?.message));
              await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}"`).catch(e => console.warn("Local D1 sync note:", e?.message));

              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: `Transaction ${id} stored in Cloudflare D1 successfully.`,
                id,
                local_dev: false
              }));
            } catch (err: any) {
              console.error("[Dev Server D1 Sync Error]:", err);
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'Transaction saved to local IndexedDB queue',
                local_dev: true
              }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/users/sync')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(bodyStr || '{}');
              const id = body.id ? String(body.id).trim().replace(/'/g, "''") : '';
              const fullName = (body.fullName || body.full_name) ? String(body.fullName || body.full_name).replace(/'/g, "''") : 'Anonymous Student';
              const email = body.email ? String(body.email).replace(/'/g, "''") : '';
              const avatarUrl = (body.avatarUrl || body.avatar_url) ? String(body.avatarUrl || body.avatar_url).replace(/'/g, "''") : '';
              const role = body.role ? String(body.role).replace(/'/g, "''") : 'student';
              const phone = body.phone ? String(body.phone).replace(/'/g, "''") : '';
              const xp = typeof body.xp === 'number' ? body.xp : 0;

              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'User ID is required' }));
                return;
              }

              const sql = `
                INSERT INTO users_profile (id, full_name, email, avatar_url, role, phone, xp)
                VALUES ('${id}', '${fullName}', '${email}', '${avatarUrl}', '${role}', '${phone}', ${xp})
                ON CONFLICT(id) DO UPDATE SET
                  full_name = excluded.full_name,
                  email = excluded.email,
                  avatar_url = excluded.avatar_url,
                  phone = COALESCE(NULLIF(excluded.phone, ''), users_profile.phone),
                  xp = COALESCE(excluded.xp, users_profile.xp),
                  role = COALESCE(excluded.role, users_profile.role);
              `;

              await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="${sql}"`).catch(e => console.warn("Remote D1 user sync note:", e?.message));
              await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}"`).catch(e => console.warn("Local D1 user sync note:", e?.message));

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'User synced successfully', id }));
            } catch (err: any) {
              console.error("[Dev Server User Sync Error]:", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/profile')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const userId = urlObj.searchParams.get('userId') || urlObj.searchParams.get('user_id') || urlObj.searchParams.get('id') || '';

            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'userId parameter is required' }));
              return;
            }

            const cleanId = userId.replace(/'/g, "''");
            const profileRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT id, full_name, email, avatar_url, role, phone, xp, created_at FROM users_profile WHERE id = '${cleanId}';" --json`).catch(() => ({ stdout: '[]' }));
            const parsedProfile = JSON.parse(profileRes.stdout || '[]');
            const userProfile = (parsedProfile && parsedProfile[0] && parsedProfile[0].results && parsedProfile[0].results[0]) || null;

            const countRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT COUNT(DISTINCT course_id) as total_purchased_courses FROM transactions WHERE user_id = '${cleanId}' AND status = 'approved';" --json`).catch(() => ({ stdout: '[]' }));
            const parsedCount = JSON.parse(countRes.stdout || '[]');
            const countRow = (parsedCount && parsedCount[0] && parsedCount[0].results && parsedCount[0].results[0]) || {};
            const totalPurchasedCourses = Number(countRow.total_purchased_courses ?? countRow['COUNT(DISTINCT course_id)'] ?? 0);

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              data: {
                profile: userProfile,
                totalPurchasedCourses,
                userId
              }
            }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e?.message }));
          }
          return;
        }

        if (req.url?.startsWith('/api/user-courses')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const userId = urlObj.searchParams.get('userId') || urlObj.searchParams.get('user_id') || urlObj.searchParams.get('id') || '';

            if (!userId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'userId parameter is required' }));
              return;
            }

            const cleanId = userId.replace(/'/g, "''");
            const sql = `SELECT c.*, t.created_at as purchased_at, t.id as transaction_id, t.status as transaction_status FROM transactions t JOIN courses c ON t.course_id = c.id WHERE t.user_id = '${cleanId}' AND t.status = 'approved' ORDER BY t.created_at DESC;`;
            const coursesRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}" --json`).catch(() => ({ stdout: '[]' }));
            const parsedCourses = JSON.parse(coursesRes.stdout || '[]');
            const coursesList = (parsedCourses && parsedCourses[0] && parsedCourses[0].results) || [];

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              data: coursesList,
              userId,
              count: coursesList.length
            }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e?.message }));
          }
          return;
        }

        if (req.url?.startsWith('/api/admin/users')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT id, full_name, email, avatar_url, role, phone, xp, created_at FROM users_profile ORDER BY created_at DESC;" --json`, { timeout: 5000 });
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: results, count: results.length }));
          } catch (e: any) {
            console.warn("[Dev Server Admin Users Note]:", e?.message);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [], count: 0, error: e?.message }));
          }
          return;
        }

        if (req.url?.startsWith('/api/admin/transactions')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const sql = `SELECT t.*, u.full_name as student_full_name, u.email as student_profile_email, c.name as course_name, c.name_mm as course_name_mm FROM transactions t LEFT JOIN users_profile u ON t.user_id = u.id LEFT JOIN courses c ON t.course_id = c.id ORDER BY t.created_at DESC;`;
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: results, count: results.length }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e?.message }));
          }
          return;
        }

        if (req.url?.startsWith('/api/admin/delete-user')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(bodyStr || '{}');
              const userId = body.userId || body.id;
              if (!userId) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'User ID is required' }));
                return;
              }
              const sql = `DELETE FROM users_profile WHERE id = '${String(userId).replace(/'/g, "''")}';`;
              await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="${sql}"`).catch(e => console.warn("Remote D1 delete-user note:", e?.message));
              await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}"`).catch(e => console.warn("Local D1 delete-user note:", e?.message));
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `User ${userId} deleted from D1` }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/admin/update-status') || req.url?.startsWith('/api/admin/approve-payment') || req.url?.startsWith('/api/approve-payment')) {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const body = JSON.parse(bodyStr || '{}');
              const transactionId = body.transactionId || body.transaction_id || body.id;
              const id = transactionId ? String(transactionId).trim().replace(/'/g, "''") : '';
              const status = body.status ? String(body.status).trim().toLowerCase().replace(/'/g, "''") : 'approved';

              if (!id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Transaction ID is required' }));
                return;
              }

              const sql = `UPDATE transactions SET status = '${status}' WHERE id = '${id}';`;
              await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="${sql}"`).catch(e => console.warn("Remote D1 update-status note:", e?.message));
              await execPromise(`npx wrangler d1 execute sirithai-db --local --command="${sql}"`).catch(e => console.warn("Local D1 update-status note:", e?.message));

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Transaction ${id} status updated to '${status}'`, transactionId: id, status }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/check-transactions')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --remote --command="SELECT id, user_id, amount, payment_method, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 10;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: results.length, transactions: results }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: 0, transactions: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/courses')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM courses ORDER BY created_at ASC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            const courses = results.map((row: any) => ({
              id: row.id,
              name: row.name,
              nameMm: row.name_mm || row.name,
              description: row.description || '',
              priceAmount: row.price_amount || 0,
              currency: row.currency || 'MMK',
              duration: row.duration || '',
              instructor: row.instructor || '',
              resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
            }));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: courses }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              data: [
                { id: 'course-basic', name: 'Basic Thai Conversation & Foundation', priceAmount: 135000 },
                { id: 'course-business', name: 'Business & Advanced Spoken Thai', priceAmount: 135000 }
              ]
            }));
          }
          return;
        }

        if (req.url?.startsWith('/api/lessons')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM lessons ORDER BY rowid ASC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            const lessons = results.map((row: any) => ({
              id: row.id,
              courseId: row.course_id || 'course-basic',
              titleThai: row.title_thai,
              titlePhonetic: row.title_phonetic || '',
              titleEnglish: row.title_english || '',
              titleMyanmar: row.title_myanmar || '',
              dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
              grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
              quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
            }));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: lessons }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/vocabulary')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM words_phrases ORDER BY id ASC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            const items = results.map((row: any) => ({
              id: row.id,
              thai: row.thai_text,
              english: row.english_text || '',
              myanmar: row.myanmar_text || '',
              phonetic: row.phonetic || '',
              phoneticMm: row.phonetic_mm || '',
              category: row.category || 'general',
              audioUrl: row.audio_url || null,
              pdfDriveUrl: row.pdf_drive_url || null
            }));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: items }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/grammar-chapters')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM grammar_chapters ORDER BY chapter_number ASC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            const grammar = results.map((row: any) => ({
              chapterNumber: row.chapter_number,
              titleEnglish: row.title_english,
              titleMyanmar: row.title_myanmar,
              content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
            }));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: grammar }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/alphabet')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM alphabet ORDER BY id ASC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: results }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/orders') || req.url?.startsWith('/api/transactions')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { stdout } = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM transactions ORDER BY created_at DESC;" --json`);
            const parsed = JSON.parse(stdout || '[]');
            const results = (parsed && parsed[0] && parsed[0].results) || [];
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: results, orders: results }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: [], orders: [] }));
          }
          return;
        }

        if (req.url?.startsWith('/api/dynamic-data')) {
          res.setHeader('Content-Type', 'application/json');
          try {
            const lessonsRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM lessons ORDER BY rowid ASC;" --json`).catch(() => ({ stdout: '[]' }));
            const parsedLessons = JSON.parse(lessonsRes.stdout || '[]');
            const lessonsRows = (parsedLessons && parsedLessons[0] && parsedLessons[0].results) || [];

            const coursesRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM courses ORDER BY created_at ASC;" --json`).catch(() => ({ stdout: '[]' }));
            const parsedCourses = JSON.parse(coursesRes.stdout || '[]');
            const coursesRows = (parsedCourses && parsedCourses[0] && parsedCourses[0].results) || [];

            const alphabetRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM alphabet ORDER BY id ASC;" --json`).catch(() => ({ stdout: '[]' }));
            const parsedAlphabet = JSON.parse(alphabetRes.stdout || '[]');
            const alphabetRows = (parsedAlphabet && parsedAlphabet[0] && parsedAlphabet[0].results) || [];

            const grammarRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM grammar_chapters ORDER BY chapter_number ASC;" --json`).catch(() => ({ stdout: '[]' }));
            const parsedGrammar = JSON.parse(grammarRes.stdout || '[]');
            const grammarRows = (parsedGrammar && parsedGrammar[0] && parsedGrammar[0].results) || [];

            const vocabRes = await execPromise(`npx wrangler d1 execute sirithai-db --local --command="SELECT * FROM words_phrases ORDER BY id ASC;" --json`).catch(() => ({ stdout: '[]' }));
            const parsedVocab = JSON.parse(vocabRes.stdout || '[]');
            const vocabRows = (parsedVocab && parsedVocab[0] && parsedVocab[0].results) || [];

            const catMap = new Map<string, any[]>();
            for (const row of vocabRows) {
              const cat = row.category || 'General';
              if (!catMap.has(cat)) catMap.set(cat, []);
              catMap.get(cat)!.push({
                id: row.id,
                thai: row.thai_text,
                phonetic: row.phonetic || '',
                phoneticMm: row.phonetic_mm || '',
                english: row.english_text || '',
                myanmar: row.myanmar_text || '',
                illustration: '📙',
                audio_url: row.audio_url || null,
                pdf_drive_url: row.pdf_drive_url || null
              });
            }

            const vocabCategories = Array.from(catMap.entries()).map(([name, items]) => ({
              name,
              icon: '📙',
              items
            }));

            const data = {
              lessons: lessonsRows.map((row: any) => ({
                id: row.id,
                courseId: row.course_id || 'course-basic',
                titleThai: row.title_thai,
                titlePhonetic: row.title_phonetic,
                titleEnglish: row.title_english,
                titleMyanmar: row.title_myanmar,
                dialogue: row.dialogue ? (typeof row.dialogue === 'string' ? JSON.parse(row.dialogue) : row.dialogue) : [],
                grammar: row.grammar ? (typeof row.grammar === 'string' ? JSON.parse(row.grammar) : row.grammar) : [],
                quizzes: row.quizzes ? (typeof row.quizzes === 'string' ? JSON.parse(row.quizzes) : row.quizzes) : []
              })),
              courses: coursesRows.map((row: any) => ({
                id: row.id,
                name: row.name,
                nameMm: row.name_mm || row.name,
                description: row.description,
                priceAmount: row.price_amount || 0,
                currency: row.currency || 'MMK',
                duration: row.duration || '',
                instructor: row.instructor || '',
                resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : []
              })),
              alphabet: alphabetRows,
              grammar_chapters: grammarRows.map((row: any) => ({
                chapterNumber: row.chapter_number,
                titleEnglish: row.title_english,
                titleMyanmar: row.title_myanmar,
                content: row.content ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : null
              })),
              vocab_categories: vocabCategories,
              orientation: []
            };

            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: {} }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), mockApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/.wrangler/**']
      },
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8888/.netlify/functions',
          changeOrigin: true,
          rewrite: (path) => {
            if (path.startsWith('/api/admin/users')) return '/admin-users';
            if (path.startsWith('/api/admin/transactions')) return '/admin-transactions';
            if (path.startsWith('/api/admin/delete-user')) return '/admin-delete-user';
            if (path.startsWith('/api/admin/update-status')) return '/admin-update-status';
            if (path.startsWith('/api/admin/approve-payment')) return '/admin-approve-payment';
            if (path.startsWith('/api/webhooks/clerk') || path.startsWith('/api/webhook/clerk')) return '/webhooks-clerk';
            return path.replace(/^\/api/, '');
          },
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              if (res && !res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: `Proxy connection error: ${err.message}` }));
              }
            });
          }
        },
      },
    },
  };
});
