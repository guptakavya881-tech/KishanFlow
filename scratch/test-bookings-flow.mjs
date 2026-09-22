async function runBookingsE2ETest() {
  console.log('=== RUNNING FARMER BOOKINGS & UPCOMING PROCUREMENT E2E TESTS ===\n');

  // Step 1: Unauthenticated request check
  console.log('1. Verifying unauthenticated request to /api/farmer/bookings is rejected with 401...');
  const unauthRes = await fetch('http://localhost:3000/api/farmer/bookings');
  console.log('Unauthenticated status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('PASS: Unauthenticated access blocked.\n');

  // Step 2: Farmer 7 Login (Multi-booking farmer)
  console.log('2. Authenticating as Farmer 7 (9266717417) with multiple bookings...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9266717417',
      password: 'Farmer@12345',
      role: 'farmer',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const cookie7 = loginRes.headers.get('set-cookie');
  console.log(`PASS: Farmer 7 authenticated (User ID: ${loginData.user.id}, Name: ${loginData.user.fullName}).\n`);

  // Step 3: Fetch All Bookings via GET /api/farmer/bookings
  console.log('3. Fetching all bookings for Farmer 7 via GET /api/farmer/bookings...');
  const bookingsRes = await fetch('http://localhost:3000/api/farmer/bookings', {
    headers: { Cookie: cookie7 },
  });
  const bookingsData = await bookingsRes.json();
  console.log(`Status: ${bookingsRes.status}, Success: ${bookingsData.success}`);
  console.log(`Total Bookings Count: ${bookingsData.bookings.length}`);

  if (!bookingsData.success || !Array.isArray(bookingsData.bookings)) {
    throw new Error('Failed to retrieve bookings: ' + JSON.stringify(bookingsData));
  }

  bookingsData.bookings.forEach((b, idx) => {
    console.log(`  [#${idx + 1}] ID: ${b.id} | Crop: ${b.cropName} (${b.quantity} ${b.unit}) | Status: ${b.status} | Token: #${b.tokenNumber} | Date: ${b.date}`);
  });

  const activeBookings = bookingsData.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Upcoming' || b.status === 'In Queue');
  console.log(`\nActive/Upcoming bookings count: ${activeBookings.length}`);
  if (activeBookings.length < 2) {
    throw new Error(`Expected at least 2 active bookings for Farmer 7, found ${activeBookings.length}`);
  }
  console.log('PASS: All farmer bookings retrieved, including multiple active bookings.\n');

  // Step 4: Verify Dashboard Consistency & Multi-Upcoming Data
  console.log('4. Verifying Dashboard Upcoming Procurement data via GET /api/farmer/dashboard...');
  const dashRes = await fetch('http://localhost:3000/api/farmer/dashboard', {
    headers: { Cookie: cookie7 },
  });
  const dashData = await dashRes.json();
  console.log(`Dashboard upcomingBookings count: ${dashData.data?.upcomingBookings?.length}`);
  console.log(`Dashboard upcomingBookingsCount stat: ${dashData.data?.stats?.upcomingBookingsCount}`);

  if (!dashData.data?.upcomingBookings || dashData.data.upcomingBookings.length < 2) {
    throw new Error('Dashboard missing upcomingBookings array with multiple bookings');
  }

  dashData.data.upcomingBookings.forEach((ub, idx) => {
    console.log(`  [Upcoming #${idx + 1}] ID: ${ub.id} | Crop: ${ub.cropName} | Token: #${ub.tokenNumber} | Date: ${ub.date}`);
  });
  console.log('PASS: Dashboard contains full upcomingBookings array for selector dropdown.\n');

  // Step 5: Test View Pass for each active booking
  for (const ab of activeBookings) {
    console.log(`5. Testing View Pass for booking ID ${ab.id} (${ab.cropName})...`);
    const passRes = await fetch(`http://localhost:3000/api/farmer/bookings/${ab.id}`, {
      headers: { Cookie: cookie7 },
    });
    const passData = await passRes.json();
    if (!passData.success || !passData.booking) {
      throw new Error(`Failed to load pass for booking ID ${ab.id}`);
    }
    console.log(`  PASS: Loaded pass for ${passData.booking.cropName} (Token: #${passData.booking.tokenNumber}, ID: ${passData.booking.bookingNumber})`);
  }
  console.log('PASS: View Pass API verified for all active bookings.\n');

  // Step 6: Test Ownership Security (Farmer 7 trying to access Farmer 3's booking ID 1)
  console.log('6. Verifying Farmer 7 CANNOT access Farmer 3 booking ID 1 (ownership isolation)...');
  const illegalRes = await fetch('http://localhost:3000/api/farmer/bookings/1', {
    headers: { Cookie: cookie7 },
  });
  console.log('Cross-tenant access status:', illegalRes.status);
  if (illegalRes.status !== 404) {
    throw new Error(`Expected 404 for unauthorized booking access, got ${illegalRes.status}`);
  }
  console.log('PASS: Cross-tenant access strictly prevented.\n');

  // Step 7: Verify /farmer/bookings HTML Rendering
  console.log('7. Verifying /farmer/bookings HTML page renders successfully...');
  const pageRes = await fetch('http://localhost:3000/farmer/bookings', {
    headers: { Cookie: cookie7 },
  });
  console.log('Page status:', pageRes.status);
  if (pageRes.status !== 200) {
    throw new Error(`Expected 200 OK for /farmer/bookings, got ${pageRes.status}`);
  }
  const html = await pageRes.text();
  const hasTitle = html.includes('My Bookings');
  console.log('Contains "My Bookings":', hasTitle);
  if (!hasTitle) {
    throw new Error('HTML does not contain "My Bookings"');
  }
  console.log('PASS: /farmer/bookings renders 200 OK with expected content.\n');

  console.log('=== ALL MY BOOKINGS & UPCOMING PROCUREMENT E2E TESTS PASSED! ===');
}

runBookingsE2ETest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
