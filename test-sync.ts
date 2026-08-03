import fetch from 'node-fetch';

async function testSync() {
  const testUserId = `test_user_${Date.now()}`;
  console.log(`[TEST] 🚀 Sending POST request to /api/users/sync for user: ${testUserId}...`);
  
  try {
    const syncRes = await fetch('http://127.0.0.1:3002/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testUserId,
        fullName: 'Auto Debugger',
        email: 'auto@debugger.local',
        avatarUrl: '',
        role: 'student'
      })
    });
    
    if (!syncRes.ok) {
      console.error(`[TEST] ❌ POST Sync failed with status: ${syncRes.status}`);
      const text = await syncRes.text();
      console.error(`[TEST] Response:`, text);
      return;
    }
    
    const syncData = await syncRes.json();
    console.log(`[TEST] ✅ Sync POST response received successfully!`);
    console.log(`[TEST] 🔍 Now fetching all users from GET /api/users to verify database...`);
    
    const getRes = await fetch('http://127.0.0.1:3002/api/users');
    const getData = await getRes.json() as any;
    
    const found = getData.data?.find((u: any) => u.id === testUserId);
    if (found) {
      console.log(`[TEST] 🎉 SUCCESS! User ${testUserId} was found in the D1 database.`);
      console.log(`[TEST] 📄 User Record:`, found);
    } else {
      console.error(`[TEST] ❌ FAILURE! User ${testUserId} was NOT found in the database.`);
    }
  } catch (err) {
    console.error(`[TEST] ❌ Exception during test:`, err);
  }
}

testSync();
