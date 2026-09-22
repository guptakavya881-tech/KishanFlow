import http from 'http';

const routes = [
  '/admin/reports',
  '/admin/settings',
  '/admin/support',
  '/admin/analytics',
  '/farmer/settings',
  '/farmer/support',
  '/farmer/help',
  '/buyer/settings',
  '/buyer/support',
  '/buyer/help',
  '/supplier/settings',
  '/supplier/support',
  '/settings',
  '/support',
];

async function checkRoute(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          hasContent: data.length > 500,
          location: res.headers.location || null,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ path, statusCode: 'ERR', error: err.message });
    });
  });
}

async function run() {
  console.log('Testing KisanFlow routes on dev server...\n');
  let allOk = true;
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`Route: ${r.padEnd(22)} | Status: ${res.statusCode} | Content: ${res.hasContent ? 'OK' : 'Redirect/Short'} ${res.location ? `-> ${res.location}` : ''}`);
    if (res.statusCode !== 200 && res.statusCode !== 307 && res.statusCode !== 308) {
      allOk = false;
    }
  }
  console.log(`\nOverall Result: ${allOk ? 'ALL ROUTES RESPONDING HEALTHILY' : 'FAILURES DETECTED'}`);
}

run();
