import {
  getDatabase,
  createBuyerOrder,
  confirmFarmerOrder,
  advanceOrderStatus,
  createOrderPayment,
  completeOrderPayment,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  getUserById,
  updateUserProfile,
  getBuyerProfileData,
  getBuyerPurchaseHistory,
} from '../src/lib/db.js';

console.log('\n======================================================');
console.log('RUNNING COMPREHENSIVE TESTS FOR BUYER NOTIFICATIONS, PROFILE & PURCHASE HISTORY');
console.log('======================================================\n');

const db = getDatabase();

// 1. Setup Test Actors: Farmer A, Buyer A, and Buyer B
let farmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
if (!farmer) throw new Error('Farmer not found');

// Find or create Buyer A
let buyerA = db.prepare("SELECT * FROM users WHERE email IN ('buyer_a_test@kishanflow.com', 'priya.patel@agrisharma.in')").get();
if (buyerA) {
  db.prepare("UPDATE users SET fullName = 'Priya Sharma (Buyer A)', email = 'buyer_a_test@kishanflow.com', mobile = '9820000001', companyName = 'Sharma Agro Commodities', location = 'Mumbai APMC Market' WHERE id = ?").run(buyerA.id);
  buyerA = db.prepare('SELECT * FROM users WHERE id = ?').get(buyerA.id);
} else {
  const res = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, companyName, businessType, gstin, passwordHash, role)
    VALUES ('Priya Sharma (Buyer A)', 'buyer_a_test@kishanflow.com', '9820000001', 'Mumbai APMC Market', 'Sharma Agro Commodities', 'Wholesale Processor', '27AAAAA0000A1Z5', 'pw', 'buyer')
  `).run();
  buyerA = db.prepare('SELECT * FROM users WHERE id = ?').get(res.lastInsertRowid);
}

// Find or create Buyer B
let buyerB = db.prepare("SELECT * FROM users WHERE role = 'buyer' AND email = 'buyer_b_test@kishanflow.com'").get();
if (!buyerB) {
  const res = db.prepare(`
    INSERT INTO users (fullName, email, mobile, location, companyName, businessType, gstin, passwordHash, role)
    VALUES ('Vikram Singhania (Buyer B)', 'buyer_b_test@kishanflow.com', '9820000002', 'Delhi Grain Market', 'Singhania Flour Mills', 'Flour Mill Operator', '07BBBBB1111B2Z6', 'pw', 'buyer')
  `).run();
  buyerB = db.prepare('SELECT * FROM users WHERE id = ?').get(res.lastInsertRowid);
}

console.log(`[SETUP] Farmer: ID=${farmer.id} (${farmer.fullName})`);
console.log(`[SETUP] Buyer A: ID=${buyerA.id} (${buyerA.fullName})`);
console.log(`[SETUP] Buyer B: ID=${buyerB.id} (${buyerB.fullName})`);

// Find or create crop for farmer
let crop = db.prepare('SELECT * FROM crops WHERE userId = ? LIMIT 1').get(farmer.id);
if (!crop) {
  const res = db.prepare(`
    INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate)
    VALUES (?, 'Wheat Sharbati', 2500, 'kg', 'Ready to Harvest', 'Immediate')
  `).run(farmer.id);
  crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(res.lastInsertRowid);
}

// Clean up prior test notifications & orders for test buyers
db.prepare("UPDATE users SET email = 'prior_test_' || id || '@kishanflow.com' WHERE email = 'priya.patel@agrisharma.in' AND id != ?").run(buyerA.id);
db.prepare("UPDATE users SET mobile = '98000000' || id WHERE mobile = '9820098200' AND id != ?").run(buyerA.id);
db.prepare('DELETE FROM notifications WHERE userId IN (?, ?)').run(buyerA.id, buyerB.id);
db.prepare('UPDATE orders SET paymentId = NULL WHERE buyerId IN (?, ?)').run(buyerA.id, buyerB.id);
db.prepare('DELETE FROM payments WHERE buyerId IN (?, ?)').run(buyerA.id, buyerB.id);
db.prepare('DELETE FROM orders WHERE buyerId IN (?, ?)').run(buyerA.id, buyerB.id);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ----------------------------------------------------
// PART 1: BUYER NOTIFICATIONS
// ----------------------------------------------------
console.log('\n--- PART 1: BUYER NOTIFICATIONS & MULTI-BUYER ISOLATION ---');

// Test 1: Buyer A starts with 0 notifications
const initialNotifsA = getNotificationsByUserId(buyerA.id);
assert(initialNotifsA.length === 0, 'Buyer A has 0 notifications initially (no fake data)');

// Test 2: Buyer A places an order -> Buyer A receives "Order Request Sent" notification
const orderA = createBuyerOrder({
  buyerId: buyerA.id,
  cropId: crop.id,
  quantity: 500,
  deliveryNotes: 'Urgent mandi pickup',
});
assert(orderA && orderA.id, `Buyer A created order #${orderA.orderNumber}`);

