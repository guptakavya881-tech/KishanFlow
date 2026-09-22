import {
  getDatabase,
  createBuyerOrder,
  getOrdersByBuyerId,
  getOrderByIdAndBuyer,
  getOrdersByFarmerId,
  getFarmerOrderById,
  getFarmerOrderMetrics,
  confirmFarmerOrder,
  getBuyerOrderMetrics,
} from '../src/lib/db.js';

console.log('\n=== RUNNING 10 VERIFICATION TESTS FOR TWO-SIDED ORDER LIFECYCLE ===\n');

const db = getDatabase();

// 1. Setup two distinct test farmers and one test buyer
const farmerA = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id ASC LIMIT 1").get();
if (!farmerA) throw new Error('No farmer found in database');

// Ensure a second farmer exists for isolation testing
let farmerB = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND id != ? LIMIT 1").get(farmerA.id);
if (!farmerB) {
  const insertFarmerB = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('Ramesh Kumar (Farmer B)', 'farmerB_test@kishanflow.com', '9811122233', 'Karnal, Haryana', 'hashed_pw', 'farmer')
  `).run();
  farmerB = db.prepare('SELECT * FROM users WHERE id = ?').get(insertFarmerB.lastInsertRowid);
}

// Ensure two distinct buyers exist
let buyer1 = db.prepare("SELECT * FROM users WHERE role = 'buyer' ORDER BY id ASC LIMIT 1").get();
if (!buyer1) {
  const insertBuyer1 = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('AgroCorp Buyer 1', 'buyer1_test@kishanflow.com', '9822233344', 'Delhi APMC Yard', 'hashed_pw', 'buyer')
  `).run();
  buyer1 = db.prepare('SELECT * FROM users WHERE id = ?').get(insertBuyer1.lastInsertRowid);
}

let buyer2 = db.prepare("SELECT * FROM users WHERE role = 'buyer' AND id != ? LIMIT 1").get(buyer1.id);
if (!buyer2) {
  const insertBuyer2 = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('GreenHarvest Buyer 2', 'buyer2_test@kishanflow.com', '9833344455', 'Noida Mandi', 'hashed_pw', 'buyer')
  `).run();
  buyer2 = db.prepare('SELECT * FROM users WHERE id = ?').get(insertBuyer2.lastInsertRowid);
}

// 2. Setup crops for Farmer A and Farmer B (Both have Wheat!)
const cropA = db.prepare(`
  INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
  VALUES (?, 'Wheat', 1000, 'kg', 'Ready for Procurement', '2026-09-25', 'Farmer A Grade A Wheat', 0)
`).run(farmerA.id);
const cropAId = cropA.lastInsertRowid;

const cropB = db.prepare(`
  INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
  VALUES (?, 'Wheat', 700, 'kg', 'Ready for Procurement', '2026-09-28', 'Farmer B Organic Wheat', 0)
`).run(farmerB.id);
const cropBId = cropB.lastInsertRowid;

console.log(`Farmer A: ${farmerA.fullName} (ID: ${farmerA.id}) with Wheat (${cropAId}): 1000 kg`);
console.log(`Farmer B: ${farmerB.fullName} (ID: ${farmerB.id}) with Wheat (${cropBId}): 700 kg`);
console.log(`Buyer 1: ${buyer1.fullName} (ID: ${buyer1.id})`);
console.log(`Buyer 2: ${buyer2.fullName} (ID: ${buyer2.id})\n`);

// ----------------------------------------------------
// TEST 1: Buyer places order for Farmer A's Wheat
// ----------------------------------------------------
console.log('--- TEST 1: Buyer places order for Farmer A Wheat (500 kg) ---');
const order1 = createBuyerOrder({
  buyerId: buyer1.id,
  cropId: cropAId,
  cropName: 'Wheat',
  quantity: 500,
  unit: 'kg',
  procurementCentre: 'Meerut Mandi Samiti',
});

if (!order1) throw new Error('Failed to create order1');
if (order1.buyerId !== buyer1.id) throw new Error(`Expected buyerId ${buyer1.id}, got ${order1.buyerId}`);
if (order1.farmerId !== farmerA.id) throw new Error(`Expected farmerId ${farmerA.id}, got ${order1.farmerId}`);
if (order1.cropId !== cropAId) throw new Error(`Expected cropId ${cropAId}, got ${order1.cropId}`);
if (order1.status !== 'ORDER_REQUESTED') throw new Error(`Expected status ORDER_REQUESTED, got ${order1.status}`);

console.log(`✓ Order Created: ${order1.orderNumber}`);
console.log(`✓ buyerId: ${order1.buyerId}, farmerId: ${order1.farmerId}, cropId: ${order1.cropId}`);
console.log(`✓ Status: ${order1.status}`);

// ----------------------------------------------------
// TEST 2: Farmer A queries orders (Sees order request)
// ----------------------------------------------------
console.log('\n--- TEST 2: Farmer A logs in and checks orders ---');
const farmerAOrders = getOrdersByFarmerId(farmerA.id);
const foundInFarmerA = farmerAOrders.find((o) => o.id === order1.id || o.orderNumber === order1.orderNumber);
if (!foundInFarmerA) throw new Error("Farmer A did NOT receive the order request!");
if (foundInFarmerA.status !== 'ORDER_REQUESTED') throw new Error(`Unexpected status for Farmer A: ${foundInFarmerA.status}`);
console.log(`✓ Farmer A successfully sees order ${foundInFarmerA.orderNumber} with status: ${foundInFarmerA.status}`);

// ----------------------------------------------------
// TEST 3: Farmer B queries orders (Does NOT see Farmer A's order)
// ----------------------------------------------------
console.log("\n--- TEST 3: Farmer B logs in (Must NOT see Farmer A's order) ---");
const farmerBOrders = getOrdersByFarmerId(farmerB.id);
const foundInFarmerB = farmerBOrders.find((o) => o.id === order1.id || o.orderNumber === order1.orderNumber);
if (foundInFarmerB) throw new Error("SECURITY FAILURE: Farmer B can see Farmer A's order!");
console.log(`✓ Verified: Farmer B sees 0 orders belonging to Farmer A.`);

// Check unauthorized confirmation attempt by Farmer B
try {
  confirmFarmerOrder(order1.id, farmerB.id);
  throw new Error("SECURITY FAILURE: Farmer B was able to confirm Farmer A's order!");
} catch (err) {
  if (err.message.includes('unauthorized') || err.message.includes('not found')) {
    console.log(`✓ Verified: Farmer B cannot confirm Farmer A's order (${err.message}).`);
  } else {
    throw err;
  }
}

