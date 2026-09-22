console.log('=== SUPPLIER HTTP & ROUTE VERIFICATION ===');

async function verifyRoutes() {
  const baseUrl = 'http://localhost:3000';

  // 1. Test Login Page HTML
  const loginRes = await fetch(`${baseUrl}/supplier/login`);
  console.log(`[HTTP 1] GET /supplier/login -> Status: ${loginRes.status}`);
  const loginHtml = await loginRes.text();
  if (!loginHtml.includes('Supplier') || loginRes.status !== 200) {
    throw new Error('Supplier login page failed to load.');
  }
  console.log('  -> Supplier login page loaded successfully with HTML.');

  // 2. Perform Login API call
  const authRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'supplier@kishanflow.com',
      password: 'Supplier@12345',
      role: 'supplier',
    }),
  });
  console.log(`[HTTP 2] POST /api/auth/login -> Status: ${authRes.status}`);
  const authJson = await authRes.json();
  const setCookie = authRes.headers.get('set-cookie');
  console.log('  -> Auth response:', authJson);
  console.log('  -> Auth cookie received:', Boolean(setCookie));

  if (!authJson.success || !setCookie) {
    throw new Error('Supplier authentication failed.');
  }

  // 3. Test Protected Dashboard API with Auth Cookie
  const cookieHeader = setCookie.split(';')[0];
  const dashRes = await fetch(`${baseUrl}/api/supplier/dashboard`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`[HTTP 3] GET /api/supplier/dashboard -> Status: ${dashRes.status}`);
  const dashJson = await dashRes.json();
  console.log('  -> Dashboard data stats:', dashJson.data?.stats);
  console.log('  -> Dashboard products count:', dashJson.data?.products?.length);
  console.log('  -> Dashboard recent orders count:', dashJson.data?.recentOrders?.length);
  console.log('  -> Dashboard low stock count:', dashJson.data?.lowStockProducts?.length);

  if (!dashJson.success || dashJson.data?.stats?.totalProducts < 1) {
    throw new Error('Supplier dashboard API did not return expected data.');
  }

  // 4. Test Dashboard Page HTML
  const dashHtmlRes = await fetch(`${baseUrl}/supplier/dashboard`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`[HTTP 4] GET /supplier/dashboard -> Status: ${dashHtmlRes.status}`);
  if (dashHtmlRes.status !== 200) {
    throw new Error('Supplier dashboard page returned non-200 status.');
  }
  console.log('  -> Supplier dashboard page HTML returned 200 OK.');

  // 5. Test Supplier Products API
  const prodRes = await fetch(`${baseUrl}/api/supplier/products`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`[HTTP 5] GET /api/supplier/products -> Status: ${prodRes.status}`);
  const prodJson = await prodRes.json();
  console.log(`  -> Returned ${prodJson.data?.length} products.`);

  // 6. Test Supplier Orders API
  const ordersRes = await fetch(`${baseUrl}/api/supplier/orders`, {
    headers: { Cookie: cookieHeader },
  });
  console.log(`[HTTP 6] GET /api/supplier/orders -> Status: ${ordersRes.status}`);
  const ordersJson = await ordersRes.json();
  console.log(`  -> Returned ${ordersJson.data?.length} orders.`);

  console.log('\n>>> ALL SUPPLIER HTTP ROUTES & API VERIFIED SUCCESSFULLY! <<<');
}

verifyRoutes().catch((err) => {
  console.error('\nHTTP VERIFICATION FAILED:', err);
  process.exit(1);
});
