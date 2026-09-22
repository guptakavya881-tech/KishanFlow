import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'kishan-flow-super-secure-jwt-secret-farm-to-future-2026';
const AUTH_COOKIE_NAME = 'kishan_auth_token';

async function testHttp() {
  console.log('=== HTTP ENDPOINT VERIFICATION ===\n');

  // Step 1: Sign admin JWT token directly with jsonwebtoken
  console.log('1. Generating admin authentication token...');
  const adminToken = jwt.sign({
    id: 1,
    fullName: 'System Administrator',
    role: 'admin',
    email: 'admin@kishanflow.com',
  }, JWT_SECRET, { expiresIn: '7d' });

  const cookie = `${AUTH_COOKIE_NAME}=${adminToken}`;
  console.log('✓ Admin authenticated token generated.');

  const authHeaders = {
    'Cookie': cookie,
    'Content-Type': 'application/json',
  };

  // Step 2: GET /api/admin/queue?centreId=centre-1
  console.log('\n2. GET /api/admin/queue?centreId=centre-1...');
  const queueRes = await fetch(`${BASE_URL}/api/admin/queue?centreId=centre-1`, {
    headers: authHeaders,
  });
  const queueJson = await queueRes.json();
  if (!queueJson.success || !queueJson.data) {
    throw new Error('GET /api/admin/queue failed: ' + JSON.stringify(queueJson));
  }
  console.log(`✓ GET /api/admin/queue returned 200 with ${queueJson.data.activeQueue.length} active entries.`);

  // Step 3: POST /api/admin/queue with invalid queue entry (token KF-99999)
  console.log('\n3. POST /api/admin/queue with invalid queue entry (no linked order)...');
  const invalidRes = await fetch(`${BASE_URL}/api/admin/queue`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'completeProcurement',
      tokenNumber: 'KF-NONEXISTENT-999',
      bookingId: 99999,
    }),
  });
  const invalidJson = await invalidRes.json();
  console.log(`HTTP Status: ${invalidRes.status}`);
  console.log(`Response Error: "${invalidJson.error}"`);
  if (invalidRes.status !== 404 || invalidJson.error !== 'Order not found for this queue entry.') {
    throw new Error(`Expected 404 with "Order not found for this queue entry.", got ${invalidRes.status}: ${JSON.stringify(invalidJson)}`);
  }
  console.log('✓ Cleanly returned HTTP 404 with exact message: "Order not found for this queue entry."');

  // Step 4: POST /api/admin/queue with valid order
  console.log('\n4. POST /api/admin/queue with real order...');
  const validRes = await fetch(`${BASE_URL}/api/admin/queue`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'completeProcurement',
      orderId: 5,
      tokenNumber: 'KF-247',
    }),
  });
  const validJson = await validRes.json();
  console.log(`HTTP Status: ${validRes.status}`);
  console.log(`Message: "${validJson.message}"`);
  if (!validJson.success) {
    throw new Error('POST /api/admin/queue failed: ' + JSON.stringify(validJson));
  }
  console.log('✓ Order procurement completed via API successfully.');

  // Step 5: GET /api/admin/crops
  console.log('\n5. GET /api/admin/crops (All Crops)...');
  const cropsRes = await fetch(`${BASE_URL}/api/admin/crops`, {
    headers: authHeaders,
  });
  const cropsJson = await cropsRes.json();
  if (!cropsJson.success || !Array.isArray(cropsJson.data.crops)) {
    throw new Error('GET /api/admin/crops failed: ' + JSON.stringify(cropsJson));
  }
  console.log(`✓ GET /api/admin/crops returned ${cropsJson.data.crops.length} real crops.`);

  // Step 6: GET /api/admin/crops?status=Ready+for+Procurement
  console.log('\n6. GET /api/admin/crops?status=Ready+for+Procurement...');
  const readyRes = await fetch(`${BASE_URL}/api/admin/crops?status=${encodeURIComponent('Ready for Procurement')}`, {
    headers: authHeaders,
  });
  const readyJson = await readyRes.json();
  if (!readyJson.success || !Array.isArray(readyJson.data.crops)) {
    throw new Error('GET /api/admin/crops?status=Ready for Procurement failed: ' + JSON.stringify(readyJson));
  }
  console.log(`✓ Ready for Procurement crops returned: ${readyJson.data.crops.length}`);

  // Step 7: GET /api/admin/crops?id=44 (View Lots)
  console.log('\n7. GET /api/admin/crops?id=44 (View Lots)...');
  const detailsRes = await fetch(`${BASE_URL}/api/admin/crops?id=44`, {
    headers: authHeaders,
  });
  const detailsJson = await detailsRes.json();
  if (!detailsJson.success || !detailsJson.data.crop || !Array.isArray(detailsJson.data.lots)) {
    throw new Error('GET /api/admin/crops?id=44 failed: ' + JSON.stringify(detailsJson));
  }
  console.log(`✓ Crop details for ID 44 loaded with ${detailsJson.data.lots.length} lots.`);
  console.log('  Lot Data:', detailsJson.data.lots[0]);

  // Step 8: Verify route aliases resolve with 200 OK
  console.log('\n8. Checking route aliases...');
  const pageRes1 = await fetch(`${BASE_URL}/admin/queue-management`, { headers: { 'Cookie': cookie } });
  console.log(`  /admin/queue-management status: ${pageRes1.status}`);
  if (pageRes1.status !== 200) throw new Error(`/admin/queue-management returned status ${pageRes1.status}`);

  const pageRes2 = await fetch(`${BASE_URL}/admin/crop-listing`, { headers: { 'Cookie': cookie } });
  console.log(`  /admin/crop-listing status: ${pageRes2.status}`);
  if (pageRes2.status !== 200) throw new Error(`/admin/crop-listing returned status ${pageRes2.status}`);

  console.log('\n==================================================');
  console.log('🎉 ALL HTTP API & ROUTE TESTS PASSED WITH 100% SUCCESS!');
  console.log('==================================================\n');
}

testHttp().catch(err => {
  console.error('\n❌ HTTP TEST FAILED:', err);
  process.exit(1);
});