// ----------------------------------------------------
// TEST 4: Farmer A confirms order
// ----------------------------------------------------
console.log('\n--- TEST 4: Farmer A clicks Confirm Order ---');
const confirmedOrder = confirmFarmerOrder(order1.id, farmerA.id);
if (confirmedOrder.status !== 'CONFIRMED') throw new Error(`Expected status CONFIRMED, got ${confirmedOrder.status}`);

const historyConfirm = confirmedOrder.statusHistory.find((h) => h.status === 'CONFIRMED');
if (!historyConfirm) throw new Error("Status history did not record CONFIRMED event!");
if (historyConfirm.actor !== farmerA.id) throw new Error(`Expected actor ${farmerA.id}, got ${historyConfirm.actor}`);
console.log(`✓ Order status updated to: ${confirmedOrder.status}`);
console.log(`✓ History event: ${JSON.stringify(historyConfirm)}`);

// ----------------------------------------------------
// TEST 5: Buyer opens Track Orders (Shows Confirmed)
// ----------------------------------------------------
console.log('\n--- TEST 5: Buyer opens Track Orders ---');
const buyerTrackOrder = getOrderByIdAndBuyer(order1.id, buyer1.id);
if (!buyerTrackOrder) throw new Error("Buyer could not retrieve their order!");
if (buyerTrackOrder.status !== 'CONFIRMED') throw new Error(`Expected buyer order status CONFIRMED, got ${buyerTrackOrder.status}`);

const requestStage = buyerTrackOrder.statusHistory.find((h) => h.status === 'ORDER_REQUESTED' || h.status === 'Order Placed');
const confirmStage = buyerTrackOrder.statusHistory.find((h) => h.status === 'CONFIRMED');
if (!requestStage) throw new Error("Order Request stage missing from history!");
if (!confirmStage) throw new Error("Confirmed stage missing from history!");
console.log(`✓ Order Request Created: ✓ ${requestStage.timestamp}`);
console.log(`✓ Order Confirmed: ✓ ${confirmStage.timestamp}`);
console.log(`✓ Current Status: ${buyerTrackOrder.status}`);

