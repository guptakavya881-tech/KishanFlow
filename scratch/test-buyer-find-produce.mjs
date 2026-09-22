import { getDatabase, createCropRecord, updateCropRecord, deleteCropRecord, getBuyerEligibleCrops } from '../src/lib/db.js';

async function testFindProduce() {
  console.log('=== VERIFYING BUYER FIND PRODUCE MODULE (REAL DATA ONLY) ===\n');

  const db = getDatabase();

  // Test 1: Query API for Find Produce default list
  console.log('--- Test 1: Default Find Produce Listings ---');
  const res = await fetch('http://localhost:3000/api/buyer/crops');
  const json = await res.json();
  if (!json.success) throw new Error(`API failed: ${json.error}`);

  const { crops, totalCount, availableCropNames, availableLocations } = json.data;
  console.log(`✓ Total produce listings found: ${totalCount}`);
  console.log(`✓ Real registered crops: [ ${availableCropNames.join(', ')} ]`);
  console.log(`✓ Real registered locations: [ ${availableLocations.join(', ')} ]`);

  // Verify no non-existent crops exist
  const nonExistent = ['Potato', 'Tomato', 'Sugarcane', 'Onion'];
  for (const fake of nonExistent) {
    if (availableCropNames.includes(fake)) {
      throw new Error(`FAIL: Found fake crop ${fake} in available crop list!`);
    }
  }
  console.log('✓ Verified: Non-registered crops (Potato, Tomato, Sugarcane) do NOT appear.');

  // Test 2: Search for Potato (should return 0 matches)
  console.log('\n--- Test 2: Search Non-existent Crop ("Potato") ---');
  const searchPotatoRes = await fetch('http://localhost:3000/api/buyer/crops?search=Potato');
  const potatoJson = await searchPotatoRes.json();
  if (potatoJson.data.crops.length !== 0) {
    throw new Error(`FAIL: Searching "Potato" returned ${potatoJson.data.crops.length} items! Expected 0.`);
  }
  console.log('✓ Verified: Searching "Potato" returns 0 records (No fake Potato card generated).');

  // Test 3: Search "Whe" (case-insensitive substring)
  console.log('\n--- Test 3: Dynamic Substring Search ("whe") ---');
  const searchWheRes = await fetch('http://localhost:3000/api/buyer/crops?search=whe');
  const wheJson = await searchWheRes.json();
  console.log(`✓ Found ${wheJson.data.crops.length} crops matching "whe":`);
  for (const c of wheJson.data.crops) {
    if (!c.cropName.toLowerCase().includes('whe') && !c.notes?.toLowerCase().includes('whe')) {
      throw new Error(`FAIL: Unexpected crop ${c.cropName} in "whe" search results!`);
    }
  }
  console.log('✓ Verified: Search dynamically filters only actual records matching "whe".');

  // Test 4: Availability Mapping
  console.log('\n--- Test 4: Availability Filter & Growing Exclusion ---');
  const availNowRes = await fetch('http://localhost:3000/api/buyer/crops?status=Available+Now');
  const availNowJson = await availNowRes.json();
  for (const c of availNowJson.data.crops) {
    if (c.harvestStatus !== 'Ready for Procurement') {
      throw new Error(`FAIL: Crop ${c.cropName} with status "${c.harvestStatus}" in Available Now!`);
    }
  }
  console.log(`✓ Available Now strictly returns ${availNowJson.data.crops.length} 'Ready for Procurement' lots.`);

  const comingSoonRes = await fetch('http://localhost:3000/api/buyer/crops?status=Coming+Soon');
  const comingSoonJson = await comingSoonRes.json();
  for (const c of comingSoonJson.data.crops) {
    if (c.harvestStatus !== 'Nearly Ready') {
      throw new Error(`FAIL: Crop ${c.cropName} with status "${c.harvestStatus}" in Coming Soon!`);
    }
  }
  console.log(`✓ Coming Soon strictly returns ${comingSoonJson.data.crops.length} 'Nearly Ready' lots.`);

  // Verify 'Growing' crops are never present
  const allCrops = json.data.crops;
  const growing = allCrops.filter(c => c.harvestStatus === 'Growing');
  if (growing.length > 0) {
    throw new Error(`FAIL: Found ${growing.length} crops with status 'Growing'!`);
  }
  console.log('✓ Verified: ZERO crops with status "Growing" appear as purchasable produce.');

  // Test 5: Sorting
  console.log('\n--- Test 5: Real Produce Sorting ---');
  const descRes = await fetch('http://localhost:3000/api/buyer/crops?sortBy=quantity-desc');
  const descJson = await descRes.json();
  const descQtys = descJson.data.crops.map(c => c.quantity);
  for (let i = 0; i < descQtys.length - 1; i++) {
    if (descQtys[i] < descQtys[i + 1]) {
      throw new Error(`FAIL: Quantity sort DESC violated at index ${i}: ${descQtys[i]} < ${descQtys[i + 1]}`);
    }
  }
  console.log(`✓ Verified: Quantity: High to Low sort correctly orders [${descQtys.slice(0, 5).join(', ')}...]`);

  const ascRes = await fetch('http://localhost:3000/api/buyer/crops?sortBy=quantity-asc');
  const ascJson = await ascRes.json();
  const ascQtys = ascJson.data.crops.map(c => c.quantity);
  for (let i = 0; i < ascQtys.length - 1; i++) {
    if (ascQtys[i] > ascQtys[i + 1]) {
      throw new Error(`FAIL: Quantity sort ASC violated at index ${i}: ${ascQtys[i]} > ${ascQtys[i + 1]}`);
    }
  }
  console.log(`✓ Verified: Quantity: Low to High sort correctly orders [${ascQtys.slice(0, 5).join(', ')}...]`);

  // Test 6: Privacy & Pricing
  console.log('\n--- Test 6: Privacy & Price Rule ---');
  for (const c of crops) {
    if (c.mobile || c.passwordHash || c.userId || c.address) {
      throw new Error(`FAIL: Sensitive farmer info found in crop ID ${c.id}`);
    }
    if (c.pricePerKg !== undefined || c.price !== undefined) {
      throw new Error(`FAIL: Fake price field detected in crop ID ${c.id}`);
    }
  }
  console.log('✓ Verified: Zero private farmer data exposed and ZERO fake prices.');

  // Test 7: Multi-Farmer Same Crop Isolation
  console.log('\n--- Test 7: Multiple Farmers with Same Crop ---');
  const wheatLots = crops.filter(c => c.cropName === 'Wheat');
  console.log(`Found ${wheatLots.length} separate Wheat listings:`);
  for (const w of wheatLots) {
    console.log(`- Lot: ${w.lotId} | Qty: ${w.quantity} ${w.unit} | Status: ${w.harvestStatus} | Mandi: ${w.procurementCentre}`);
  }
  const lotIds = new Set(wheatLots.map(w => w.lotId));
  if (lotIds.size !== wheatLots.length) {
    throw new Error('FAIL: Duplicate lot IDs detected for same crop!');
  }
  console.log('✓ Verified: Multiple farmer Wheat lots remain distinct individual listings.');

  // Test 8: Real Farmer Sync Lifecycle
  console.log('\n--- Test 8: Real Farmer Sync Lifecycle ---');
  const farmer = db.prepare("SELECT id, fullName FROM users WHERE role = 'farmer' LIMIT 1").get();
  console.log(`Farmer: ${farmer.fullName} (ID: ${farmer.id})`);

  // 1. Farmer adds: Mustard 500 kg Ready for Procurement
  const testMustard = createCropRecord({
    userId: farmer.id,
    name: 'Mustard_SyncTest',
    quantity: 500,
    unit: 'kg',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '20 October 2026',
    notes: 'Direct farm fresh mustard seeds'
  });
  console.log(`Farmer added new crop: ID ${testMustard.id} (${testMustard.name}, 500 kg)`);

  let check = getBuyerEligibleCrops({ cropName: 'Mustard_SyncTest' });
  if (check.crops.length !== 1 || check.crops[0].quantity !== 500) {
    throw new Error('FAIL: Find Produce did not see newly added Mustard!');
  }
  console.log('✓ Verified: Newly added crop immediately appears in Find Produce.');

  // 2. Farmer edits quantity to 350 kg
  updateCropRecord(testMustard.id, farmer.id, { quantity: 350 });
  check = getBuyerEligibleCrops({ cropName: 'Mustard_SyncTest' });
  if (check.crops.length !== 1 || check.crops[0].quantity !== 350) {
    throw new Error('FAIL: Find Produce did not reflect updated quantity!');
  }
  console.log('✓ Verified: Farmer edits 500 -> 350 kg, Find Produce immediately reflects 350 kg.');

  // 3. Farmer deletes crop
  deleteCropRecord(testMustard.id, farmer.id);
  check = getBuyerEligibleCrops({ cropName: 'Mustard_SyncTest' });
  if (check.crops.length !== 0) {
    throw new Error('FAIL: Deleted crop still appears in Find Produce!');
  }
  console.log('✓ Verified: Farmer removes crop, Find Produce immediately drops the listing.');

  console.log('\n=== ALL BUYER FIND PRODUCE TESTS PASSED PERFECTLY ===');
}

testFindProduce().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
