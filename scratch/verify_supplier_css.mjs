async function verifyAll() {
  console.log('=== 1. Logging in as Supplier ===');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'supplier@kishanflow.com',
      password: 'Supplier@12345',
      role: 'supplier'
    })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Supplier login status:', loginRes.status, 'Cookie set:', !!cookie);

  console.log('=== 2. Fetching /supplier/dashboard ===');
  const dashRes = await fetch('http://localhost:3000/supplier/dashboard', {
    headers: { cookie }
  });
  console.log('/supplier/dashboard status:', dashRes.status);
  const html = await dashRes.text();
  console.log('Dashboard HTML length:', html.length);

  console.log('=== 3. Checking Delivered CSS Bundle ===');
  const cssMatches = [...html.matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)];
  console.log('Found CSS link matches in HTML:', cssMatches.length);
  for (const match of cssMatches) {
    const cssUrl = 'http://localhost:3000' + match[1];
    const cssRes = await fetch(cssUrl);
    const cssContent = await cssRes.text();
    console.log('CSS path:', match[1], 'HTTP Status:', cssRes.status, 'Bytes:', cssContent.length);
    console.log('  Includes .supplier-saas-layout:', cssContent.includes('supplier-saas-layout'));
    console.log('  Includes .supplier-welcome-banner:', cssContent.includes('supplier-welcome-banner'));
    console.log('  Includes .supplier-stats-grid:', cssContent.includes('supplier-stats-grid'));
    console.log('  Includes .supplier-stat-card:', cssContent.includes('supplier-stat-card'));
    console.log('  Includes .supplier-card:', cssContent.includes('supplier-card'));
    console.log('  Includes .supplier-table:', cssContent.includes('supplier-table'));
    console.log('  Includes .supplier-badge:', cssContent.includes('supplier-badge'));
  }

  console.log('=== 4. Checking Real Dashboard API ===');
  const apiRes = await fetch('http://localhost:3000/api/supplier/dashboard', {
    headers: { cookie }
  });
  console.log('API Status:', apiRes.status);
  const apiData = await apiRes.json();
  console.log('API Success:', apiData.success);
  console.log('Stats:', apiData.data?.stats);
  console.log('Products:', apiData.data?.products?.map(p => ({ name: p.name, stock: p.stock, price: p.price })));
  console.log('Recent Orders:', apiData.data?.recentOrders?.map(o => ({ orderNumber: o.orderNumber, status: o.status, farmer: o.farmerName })));

  console.log('=== 5. Verifying All Supplier Subpages ===');
  const pages = [
    '/supplier/products',
    '/supplier/orders',
    '/supplier/inventory',
    '/supplier/notifications',
    '/supplier/settings',
    '/supplier/support'
  ];
  for (const page of pages) {
    const res = await fetch('http://localhost:3000' + page, { headers: { cookie } });
    console.log(page, '-> status:', res.status);
  }
}

verifyAll().catch(console.error);