// ----------------------------------------------------
// TEST 6: Buyer refreshes page (Order remains Confirmed)
// ----------------------------------------------------
console.log('\n--- TEST 6: Buyer refreshes page ---');
const refreshedOrder = getOrderByIdAndBuyer(order1.orderNumber, buyer1.id);
if (refreshedOrder.status !== 'CONFIRMED') throw new Error("Order did not persist CONFIRMED status!");
console.log(`✓ Verified: Order persistently remains ${refreshedOrder.status}`);

// ----------------------------------------------------
// TEST 7: Another farmer has same crop (Wheat), Buyer orders from Farmer B
// ----------------------------------------------------
console.log('\n--- TEST 7: Buyer orders from Farmer B Wheat listing (300 kg) ---');
const order2 = createBuyerOrder({
  buyerId: buyer1.id,
  cropId: cropBId,
  cropName: 'Wheat',
  quantity: 300,
  unit: 'kg',
});

if (order2.farmerId !== farmerB.id) throw new Error(`Expected farmerId ${farmerB.id}, got ${order2.farmerId}`);
if (order2.cropId !== cropBId) throw new Error(`Expected cropId ${cropBId}, got ${order2.cropId}`);

const farmerAOrdersCheck = getOrdersByFarmerId(farmerA.id);
if (farmerAOrdersCheck.some((o) => o.id === order2.id)) {
  throw new Error("Farmer A mistakenly received order for Farmer B's listing!");
}

const farmerBOrdersCheck = getOrdersByFarmerId(farmerB.id);
if (!farmerBOrdersCheck.some((o) => o.id === order2.id)) {
  throw new Error("Farmer B did not receive the order for their listing!");
}
console.log(`✓ Verified: Order for Farmer B's Wheat listing routed strictly to Farmer B (${farmerB.fullName}). Farmer A did NOT receive it.`);

// ----------------------------------------------------
// TEST 8: Quantity validation (Buyer requests > available)
// ----------------------------------------------------
console.log('\n--- TEST 8: Buyer requests more quantity than available (1500 kg vs 1000 kg) ---');
try {
  createBuyerOrder({
    buyerId: buyer1.id,
    cropId: cropAId,
    cropName: 'Wheat',
    quantity: 1500,
    unit: 'kg',
  });
  throw new Error("Validation failure: Oversell order was permitted!");
} catch (err) {
  if (err.message === 'Requested quantity exceeds available quantity.') {
    console.log(`✓ Order creation blocked with exact message: "${err.message}"`);
  } else {
    throw new Error(`Unexpected error message: "${err.message}"`);
  }
}

// ----------------------------------------------------
// TEST 9: Cross-buyer access security
// ----------------------------------------------------
console.log('\n--- TEST 9: Cross-buyer access security ---');
const crossBuyerQuery = getOrderByIdAndBuyer(order1.id, buyer2.id);
if (crossBuyerQuery !== null) {
  throw new Error("SECURITY FAILURE: Buyer 2 was able to view Buyer 1's order!");
}
console.log('✓ Verified: Buyer 2 received null when attempting to query Buyer 1 order.');

// ----------------------------------------------------
// TEST 10: Buyer My Orders status update verification
// ----------------------------------------------------
console.log('\n--- TEST 10: Buyer My Orders status reflection ---');
const buyer1OrdersList = getOrdersByBuyerId(buyer1.id);
const verifiedOrder1 = buyer1OrdersList.find((o) => o.id === order1.id);
if (!verifiedOrder1) throw new Error("Order 1 missing from Buyer 1 orders list!");
if (verifiedOrder1.status !== 'CONFIRMED') throw new Error(`Expected Confirmed status in My Orders, got ${verifiedOrder1.status}`);

const buyerMetrics = getBuyerOrderMetrics(buyer1.id);
console.log(`✓ Buyer My Orders reflects status: ${verifiedOrder1.status}`);
console.log(`✓ Buyer Order Metrics: total=${buyerMetrics.totalOrders}, active=${buyerMetrics.activeOrders}, pending=${buyerMetrics.pendingRequests}`);

console.log('\n====================================================');
console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
console.log('====================================================\n');
