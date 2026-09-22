/**
 * Full Lifecycle Test Suite for Farmer -> Supplier Input Orders
 * Tests Database Operations, State Transitions, Payment Ledger,
 * Notifications, Stock Adjustments, and Security Restrictions.
 */

import {
  getDatabase,
  createSupplierOrderForFarmer,
  confirmSupplierOrder,
  payFarmerSupplierOrder,
  markSupplierOrderDelivered,
  cancelFarmerSupplierOrder,
  updateSupplierOrderStatus,
  getFarmerSupplierOrders,
  getSupplierOrders,
} from '../src/lib/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING FARMER → SUPPLIER INPUT ORDER LIFECYCLE TEST SUITE');
  console.log('================================================================\n');

  const db = getDatabase();

  // Step 1: Find or ensure valid test Farmer, Supplier, and Supplier Product
  const farmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
  const supplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
  
  assert(farmer && farmer.id, `Test Farmer found (ID: ${farmer?.id}, Name: ${farmer?.fullName})`);
  assert(supplier && supplier.id, `Test Supplier found (ID: ${supplier?.id}, Name: ${supplier?.fullName})`);

  let product = db.prepare('SELECT * FROM supplier_products WHERE supplierId = ? AND stock >= 10 LIMIT 1').get(supplier.id);
  if (!product) {
    const insertProd = db.prepare(`
      INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
      VALUES (?, 'Organic Vermicompost', 'Fertilizers', 450, 'bag', 50, 5, 'High yield organic compost')
    `).run(supplier.id);
    product = db.prepare('SELECT * FROM supplier_products WHERE id = ?').get(insertProd.lastInsertRowid);
  }

  assert(product && product.id, `Test Supplier Product available (ID: ${product.id}, Name: "${product.name}", Stock: ${product.stock}, Price: ₹${product.price})`);

  const initialStock = Number(product.stock);
  const orderQuantity = 3;
  const expectedTotal = orderQuantity * Number(product.price);

  console.log('\n--- TEST CASE 1: Farmer Places Supplier Input Order ---');
  const order = createSupplierOrderForFarmer(farmer.id, {
    productId: product.id,
    quantity: orderQuantity,
    deliveryAddress: 'Nashik Central Mandi Yard, Gate 2',
  });

  assert(order && order.id, `Order created with ID: ${order.id}, Order Number: ${order.orderNumber}`);
  assert(order.status === 'PENDING', `Initial order status is 'PENDING' (Actual: ${order.status})`);
  assert(order.paymentStatus === 'UNPAID', `Initial paymentStatus is 'UNPAID' (Actual: ${order.paymentStatus})`);
  assert(Number(order.totalAmount) === expectedTotal, `Total amount correctly calculated as ₹${expectedTotal} (Actual: ₹${order.totalAmount})`);

  const productAfterOrder = db.prepare('SELECT stock FROM supplier_products WHERE id = ?').get(product.id);
  assert(productAfterOrder.stock === initialStock - orderQuantity, `Inventory stock reduced by ${orderQuantity} (Before: ${initialStock}, After: ${productAfterOrder.stock})`);

  // Check supplier notification
  const supplierNotif = db.prepare("SELECT * FROM notifications WHERE userId = ? AND description LIKE ? ORDER BY id DESC LIMIT 1")
    .get(supplier.id, `%${order.orderNumber}%`);
  assert(supplierNotif !== undefined, `Supplier notification dispatched for new order #${order.orderNumber}`);

  console.log('\n--- TEST CASE 2: Invalid Premature Payment / Delivery Attempts ---');
  // Attempt 1: Farmer tries to pay before supplier confirmation
  try {
    payFarmerSupplierOrder(order.id, farmer.id, { paymentMethod: 'UPI' });
    assert(false, 'Expected premature payment before confirmation to throw error');
  } catch (err) {
    assert(err.message.includes('confirmed by supplier'), `Blocked payment before confirmation: "${err.message}"`);
  }

  // Attempt 2: Supplier tries to deliver before confirmation & payment
  try {
    markSupplierOrderDelivered(order.id, supplier.id);
    assert(false, 'Expected premature delivery to throw error');
  } catch (err) {
    assert(err.message.includes('must be confirmed first'), `Blocked delivery before confirmation: "${err.message}"`);
  }

  console.log('\n--- TEST CASE 3: Supplier Confirms Order ---');
  const confirmedOrder = confirmSupplierOrder(order.id, supplier.id);
  assert(confirmedOrder.status === 'CONFIRMED', `Order status updated to 'CONFIRMED' (Actual: ${confirmedOrder.status})`);
  assert(confirmedOrder.paymentStatus === 'UNPAID', `Order paymentStatus remains 'UNPAID' (Actual: ${confirmedOrder.paymentStatus})`);

  // Check farmer notification
  const farmerConfirmNotif = db.prepare("SELECT * FROM notifications WHERE userId = ? AND description LIKE ? ORDER BY id DESC LIMIT 1")
    .get(farmer.id, `%${order.orderNumber}%`);
  assert(farmerConfirmNotif && farmerConfirmNotif.description.includes('confirmed. Please complete payment'),
    `Farmer received confirmation notification asking to complete payment`);

  console.log('\n--- TEST CASE 4: Supplier Attempts Delivery While UNPAID (Must Fail) ---');
  try {
    markSupplierOrderDelivered(order.id, supplier.id);
    assert(false, 'Expected delivery of unpaid order to throw error');
  } catch (err) {
    assert(err.message.includes('fully paid before it can be marked as delivered'),
      `Delivery blocked when unpaid: "${err.message}"`);
  }

  console.log('\n--- TEST CASE 5: Farmer Completes Real Payment ---');
  const paymentMethodChoice = 'Mandi Escrow / Direct DBT (Test)';
  const paidOrder = payFarmerSupplierOrder(order.id, farmer.id, { paymentMethod: paymentMethodChoice });

  assert(paidOrder.status === 'CONFIRMED', `Order status remains 'CONFIRMED' after payment (Actual: ${paidOrder.status})`);
  assert(paidOrder.paymentStatus === 'PAID', `Order paymentStatus updated to 'PAID' (Actual: ${paidOrder.paymentStatus})`);
  assert(paidOrder.paymentId > 0, `Order linked to valid payment record ID: ${paidOrder.paymentId}`);
  assert(paidOrder.paidAt !== null, `Order paidAt timestamp recorded: ${paidOrder.paidAt}`);

  // Check payment ledger in payments table
  const paymentRecord = db.prepare('SELECT * FROM payments WHERE id = ?').get(paidOrder.paymentId);
  assert(paymentRecord !== undefined, `Payment record found in unified payments table`);
  assert(paymentRecord.supplierOrderId === order.id, `Payment linked to supplierOrderId: ${order.id}`);
  assert(Number(paymentRecord.amount) === expectedTotal, `Payment amount equals order total ₹${expectedTotal}`);
  assert(paymentRecord.status === 'PAID', `Payment status is 'PAID'`);
  assert(paymentRecord.paymentMethod === paymentMethodChoice, `Payment method recorded as "${paymentRecord.paymentMethod}"`);

  // Check farmer and supplier notifications
  const farmerPayNotif = db.prepare("SELECT * FROM notifications WHERE userId = ? AND type = 'payment' ORDER BY id DESC LIMIT 1").get(farmer.id);
  assert(farmerPayNotif && farmerPayNotif.title === 'Payment Successful', `Farmer received payment success notification`);

  const supplierPayNotif = db.prepare("SELECT * FROM notifications WHERE userId = ? AND type = 'payment' ORDER BY id DESC LIMIT 1").get(supplier.id);
  assert(supplierPayNotif && supplierPayNotif.description.includes('ready for delivery'), `Supplier received notification order is ready for delivery`);

  console.log('\n--- TEST CASE 6: Duplicate Payment Prevention ---');
  try {
    payFarmerSupplierOrder(order.id, farmer.id, { paymentMethod: 'UPI' });
    assert(false, 'Expected duplicate payment to throw error');
  } catch (err) {
    assert(err.message.includes('already been paid'), `Duplicate payment blocked: "${err.message}"`);
  }

  console.log('\n--- TEST CASE 7: Supplier Marks Order as Delivered ---');
  const deliveredOrder = markSupplierOrderDelivered(order.id, supplier.id);
  assert(deliveredOrder.status === 'DELIVERED', `Order status updated to 'DELIVERED' (Actual: ${deliveredOrder.status})`);
  assert(deliveredOrder.paymentStatus === 'PAID', `Payment status remains 'PAID' (Actual: ${deliveredOrder.paymentStatus})`);
  assert(deliveredOrder.deliveredAt !== null, `Delivered timestamp recorded: ${deliveredOrder.deliveredAt}`);

  // Check farmer delivery notification
  const farmerDelivNotif = db.prepare("SELECT * FROM notifications WHERE userId = ? AND title = 'Order Delivered' ORDER BY id DESC LIMIT 1").get(farmer.id);
  assert(farmerDelivNotif !== undefined, `Farmer received order delivered notification`);

  console.log('\n--- TEST CASE 8: Duplicate Delivery Prevention ---');
  try {
    markSupplierOrderDelivered(order.id, supplier.id);
    assert(false, 'Expected duplicate delivery to throw error');
  } catch (err) {
    assert(err.message.includes('already delivered'), `Duplicate delivery blocked: "${err.message}"`);
  }

  console.log('\n--- TEST CASE 9: Cross-User Authorization Restrictions ---');
  const fakeUserId = 999999;
  try {
    confirmSupplierOrder(order.id, fakeUserId);
    assert(false, 'Expected unauthorized supplier confirmation to fail');
  } catch (err) {
    assert(err.message.includes('not found or unauthorized'), `Unauthorized supplier blocked: "${err.message}"`);
  }

  try {
    payFarmerSupplierOrder(order.id, fakeUserId, { paymentMethod: 'UPI' });
    assert(false, 'Expected unauthorized farmer payment to fail');
  } catch (err) {
    assert(err.message.includes('not found or unauthorized'), `Unauthorized farmer blocked: "${err.message}"`);
  }

  console.log('\n--- TEST CASE 10: Order Cancellation & Inventory Restoration ---');
  const stockBeforeCancelOrder = db.prepare('SELECT stock FROM supplier_products WHERE id = ?').get(product.id).stock;
  const orderToCancel = createSupplierOrderForFarmer(farmer.id, {
    productId: product.id,
    quantity: 2,
    deliveryAddress: 'Cancel Test Address',
  });
  const stockAfterCancelOrder = db.prepare('SELECT stock FROM supplier_products WHERE id = ?').get(product.id).stock;
  assert(stockAfterCancelOrder === stockBeforeCancelOrder - 2, `Stock deducted by 2 for cancel test order`);

  const cancelledOrder = cancelFarmerSupplierOrder(orderToCancel.id, farmer.id);
  assert(cancelledOrder.status.toUpperCase() === 'CANCELLED', `Order status updated to 'CANCELLED'`);

  const stockAfterCancellation = db.prepare('SELECT stock FROM supplier_products WHERE id = ?').get(product.id).stock;
  assert(stockAfterCancellation === stockBeforeCancelOrder, `Stock restored to original count (${stockAfterCancellation}) upon cancellation`);

  console.log('\n--- TEST CASE 11: HTTP API Route Integration Checks ---');
  try {
    // Test Farmer GET orders
    const getRes = await fetch('http://localhost:3000/api/farmer/supplier-orders');
    const getJson = await getRes.json();
    assert(getJson.success === true, `GET /api/farmer/supplier-orders returns HTTP 200 and success`);
    assert(Array.isArray(getJson.data), `GET returns orders array (Count: ${getJson.data?.length})`);

    // Check delivered order in farmer list
    const foundDelivered = getJson.data.find((o) => o.id === order.id);
    assert(foundDelivered !== undefined, `Delivered order #${order.orderNumber} returned in farmer orders`);
    assert(foundDelivered.paymentStatus === 'PAID', `Order in API response has paymentStatus 'PAID'`);
    assert(foundDelivered.status === 'DELIVERED', `Order in API response has status 'DELIVERED'`);

    // Test Supplier GET orders
    const suppRes = await fetch('http://localhost:3000/api/supplier/orders');
    const suppJson = await suppRes.json();
    assert(suppJson.success === true, `GET /api/supplier/orders returns HTTP 200 and success`);
    assert(Array.isArray(suppJson.data), `Supplier GET returns orders array (Count: ${suppJson.data?.length})`);

    // Test Supplier PATCH validation
    const invalidPatchRes = await fetch('http://localhost:3000/api/supplier/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, status: 'DELIVERED' }), // already delivered
    });
    const invalidPatchJson = await invalidPatchRes.json();
    assert(invalidPatchRes.status === 400, `Supplier PATCH returns 400 for duplicate delivery`);
    assert(invalidPatchJson.success === false, `Supplier PATCH returns error: "${invalidPatchJson.error}"`);
  } catch (apiErr) {
    console.warn('API HTTP check warning (dev server may be initializing):', apiErr.message);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
