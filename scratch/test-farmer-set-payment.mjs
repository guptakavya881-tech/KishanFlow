/**
 * Comprehensive Verification Suite for Farmer "Set Payment" Functionality
 * Tests real SQLite DB operations and security validations
 */

import {
  getDatabase,
  createBuyerOrder,
  confirmFarmerOrder,
  setFarmerOrderPayment,
  getFarmerOrderById,
  getOrderByIdAndBuyer,
  getBuyerPayableOrders,
  getPaymentById,
  createOrderPayment,
  completeOrderPayment,
} from '../src/lib/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING FARMER SET PAYMENT VERIFICATION SUITE');
  console.log('====================================================\n');

  const db = getDatabase();

  // Step 0: Identify or create test users
  let farmerA = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
  let farmerB = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND id != ? LIMIT 1").get(farmerA?.id || 0);
  let buyerB = db.prepare("SELECT * FROM users WHERE role = 'buyer' LIMIT 1").get();

  if (!farmerA) {
    const res = db.prepare("INSERT INTO users (fullName, mobile, role, location) VALUES ('Farmer Ramesh', '9876543210', 'farmer', 'Nashik, Maharashtra')").run();
    farmerA = db.prepare("SELECT * FROM users WHERE id = ?").get(res.lastInsertRowid);
  }
  if (!farmerB) {
    const res = db.prepare("INSERT INTO users (fullName, mobile, role, location) VALUES ('Farmer Suresh', '9876543211', 'farmer', 'Pune, Maharashtra')").run();
    farmerB = db.prepare("SELECT * FROM users WHERE id = ?").get(res.lastInsertRowid);
  }
  if (!buyerB) {
    const res = db.prepare("INSERT INTO users (fullName, mobile, role, location) VALUES ('Buyer Amit', '9876543212', 'buyer', 'Mumbai, Maharashtra')").run();
    buyerB = db.prepare("SELECT * FROM users WHERE id = ?").get(res.lastInsertRowid);
  }

  console.log(`Test Farmer A: ID=${farmerA.id} (${farmerA.fullName})`);
  console.log(`Test Farmer B: ID=${farmerB.id} (${farmerB.fullName})`);
  console.log(`Test Buyer B:  ID=${buyerB.id} (${buyerB.fullName})\n`);

  // Ensure Farmer A has a registered crop
  let cropA = db.prepare("SELECT * FROM crops WHERE userId = ? AND harvestStatus IN ('Ready for Procurement', 'Nearly Ready') LIMIT 1").get(farmerA.id);
  if (!cropA) {
    const res = db.prepare(`
      INSERT INTO crops (userId, name, variety, quantity, unit, harvestStatus, expectedHarvestDate, notes)
      VALUES (?, 'Sharbati Premium Wheat', 'Grade A', 1000, 'kg', 'Ready for Procurement', 'Immediate', 'Test crop lot for payment verification')
    `).run(farmerA.id);
    cropA = db.prepare("SELECT * FROM crops WHERE id = ?").get(res.lastInsertRowid);
  }

  // TEST 1: Buyer B places order for Farmer A's produce
  console.log('--- TEST 1: Order Creation & Farmer Confirmation ---');
  const orderedQty = 250;
  const newOrder = createBuyerOrder({
    buyerId: buyerB.id,
    cropId: cropA.id,
    quantity: orderedQty,
    deliveryNotes: 'Urgent mandi pickup requested',
  });

  assert(newOrder && newOrder.id, `Order created with ID: ${newOrder.id} (${newOrder.orderNumber})`);
  assert(newOrder.status === 'ORDER_REQUESTED', `Initial order status is ORDER_REQUESTED (got: ${newOrder.status})`);
  assert(newOrder.farmerId === farmerA.id, `Order is linked to Farmer A (ID: ${farmerA.id})`);
  assert(newOrder.buyerId === buyerB.id, `Order is linked to Buyer B (ID: ${buyerB.id})`);

  // Farmer A confirms the order
  const confirmedOrder = confirmFarmerOrder(newOrder.id, farmerA.id);
  assert(confirmedOrder.status === 'CONFIRMED', `Farmer A confirms order; status is CONFIRMED (got: ${confirmedOrder.status})`);

  // TEST 2: Security check - Farmer B cannot set payment on Farmer A's order
  console.log('\n--- TEST 2: Security & Cross-Farmer Isolation ---');
  let farmerBBlocked = false;
  try {
    setFarmerOrderPayment(confirmedOrder.id, farmerB.id, {
      finalQuantity: 250,
      pricePerUnit: 30,
    });
  } catch (err) {
    farmerBBlocked = true;
    assert(
      err.message.includes('Unauthorized') || err.message.includes('own orders') || err.message.includes('access unauthorized'),
      `Farmer B blocked from setting payment on Farmer A's order (${err.message})`
    );
  }
  assert(farmerBBlocked, 'Farmer B was strictly forbidden from modifying Farmer A\'s order');

  // TEST 3: Validation checks - Negative and zero values rejected
  console.log('\n--- TEST 3: Input Validation ---');
  let invalidQtyBlocked = false;
  try {
    setFarmerOrderPayment(confirmedOrder.id, farmerA.id, {
      finalQuantity: -50,
      pricePerUnit: 28,
    });
  } catch (err) {
    invalidQtyBlocked = true;
    assert(err.message.includes('Final quantity must be a valid number greater than 0'), `Negative quantity rejected (${err.message})`);
  }
  assert(invalidQtyBlocked, 'Negative quantity was rejected');

  let invalidRateBlocked = false;
  try {
    setFarmerOrderPayment(confirmedOrder.id, farmerA.id, {
      finalQuantity: 250,
      pricePerUnit: -10,
    });
  } catch (err) {
    invalidRateBlocked = true;
    assert(err.message.includes('Price per unit must be a valid positive number'), `Negative rate rejected (${err.message})`);
  }
  assert(invalidRateBlocked, 'Negative rate was rejected');

  // TEST 4: Farmer A sets payment details
  console.log('\n--- TEST 4: Farmer A Sets Payment Details ---');
  const finalQuantity = 240; // e.g. actual weight after mandi moisture deduction
  const pricePerUnit = 28.5;  // ₹28.50 per kg
  const expectedTotal = Math.round(finalQuantity * pricePerUnit * 100) / 100; // 6840

  const paymentResult = setFarmerOrderPayment(confirmedOrder.id, farmerA.id, {
    finalQuantity,
    pricePerUnit,
    notes: 'Weighbridge slip #4829, net 240kg',
  });

  assert(paymentResult && paymentResult.order, 'Farmer set payment succeeded and returned updated order');
  assert(paymentResult.payment, 'Payment record was created/linked');

  const updatedOrder = paymentResult.order;
  const paymentRecord = paymentResult.payment;

  // IMPORTANT RULE: Payment must NOT be marked as PAID when Farmer sets payment!
  assert(
    updatedOrder.paymentStatus === 'PENDING',
    `Order paymentStatus is PENDING (got: ${updatedOrder.paymentStatus}) - NOT PAID`
  );
  assert(
    paymentRecord.status === 'PENDING',
    `Payment record status is PENDING (got: ${paymentRecord.status}) - NOT PAID`
  );
  assert(
    updatedOrder.totalAmount === expectedTotal,
    `Order totalAmount calculated correctly: ₹${updatedOrder.totalAmount} (expected ₹${expectedTotal})`
  );
  assert(
    paymentRecord.amount === expectedTotal,
    `Payment amount matches: ₹${paymentRecord.amount} (expected ₹${expectedTotal})`
  );
  assert(
    paymentRecord.quantity === finalQuantity,
    `Payment quantity is final approved quantity: ${paymentRecord.quantity} (expected ${finalQuantity})`
  );
  assert(
    paymentRecord.orderId === updatedOrder.id,
    `Payment is linked to exact orderId: ${paymentRecord.orderId}`
  );
  assert(
    paymentRecord.buyerId === buyerB.id,
    `Payment is linked to exact buyerId: ${paymentRecord.buyerId}`
  );
  assert(
    paymentRecord.farmerId === farmerA.id,
    `Payment is linked to exact farmerId: ${paymentRecord.farmerId}`
  );

  // TEST 5: Buyer view of payable orders
  console.log('\n--- TEST 5: Buyer Payable Orders View ---');
  const buyerPayable = getBuyerPayableOrders(buyerB.id);
  const foundOrder = buyerPayable.find((o) => o.id === updatedOrder.id);
  assert(foundOrder !== undefined, `Buyer B finds order ${updatedOrder.orderNumber} in payable orders`);
  assert(foundOrder.totalAmount === expectedTotal, `Buyer B sees real total amount: ₹${foundOrder.totalAmount}`);
  assert(foundOrder.paymentStatus === 'PENDING', `Buyer B sees payment status: PENDING`);
  assert(foundOrder.agreedPrice === pricePerUnit, `Buyer B sees price per unit: ₹${foundOrder.agreedPrice}`);

  // TEST 6: Farmer edits payment details before payment is made
  console.log('\n--- TEST 6: Farmer Edits Payment Details Before Payment ---');
  const updatedRate = 29.0;
  const newExpectedTotal = Math.round(finalQuantity * updatedRate * 100) / 100; // 6960
  const editResult = setFarmerOrderPayment(updatedOrder.id, farmerA.id, {
    finalQuantity,
    pricePerUnit: updatedRate,
    notes: 'Revised APMC price adjustment',
  });

  assert(editResult.order.totalAmount === newExpectedTotal, `Edited total amount is ₹${newExpectedTotal}`);
  assert(editResult.payment.id === paymentRecord.id, `Reused the SAME payment record (ID: ${editResult.payment.id})`);
  assert(editResult.payment.status === 'PENDING', `Payment remains PENDING after edit`);

  // TEST 7: Buyer completes payment
  console.log('\n--- TEST 7: Buyer Makes Payment (Flow Completion) ---');
  // Buyer initiates processing
  const processingPayment = createOrderPayment({
    orderId: updatedOrder.id,
    buyerId: buyerB.id,
    paymentMethod: 'UPI / Direct DBT',
  });
  assert(processingPayment.id === paymentRecord.id, `Payment initiation reused SAME payment record (ID: ${processingPayment.id})`);

  // Buyer completes payment
  const completedPayment = completeOrderPayment(processingPayment.id, {
    transactionId: null, // real gateway null reference as required
    method: 'UPI / Direct DBT',
  });

  assert(completedPayment.status === 'PAID', `Payment record status is now PAID (got: ${completedPayment.status})`);

  // Verify exact order record reflection
  const finalOrder = getFarmerOrderById(updatedOrder.id, farmerA.id);
  assert(finalOrder.paymentStatus === 'PAID', `Farmer sees order paymentStatus as PAID (got: ${finalOrder.paymentStatus})`);
  assert(finalOrder.paidAt !== null, `Order has paidAt timestamp recorded: ${finalOrder.paidAt}`);

  // TEST 8: Immutability - Farmer cannot edit amount after payment is PAID
  console.log('\n--- TEST 8: Immutability Once PAID ---');
  let editAfterPaidBlocked = false;
  try {
    setFarmerOrderPayment(updatedOrder.id, farmerA.id, {
      finalQuantity: 250,
      pricePerUnit: 35,
    });
  } catch (err) {
    editAfterPaidBlocked = true;
    assert(
      err.message.includes('already been completed and cannot be modified'),
      `Attempt to edit paid order blocked (${err.message})`
    );
  }
  assert(editAfterPaidBlocked, 'Farmer strictly blocked from modifying payment after order is PAID');

  // Clean up test order & payment
  console.log('\n--- Cleaning up test records ---');
  db.prepare("UPDATE orders SET paymentId = NULL WHERE id = ?").run(newOrder.id);
  db.prepare("DELETE FROM payments WHERE id = ?").run(paymentRecord.id);
  db.prepare("DELETE FROM orders WHERE id = ?").run(newOrder.id);
  console.log('Cleanup completed successfully.');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled error in test suite:', err);
  process.exit(1);
});
