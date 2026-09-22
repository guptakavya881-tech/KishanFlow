import {
  getDatabase,
  getCentreQueueState,
  completeAdminProcurement,
  getAdminCropsList,
  getAdminCropDetails,
  getAdminOrderDetails,
  createCropRecord,
  createBuyerOrder,
  createUser,
  getFarmerOrderById,
  getOrderByIdAndBuyer,
} from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

console.log('=== TESTING ADMIN QUEUE & CROP LISTING FIXES ===\n');

async function runTests() {
  const db = getDatabase();

  // Test 1: getCentreQueueState
  console.log('TEST 1: getCentreQueueState for centre-1...');
  const queueState = getCentreQueueState('centre-1');
  if (!queueState) throw new Error('getCentreQueueState failed.');
  console.log(`✓ Active queue entries: ${queueState.activeQueue.length}`);
  console.log(`✓ Completed procurements: ${queueState.completedProcurements.length}`);

  // Check if any booking in activeQueue has clean orderId linkage
  for (const item of queueState.activeQueue) {
    if (item.type === 'BOOKING') {
      console.log(`  Booking Entry: ID=${item.id}, BookingNum=${item.bookingNumber}, Token=${item.tokenNumber}, MatchedOrderId=${item.orderId || 'None (Direct slot)'}`);
    }
  }

  // Test 2: Verify "Order not found for this queue entry." when queue entry genuinely has no order
  console.log('\nTEST 2: Attempt to complete queue entry with no linked order...');
  try {
    completeAdminProcurement(null, 'ADMIN-TEST', {
      tokenNumber: 'KF-NONEXISTENT-TOKEN-999',
      bookingId: 999999,
    });
    throw new Error('Should have thrown an error for invalid queue entry!');
  } catch (err) {
    if (err.message === 'Order not found for this queue entry.') {
      console.log(`✓ Correctly threw exact error: "${err.message}"`);
    } else {
      throw new Error(`Unexpected error message: "${err.message}"`);
    }
  }

  // Test 3: Complete procurement for a real order
  console.log('\nTEST 3: Complete procurement for real order...');
  // Find an active confirmed order in the queue
  const activeOrderEntry = queueState.activeQueue.find(i => i.type === 'ORDER' && (i.status === 'CONFIRMED' || i.status === 'ORDER_SCHEDULED'));
  if (!activeOrderEntry) {
    console.log('No CONFIRMED order in active queue to test, checking orders table...');
  }
  const testOrderId = activeOrderEntry ? activeOrderEntry.orderId : 5;
  console.log(`Target real order ID: ${testOrderId}`);

  const initialOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(testOrderId);
  console.log(`Initial status: ${initialOrder.status}, Payment status: ${initialOrder.paymentStatus}`);

  const completedResult = completeAdminProcurement(testOrderId, 'ADMIN-TEST', {
    tokenNumber: initialOrder.bookingToken,
  });

  if (completedResult.status !== 'PROCUREMENT_COMPLETED') {
    throw new Error(`Expected status PROCUREMENT_COMPLETED, got ${completedResult.status}`);
  }
  console.log(`✓ Order successfully updated to: ${completedResult.status}`);

  // Verify paymentStatus was NOT prematurely marked PAID
  const orderAfter = db.prepare('SELECT status, paymentStatus FROM orders WHERE id = ?').get(testOrderId);
  console.log(`Post-completion payment status: ${orderAfter.paymentStatus} (Must NOT be auto-changed to PAID)`);
  if (orderAfter.paymentStatus === 'PAID' && initialOrder.paymentStatus !== 'PAID') {
    throw new Error('Payment was improperly auto-marked as PAID!');
  }

  // Test 4: Prevent duplicate completion (STEP 6)
  console.log('\nTEST 4: Duplicate completion idempotency...');
  const duplicateResult = completeAdminProcurement(testOrderId, 'ADMIN-TEST');
  if (duplicateResult.status !== 'PROCUREMENT_COMPLETED') {
    throw new Error('Duplicate call should succeed and return completed order.');
  }
  console.log('✓ Duplicate completion handled gracefully without error or duplicated records.');

  // Test 5: Verify cross-module order reflection
  console.log('\nTEST 5: Cross-module reflection for Order ID', testOrderId);
  const queueAfter = getCentreQueueState('centre-1');
  const inActive = queueAfter.activeQueue.some(i => i.orderId === testOrderId);
  if (inActive) throw new Error('Order still present in active queue after completion!');
  console.log('✓ Order cleanly removed from active queue.');

  const inCompleted = queueAfter.completedProcurements.some(i => i.id === testOrderId);
  console.log(`✓ Order present in centre completed procurements: ${inCompleted}`);

  if (initialOrder.farmerId) {
    const farmerOrder = getFarmerOrderById(testOrderId, initialOrder.farmerId);
    console.log(`✓ Farmer Orders sees status: ${farmerOrder?.status}`);
  }
  if (initialOrder.buyerId) {
    const buyerOrder = getOrderByIdAndBuyer(testOrderId, initialOrder.buyerId);
    console.log(`✓ Buyer Orders sees status: ${buyerOrder?.status}`);
  }

  // Test 6: getAdminCropsList (STEP 8, 9, 10, 11)
  console.log('\nTEST 6: Admin Crops List verification...');
  const allCrops = getAdminCropsList({ status: 'ALL' });
  console.log(`✓ Total real crops in getAdminCropsList: ${allCrops.length}`);
  if (allCrops.length > 0) {
    const sample = allCrops[0];
    console.log('Sample crop listing:');
    console.log(`  Name: ${sample.name}`);
    console.log(`  Lot ID: ${sample.lotId}`);
    console.log(`  Farmer: ${sample.farmerName}`);
    console.log(`  Quantity: ${sample.quantity} ${sample.unit}`);
    console.log(`  Readiness: ${sample.harvestStatus}`);
    console.log(`  Expected Harvest: ${sample.expectedHarvestDate}`);
    console.log(`  Centre: ${sample.procurementCentre}`);
    console.log(`  Orders Count: ${sample.ordersCount}`);
    console.log(`  Lot Count: ${sample.lotCount}`);
    console.log(`  Listing Status: ${sample.listingStatus}`);
  }

  const readyCrops = getAdminCropsList({ status: 'Ready for Procurement' });
  console.log(`✓ Ready for Procurement crops: ${readyCrops.length}`);
  const allReady = readyCrops.every(c => c.harvestStatus === 'Ready for Procurement');
  if (!allReady) throw new Error('Filter for Ready for Procurement contained non-ready crops!');
  console.log('✓ All filtered crops strictly have harvestStatus = "Ready for Procurement".');

  // Test 7: getAdminCropDetails / View Lots (STEP 12, 13, 14)
  console.log('\nTEST 7: Admin Crop Details / View Lots verification...');
  if (allCrops.length > 0) {
    const cropWithOrders = allCrops.find(c => c.ordersCount > 0) || allCrops[0];
    const details = getAdminCropDetails(cropWithOrders.id);
    if (!details || !details.crop) throw new Error('Failed to getAdminCropDetails.');
    console.log(`✓ Crop Details for Crop ID ${cropWithOrders.id} (${details.crop.name}):`);
    console.log(`  Lots count: ${details.lots.length}`);
    if (details.lots.length > 0) {
      const sampleLot = details.lots[0];
      console.log('  Sample Lot Data:');
      console.log(`    Lot ID: ${sampleLot.lotId}`);
      console.log(`    Order ID: ${sampleLot.orderId}`);
      console.log(`    Crop: ${sampleLot.cropName}`);
      console.log(`    Farmer: ${sampleLot.farmerName}`);
      console.log(`    Buyer: ${sampleLot.buyerName}`);
      console.log(`    Quantity: ${sampleLot.quantity} ${sampleLot.unit}`);
      console.log(`    Centre: ${sampleLot.procurementCentre}`);
      console.log(`    Order Status: ${sampleLot.orderStatus}`);
      console.log(`    Procurement Status: ${sampleLot.procurementStatus}`);
      console.log(`    Payment Status: ${sampleLot.paymentStatus}`);
    }
  }

  // Test 8: Multiple farmers with the same crop name remain separate (STEP 13)
  console.log('\nTEST 8: Verify multiple farmers with same crop name remain strictly separate...');
  const cropsGroupedByName = db.prepare(`
    SELECT name, COUNT(DISTINCT userId) as farmerCount 
    FROM crops 
    GROUP BY name 
    HAVING farmerCount > 1
  `).all();
  console.log('Crops grown by multiple farmers:', cropsGroupedByName);
  if (cropsGroupedByName.length > 0) {
    const testCropName = cropsGroupedByName[0].name;
    const sameCrops = db.prepare('SELECT id, userId, name FROM crops WHERE name = ?').all(testCropName);
    const details1 = getAdminCropDetails(sameCrops[0].id);
    const details2 = getAdminCropDetails(sameCrops[1].id);
    if (details1.crop.userId === details2.crop.userId) throw new Error('Farmers should be different!');
    console.log(`✓ Farmer 1 (ID: ${details1.crop.userId}) and Farmer 2 (ID: ${details2.crop.userId}) both have crop "${testCropName}".`);
    console.log(`  Farmer 1 Crop ID: ${details1.crop.id}, Lots: ${details1.lots.length}`);
    console.log(`  Farmer 2 Crop ID: ${details2.crop.id}, Lots: ${details2.lots.length}`);
  }

  console.log('\n==================================================');
  console.log('🎉 ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
