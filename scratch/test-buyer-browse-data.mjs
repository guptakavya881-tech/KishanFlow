import { getDatabase, createCropRecord, updateCropRecord, deleteCropRecord, getBuyerEligibleCrops } from '../src/lib/db.js';

async function runVerification() {
  console.log('=== VERIFYING BUYER BROWSE & REAL FARMER CROP INTEGRATION ===\n');
  const db = getDatabase();

  // Test 1: Query API output via HTTP
  console.log('--- Test 1: Buyer Crops API ---');
  const res = await fetch('http://localhost:3000/api/buyer/crops');
  const json = await res.json();

  if (!json.success) {
    throw new Error(`API failed: ${json.error}`);
  }

  const { crops, availableCropNames, availableLocations, totalCount } = json.data;
  console.log(`✓ Total eligible crops returned: ${crops.length}`);
  console.log(`✓ Available crop filter names: [ ${availableCropNames.join(', ')} ]`);
  console.log(`✓ Available locations: [ ${availableLocations.join(', ')} ]`);

  // Verify no 'Growing' crop appears
  const growingCrops = crops.filter(c => c.harvestStatus === 'Growing');
  if (growingCrops.length > 0) {
    throw new Error(`FAIL: Found ${growingCrops.length} crops with status 'Growing' in buyer browse!`);
  }
  console.log('✓ Verified: ZERO crops with status "Growing" appear in Buyer browse.');

  // Verify privacy: no mobile, passwordHash, userId
  for (const crop of crops) {
    if (crop.mobile || crop.passwordHash || crop.userId || crop.address) {
      throw new Error(`FAIL: Private farmer data exposed in crop ID ${crop.id}!`);
    }
  }
  console.log('✓ Verified: ZERO private farmer details exposed (no mobile, password, user ID).');

  // Test 2: Verify Buyer Dashboard API
  console.log('\n--- Test 2: Buyer Dashboard API ---');
  const dashRes = await fetch('http://localhost:3000/api/buyer/dashboard');
  const dashJson = await dashRes.json();
  if (!dashJson.success) {
    throw new Error(`Dashboard API failed: ${dashJson.error}`);
  }
  const { stats, availableCrops, recentOrders, notifications } = dashJson.data;
  console.log('Dashboard Stats:');
  console.log(`- Available Produce: ${stats.availableProduce} (Must match ${totalCount})`);
  console.log(`- Active Orders: ${stats.activeOrders}`);
  console.log(`- Ready for Delivery: ${stats.readyForDelivery}`);
  console.log(`- Pending Payments: ₹${stats.pendingPayments}`);

  if (stats.availableProduce !== totalCount) {
    throw new Error(`FAIL: Stats availableProduce (${stats.availableProduce}) != totalCount (${totalCount})`);
  }
  console.log('✓ Verified: Dashboard stats accurately reflect real DB state.');

  // Test 3: Farmer Crop Lifecycle Sync Test (Add -> Edit -> Status Check -> Delete)
  console.log('\n--- Test 3: Real Farmer Sync Lifecycle ---');
  // Find a farmer ID
  const farmer = db.prepare("SELECT id, fullName FROM users WHERE role = 'farmer' LIMIT 1").get();
  console.log(`Using real farmer: ${farmer.fullName} (ID: ${farmer.id})`);

  // 1. Farmer adds: TestCropX with 1500 kg, Ready for Procurement
  const testCrop = createCropRecord({
    userId: farmer.id,
    name: 'TestCropX_SpecialWheat',
    quantity: 1500,
    unit: 'kg',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '15 October 2026',
    notes: 'Premium test lot created by real farmer'
  });
  console.log(`Created new crop ID: ${testCrop.id} (${testCrop.name}, ${testCrop.quantity} kg)`);

  // Verify buyer immediately sees TestCropX
  let buyerCheck = getBuyerEligibleCrops({ cropName: 'TestCropX_SpecialWheat' });
  if (buyerCheck.crops.length !== 1 || buyerCheck.crops[0].quantity !== 1500) {
    throw new Error('FAIL: Buyer did not see newly created farmer crop!');
  }
  console.log('✓ Verified: Buyer immediately sees new farmer crop (1500 kg, Ready for Procurement).');

  // 2. Farmer edits quantity: 1500 -> 950 kg
  updateCropRecord(testCrop.id, farmer.id, { quantity: 950 });
  buyerCheck = getBuyerEligibleCrops({ cropName: 'TestCropX_SpecialWheat' });
  if (buyerCheck.crops.length !== 1 || buyerCheck.crops[0].quantity !== 950) {
    throw new Error('FAIL: Buyer did not see updated crop quantity!');
  }
  console.log('✓ Verified: Farmer edits 1500 kg -> 950 kg, Buyer immediately sees 950 kg.');

  // 3. Farmer changes status to Growing -> Buyer should NOT see it
  updateCropRecord(testCrop.id, farmer.id, { harvestStatus: 'Growing' });
  buyerCheck = getBuyerEligibleCrops({ cropName: 'TestCropX_SpecialWheat' });
  if (buyerCheck.crops.length !== 0) {
    throw new Error('FAIL: Growing crop appeared in Buyer browse!');
  }
  console.log('✓ Verified: When crop status is set to Growing, Buyer does NOT see it.');

  // 4. Farmer changes status back to Nearly Ready -> Buyer sees under Coming Soon
  updateCropRecord(testCrop.id, farmer.id, { harvestStatus: 'Nearly Ready' });
  buyerCheck = getBuyerEligibleCrops({ cropName: 'TestCropX_SpecialWheat' });
  if (buyerCheck.crops.length !== 1 || buyerCheck.crops[0].availabilityStatus !== 'Coming Soon') {
    throw new Error('FAIL: Nearly Ready crop did not show as Coming Soon!');
  }
  console.log('✓ Verified: When crop status is Nearly Ready, Buyer sees it as "Coming Soon".');

  // 5. Farmer deletes the crop -> Buyer should no longer see it
  deleteCropRecord(testCrop.id, farmer.id);
  buyerCheck = getBuyerEligibleCrops({ cropName: 'TestCropX_SpecialWheat' });
  if (buyerCheck.crops.length !== 0) {
    throw new Error('FAIL: Deleted crop still appeared in Buyer browse!');
  }
  console.log('✓ Verified: Farmer removes crop, Buyer no longer sees it.');

  console.log('\n=== ALL VERIFICATION CHECKS PASSED PERFECTLY ===');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