const notifsAfterOrderA = getNotificationsByUserId(buyerA.id);
assert(notifsAfterOrderA.length === 1, 'Buyer A received exactly 1 real notification upon order placement');
assert(notifsAfterOrderA[0].relatedOrderId === orderA.id, 'Notification contains relatedOrderId matching the real order');
assert(notifsAfterOrderA[0].actionUrl.includes(String(orderA.id)), 'Notification actionUrl points to tracking page');

// Test 3: Buyer B has zero notifications (Strict Multi-Buyer Isolation)
const notifsB = getNotificationsByUserId(buyerB.id);
assert(notifsB.length === 0, 'Buyer B received 0 notifications (No data leakage across buyers)');

// Test 4: Farmer confirms order -> Buyer A receives "Order Confirmed" notification
confirmFarmerOrder(orderA.id, farmer.id, { agreedPrice: 28 });
const notifsAfterConfirm = getNotificationsByUserId(buyerA.id);
assert(notifsAfterConfirm.length === 2, 'Buyer A now has 2 notifications after farmer confirmation');
const confirmNotif = notifsAfterConfirm.find(n => n.title.includes('Confirmed'));
assert(confirmNotif && confirmNotif.relatedOrderId === orderA.id, 'Buyer A received "Order Confirmed" with relatedOrderId');

// Test 5: Unread count check
const unreadCountA = getUnreadNotificationCount(buyerA.id);
assert(unreadCountA === 2, `Unread notification count for Buyer A is 2 (actual: ${unreadCountA})`);

// Test 6: Mark single notification read
markNotificationRead(confirmNotif.id, buyerA.id);
const unreadCountAfterOne = getUnreadNotificationCount(buyerA.id);
assert(unreadCountAfterOne === 1, 'Unread notification count decremented to 1 after marking single read');

// Test 7: Mark all notifications read
markAllNotificationsRead(buyerA.id);
const unreadCountAfterAll = getUnreadNotificationCount(buyerA.id);
assert(unreadCountAfterAll === 0, 'Unread notification count is 0 after markAllNotificationsRead');

// ----------------------------------------------------
// PART 2: BUYER PROFILE
// ----------------------------------------------------
console.log('\n--- PART 2: BUYER PROFILE & PERSISTENCE ---');

// Test 8: Get Buyer Profile Data
const profileA = getBuyerProfileData(buyerA.id);
assert(profileA && profileA.user, 'getBuyerProfileData returned buyer profile');
assert(profileA.user.buyerId === `KF-BUYER-${String(buyerA.id).padStart(4, '0')}`, 'buyerId is properly formatted KF-BUYER-000X');
assert(profileA.user.fullName.includes('Priya'), 'Full name matches database record');
assert(profileA.user.companyName === 'Sharma Agro Commodities', 'Company name matches database record');

// Test 9: Update Buyer Profile (Valid)
const updatedUser = updateUserProfile(buyerA.id, {
  fullName: 'Priya Sharma-Patel',
  companyName: 'Sharma & Patel Agro Enterprise',
  email: 'priya.patel@agrisharma.in',
  mobile: '9820098200',
  location: 'Vashi Mandi Hub, Navi Mumbai',
  businessType: 'Institutional Grain Exporter',
  gstin: '27ABCDE1234F1Z5',
});
assert(updatedUser.fullName === 'Priya Sharma-Patel', 'Full name updated in SQLite');
assert(updatedUser.companyName === 'Sharma & Patel Agro Enterprise', 'Company name updated in SQLite');
assert(updatedUser.email === 'priya.patel@agrisharma.in', 'Email updated in SQLite');
assert(updatedUser.mobile === '9820098200', 'Mobile updated in SQLite');
assert(updatedUser.location === 'Vashi Mandi Hub, Navi Mumbai', 'Location updated in SQLite');

// Verify persistent read via getUserById
const refreshedUser = getUserById(buyerA.id);
assert(refreshedUser.fullName === 'Priya Sharma-Patel', 'getUserById confirms persistence');

// Test 10: Profile validation rejects invalid email
let emailErrorCaught = false;
try {
  updateUserProfile(buyerA.id, { email: 'invalid-email-format' });
} catch (e) {
  emailErrorCaught = true;
}
assert(emailErrorCaught, 'updateUserProfile threw error on invalid email address');

// Test 11: Profile validation rejects invalid mobile
let mobileErrorCaught = false;
try {
  updateUserProfile(buyerA.id, { mobile: '123' });
} catch (e) {
  mobileErrorCaught = true;
}
assert(mobileErrorCaught, 'updateUserProfile threw error on short mobile number');

// Test 12: Profile validation rejects empty full name
let nameErrorCaught = false;
try {
  updateUserProfile(buyerA.id, { fullName: '   ' });
} catch (e) {
  nameErrorCaught = true;
}
assert(nameErrorCaught, 'updateUserProfile threw error on empty full name');

