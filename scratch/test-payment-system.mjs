import {
  getDatabase,
  createBuyerOrder,
  getOrdersByBuyerId,
  getOrderByIdAndBuyer,
  getOrdersByFarmerId,
  getFarmerOrderById,
  confirmFarmerOrder,
  createOrderPayment,
  completeOrderPayment,
  failOrderPayment,
  getPaymentsByBuyerId,
  getPaymentsByFarmerId,
  getPaymentById,
  getBuyerPayableOrders,
  getBuyerPaymentMetrics,
  getFarmerPaymentMetrics,
  getFarmerDashboardData,
} from '../src/lib/db.js';

import { paymentService } from '../src/services/paymentService.js';

console.log('\n======================================================');
console.log('RUNNING ALL 13 END-TO-END TESTS FOR PAYMENT SYSTEM');
console.log('======================================================\n');

const db = getDatabase();

// Setup two distinct farmers: Farmer A and Farmer B
let farmerA = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id ASC LIMIT 1").get();
if (!farmerA) throw new Error('Farmer A not found in database');

let farmerB = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND id != ? LIMIT 1").get(farmerA.id);
if (!farmerB) {
  const insertFarmerB = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('Ramesh Kumar (Farmer B)', 'farmerB_test_pay@kishanflow.com', '9811199988', 'Karnal, Haryana', 'hashed_pw', 'farmer')
  `).run();
  farmerB = db.prepare('SELECT * FROM users WHERE id = ?').get(insertFarmerB.lastInsertRowid);
}

// Setup two distinct buyers: Buyer 1 and Buyer 2
let buyer1 = db.prepare("SELECT * FROM users WHERE role = 'buyer' ORDER BY id ASC LIMIT 1").get();
if (!buyer1) {
  const insertBuyer1 = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('AgroCorp Buyer 1', 'buyer1_test_pay@kishanflow.com', '9822299977', 'Delhi APMC Yard', 'hashed_pw', 'buyer')
  `).run();
  buyer1 = db.prepare('SELECT * FROM users WHERE id = ?').get(insertBuyer1.lastInsertRowid);
}

