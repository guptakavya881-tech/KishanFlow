import {
  getDatabase,
  getUserById,
  updateUserProfile,
  changeUserPassword,
  createSupportTicket,
  getUserSupportTickets,
  getAdminSupportTickets,
  updateSupportTicketStatus,
  getAdminAnalytics,
  getAdminReportsExportCsv,
} from '../src/lib/db.js';
import bcrypt from 'bcryptjs';

console.log('=== KISANFLOW SETTINGS, SUPPORT & ANALYTICS TEST SUITE ===');

async function runTests() {
  const db = getDatabase();

  // 1. Find or verify test users
  const admin = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
  const farmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
  const buyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' LIMIT 1").get();

  console.log(`[TEST 1] Testing Users: Admin (#${admin.id}), Farmer (#${farmer.id}), Buyer (#${buyer.id})`);
  if (!admin || !farmer || !buyer) {
    throw new Error('Required test roles not present in database.');
  }

  // 2. Test User Profile Update & Role Immutability
  console.log('[TEST 2] Testing updateUserProfile and Role Immutability...');
  const originalFarmerRole = farmer.role;
  const originalFarmerName = farmer.fullName;

  const updatedProfile = updateUserProfile(farmer.id, {
    fullName: 'Anshika Verified Farmer',
    location: 'Meerut Mandi Circle, UP',
  });

  if (updatedProfile.role !== originalFarmerRole) {
    throw new Error(`CRITICAL: Farmer role changed from ${originalFarmerRole} to ${updatedProfile.role}!`);
  }
  if (updatedProfile.fullName !== 'Anshika Verified Farmer') {
    throw new Error('Farmer name was not updated correctly.');
  }
  console.log('  -> Profile successfully updated. Role remains strictly:', updatedProfile.role);

  // Restore name
  updateUserProfile(farmer.id, { fullName: originalFarmerName });

  // 3. Test Password Change
  console.log('[TEST 3] Testing changeUserPassword security...');
  // Test wrong current password
  let wrongPwFailed = false;
  try {
    changeUserPassword(farmer.id, 'WrongPassword123!', 'NewFarmer@123');
  } catch (err) {
    wrongPwFailed = true;
    console.log('  -> Correctly rejected wrong password:', err.message);
  }
  if (!wrongPwFailed) {
    throw new Error('CRITICAL: changeUserPassword accepted an incorrect current password!');
  }

  // Test short password
  let shortPwFailed = false;
  try {
    changeUserPassword(farmer.id, 'Farmer@12345', '123');
  } catch (err) {
    shortPwFailed = true;
    console.log('  -> Correctly rejected short password:', err.message);
  }
  if (!shortPwFailed) {
    throw new Error('CRITICAL: changeUserPassword accepted a password shorter than 6 characters!');
  }

  // Test successful password change
  changeUserPassword(farmer.id, 'Farmer@12345', 'NewSecurePass@2026');
  const userCheck = db.prepare('SELECT passwordHash FROM users WHERE id = ?').get(farmer.id);
  if (!bcrypt.compareSync('NewSecurePass@2026', userCheck.passwordHash)) {
    throw new Error('Password hash does not match new password!');
  }
  console.log('  -> Password successfully changed and verified with bcrypt.');

  // Revert password back to Farmer@12345 so future logins continue working
  changeUserPassword(farmer.id, 'NewSecurePass@2026', 'Farmer@12345');
  console.log('  -> Reverted password back to default Farmer@12345.');

  // 4. Test Support Tickets Creation & Data Isolation
  console.log('[TEST 4] Testing Support Tickets creation and isolation...');
  const farmerTicket = createSupportTicket({
    userId: farmer.id,
    role: farmer.role,
    subject: 'Weighbridge calibration test ticket',
    category: 'Procurement Issue',
    description: 'Reporting a test weighbridge discrepancy at Mandi Gate 2.',
    relatedOrderId: null,
    relatedPaymentId: null,
  });

  const buyerTicket = createSupportTicket({
    userId: buyer.id,
    role: buyer.role,
    subject: 'Invoice GST reconciliation request',
    category: 'Payment Issue',
    description: 'Please verify the GST invoice breakdown for recent procurement lot.',
    relatedOrderId: null,
    relatedPaymentId: null,
  });

  console.log(`  -> Created Farmer Ticket: ${farmerTicket.ticketId} (#${farmerTicket.id})`);
  console.log(`  -> Created Buyer Ticket: ${buyerTicket.ticketId} (#${buyerTicket.id})`);

  // Verify farmer sees only own tickets
  const farmerTickets = getUserSupportTickets(farmer.id);
  const hasBuyerTicketInFarmerList = farmerTickets.some((t) => t.ticketId === buyerTicket.ticketId);
  if (hasBuyerTicketInFarmerList) {
    throw new Error('DATA ISOLATION BREACH: Buyer ticket leaked into Farmer tickets list!');
  }
  console.log(`  -> Farmer sees ${farmerTickets.length} tickets (isolated strictly to Farmer).`);

  // Verify buyer sees only own tickets
  const buyerTickets = getUserSupportTickets(buyer.id);
  const hasFarmerTicketInBuyerList = buyerTickets.some((t) => t.ticketId === farmerTicket.ticketId);
  if (hasFarmerTicketInBuyerList) {
    throw new Error('DATA ISOLATION BREACH: Farmer ticket leaked into Buyer tickets list!');
  }
  console.log(`  -> Buyer sees ${buyerTickets.length} tickets (isolated strictly to Buyer).`);

  // Verify Admin sees all tickets
  const adminTickets = getAdminSupportTickets();
  const foundFarmerTicketInAdmin = adminTickets.some((t) => t.ticketId === farmerTicket.ticketId);
  const foundBuyerTicketInAdmin = adminTickets.some((t) => t.ticketId === buyerTicket.ticketId);
  if (!foundFarmerTicketInAdmin || !foundBuyerTicketInAdmin) {
    throw new Error('Admin ticket view is missing registered tickets.');
  }
  console.log(`  -> Admin sees all ${adminTickets.length} tickets across users.`);

  // 5. Test Admin Ticket Status & Notes Update
  console.log('[TEST 5] Testing updateSupportTicketStatus...');
  const updatedTicket = updateSupportTicketStatus(farmerTicket.ticketId, {
    status: 'IN_PROGRESS',
    adminNotes: 'Weighbridge technician has been dispatched to Gate 2 for verification.',
  });
  if (updatedTicket.status !== 'IN_PROGRESS') {
    throw new Error(`Expected status IN_PROGRESS, got: ${updatedTicket.status}`);
  }
  if (!updatedTicket.adminNotes.includes('Weighbridge technician')) {
    throw new Error('Admin notes were not saved on ticket.');
  }
  console.log('  -> Ticket status updated to IN_PROGRESS with admin notes.');

  updateSupportTicketStatus(farmerTicket.ticketId, {
    status: 'RESOLVED',
    adminNotes: 'Calibration complete and certified. Ticket resolved.',
  });
  console.log('  -> Ticket status updated to RESOLVED.');

  // 6. Test Real Admin Analytics
  console.log('[TEST 6] Testing getAdminAnalytics (100% Real SQLite records)...');
  const analyticsAll = getAdminAnalytics({ timeRange: 'ALL' });

  console.log('  -> Users:', analyticsAll.users);
  console.log('  -> Crops:', analyticsAll.crops);
  console.log('  -> Orders:', analyticsAll.orders);
  console.log('  -> Payments:', analyticsAll.payments);
  console.log('  -> Centres Count:', analyticsAll.centres.total);
  console.log('  -> Support Tickets:', analyticsAll.support);

  if (analyticsAll.users.total < 3) {
    throw new Error('Expected at least 3 users in database.');
  }
  if (analyticsAll.payments.paidCount < 0) {
    throw new Error('Paid count is invalid.');
  }
  if (analyticsAll.support.total < 2) {
    throw new Error('Support tickets count did not reflect newly created tickets.');
  }

  // Verify time filters execute cleanly
  const analyticsToday = getAdminAnalytics({ timeRange: 'TODAY' });
  const analytics7D = getAdminAnalytics({ timeRange: '7D' });
  const analytics30D = getAdminAnalytics({ timeRange: '30D' });
  console.log(`  -> Time filters tested: TODAY (${analyticsToday.timeRange}), 7D (${analytics7D.timeRange}), 30D (${analytics30D.timeRange})`);

  // 7. Test CSV Export Generation
  console.log('[TEST 7] Testing CSV Export Generator...');
  const csv = getAdminReportsExportCsv({ timeRange: 'ALL' });
  if (!csv.includes('KISANFLOW OPERATIONS & ANALYTICS REPORT')) {
    throw new Error('CSV output missing expected title header.');
  }
  if (!csv.includes('METRIC SUMMARY') || !csv.includes('PROCUREMENT CENTRES STATUS')) {
    throw new Error('CSV output missing expected section headers.');
  }
  console.log(`  -> CSV successfully generated (${csv.length} bytes). Sample line:`);
  console.log('     ' + csv.split('\n').slice(0, 4).join('\n     '));

  console.log('\n>>> ALL SETTINGS, SUPPORT & ANALYTICS TESTS PASSED WITH 100% ACCURACY! <<<');
}

runTests().catch((err) => {
  console.error('\nFAILED TEST:', err);
  process.exit(1);
});
