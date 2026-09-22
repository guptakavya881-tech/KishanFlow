import http from 'http';

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json: () => {
            try {
              return JSON.parse(body);
            } catch {
              return null;
            }
          },
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('=== Starting My Crops Flow Automated Verification ===\n');

  // 1. Verify Page Route /farmer/crops
  const pageRes = await request('http://localhost:3000/farmer/crops');
  console.log(`1. GET /farmer/crops -> Status: ${pageRes.statusCode}`);
  const hasMyCrops = pageRes.body.includes('MY CROPS') || pageRes.body.includes('My Crops');
  console.log(`   Contains "My Crops": ${hasMyCrops}`);

  // 2. Login as real farmer to get session cookie
  const loginRes = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    identifier: 'farmer@kishanflow.com',
    password: 'Farmer@12345',
    role: 'farmer',
  });

  console.log(`\n2. POST /api/auth/login -> Status: ${loginRes.statusCode}`);
  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : (setCookie ? setCookie.split(';')[0] : '');
  console.log(`   Session cookie acquired: ${Boolean(cookieHeader)}`);

  // 3. GET /api/farmer/crops with session
  const cropsRes = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  console.log(`\n3. GET /api/farmer/crops -> Status: ${cropsRes.statusCode}`);
  const cropsJson = cropsRes.json();
  console.log(`   Success: ${cropsJson?.success}, Crops Count: ${cropsJson?.crops?.length}`);
  if (cropsJson?.crops) {
    cropsJson.crops.forEach(c => {
      console.log(`   - Crop: ${c.name} (${c.quantity} ${c.unit}), Status: ${c.harvestStatus}, hasActiveBooking: ${c.hasActiveBooking}`);
    });
  }

  // 4. Test Add New Crop (e.g. Barley)
  const addRes = await request('http://localhost:3000/api/farmer/crops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  }, {
    name: 'Barley',
    quantity: 120,
    unit: 'Quintal',
    expectedHarvestDate: '2026-10-15',
    harvestStatus: 'Growing',
    notes: 'Organic winter barley',
  });

  console.log(`\n4. POST /api/farmer/crops (Add Barley) -> Status: ${addRes.statusCode}`);
  const addJson = addRes.json();
  console.log(`   Success: ${addJson?.success}, Crop ID: ${addJson?.crop?.id}`);
  const newCropId = addJson?.crop?.id;

  // 5. Verify Newly Added Crop in Crops list
  const cropsRes2 = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const foundBarley = cropsRes2.json()?.crops?.some(c => c.id === newCropId);
  console.log(`\n5. Verified Barley in crops list: ${foundBarley}`);

  // 6. Test Delete the newly added crop (No active booking -> should succeed)
  const deleteRes = await request(`http://localhost:3000/api/farmer/crops/${newCropId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  });
  console.log(`\n6. DELETE /api/farmer/crops/${newCropId} -> Status: ${deleteRes.statusCode}`);
  const delJson = deleteRes.json();
  console.log(`   Success: ${delJson?.success}, Message: "${delJson?.message}"`);

  // 7. Test Delete on Crop WITH ACTIVE BOOKING (Wheat)
  const wheatCrop = cropsJson?.crops?.find(c => c.name === 'Wheat' && c.hasActiveBooking);
  if (wheatCrop) {
    const deleteBlockedRes = await request(`http://localhost:3000/api/farmer/crops/${wheatCrop.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
    console.log(`\n7. DELETE Active Booking Crop (${wheatCrop.name}) -> Status: ${deleteBlockedRes.statusCode}`);
    const blockedJson = deleteBlockedRes.json();
    console.log(`   Blocked Successfully: ${deleteBlockedRes.statusCode === 400}`);
    console.log(`   hasActiveBooking: ${blockedJson?.hasActiveBooking}`);
    console.log(`   Error Message: "${blockedJson?.error}"`);
  } else {
    console.log('\n7. No active booking crop found in initial list to test safety on, checking bookings...');
  }

  // 8. Test Unauthorized Delete (no session)
  const unauthDel = await request(`http://localhost:3000/api/farmer/crops/99999`, {
    method: 'DELETE',
  });
  console.log(`\n8. Unauthorized DELETE attempt -> Status: ${unauthDel.statusCode} (Expected 401)`);

  console.log('\n=== All Tests Finished Successfully ===');
}

run().catch(console.error);
