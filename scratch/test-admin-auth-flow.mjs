const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== TESTING ADMIN AUTHENTICATION FLOW ===');

  const testEmail = `admin_flow_test_${Date.now()}@kishanflow.com`;
  const testPassword = 'SecureAdmin@987';
  const testMobile = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const testFullName = 'Regional Directorate Admin';

  // 1. Test Admin Registration via API
  console.log('\n[1] Registering new Admin via /api/auth/register...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: testFullName,
      email: testEmail,
      mobile: testMobile,
      password: testPassword,
      confirmPassword: testPassword,
      role: 'admin',
    }),
  });

  const regData = await regRes.json();
  console.log('Registration status:', regRes.status);
  console.log('Registration data:', regData);

  if (!regData.success || regData.user?.role !== 'admin') {
    throw new Error('Admin registration failed: ' + JSON.stringify(regData));
  }
  console.log('✅ Admin registration succeeded and role is "admin"');

  // Extract auth cookie from registration
  const regCookie = regRes.headers.get('set-cookie');
  console.log('Registration cookie issued:', !!regCookie);

  // 2. Test Login with exact registered email & password
  console.log('\n[2] Logging in with registered email & password (role: "admin")...');
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: testPassword,
      role: 'admin',
    }),
  });
  const loginData1 = await loginRes1.json();
  console.log('Login status:', loginRes1.status);
  console.log('Login user:', loginData1.user);
  if (!loginData1.success || loginData1.user?.email !== testEmail) {
    throw new Error('Login with email failed: ' + JSON.stringify(loginData1));
  }
  console.log('✅ Login with registered email succeeded');

  // 3. Test Login with mobile number
  console.log('\n[3] Logging in with registered mobile number...');
  const loginResMobile = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testMobile,
      password: testPassword,
      role: 'admin',
    }),
  });
  const loginDataMobile = await loginResMobile.json();
  if (!loginDataMobile.success) {
    throw new Error('Login with mobile failed: ' + JSON.stringify(loginDataMobile));
  }
  console.log('✅ Login with registered mobile succeeded');

  // 4. Test Login with uppercase role "ADMIN"
  console.log('\n[4] Logging in with role: "ADMIN" (uppercase)...');
  const loginResUpper = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: testPassword,
      role: 'ADMIN',
    }),
  });
  const loginDataUpper = await loginResUpper.json();
  if (!loginDataUpper.success) {
    throw new Error('Login with uppercase ADMIN role failed: ' + JSON.stringify(loginDataUpper));
  }
  console.log('✅ Login with uppercase role "ADMIN" succeeded');

  // 5. Test Login with username / email prefix
  const emailPrefix = testEmail.split('@')[0];
  console.log(`\n[5] Logging in with username/prefix "${emailPrefix}"...`);
  const loginResUser = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: emailPrefix,
      password: testPassword,
      role: 'admin',
    }),
  });
  const loginDataUser = await loginResUser.json();
  if (!loginDataUser.success) {
    throw new Error('Login with username prefix failed: ' + JSON.stringify(loginDataUser));
  }
  console.log('✅ Login with username/email-prefix succeeded');

  // 6. Test Login with incorrect password
  console.log('\n[6] Testing login with wrong password...');
  const loginResWrong = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'WrongPassword@123',
      role: 'admin',
    }),
  });
  const loginDataWrong = await loginResWrong.json();
  if (loginResWrong.status !== 401) {
    throw new Error('Expected 401 for wrong password, got: ' + loginResWrong.status);
  }
  console.log('✅ Wrong password correctly rejected with 401:', loginDataWrong.error);

  // 7. Test Farmer trying to login via Admin portal
  console.log('\n[7] Testing Farmer trying to login as Admin...');
  const loginFarmer = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'farmer@kishanflow.com',
      password: 'Farmer@12345',
      role: 'admin',
    }),
  });
  const loginFarmerData = await loginFarmer.json();
  if (loginFarmer.status !== 403) {
    throw new Error('Expected 403 when farmer attempts admin login, got: ' + loginFarmer.status);
  }
  console.log('✅ Farmer rejected from admin portal with 403:', loginFarmerData.error);

  // 8. Test Session verification via /api/auth/me with auth cookie
  console.log('\n[8] Testing session verification via /api/auth/me...');
  const loginCookie = loginRes1.headers.get('set-cookie');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Cookie: loginCookie.split(';')[0],
    },
  });
  const meData = await meRes.json();
  console.log('/api/auth/me response:', meData);
  if (!meData.authenticated || meData.user?.role !== 'admin' || meData.user?.email !== testEmail) {
    throw new Error('Session verification failed: ' + JSON.stringify(meData));
  }
  console.log('✅ Session verified successfully for admin');

  // 9. Verify /admin/register and /admin/login pages return 200
  console.log('\n[9] Checking page HTTP status...');
  const regPageRes = await fetch(`${BASE_URL}/admin/register`);
  console.log('/admin/register status:', regPageRes.status);
  if (regPageRes.status !== 200) throw new Error('/admin/register did not return 200');

  const loginPageRes = await fetch(`${BASE_URL}/admin/login`);
  console.log('/admin/login status:', loginPageRes.status);
  if (loginPageRes.status !== 200) throw new Error('/admin/login did not return 200');

  // 10. Check that Farmer & Buyer login still work perfectly
  console.log('\n[10] Verifying Farmer and Buyer logins are completely unaffected...');
  const farmerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'farmer@kishanflow.com',
      password: 'Farmer@12345',
      role: 'farmer',
    }),
  });
  const farmerData = await farmerLogin.json();
  if (!farmerData.success || farmerData.user?.role !== 'farmer') {
    throw new Error('Farmer login broken: ' + JSON.stringify(farmerData));
  }
  console.log('✅ Farmer login works perfectly');

  const buyerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'buyer@kishanflow.com',
      password: 'Buyer@12345',
      role: 'buyer',
    }),
  });
  const buyerData = await buyerLogin.json();
  if (!buyerData.success || buyerData.user?.role !== 'buyer') {
    throw new Error('Buyer login broken: ' + JSON.stringify(buyerData));
  }
  console.log('✅ Buyer login works perfectly');

  console.log('\n🎉 ALL ADMIN AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
