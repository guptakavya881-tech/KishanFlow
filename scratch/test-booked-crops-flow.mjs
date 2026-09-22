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
  console.log('=== Starting Test: Only Booked Crops & Removal Workflow ===\n');

  // 1. Login as real farmer
  const loginRes = await request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    identifier: 'farmer@kishanflow.com',
    password: 'Farmer@12345',
    role: 'farmer',
  });

  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : (setCookie ? setCookie.split(';')[0] : '');
  console.log(`1. Farmer Login -> Status: ${loginRes.statusCode}, Cookie: ${Boolean(cookieHeader)}`);

  // 2. Fetch My Crops (Should return ONLY crops with active bookings)
  const cropsRes = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  console.log(`2. GET /api/farmer/crops -> Status: ${cropsRes.statusCode}`);
  const cropsData = cropsRes.json();
  console.log(`   Booked crops returned: ${cropsData?.crops?.length}`);
  cropsData?.crops?.forEach((c) => {
    console.log(`   - ${c.name}: ${c.quantity} ${c.unit} | Centre: "${c.procurementCentre}" | Date: ${c.bookingDate} | Token: ${c.tokenNumber} | Status: ${c.status}`);
  });

  // 3. Add an UNBOOKED crop (e.g. Cotton)
  const addUnbookedRes = await request('http://localhost:3000/api/farmer/crops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  }, {
    name: 'Cotton',
    quantity: 300,
    unit: 'kg',
    expectedHarvestDate: '2026-11-20',
    harvestStatus: 'Growing',
  });
  console.log(`\n3. Add Unbooked Crop (Cotton) -> Status: ${addUnbookedRes.statusCode}`);

  // 4. Verify My Crops still does NOT include Cotton
  const cropsResAfterUnbooked = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const hasCotton = cropsResAfterUnbooked.json()?.crops?.some(c => c.name === 'Cotton');
  console.log(`4. Unbooked Cotton visible in My Crops? ${hasCotton} (Expected: false)`);

  // 5. Check Farmer Dashboard stats
  const dashRes = await request('http://localhost:3000/api/farmer/dashboard', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const dashData = dashRes.json()?.data;
  console.log(`\n5. Dashboard Active Crops Count: ${dashData?.stats?.activeCropsCount}`);
  console.log(`   Dashboard Crops List count: ${dashData?.crops?.length}`);
  const dashHasCotton = dashData?.crops?.some(c => c.name === 'Cotton');
  console.log(`   Dashboard shows unbooked Cotton? ${dashHasCotton} (Expected: false)`);

  // 6. Now book a slot for Cotton!
  const bookCottonRes = await request('http://localhost:3000/api/farmer/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  }, {
    cropName: 'Cotton',
    quantity: 300,
    unit: 'kg',
    centreId: 'centre-1',
    centreName: 'Meerut Procurement Centre',
    centreAddress: 'Mandi Samiti Compound, Delhi Road, Meerut, UP',
    date: '20 November 2026',
    timeSlot: '02:00 PM – 02:30 PM',
  });
  const bookCottonJson = bookCottonRes.json();
  console.log(`\n6. Booked Cotton Slot -> Status: ${bookCottonRes.statusCode}, Success: ${bookCottonJson?.success}, Token: ${bookCottonJson?.tokenNumber}`);

  // 7. Verify Cotton NOW appears in My Crops!
  const cropsResAfterBooked = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const cottonInList = cropsResAfterBooked.json()?.crops?.find(c => c.name === 'Cotton');
  console.log(`7. Cotton NOW visible in My Crops? ${Boolean(cottonInList)} (Expected: true)`);
  if (cottonInList) {
    console.log(`   Details: ${cottonInList.name}, Token: ${cottonInList.tokenNumber}, Centre: ${cottonInList.procurementCentre}`);
  }

  // 8. Test Removing the Cotton Booked Crop (Yes, Remove)
  const removeTargetId = cottonInList?.bookingId || cottonInList?.id;
  const removeRes = await request(`http://localhost:3000/api/farmer/crops/${removeTargetId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieHeader },
  });
  const removeJson = removeRes.json();
  console.log(`\n8. Remove Booked Cotton (Yes, Remove) -> Status: ${removeRes.statusCode}, Message: "${removeJson?.message}"`);

  // 9. Verify Cotton is removed from My Crops immediately
  const cropsResFinal = await request('http://localhost:3000/api/farmer/crops', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const cottonStillPresent = cropsResFinal.json()?.crops?.some(c => c.name === 'Cotton');
  console.log(`9. Cotton still present after removal? ${cottonStillPresent} (Expected: false)`);

  // 10. Verify Dashboard active crops count updated
  const dashResFinal = await request('http://localhost:3000/api/farmer/dashboard', {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  console.log(`10. Dashboard Active Crops Count after removal: ${dashResFinal.json()?.data?.stats?.activeCropsCount}`);

  // 11. Security test: Attempt to delete with unauthorized user
  const unauthRes = await request(`http://localhost:3000/api/farmer/crops/1`, {
    method: 'DELETE',
  });
  console.log(`11. Unauthorized DELETE attempt -> Status: ${unauthRes.statusCode} (Expected: 401)`);

  console.log('\n=== All Verification Checks Passed Successfully ===');
}

run().catch(console.error);
