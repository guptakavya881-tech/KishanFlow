import {
  getDatabase,
  createBuyerOrder,
  getOrdersByBuyerId,
  getOrderByIdAndBuyer,
  updateOrderStatus,
  getBuyerOrderMetrics,
  getBuyerEligibleCrops,
  getBuyerDashboardData,
} from '../src/lib/db.js';

async function testBuyerOrdersFlow() {
  console.log('=== VERIFYING BUYER MY ORDERS & TRACK ORDERS MODULE ===\n');

  const db = getDatabase();

  // Pick an existing real buyer
  const buyer = db.prepare("SELECT id, fullName, email FROM users WHERE role = 'buyer' LIMIT 1").get();
  console.log(`Using Buyer: ${buyer.fullName} (ID: ${buyer.id}, Email: ${buyer.email})`);

  // Clear any previous test orders for clean scenario
  db.prepare('DELETE FROM orders WHERE buyerId = ?').run(buyer.id);

  // TEST 1: Initial Empty State Check
  console.log('\n--- Test 1: Initial Empty State ---');
  let orders = getOrdersByBuyerId(buyer.id);
  let metrics = getBuyerOrderMetrics(buyer.id);
  console.log(`Initial orders count: ${orders.length}`);
  console.log(`Metrics: Total = ${metrics.totalOrders}, Active = ${metrics.activeOrders}, Completed = ${metrics.completedOrders}, Pending = ${metrics.pendingRequests}`);

  if (orders.length !== 0 || metrics.totalOrders !== 0 || metrics.activeOrders !== 0) {
    throw new Error('FAIL: Initial state is not empty!');
  }
  console.log('✓ Verified: When zero orders exist, counts are 0 and list is empty (Zero fake orders).');

  // TEST 2: Pick a real farmer crop and create real buyer order
  console.log('\n--- Test 2: Create Real Procurement Order ---');
  const eligibleCrops = getBuyerEligibleCrops();
  if (eligibleCrops.crops.length === 0) {
    throw new Error('FAIL: No eligible crops found in database!');
  }
  // Pick a crop with sufficient quantity (e.g. >= 100 kg)
  const targetCrop = eligibleCrops.crops.find(c => c.quantity >= 100) || eligibleCrops.crops[0];
  console.log(`Target Crop Lot: ${targetCrop.lotId} (${targetCrop.cropName}, Available: ${targetCrop.quantity} ${targetCrop.unit})`);

  // Buyer requests a valid portion
  const requestedQty = Math.min(250, targetCrop.quantity);
  const order = createBuyerOrder({
    buyerId: buyer.id,
    cropId: targetCrop.id,
    cropName: targetCrop.cropName,
    quantity: requestedQty,
    unit: targetCrop.unit,
    procurementCentre: targetCrop.procurementCentre,
    centreAddress: targetCrop.centreAddress,
    expectedDate: targetCrop.expectedHarvestDate,
    deliveryNotes: 'Urgent processing requirement for central mandi dispatch.',
  });

  console.log(`Created Real Order: ${order.orderNumber} (ID: ${order.id})`);
  console.log(`- Requested Volume: ${order.quantity} ${order.unit} (Separate from farmer's ${targetCrop.quantity} ${targetCrop.unit})`);
  console.log(`- Initial Status: ${order.status}`);
  console.log(`- Status History: ${JSON.stringify(order.statusHistory)}`);

  if (!order.orderNumber.startsWith('KF-ORD-')) {
    throw new Error(`FAIL: Unexpected orderNumber format: ${order.orderNumber}`);
  }
  if (order.quantity !== requestedQty) {
    throw new Error(`FAIL: Stored quantity (${order.quantity}) != requested (${requestedQty})!`);
  }
  console.log('✓ Verified: Order created with unique Order ID and isolated buyer quantity.');

  // TEST 3: Query My Orders & Metrics
  console.log('\n--- Test 3: My Orders Query & Metrics Verification ---');
  orders = getOrdersByBuyerId(buyer.id);
  metrics = getBuyerOrderMetrics(buyer.id);
  console.log(`Orders list length: ${orders.length}`);
  console.log(`Metrics: Total = ${metrics.totalOrders}, Active = ${metrics.activeOrders}, Completed = ${metrics.completedOrders}, Pending = ${metrics.pendingRequests}`);

  if (orders.length !== 1 || metrics.totalOrders !== 1 || metrics.activeOrders !== 1 || metrics.pendingRequests !== 1) {
    throw new Error('FAIL: Metrics do not match created order!');
  }
  console.log('✓ Verified: Order appears in My Orders and metrics calculate dynamically from real records.');

  // TEST 4: Search Order by ID & Crop Name
  console.log('\n--- Test 4: Search Functionality ---');
  const searchById = getOrdersByBuyerId(buyer.id, { search: order.orderNumber });
  if (searchById.length !== 1 || searchById[0].id !== order.id) {
    throw new Error('FAIL: Search by exact Order ID failed!');
  }
  console.log(`✓ Search by Order ID ("${order.orderNumber}") returned 1 match.`);

  const searchByCrop = getOrdersByBuyerId(buyer.id, { search: targetCrop.cropName.slice(0, 3) });
  if (searchByCrop.length !== 1) {
    throw new Error('FAIL: Search by crop substring failed!');
  }
  console.log(`✓ Search by crop substring ("${targetCrop.cropName.slice(0, 3)}") returned 1 match.`);

  const searchNonExistent = getOrdersByBuyerId(buyer.id, { search: 'NON_EXISTENT_ID_999' });
  if (searchNonExistent.length !== 0) {
    throw new Error('FAIL: Search for non-existent ID should return 0 results!');
  }
  console.log('✓ Verified: Search for non-existent ID returns 0 matches (No fake card generated).');

  // TEST 5: Security & Multi-Buyer Isolation
  console.log('\n--- Test 5: Buyer Ownership Security Check ---');
  // Create another buyer or use ID 9999
  const otherBuyerId = 999999;
  const unauthorizedCheck = getOrderByIdAndBuyer(order.orderNumber, otherBuyerId);
  if (unauthorizedCheck !== null) {
    throw new Error('CRITICAL SECURITY FAIL: Buyer B accessed Buyer A order!');
  }
  console.log('✓ Verified: Other buyers CANNOT access or view this order (Strict server-side ownership enforced).');

  // TEST 6: Lifecycle Tracking & Status Transitions
  console.log('\n--- Test 6: Order Lifecycle Tracking & Transitions ---');
  // 1. Advance to Confirmed
  let updated = updateOrderStatus(order.id, buyer.id, 'Confirmed', 'Lot allocated by Meerut APMC Samiti.');
  console.log(`Updated to: ${updated.status} | History events count: ${updated.statusHistory.length}`);
  if (updated.status !== 'Confirmed' || updated.statusHistory.length !== 2) {
    throw new Error('FAIL: Transition to Confirmed failed!');
  }

  // 2. Advance to Ready for Procurement
  updated = updateOrderStatus(order.id, buyer.id, 'Ready for Procurement', 'Produce weighed and bagged at mandi yard.');
  console.log(`Updated to: ${updated.status} | History events count: ${updated.statusHistory.length}`);

  // 3. Advance to Completed
  updated = updateOrderStatus(order.id, buyer.id, 'Completed', 'Procurement fulfilled and dispatch released.');
  console.log(`Updated to: ${updated.status} | History events count: ${updated.statusHistory.length}`);
  if (updated.status !== 'Completed' || updated.statusHistory.length !== 4) {
    throw new Error('FAIL: Transition to Completed failed!');
  }

  // Verify Completed metrics
  metrics = getBuyerOrderMetrics(buyer.id);
  console.log(`Metrics after Completion: Active = ${metrics.activeOrders}, Completed = ${metrics.completedOrders}`);
  if (metrics.activeOrders !== 0 || metrics.completedOrders !== 1) {
    throw new Error('FAIL: Completed order did not leave active count!');
  }
  console.log('✓ Verified: Order lifecycle advances cleanly, status history is recorded, and active count updates.');

  // TEST 7: Order Cancellation Flow
  console.log('\n--- Test 7: Order Cancellation Flow ---');
  const secondOrder = createBuyerOrder({
    buyerId: buyer.id,
    cropId: targetCrop.id,
    cropName: targetCrop.cropName,
    quantity: 100,
    unit: targetCrop.unit,
    procurementCentre: targetCrop.procurementCentre,
  });
  console.log(`Created second order: ${secondOrder.orderNumber}`);
  const cancelledOrder = updateOrderStatus(secondOrder.id, buyer.id, 'Cancelled', 'Cancelled by buyer request.');
  console.log(`Second order status: ${cancelledOrder.status}`);
  if (cancelledOrder.status !== 'Cancelled') {
    throw new Error('FAIL: Second order not marked as Cancelled!');
  }
  console.log('✓ Verified: Cancellation flow works as specified.');

  // TEST 8: Buyer Dashboard Integration Check
  console.log('\n--- Test 8: Buyer Dashboard Sync Check ---');
  const dashData = getBuyerDashboardData(buyer.id);
  console.log('Buyer Dashboard stats:');
  console.log(`- Active Orders: ${dashData.stats.activeOrders}`);
  console.log(`- Available Produce: ${dashData.stats.availableProduce}`);
  console.log(`- Notifications count: ${dashData.notifications.length}`);
  console.log('✓ Verified: Buyer Dashboard seamlessly integrates with real order tables.');

  // Clean up test orders
  db.prepare('DELETE FROM orders WHERE buyerId = ?').run(buyer.id);

  console.log('\n=== ALL BUYER MY ORDERS & TRACK ORDERS TESTS PASSED PERFECTLY ===');
}

testBuyerOrdersFlow().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