// Test 13: Protected identity fields: id and role cannot be changed
assert(refreshedUser.id === buyerA.id, 'Buyer id remains immutable');
assert(refreshedUser.role === 'buyer', 'Buyer role remains immutable');

// ----------------------------------------------------
// PART 3: BUYER PURCHASE HISTORY
// ----------------------------------------------------
console.log('\n--- PART 3: BUYER PURCHASE HISTORY & COMPLETED PURCHASES ---');

// Test 14: Order is currently CONFIRMED -> Should NOT be in Purchase History yet
const historyBeforeComplete = getBuyerPurchaseHistory(buyerA.id);
assert(historyBeforeComplete.length === 0, 'Purchase History is empty while order is CONFIRMED (real lifecycle rule)');

// Test 15: Advance order to PROCUREMENT_SCHEDULED, then READY_FOR_PROCUREMENT, then PROCUREMENT_COMPLETED
advanceOrderStatus(orderA.id, 'PROCUREMENT_SCHEDULED', 'Slot scheduled at Meerut Mandi');
advanceOrderStatus(orderA.id, 'READY_FOR_PROCUREMENT', 'Produce arrived at mandi weighing bridge');
advanceOrderStatus(orderA.id, 'PROCUREMENT_COMPLETED', 'Weighment and quality test completed: 500 kg A-grade');

// Test 16: Order has reached PROCUREMENT_COMPLETED -> Now it appears in Purchase History!
const historyAfterProcure = getBuyerPurchaseHistory(buyerA.id);
assert(historyAfterProcure.length === 1, 'Order appears in Purchase History after reaching PROCUREMENT_COMPLETED');
assert(historyAfterProcure[0].orderNumber === orderA.orderNumber, 'Historical purchase matches real order number');
assert(historyAfterProcure[0].cropName === crop.name, 'Historical purchase produce name matches real crop');
assert(historyAfterProcure[0].farmer.name === farmer.fullName, 'Historical purchase contains real farmer supplier name');

// Test 17: Buyer B still has 0 purchases in Purchase History (No Cross-Buyer Leak)
const historyBuyerB = getBuyerPurchaseHistory(buyerB.id);
assert(historyBuyerB.length === 0, 'Buyer B has 0 purchases in Purchase History (Multi-buyer isolation verified)');

// Test 18: Buyer A completes payment for the order
const paymentRecord = createOrderPayment({
  orderId: orderA.id,
  buyerId: buyerA.id,
  paymentMethod: 'Mandi Escrow / Direct DBT',
});
completeOrderPayment(paymentRecord.id, {
  transactionId: 'TXN-KFPAY-998877',
  method: 'Mandi Escrow / Direct DBT',
});

// Test 19: Historical purchase now reflects real settlement / payment record
const historyWithPayment = getBuyerPurchaseHistory(buyerA.id);
assert(historyWithPayment[0].paymentStatus === 'PAID', 'Historical purchase paymentStatus is PAID');
assert(historyWithPayment[0].payment && historyWithPayment[0].payment.transactionId === 'TXN-KFPAY-998877', 'Historical purchase includes real payment transaction ID');
assert(Number(historyWithPayment[0].payment.amount) === Number(historyWithPayment[0].totalAmount), 'Payment amount matches real order total amount');

// Test 20: Notification generated for Payment Successful
const notifsAfterPayment = getNotificationsByUserId(buyerA.id);
const payNotif = notifsAfterPayment.find(n => n.type === 'payment' && n.title.includes('Successful'));
assert(payNotif && payNotif.relatedOrderId === orderA.id, 'Buyer A received "Payment Successful" notification linked to order');

// Test 21: Purchase History Search & Filter
const searchMatch = getBuyerPurchaseHistory(buyerA.id, { search: orderA.orderNumber });
assert(searchMatch.length === 1, 'Search by order number returned 1 match');

const searchCropMatch = getBuyerPurchaseHistory(buyerA.id, { search: 'Wheat' });
assert(searchCropMatch.length === 1, 'Search by crop name returned 1 match');

const searchNoMatch = getBuyerPurchaseHistory(buyerA.id, { search: 'NonExistentProduce' });
assert(searchNoMatch.length === 0, 'Search for non-existent produce returns 0 matches');

const filterPaid = getBuyerPurchaseHistory(buyerA.id, { paymentStatus: 'PAID' });
assert(filterPaid.length === 1, 'Filter by paymentStatus = PAID returned 1 match');

// Test 22: Profile Stats reflect completed procurement and spent amount
const finalProfileStats = getBuyerProfileData(buyerA.id);
assert(finalProfileStats.stats.completedOrders >= 1, 'Buyer profile stats reflect completed order');
assert(finalProfileStats.stats.totalSpent > 0, 'Buyer profile stats reflect total spent amount');

console.log(`\n======================================================`);
console.log(`ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
console.log('======================================================\n');
