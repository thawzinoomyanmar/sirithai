import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

function getTestDB() {
  const cwd = process.cwd();
  const dir = path.join(cwd, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.sqlite'));
    if (files.length > 0) {
      const dbPath = path.join(dir, files[0]);
      const localDb = new DatabaseSync(dbPath);

      // Ensure columns exist on local SQLite tables
      try {
        localDb.prepare(`ALTER TABLE transactions ADD COLUMN course_id TEXT`).run();
      } catch {}
      try {
        localDb.prepare(`ALTER TABLE users_profile ADD COLUMN avatar_url TEXT`).run();
      } catch {}
      try {
        localDb.prepare(`ALTER TABLE users_profile ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`).run();
      } catch {}

      return {
        prepare(sql: string) {
          const stmt = localDb.prepare(sql);
          let boundArgs: any[] = [];
          const d1Stmt = {
            bind(...args: any[]) {
              boundArgs = args.map(arg => typeof arg === 'undefined' ? null : arg);
              return d1Stmt;
            },
            async run() {
              const info = stmt.run(...boundArgs);
              return { success: true, meta: { changes: info.changes, lastRowId: info.lastInsertRowid } };
            },
            async all() {
              const rows = stmt.all(...boundArgs);
              return { success: true, results: rows };
            },
            async first() {
              return stmt.get(...boundArgs);
            }
          };
          return d1Stmt;
        }
      };
    }
  }
  return null;
}

async function runAutoTest() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTOMATED BACKEND INTEGRATION & LOGIC TESTS');
  console.log('====================================================\n');

  const db = getTestDB();
  if (!db) {
    console.error('❌ Could not initialize local D1 database test instance.');
    process.exit(1);
  }

  const testUserId = `test_clerk_user_${Date.now()}`;
  const testEmail = `test_${Date.now()}@sirithai.dev`;
  const testName = 'Automated Test Student';

  console.log(`[TEST 1] 🔄 Simulating Clerk Webhook User UPSERT for ${testUserId}...`);

  // Test Webhook User Creation Query
  try {
    await db.prepare(
      `INSERT INTO users_profile (id, full_name, email, role, created_at)
       VALUES (?, ?, ?, 'user', ?)
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name,
         email = excluded.email;`
    ).bind(testUserId, testName, testEmail, new Date().toISOString()).run();

    console.log('✅ Webhook UPSERT executed successfully!');
  } catch (err) {
    console.error('❌ Webhook UPSERT failed:', err);
    process.exit(1);
  }

  // Verify User In DB
  const userRecord: any = await db.prepare(
    `SELECT id, full_name, email, role FROM users_profile WHERE id = ?`
  ).bind(testUserId).first();

  if (userRecord && userRecord.id === testUserId) {
    console.log('✅ Verified: User profile correctly stored in D1 users_profile table.');
    console.log('   User Payload:', userRecord);
  } else {
    console.error('❌ Failed: User profile not found in D1.');
    process.exit(1);
  }

  console.log('\n[TEST 2] 💳 Injecting Approved Test Transactions for Course Count Query...');

  // Inject 2 distinct approved course transactions & 1 duplicate approved transaction
  const tx1 = `tx_${Date.now()}_1`;
  const tx2 = `tx_${Date.now()}_2`;
  const tx3 = `tx_${Date.now()}_3`;

  try {
    await db.prepare(
      `INSERT INTO transactions (id, user_id, course_id, amount, status) VALUES (?, ?, ?, ?, ?)`
    ).bind(tx1, testUserId, 'course-basic', 35000, 'approved').run();

    await db.prepare(
      `INSERT INTO transactions (id, user_id, course_id, amount, status) VALUES (?, ?, ?, ?, ?)`
    ).bind(tx2, testUserId, 'course-business', 65000, 'approved').run();

    // Duplicate course transaction (should be distinct)
    await db.prepare(
      `INSERT INTO transactions (id, user_id, course_id, amount, status) VALUES (?, ?, ?, ?, ?)`
    ).bind(tx3, testUserId, 'course-basic', 35000, 'approved').run();

    console.log('✅ Test transactions inserted successfully.');
  } catch (err) {
    console.error('❌ Failed to insert transactions:', err);
    process.exit(1);
  }

  console.log('\n[TEST 3] 📊 Running Profile & Course Count Query API Logic...');

  // Query 1: Profile
  const profile: any = await db.prepare(
    `SELECT id, full_name, email, avatar_url, role, created_at FROM users_profile WHERE id = ?`
  ).bind(testUserId).first();

  // Query 2: Course Count
  const countResult: any = await db.prepare(
    `SELECT COUNT(DISTINCT course_id) as total_purchased_courses FROM transactions WHERE user_id = ? AND status = 'approved'`
  ).bind(testUserId).first();

  const totalPurchasedCourses = countResult
    ? Number(countResult.total_purchased_courses ?? countResult['COUNT(DISTINCT course_id)'] ?? 0)
    : 0;

  console.log('   Retrieved Profile:', profile);
  console.log('   Total Purchased Courses (Distinct Approved):', totalPurchasedCourses);

  if (profile && totalPurchasedCourses === 2) {
    console.log('\n====================================================');
    console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('====================================================');
    console.log('  1. Clerk Webhook UPSERT query logic -> VERIFIED');
    console.log('  2. D1 User Profile Retrieval        -> VERIFIED');
    console.log('  3. Purchased Course Count Aggregation -> VERIFIED');
  } else {
    console.error(`❌ Course count mismatch! Expected: 2, Got: ${totalPurchasedCourses}`);
    process.exit(1);
  }
}

runAutoTest();
