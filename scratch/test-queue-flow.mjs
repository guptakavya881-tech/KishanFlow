async function runQueueE2ETest() {
  console.log('=== RUNNING FARMER QUEUE STATUS E2E TESTS AGAINST http://localhost:3000 ===\n');

  // Step 1: Unauthenticated request check
  console.log('1. Verifying unauthenticated request to /api/farmer/queue is rejected with 401...');
  const unauthRes = await fetch('http://localhost:3000/api/farmer/queue');
  console.log('Unauthenticated status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('PASS: Unauthenticated access blocked.\n');

  // Step 2: Farmer 3 Login
  console.log('2. Authenticating as Farmer 3 (farmer@kishanflow.com)...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'farmer@kishanflow.com',
      password: 'Farmer@12345',
      role: 'farmer',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const cookie3 = loginRes.headers.get('set-cookie');
  console.log(`PASS: Farmer 3 authenticated (User ID: ${loginData.user.id}).\n`);

  // Step 3: Fetch Farmer 3 Queue Data
  console.log('3. Fetching queue data for Farmer 3 via GET /api/farmer/queue...');
  const q3Res = await fetch('http://localhost:3000/api/farmer/queue', {
    headers: { Cookie: cookie3 },
  });
  const q3Data = await q3Res.json();
  console.log(`Status: ${q3Res.status}, Success: ${q3Data.success}`);
  console.log(`Active Queues Count: ${q3Data.queues.length}, Completed Count: ${q3Data.completedQueues.length}`);

  if (!q3Data.success || !Array.isArray(q3Data.queues)) {
    throw new Error('Failed to retrieve queue data: ' + JSON.stringify(q3Data));
  }

  q3Data.queues.forEach((q, idx) => {
    console.log(`  [Crop #${idx + 1}] ${q.cropName} (${q.quantity} ${q.unit})`);
    console.log(`    Centre: ${q.centreName}`);
    console.log(`    Date: ${q.date}, Slot: ${q.timeSlot}`);
    console.log(`    Token: #${q.tokenNumber}, Status: ${q.statusBadge}`);
    console.log(`    Live: ${q.isLive}, Serving: ${q.currentServingToken || 'N/A'}, Ahead: ${q.peopleAhead ?? 'N/A'}, Wait: ${q.estimatedWaitMinutes ?? 'N/A'} mins`);
    console.log(`    Sequence: ${q.tokensSequence?.map(s => s.token).join(' -> ') || 'None'}`);
  });
  console.log('PASS: Farmer 3 queue data validated.\n');

  // Step 4: Multi-Crop Farmer Check (Farmer 7)
  console.log('4. Authenticating as Farmer 7 (9266717417) with multiple booked crops...');
  const login7Res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9266717417',
      password: 'Farmer@12345',
      role: 'farmer',
    }),
  });
  const login7Data = await login7Res.json();
  if (!login7Data.success) {
    throw new Error('Farmer 7 login failed: ' + JSON.stringify(login7Data));
  }
  const cookie7 = login7Res.headers.get('set-cookie');
  console.log(`PASS: Farmer 7 authenticated (User ID: ${login7Data.user.id}).`);

  console.log('Fetching queue data for Farmer 7...');
  const q7Res = await fetch('http://localhost:3000/api/farmer/queue', {
    headers: { Cookie: cookie7 },
  });
  const q7Data = await q7Res.json();
  console.log(`Farmer 7 active queues: ${q7Data.queues.length}`);
  q7Data.queues.forEach((q, idx) => {
    console.log(`  [Crop #${idx + 1}] ${q.cropName} (${q.quantity} ${q.unit}) | Token: #${q.tokenNumber} | Centre: ${q.centreName} | Status: ${q.statusBadge}`);
  });

  if (q7Data.queues.length < 2) {
    throw new Error(`Expected at least 2 active queues for Farmer 7, got ${q7Data.queues.length}`);
  }
  console.log('PASS: Multiple active booked crops successfully returned for Farmer 7!\n');

  // Step 5: Test View Pass for Farmer 3's Booking
  const firstBooking = q3Data.queues[0];
  console.log(`5. Testing View Pass for booking ID ${firstBooking.bookingId}...`);
  const passRes = await fetch(`http://localhost:3000/api/farmer/bookings/${firstBooking.bookingId}`, {
    headers: { Cookie: cookie3 },
  });
  const passData = await passRes.json();
  console.log('Pass response status:', passRes.status, 'Success:', passData.success);
  if (!passData.success || !passData.booking) {
    throw new Error('Failed to retrieve pass data: ' + JSON.stringify(passData));
  }
  console.log(`PASS: Pass retrieved with token #${passData.booking.tokenNumber} and booking #${passData.booking.bookingNumber}.\n`);

  // Step 6: Test HTML Rendering of /farmer/queue
  console.log('6. Verifying /farmer/queue HTML renders successfully...');
  const pageRes = await fetch('http://localhost:3000/farmer/queue', {
    headers: { Cookie: cookie3 },
  });
  console.log('Page HTTP status:', pageRes.status);
  if (pageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /farmer/queue, got ${pageRes.status}`);
  }
  const pageHtml = await pageRes.text();
  const hasLiveQueue = pageHtml.includes('Live Queue Status') || pageHtml.includes('Queue Status');
  console.log('Contains Live Queue Status or Queue Status:', hasLiveQueue);
  if (!hasLiveQueue) {
    throw new Error('Page HTML missing expected Queue Status title/elements');
  }
  console.log('PASS: /farmer/queue renders 200 OK with expected content.\n');

  console.log('=== ALL FARMER QUEUE STATUS E2E TESTS PASSED SUCCESSFULLY! ===');
}

runQueueE2ETest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
