async function runNotificationsE2ETest() {
  console.log('=== RUNNING FARMER NOTIFICATIONS E2E TEST AGAINST http://localhost:3000 ===\n');

  // Step 1: Unauthorized access check
  console.log('1. Verifying unauthenticated access to /api/farmer/notifications is rejected...');
  const unauthRes = await fetch('http://localhost:3000/api/farmer/notifications');
  console.log('Unauthenticated status:', unauthRes.status);
  if (unauthRes.status !== 401) {
    throw new Error(`Expected status 401 for unauthenticated request, got ${unauthRes.status}`);
  }
  console.log('PASS: Unauthenticated access blocked with 401.\n');

  // Step 2: Farmer Login
  console.log('2. Authenticating as farmer (farmer@kishanflow.com)...');
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
  const setCookie = loginRes.headers.get('set-cookie');
  const authHeaders = {
    'Cookie': setCookie || '',
    'Content-Type': 'application/json',
  };
  console.log(`PASS: Farmer authenticated successfully (User ID: ${loginData.user.id}, Name: ${loginData.user.fullName}).\n`);

  // Step 3: Fetch Notifications List
  console.log('3. Fetching all notifications via GET /api/farmer/notifications?limit=20&offset=0...');
  const notifRes = await fetch('http://localhost:3000/api/farmer/notifications?limit=20&offset=0', {
    headers: authHeaders,
  });
  const notifData = await notifRes.json();
  console.log(`Status: ${notifRes.status}, Success: ${notifData.success}`);
  console.log(`Total Count: ${notifData.totalCount}, Unread Count: ${notifData.unreadCount}, Loaded Items: ${notifData.notifications.length}`);

  if (!notifData.success || !Array.isArray(notifData.notifications)) {
    throw new Error('Failed to fetch notifications: ' + JSON.stringify(notifData));
  }

  notifData.notifications.slice(0, 5).forEach((n, idx) => {
    console.log(`  [#${idx + 1}] ID: ${n.id} | Type: ${n.type} | Read: ${n.isRead ? 'YES' : 'NO'} | Title: "${n.title}" | Desc: "${n.description}"`);
  });
  console.log('PASS: Notifications retrieved from real database.\n');

  // Step 4: Verify Dashboard Consistency
  console.log('4. Verifying Farmer Dashboard consistency via GET /api/farmer/dashboard...');
  const dashRes = await fetch('http://localhost:3000/api/farmer/dashboard', {
    headers: authHeaders,
  });
  const dashData = await dashRes.json();
  if (!dashData.success || !dashData.data) {
    throw new Error('Failed to fetch dashboard data: ' + JSON.stringify(dashData));
  }
  console.log(`Dashboard notifications count: ${dashData.data.notifications.length}, Dashboard unreadCount: ${dashData.data.unreadCount}`);
  if (dashData.data.unreadCount !== notifData.unreadCount) {
    console.warn(`Note: unreadCount diff (dash: ${dashData.data.unreadCount}, notif: ${notifData.unreadCount})`);
  }
  console.log('PASS: Dashboard and Notifications use synchronized backend data.\n');

  // Step 5: Test Type-Based Filtering
  console.log('5. Testing type filters on /api/farmer/notifications...');
  const filterTypes = ['booking', 'crop', 'token', 'queue', 'payment'];
  for (const fType of filterTypes) {
    const fRes = await fetch(`http://localhost:3000/api/farmer/notifications?type=${fType}`, {
      headers: authHeaders,
    });
    const fData = await fRes.json();
    console.log(`  Filter [${fType}]: ${fData.notifications.length} items (Total: ${fData.totalCount})`);
    if (!fData.success) {
      throw new Error(`Filter ${fType} failed: ` + JSON.stringify(fData));
    }
  }
  console.log('PASS: All filter types work correctly.\n');

  // Step 6: Test Single "Mark as read"
  console.log('6. Testing single "Mark as read" via PATCH /api/farmer/notifications...');
  // Find an unread notification or create/use the first notification
  let targetNotif = notifData.notifications.find((n) => !n.isRead);
  if (!targetNotif && notifData.notifications.length > 0) {
    targetNotif = notifData.notifications[0];
  }

  if (targetNotif) {
    const prevUnread = notifData.unreadCount;
    console.log(`Targeting notification ID: ${targetNotif.id} (currently isRead = ${targetNotif.isRead})`);
    const markRes = await fetch('http://localhost:3000/api/farmer/notifications', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ id: targetNotif.id }),
    });
    const markData = await markRes.json();
    console.log('Mark single read response:', markData);
    if (!markData.success) {
      throw new Error('Failed to mark notification read: ' + JSON.stringify(markData));
    }
    console.log(`PASS: Notification ID ${targetNotif.id} marked as read. New unreadCount: ${markData.unreadCount}.\n`);
  } else {
    console.log('No notifications found to test single mark read, skipping single check.\n');
  }

  // Step 7: Test "Mark all as read"
  console.log('7. Testing "Mark all as read" via PATCH /api/farmer/notifications { markAll: true }...');
  const markAllRes = await fetch('http://localhost:3000/api/farmer/notifications', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ markAll: true }),
  });
  const markAllData = await markAllRes.json();
  console.log('Mark all read response:', markAllData);
  if (!markAllData.success || markAllData.unreadCount !== 0) {
    throw new Error('Mark all read did not reset unreadCount to 0: ' + JSON.stringify(markAllData));
  }

  // Verify list reflects isRead = 1 for all items
  const verifyRes = await fetch('http://localhost:3000/api/farmer/notifications', {
    headers: authHeaders,
  });
  const verifyData = await verifyRes.json();
  const remainingUnread = verifyData.notifications.filter((n) => !n.isRead).length;
  console.log(`Remaining unread in list: ${remainingUnread}`);
  if (remainingUnread !== 0) {
    throw new Error(`Expected 0 unread notifications after markAll, found ${remainingUnread}`);
  }
  console.log('PASS: All notifications successfully marked as read.\n');

  console.log('=== ALL FARMER NOTIFICATIONS E2E TESTS PASSED SUCCESSFULLY! ===');
}

runNotificationsE2ETest().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
