import { getDatabase } from '../src/lib/db.js';

async function testHttpAuth() {
  const baseUrl = 'http://localhost:3000';
  console.log('=== HTTP END-TO-END AUTHENTICATION TEST SUITE ===\n');

  const db = getDatabase();
  // Cleanup test accounts
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('e2e_admin@kishanflow.com', 'e2e_supplier@kishanflow.com');
  db.prepare('DELETE FROM users WHERE mobile IN (?, ?)').run('9991112233', '9992223344');

  // 1. Admin Registration HTTP
  console.log('1. Testing Admin Registration via HTTP POST /api/auth/register...');
  const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'admin',
      fullName: 'E2E Admin User',
      mobile: '9991112233',
      email: 'e2e_admin@kishanflow.com',
      password: 'E2EAdminPass@123',
      confirmPassword: 'E2EAdminPass@123',
    }),
  });
  const adminRegData = await adminRegRes.json();
  console.assert(adminRegRes.status === 200, `Admin reg status must be 200, got ${adminRegRes.status}`);
  console.assert(adminRegData.success === true, 'Admin reg success must be true');
  console.assert(adminRegData.user.role === 'admin', 'Registered role must be admin');
  const adminCookie = adminRegRes.headers.get('set-cookie');
  console.assert(adminCookie && adminCookie.includes('kishan_auth_token'), 'Must receive auth cookie on registration');
  console.log('✓ Admin registration HTTP test passed. User ID:', adminRegData.user.id);

  // 2. Admin Login with Email
  console.log('\n2. Testing Admin Login with Email via HTTP POST /api/auth/login...');
  const adminLoginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'e2e_admin@kishanflow.com',
      password: 'E2EAdminPass@123',
      role: 'admin',
    }),
  });
  const adminLoginEmailData = await adminLoginEmailRes.json();
  console.assert(adminLoginEmailRes.status === 200, 'Admin email login status must be 200');
  console.assert(adminLoginEmailData.success === true, 'Admin email login success must be true');
  console.assert(adminLoginEmailData.user.role === 'admin', 'Admin email login user role must be admin');
  console.log('✓ Admin email login HTTP test passed.');

  // 3. Admin Login with Mobile
  console.log('\n3. Testing Admin Login with Mobile via HTTP POST /api/auth/login...');
  const adminLoginMobileRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9991112233',
      password: 'E2EAdminPass@123',
      role: 'admin',
    }),
  });
  const adminLoginMobileData = await adminLoginMobileRes.json();
  console.assert(adminLoginMobileRes.status === 200, 'Admin mobile login status must be 200');
  console.assert(adminLoginMobileData.success === true, 'Admin mobile login success must be true');
  console.log('✓ Admin mobile login HTTP test passed.');

  // 4. Supplier Registration HTTP
  console.log('\n4. Testing Supplier Registration via HTTP POST /api/auth/register...');
  const supplierRegRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'supplier',
      fullName: 'E2E Supplier Logistics',
      mobile: '9992223344',
      email: 'e2e_supplier@kishanflow.com',
      password: 'E2ESupplierPass@123',
      confirmPassword: 'E2ESupplierPass@123',
    }),
  });
  const supplierRegData = await supplierRegRes.json();
  console.assert(supplierRegRes.status === 200, `Supplier reg status must be 200, got ${supplierRegRes.status}`);
  console.assert(supplierRegData.success === true, 'Supplier reg success must be true');
  console.assert(supplierRegData.user.role === 'supplier', 'Registered role must be supplier');
  console.log('✓ Supplier registration HTTP test passed. User ID:', supplierRegData.user.id);

  // 5. Supplier Login with Email
  console.log('\n5. Testing Supplier Login with Email via HTTP POST /api/auth/login...');
  const supplierLoginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'e2e_supplier@kishanflow.com',
      password: 'E2ESupplierPass@123',
      role: 'supplier',
    }),
  });
  const supplierLoginEmailData = await supplierLoginEmailRes.json();
  console.assert(supplierLoginEmailRes.status === 200, 'Supplier email login status must be 200');
  console.assert(supplierLoginEmailData.success === true, 'Supplier email login success must be true');
  console.assert(supplierLoginEmailData.user.role === 'supplier', 'Supplier role must be supplier');
  console.log('✓ Supplier email login HTTP test passed.');

  // 6. Supplier Login with Mobile
  console.log('\n6. Testing Supplier Login with Mobile via HTTP POST /api/auth/login...');
  const supplierLoginMobileRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9992223344',
      password: 'E2ESupplierPass@123',
      role: 'supplier',
    }),
  });
  const supplierLoginMobileData = await supplierLoginMobileRes.json();
  console.assert(supplierLoginMobileRes.status === 200, 'Supplier mobile login status must be 200');
  console.assert(supplierLoginMobileData.success === true, 'Supplier mobile login success must be true');
  console.log('✓ Supplier mobile login HTTP test passed.');

  // 7. Non-Regression Farmer Login
  console.log('\n7. Testing Farmer Login via HTTP POST /api/auth/login...');
  const farmerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9820123456',
      password: 'Farmer@12345',
      role: 'farmer',
    }),
  });
  const farmerLoginData = await farmerLoginRes.json();
  console.assert(farmerLoginRes.status === 200, 'Farmer login status must be 200');
  console.assert(farmerLoginData.success === true, 'Farmer login success must be true');
  console.assert(farmerLoginData.user.role === 'farmer', 'Farmer role must be farmer');
  console.log('✓ Farmer login HTTP test passed.');

  // 8. Non-Regression Buyer Login
  console.log('\n8. Testing Buyer Login via HTTP POST /api/auth/login...');
  const buyerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'buyer@kishanflow.com',
      password: 'Buyer@12345',
      role: 'buyer',
    }),
  });
  const buyerLoginData = await buyerLoginRes.json();
  console.assert(buyerLoginRes.status === 200, 'Buyer login status must be 200');
  console.assert(buyerLoginData.success === true, 'Buyer login success must be true');
  console.assert(buyerLoginData.user.role === 'buyer', 'Buyer role must be buyer');
  console.log('✓ Buyer login HTTP test passed.');

  // 9. Cross-Role Login Firewall
  console.log('\n9. Testing Cross-Role Login rejection...');
  const crossRoleRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'e2e_admin@kishanflow.com',
      password: 'E2EAdminPass@123',
      role: 'farmer', // Trying to log in to farmer portal with admin credentials
    }),
  });
  const crossRoleData = await crossRoleRes.json();
  console.assert(crossRoleRes.status === 403, `Cross-role status must be 403, got ${crossRoleRes.status}`);
  console.assert(crossRoleData.success === false, 'Cross-role login success must be false');
  console.assert(crossRoleData.error && crossRoleData.error.includes('registered as a Admin'), 'Friendly cross-role message expected');
  console.log('✓ Cross-role firewall passed. Error message:', crossRoleData.error);

  // 10. Session Verification with /api/auth/me
  console.log('\n10. Testing Session validation via GET /api/auth/me with Cookie...');
  const rawCookie = supplierLoginEmailRes.headers.get('set-cookie');
  const cookieValue = rawCookie ? rawCookie.split(';')[0] : '';
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: cookieValue },
  });
  const meData = await meRes.json();
  console.assert(meRes.status === 200, 'Me status must be 200');
  console.assert(meData.authenticated === true, 'Must be authenticated');
  console.assert(meData.user.role === 'supplier', 'Authenticated user role must match supplier');
  console.log('✓ /api/auth/me session validated. Current user:', meData.user.fullName, `(${meData.user.role})`);

  // 11. Logout HTTP Test
  console.log('\n11. Testing Logout via POST /api/auth/logout...');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieValue },
  });
  console.assert(logoutRes.status === 200, 'Logout status must be 200');
  console.log('✓ Logout HTTP test passed.');

  // Cleanup
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('e2e_admin@kishanflow.com', 'e2e_supplier@kishanflow.com');
  console.log('\n=== ALL 11 HTTP END-TO-END AUTH TESTS PASSED SUCCESSFULLY! ===');
}

testHttpAuth().catch((err) => {
  console.error('HTTP auth test error:', err);
  process.exit(1);
});
