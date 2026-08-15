import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

function getLocalD1Database() {
  const dir = path.join(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (!fs.existsSync(dir)) {
    throw new Error(`D1 directory not found at ${dir}`);
  }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite') && !f.startsWith('metadata'));
  if (files.length === 0) {
    throw new Error('No .sqlite database files found');
  }
  return new DatabaseSync(path.join(dir, files[0]));
}

async function runUnitTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE BACKEND UNIT TEST SUITE');
  console.log('====================================================\n');

  const sqlite = getLocalD1Database();

  // Ensure tables exist with expected schema
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users_profile (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'student',
      phone TEXT,
      xp INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_mm TEXT,
      description TEXT,
      price_amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'MMK',
      duration TEXT,
      instructor TEXT,
      resources TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      course_id TEXT,
      item_name TEXT,
      amount REAL DEFAULT 0.0,
      currency TEXT DEFAULT 'MMK',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Test 1: User Profile UPSERT Logic (Webhook / Client Sync)
  console.log('[UNIT TEST 1] 👤 Testing User Profile UPSERT in D1 users_profile...');
  const testUserId = `unit_test_user_${Date.now()}`;
  const testEmail = `unit_test_${Date.now()}@sirithai.dev`;
  const testName = 'Unit Test Scholar';
  const testPhone = '09-771234567';

  sqlite.prepare(`
    INSERT INTO users_profile (id, full_name, email, phone, role, created_at)
    VALUES (?, ?, ?, ?, 'student', CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone;
  `).run(testUserId, testName, testEmail, testPhone);

  const userRow: any = sqlite.prepare('SELECT * FROM users_profile WHERE id = ?').get(testUserId);
  if (userRow && userRow.email === testEmail && userRow.phone === testPhone) {
    console.log('✅ Unit Test 1 PASSED: User profile correctly stored/upserted with phone & metadata in users_profile!');
    console.log('   Retrieved Record:', userRow);
  } else {
    throw new Error('Unit Test 1 FAILED: User profile not found or phone missing after insert!');
  }

  // Test 2: Inserting Test Courses & Transactions
  console.log('\n[UNIT TEST 2] 💳 Injecting Test Course & Transaction Records...');
  const courseId1 = `course_unit_${Date.now()}_1`;
  const courseId2 = `course_unit_${Date.now()}_2`;
  const txnId1 = `txn_unit_${Date.now()}_1`;
  const txnId2 = `txn_unit_${Date.now()}_2`;

  sqlite.prepare(`
    INSERT INTO courses (id, name, name_mm, description, price_amount, currency, duration, instructor)
    VALUES (?, 'Basic Thai Conversation', 'အခြေခံ ထိုင်းစကားပြော', 'Learn basic spoken Thai', 35000, 'MMK', '4 Weeks', 'Kru Jane')
    ON CONFLICT(id) DO NOTHING;
  `).run(courseId1);

  sqlite.prepare(`
    INSERT INTO courses (id, name, name_mm, description, price_amount, currency, duration, instructor)
    VALUES (?, 'Intermediate Grammar Mastery', 'အလယ်အလတ် သဒ္ဒါ', 'Master intermediate Thai grammar', 45000, 'MMK', '6 Weeks', 'Kru Jane')
    ON CONFLICT(id) DO NOTHING;
  `).run(courseId2);

  sqlite.prepare(`
    INSERT INTO transactions (id, user_id, course_id, item_name, amount, currency, status, created_at)
    VALUES (?, ?, ?, 'Basic Thai Conversation', 35000, 'MMK', 'pending', CURRENT_TIMESTAMP);
  `).run(txnId1, testUserId, courseId1);

  sqlite.prepare(`
    INSERT INTO transactions (id, user_id, course_id, item_name, amount, currency, status, created_at)
    VALUES (?, ?, ?, 'Intermediate Grammar Mastery', 45000, 'MMK', 'approved', CURRENT_TIMESTAMP);
  `).run(txnId2, testUserId, courseId2);

  console.log('✅ Unit Test 2 PASSED: Test course and transaction rows injected.');

  // Test 3: Admin GET /api/admin/users Query Logic
  console.log('\n[UNIT TEST 3] 👥 Testing Admin Users Query (SELECT * FROM users_profile)...');
  const allUsers: any[] = sqlite.prepare('SELECT id, full_name, email, role FROM users_profile ORDER BY created_at DESC').all() as any[];
  const foundUser = allUsers.find(u => u.id === testUserId);
  if (foundUser) {
    console.log(`✅ Unit Test 3 PASSED: Retrieved ${allUsers.length} users from users_profile!`);
  } else {
    throw new Error('Unit Test 3 FAILED: Inserted user missing from users query!');
  }

  // Test 4: Admin GET /api/admin/transactions Joined Query Logic
  console.log('\n[UNIT TEST 4] 📊 Testing Admin Transactions Joined Query...');
  const joinedTxns: any[] = sqlite.prepare(`
    SELECT 
      t.*,
      u.full_name as student_full_name,
      u.email as student_profile_email,
      c.name as course_name,
      c.name_mm as course_name_mm
    FROM transactions t
    LEFT JOIN users_profile u ON t.user_id = u.id
    LEFT JOIN courses c ON t.course_id = c.id
    WHERE t.id IN (?, ?)
    ORDER BY t.created_at DESC
  `).all(txnId1, txnId2) as any[];

  if (joinedTxns.length === 2 && joinedTxns.some(t => t.student_full_name === testName)) {
    console.log('✅ Unit Test 4 PASSED: Joined transaction metadata successfully retrieved!');
    console.log('   Sample Joined Transaction:', joinedTxns[0]);
  } else {
    throw new Error('Unit Test 4 FAILED: Joined transaction query did not return expected user details!');
  }

  // Test 5: Admin Status Update (POST /api/admin/update-status)
  console.log('\n[UNIT TEST 5] 🔄 Testing Admin Update Status Logic (pending -> approved)...');
  sqlite.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('approved', txnId1);
  const updatedTxn: any = sqlite.prepare('SELECT status FROM transactions WHERE id = ?').get(txnId1);

  if (updatedTxn && updatedTxn.status === 'approved') {
    console.log('✅ Unit Test 5 PASSED: Transaction status successfully updated to "approved" in D1!');
  } else {
    throw new Error('Unit Test 5 FAILED: Transaction status update failed!');
  }

  // Test 6: User Purchased Courses Query Logic (JOIN transactions & courses WHERE approved)
  console.log('\n[UNIT TEST 6] 🎓 Testing User Purchased Courses Query (JOIN transactions & courses)...');
  const userPurchasedCourses: any[] = sqlite.prepare(`
    SELECT 
      c.*, 
      t.created_at as purchased_at,
      t.id as transaction_id,
      t.status as transaction_status
    FROM transactions t
    JOIN courses c ON t.course_id = c.id
    WHERE t.user_id = ? AND t.status = 'approved'
    ORDER BY t.created_at DESC
  `).all(testUserId) as any[];

  if (userPurchasedCourses.length === 2) {
    console.log(`✅ Unit Test 6 PASSED: Correctly fetched ${userPurchasedCourses.length} approved courses for user!`);
    console.log('   Purchased Courses:', userPurchasedCourses.map(c => c.name));
  } else {
    throw new Error(`Unit Test 6 FAILED: Expected 2 approved courses, found ${userPurchasedCourses.length}`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 6 UNIT TESTS PASSED WITH 100% SUCCESS! 🚀');
  console.log('====================================================');
}

runUnitTestSuite().catch(err => {
  console.error('\n❌ UNIT TEST SUITE FAILED:', err);
  process.exit(1);
});
