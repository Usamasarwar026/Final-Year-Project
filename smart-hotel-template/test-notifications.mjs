// Test script to verify notification system
async function main() {
  try {
    // Test 1: GET - Check current notifications
    console.log("=== TEST 1: GET /api/debug/notifications ===");
    const getRes = await fetch('http://localhost:3000/api/debug/notifications');
    const getData = await getRes.json();
    console.log("Status:", getRes.status);
    console.log("Notification Count:", getData.count);
    console.log("Users:", JSON.stringify(getData.users?.map(u => ({ id: u.id, name: u.name, role: u.role })), null, 2));
    if (getData.error) {
      console.error("ERROR:", getData.error);
      console.error("Stack:", getData.stack);
    }

    // Test 2: POST - Create test notifications
    console.log("\n=== TEST 2: POST /api/debug/notifications ===");
    const postRes = await fetch('http://localhost:3000/api/debug/notifications', { method: 'POST' });
    const postData = await postRes.json();
    console.log("Status:", postRes.status);
    console.log("Result:", JSON.stringify(postData, null, 2));

    // Test 3: GET again - Verify count increased
    console.log("\n=== TEST 3: GET /api/debug/notifications (after POST) ===");
    const getRes2 = await fetch('http://localhost:3000/api/debug/notifications');
    const getData2 = await getRes2.json();
    console.log("New Notification Count:", getData2.count);
    console.log("Latest 3 notifications:");
    getData2.notifications?.slice(0, 3).forEach((n, i) => {
      console.log(`  ${i+1}. [${n.type}] ${n.title} -> ${n.recipient_user_id} (read: ${n.is_read})`);
    });

  } catch (err) {
    console.error("FETCH ERROR:", err.message);
  }
}

main();
