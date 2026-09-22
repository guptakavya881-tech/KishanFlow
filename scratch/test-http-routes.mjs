async function testRoute(url, name) {
  try {
    const res = await fetch(url);
    console.log(`[HTTP] ${name}: status=${res.status} (${res.statusText})`);
    if (url.includes('/api/')) {
      const data = await res.json();
      console.log(`       success=${data.success}, keys=${Object.keys(data).join(', ')}`);
    } else {
      const text = await res.text();
      console.log(`       HTML length=${text.length} chars, title=${text.match(/<title>(.*?)<\/title>/)?.[1] || 'no title'}`);
    }
  } catch (err) {
    console.error(`[HTTP] ${name} FAILED:`, err.message);
  }
}

async function run() {
  console.log('Testing dev server endpoints at http://localhost:3000...\n');
  await testRoute('http://localhost:3000/api/buyer/notifications', 'GET /api/buyer/notifications');
  await testRoute('http://localhost:3000/api/buyer/profile', 'GET /api/buyer/profile');
  await testRoute('http://localhost:3000/api/buyer/purchase-history', 'GET /api/buyer/purchase-history');
  await testRoute('http://localhost:3000/buyer/notifications', 'GET /buyer/notifications');
  await testRoute('http://localhost:3000/buyer/profile', 'GET /buyer/profile');
  await testRoute('http://localhost:3000/buyer/purchase-history', 'GET /buyer/purchase-history');
}

run();