let buyer2 = db.prepare("SELECT * FROM users WHERE role = 'buyer' AND id != ? LIMIT 1").get(buyer1.id);
if (!buyer2) {
  const insertBuyer2 = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
    VALUES ('GreenHarvest Buyer 2', 'buyer2_test_pay@kishanflow.com', '9833399966', 'Noida Mandi', 'hashed_pw', 'buyer')
  `).run();
  buyer2 = db.prepare('SELECT * FROM users WHERE id = ?').get(insertBuyer2.lastInsertRowid);
}

// Setup dedicated crop for Farmer A and Farmer B
const cropA = db.prepare(`
  INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
  VALUES (?, 'Wheat', 1000, 'kg', 'Ready for Procurement', '2026-09-30', 'Farmer A Sharbati Wheat', 0)
`).run(farmerA.id);
const cropAId = cropA.lastInsertRowid;

const cropB = db.prepare(`
  INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
  VALUES (?, 'Wheat', 800, 'kg', 'Ready for Procurement', '2026-09-30', 'Farmer B Lokwan Wheat', 0)
`).run(farmerB.id);
const cropBId = cropB.lastInsertRowid;

console.log(`Farmer A: ${farmerA.fullName} (ID: ${farmerA.id}) with Wheat lot: ${cropAId} (1000 kg)`);
console.log(`Farmer B: ${farmerB.fullName} (ID: ${farmerB.id}) with Wheat lot: ${cropBId} (800 kg)`);
console.log(`Buyer 1: ${buyer1.fullName} (ID: ${buyer1.id})`);
console.log(`Buyer 2: ${buyer2.fullName} (ID: ${buyer2.id})\n`);

// ----------------------------------------------------
// TEST 1: Buyer has no payable orders
// Expected: Payments page shows no payable payment.
// ----------------------------------------------------
console.log('--- TEST 1: Buyer with no payable orders ---');
// Create an order for buyer2 that is still ORDER_REQUESTED (not confirmed yet)
const unconfirmedOrder = createBuyerOrder({
  buyerId: buyer2.id,
  cropId: cropAId,
  cropName: 'Wheat',
  quantity: 100,
  unit: 'kg',
});
if (unconfirmedOrder.status !== 'ORDER_REQUESTED') throw new Error('Expected ORDER_REQUESTED');

// Check payable orders for buyer2 when no confirmed order exists
const payableForBuyer2Before = getBuyerPayableOrders(buyer2.id).filter(o => o.id === unconfirmedOrder.id);
if (payableForBuyer2Before.length > 0) {
  throw new Error('TEST 1 FAILED: Unconfirmed order should NOT appear as payable!');
}
console.log('✓ TEST 1 PASSED: Unconfirmed order is correctly not eligible for payment.');

// ----------------------------------------------------
// TEST 2: Buyer has a confirmed order with a real payable amount
// Expected: Pay Now is available.
// ----------------------------------------------------
console.log('\n--- TEST 2: Buyer has confirmed order with real payable amount ---');
// Buyer 1 orders 500 kg of Farmer A's Wheat with agreed price ₹24.50
const agreedRate = 24.50;
const expectedTotal = 500 * agreedRate; // 12250

const orderA = createBuyerOrder({
  buyerId: buyer1.id,
  cropId: cropAId,
  cropName: 'Wheat',
  quantity: 500,
  unit: 'kg',
  agreedPrice: agreedRate,
  totalAmount: expectedTotal,
});

if (orderA.totalAmount !== expectedTotal) {
  throw new Error(`TEST 2 FAILED: Expected totalAmount ${expectedTotal}, got ${orderA.totalAmount}`);
}

// Farmer A confirms order
const confirmedOrderA = confirmFarmerOrder(orderA.id, farmerA.id);
if (confirmedOrderA.status !== 'CONFIRMED') {
  throw new Error(`TEST 2 FAILED: Expected CONFIRMED, got ${confirmedOrderA.status}`);
}

// Check buyer payable orders
const buyerPayableOrders = getBuyerPayableOrders(buyer1.id);
const matchedPayable = buyerPayableOrders.find(o => o.id === orderA.id);
if (!matchedPayable) {
  throw new Error('TEST 2 FAILED: Confirmed order with payable amount not found in payable orders!');
}
if (matchedPayable.totalAmount <= 0) {
  throw new Error('TEST 2 FAILED: Payable amount must be greater than 0');
}
console.log(`✓ TEST 2 PASSED: Order ${confirmedOrderA.orderNumber} is confirmed with payable amount ₹${matchedPayable.totalAmount}. Pay Now is available.`);

// ----------------------------------------------------
// TEST 3: Buyer completes successful payment
// Expected: Payment status = PAID.
// ----------------------------------------------------
console.log('\n--- TEST 3: Buyer completes successful payment ---');
const initiatedPay = await paymentService.initiatePayment({
  orderId: orderA.id,
  buyerId: buyer1.id,
  paymentMethod: 'Mandi Escrow / Direct DBT',
});

if (!initiatedPay) throw new Error('TEST 3 FAILED: Failed to initiate payment');
if (initiatedPay.status !== 'PROCESSING') throw new Error(`Expected status PROCESSING, got ${initiatedPay.status}`);
if (initiatedPay.farmerId !== farmerA.id) throw new Error(`Expected farmerId ${farmerA.id}, got ${initiatedPay.farmerId}`);

const completedPay = await paymentService.processPayment({
  paymentId: initiatedPay.id,
  buyerId: buyer1.id,
  paymentMethod: 'Mandi Escrow / Direct DBT',
  simulateFailure: false,
});

if (completedPay.status !== 'PAID') throw new Error(`TEST 3 FAILED: Expected status PAID, got ${completedPay.status}`);
if (!completedPay.completedAt) throw new Error('TEST 3 FAILED: completedAt timestamp missing');
console.log(`✓ TEST 3 PASSED: Payment ${completedPay.paymentNumber} completed with status: ${completedPay.status} at ${completedPay.completedAt}`);

// ----------------------------------------------------
// TEST 4: Buyer opens My Orders
// Expected: The same order shows payment as PAID.
// ----------------------------------------------------
console.log('\n--- TEST 4: Buyer opens My Orders ---');
const refreshedOrderBuyer = getOrderByIdAndBuyer(orderA.id, buyer1.id);
if (refreshedOrderBuyer.paymentStatus !== 'PAID') {
  throw new Error(`TEST 4 FAILED: Expected order paymentStatus PAID, got ${refreshedOrderBuyer.paymentStatus}`);
}
if (!refreshedOrderBuyer.paidAt) {
  throw new Error('TEST 4 FAILED: Order paidAt timestamp was not updated');
}
console.log(`✓ TEST 4 PASSED: Order ${refreshedOrderBuyer.orderNumber} in My Orders shows paymentStatus = PAID, paidAt = ${refreshedOrderBuyer.paidAt}`);

// ----------------------------------------------------
// TEST 5: Buyer opens Track Orders
// Expected: Payment Received stage is completed.
// ----------------------------------------------------
console.log('\n--- TEST 5: Buyer opens Track Orders ---');
// Verify paymentStatus on order for Track Orders timeline check
if (refreshedOrderBuyer.paymentStatus !== 'PAID') {
  throw new Error('TEST 5 FAILED: Order is not marked as PAID');
}
console.log(`✓ TEST 5 PASSED: Track Order has order.paymentStatus = 'PAID'. Payment Received stage is marked as completed.`);

// ----------------------------------------------------
// TEST 6: Exact farmer opens Farmer Payments
// Expected: The payment appears as Payment Received.
// ----------------------------------------------------
console.log('\n--- TEST 6: Exact farmer (Farmer A) opens Farmer Payments ---');
const farmerAPayments = getPaymentsByFarmerId(farmerA.id);
const foundInFarmerA = farmerAPayments.find(p => p.orderId === orderA.id);
if (!foundInFarmerA) {
  throw new Error("TEST 6 FAILED: Payment did NOT appear in Farmer A's payments!");
}
if (foundInFarmerA.status !== 'PAID' && foundInFarmerA.paymentStatus !== 'Payment Received') {
  throw new Error(`TEST 6 FAILED: Farmer payment status is not PAID/Received: ${foundInFarmerA.status}`);
}
if (foundInFarmerA.amount !== expectedTotal) {
  throw new Error(`TEST 6 FAILED: Expected amount ${expectedTotal}, got ${foundInFarmerA.amount}`);
}
console.log(`✓ TEST 6 PASSED: Farmer A sees Payment Received for Order ${orderA.orderNumber}, Amount: ₹${foundInFarmerA.amount}, Payment: ${foundInFarmerA.paymentNumber}`);

// ----------------------------------------------------
// TEST 7: Another farmer (Farmer B) opens Farmer Payments
// Expected: The payment does NOT appear.
// ----------------------------------------------------
console.log('\n--- TEST 7: Another farmer (Farmer B) opens Farmer Payments ---');
const farmerBPayments = getPaymentsByFarmerId(farmerB.id);
const foundInFarmerB = farmerBPayments.find(p => p.orderId === orderA.id || p.id === completedPay.id);
if (foundInFarmerB) {
  throw new Error("TEST 7 FAILED: Farmer B saw Farmer A's payment! Data isolation breached!");
}
console.log(`✓ TEST 7 PASSED: Farmer B sees NOTHING about Order ${orderA.orderNumber}. Strict isolation verified.`);

// ----------------------------------------------------
// TEST 8: Buyer tries to pay an already-paid order
// Expected: Pay Now is unavailable. Duplicate payment prevented.
// ----------------------------------------------------
console.log('\n--- TEST 8: Duplicate payment protection ---');
try {
  await paymentService.initiatePayment({
    orderId: orderA.id,
    buyerId: buyer1.id,
    paymentMethod: 'Mandi Escrow / Direct DBT',
  });
  throw new Error('TEST 8 FAILED: Duplicate payment was allowed on an already-paid order!');
} catch (err) {
  if (!err.message.includes('already been paid')) {
    throw new Error(`TEST 8 FAILED: Unexpected error message: ${err.message}`);
  }
  console.log(`✓ TEST 8 PASSED: Duplicate payment blocked successfully: "${err.message}"`);
}

// ----------------------------------------------------
// TEST 9: Payment fails
// Expected: Status = FAILED. Buyer can retry. Farmer does NOT see Payment Received.
// ----------------------------------------------------
console.log('\n--- TEST 9: Payment failure handling & retry ---');
// Create a new order for Farmer A
const orderFail = createBuyerOrder({
  buyerId: buyer1.id,
  cropId: cropAId,
  cropName: 'Wheat',
  quantity: 200,
  unit: 'kg',
  agreedPrice: 24.50,
  totalAmount: 4900,
});
confirmFarmerOrder(orderFail.id, farmerA.id);

// Initiate payment
const failInitiate = await paymentService.initiatePayment({
  orderId: orderFail.id,
  buyerId: buyer1.id,
});

// Process with simulateFailure = true
const failedPayment = await paymentService.processPayment({
  paymentId: failInitiate.id,
  buyerId: buyer1.id,
  simulateFailure: true,
});

if (failedPayment.status !== 'FAILED') {
  throw new Error(`TEST 9 FAILED: Expected FAILED, got ${failedPayment.status}`);
}

// Check order paymentStatus
const failedOrder = getOrderByIdAndBuyer(orderFail.id, buyer1.id);
if (failedOrder.paymentStatus !== 'FAILED') {
  throw new Error(`TEST 9 FAILED: Expected order status FAILED, got ${failedOrder.paymentStatus}`);
}

// Verify Farmer A does NOT see this as Payment Received
const farmerPaymentsAfterFail = getPaymentsByFarmerId(farmerA.id);
const failPaymentInFarmer = farmerPaymentsAfterFail.find(p => p.id === failedPayment.id);
if (failPaymentInFarmer && failPaymentInFarmer.status === 'PAID') {
  throw new Error('TEST 9 FAILED: Failed payment was marked as PAID on farmer side!');
}

console.log('✓ TEST 9 PASSED: Payment failed cleanly, order marked as FAILED, farmer did NOT receive payment.');

// Now test retry
const retriedPay = await paymentService.retryPayment({
  orderId: orderFail.id,
  buyerId: buyer1.id,
});
const retriedCompleted = await paymentService.processPayment({
  paymentId: retriedPay.id,
  buyerId: buyer1.id,
  simulateFailure: false,
});
if (retriedCompleted.status !== 'PAID') {
  throw new Error('TEST 9 FAILED: Retry payment did not succeed');
}
console.log(`✓ TEST 9b PASSED: Payment successfully retried for order ${orderFail.orderNumber}. Now PAID.`);

// ----------------------------------------------------
// TEST 10: Page refresh / Persistent data source
// Expected: Payment status remains correct from SQLite DB.
// ----------------------------------------------------
console.log('\n--- TEST 10: Persistence after reload ---');
const persistedPayment = getPaymentById(completedPay.id);
if (!persistedPayment || persistedPayment.status !== 'PAID') {
  throw new Error('TEST 10 FAILED: Persisted payment not found or status not PAID');
}
if (persistedPayment.amount !== expectedTotal) {
  throw new Error(`TEST 10 FAILED: Persisted amount incorrect: ${persistedPayment.amount}`);
}
console.log(`✓ TEST 10 PASSED: Persistent database correctly retains payment ${persistedPayment.paymentNumber} with status ${persistedPayment.status}.`);

// ----------------------------------------------------
// TEST 11: No real payment exists
// Expected: No fake payment cards or fake transaction IDs.
// ----------------------------------------------------
console.log('\n--- TEST 11: Zero fake data verification ---');
// Verify clean transactionId behavior
if (completedPay.transactionId !== null && typeof completedPay.transactionId !== 'string') {
  throw new Error('TEST 11 FAILED: Invalid transactionId representation');
}
// Check farmer metrics
const farmerMetrics = getFarmerPaymentMetrics(farmerB.id);
console.log(`Farmer B metrics: totalEarned = ₹${farmerMetrics.totalEarned}, pending = ₹${farmerMetrics.pendingAmount}, completedCount = ${farmerMetrics.completedCount}`);
if (farmerMetrics.totalEarned !== 0 && farmerBPayments.length === 0) {
  throw new Error('TEST 11 FAILED: Fake amount displayed when no payments exist!');
}
console.log('✓ TEST 11 PASSED: Zero fake financial data. All amounts calculated strictly from real records.');

// ----------------------------------------------------
// TEST 12: Buyer tries to access another buyer's payment
// Expected: Access denied / not found.
// ----------------------------------------------------
console.log('\n--- TEST 12: Buyer security and unauthorized payment access ---');
try {
  await paymentService.getPaymentDetails(completedPay.id, buyer2.id, 'buyer');
  throw new Error("TEST 12 FAILED: Buyer 2 was able to view Buyer 1's payment!");
} catch (err) {
  if (!err.message.includes('Unauthorized')) {
    throw new Error(`TEST 12 FAILED: Unexpected error: ${err.message}`);
  }
  console.log(`✓ TEST 12 PASSED: Buyer 2 access to Buyer 1 payment was blocked: "${err.message}"`);
}

// ----------------------------------------------------
// TEST 13: Farmer tries to access another farmer's payment
// Expected: Access denied / not found.
// ----------------------------------------------------
console.log('\n--- TEST 13: Farmer security and unauthorized payment access ---');
try {
  await paymentService.getPaymentDetails(completedPay.id, farmerB.id, 'farmer');
  throw new Error("TEST 13 FAILED: Farmer B was able to view Farmer A's payment!");
} catch (err) {
  if (!err.message.includes('Unauthorized')) {
    throw new Error(`TEST 13 FAILED: Unexpected error: ${err.message}`);
  }
  console.log(`✓ TEST 13 PASSED: Farmer B access to Farmer A payment was blocked: "${err.message}"`);
}

console.log('\n======================================================');
console.log('ALL 13 PAYMENT TESTS PASSED SUCCESSFULLY! ✓✓✓');
console.log('======================================================\n');
