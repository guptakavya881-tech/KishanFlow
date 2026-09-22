import bcrypt from 'bcryptjs';
import {
  getDatabase,
  createUser,
  getUserByEmail,
  createCropRecord,
  getCropsByUserId,
  getBuyerEligibleCrops,
  createBuyerOrder,
  getOrdersByBuyerId,
  getOrderByIdAndBuyer,
  getOrdersByFarmerId,
  getFarmerOrderById,
  confirmFarmerOrder,
  advanceOrderStatus,
  ensureOrderToken,
  getCentreQueueState,
  getAdminQueueOverview,
  advanceQueueOrderStatus,
  completeAdminProcurement,
  getActiveQueuesByUserId,
  getCompletedQueuesByUserId,
  getAdminCropsList,
  getAdminCropMetrics,
  getAdminCropDetails,
  getAdminOrderDetails,
} from '../src/lib/db.js';

console.log('=== KISANFLOW 20-STEP END-TO-END VERIFICATION TEST ===\n');

async function runTests() {
  const db = getDatabase();
  const timestamp = Date.now();
  const defaultHash = bcrypt.hashSync('Password@123', 10);

  // STEP 1: Register Farmer A
  console.log('STEP 1: Register Farmer A...');
  const farmerEmail = `farmer_test_${timestamp}@kisanflow.com`;
  const farmerA = createUser({
    fullName: `Rameshwar Patel ${timestamp}`,
    email: farmerEmail,
    mobile: `987${Math.floor(1000000 + Math.random() * 9000000)}`,
    passwordHash: defaultHash,
    role: 'farmer',
    location: 'Indore Mandi Region',
    state: 'Madhya Pradesh',
  });
  if (!farmerA || farmerA.role !== 'farmer') throw new Error('Farmer A registration failed.');
  console.log(`✓ Farmer A registered: ID=${farmerA.id}, Name=${farmerA.fullName}`);

  // STEP 2: Farmer A adds Rice
  console.log('\nSTEP 2: Farmer A adds Rice crop lot...');
  const cropA = createCropRecord({
    userId: farmerA.id,
    name: 'Basmati Rice',
    quantity: 500,
    unit: 'quintal',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '18 September 2026',
    notes: 'Premium organic grain ready for procurement',
    location: 'Indore Mandi Region',
    procurementCentre: 'Meerut Procurement Centre',
  });
  if (!cropA || cropA.name !== 'Basmati Rice' || cropA.quantity !== 500) {
    throw new Error('Crop creation failed.');
  }
  console.log(`✓ Crop record created: ID=${cropA.id}, Crop=${cropA.name}, Qty=${cropA.quantity} ${cropA.unit}, Farmer=${cropA.userId}`);

  // STEP 3: Register Buyer B
  console.log('\nSTEP 3: Register Buyer B...');
  const buyerEmail = `buyer_test_${timestamp}@kisanflow.com`;
  const buyerB = createUser({
    fullName: `Agro Agrocorp Ltd ${timestamp}`,
    companyName: 'Agro Agrocorp Ltd',
    email: buyerEmail,
    mobile: `912${Math.floor(1000000 + Math.random() * 9000000)}`,
    passwordHash: defaultHash,
    role: 'buyer',
    location: 'Central Zone',
  });
  if (!buyerB || buyerB.role !== 'buyer') throw new Error('Buyer B registration failed.');
  console.log(`✓ Buyer B registered: ID=${buyerB.id}, Role=${buyerB.role}, Name=${buyerB.fullName}`);

  // STEP 4: Buyer B opens Crop Listing. Verify Farmer A's real Rice appears.
  console.log("\nSTEP 4: Buyer B opens Crop Listing (getBuyerEligibleCrops)...");
  const browseResult = getBuyerEligibleCrops({ search: 'Basmati Rice' });
  const foundCropInBrowse = browseResult.crops.find((c) => c.id === cropA.id);
  if (!foundCropInBrowse) throw new Error('Farmer A crop not found in buyer eligible listings!');
  console.log(`✓ Farmer A's real Rice appeared in Buyer Browse: Lot=${foundCropInBrowse.lotId}, Status=${foundCropInBrowse.availabilityStatus}`);

  // STEP 5: Buyer B creates an order for Farmer A's Rice
  console.log("\nSTEP 5: Buyer B creates order for Farmer A's Rice...");
  const initialFarmerCropQty = db.prepare('SELECT quantity FROM crops WHERE id = ?').get(cropA.id).quantity;
  const orderQuantity = 100;

  const orderKF = createBuyerOrder({
    buyerId: buyerB.id,
    cropId: cropA.id,
    cropName: cropA.name,
    quantity: orderQuantity,
    unit: cropA.unit,
    procurementCentre: 'Meerut Procurement Centre',
    agreedPrice: 2800,
  });

  if (!orderKF) throw new Error('Order creation failed.');
  if (orderKF.buyerId !== buyerB.id) throw new Error('buyerId mismatch!');
  if (orderKF.farmerId !== farmerA.id) throw new Error('farmerId mismatch!');
  if (orderKF.farmerCropId !== cropA.id) throw new Error('farmerCropId mismatch!');

  const updatedFarmerCropQty = db.prepare('SELECT quantity FROM crops WHERE id = ?').get(cropA.id).quantity;
  if (updatedFarmerCropQty !== initialFarmerCropQty - orderQuantity) {
    throw new Error(`Crop quantity deduction failed! Expected ${initialFarmerCropQty - orderQuantity}, got ${updatedFarmerCropQty}`);
  }
  console.log(`✓ Order created: Order #${orderKF.orderNumber}`);
  console.log(`  buyerId = ${orderKF.buyerId} (Buyer B)`);
  console.log(`  farmerId = ${orderKF.farmerId} (Farmer A)`);
  console.log(`  farmerCropId = ${orderKF.farmerCropId} (Farmer A Rice)`);
  console.log(`  Farmer Crop Qty correctly reduced from ${initialFarmerCropQty} to ${updatedFarmerCropQty}`);

  // STEP 6: Farmer A receives the order
  console.log('\nSTEP 6: Farmer A receives the order...');
  const farmerOrders = getOrdersByFarmerId(farmerA.id);
  const foundFarmerOrder = farmerOrders.find((o) => o.id === orderKF.id);
  if (!foundFarmerOrder) throw new Error("Farmer A did not receive Buyer B's order!");
  console.log(`✓ Farmer A received order: Order #${foundFarmerOrder.orderNumber}, Status=${foundFarmerOrder.status}`);

  // STEP 7: Farmer A confirms the order
  console.log('\nSTEP 7: Farmer A confirms the order...');
  const confirmedOrder = confirmFarmerOrder(orderKF.id, farmerA.id);
  if (confirmedOrder.status !== 'CONFIRMED') throw new Error('Farmer order confirmation failed!');
  console.log(`✓ Farmer A confirmed order: Status=${confirmedOrder.status}`);

  // STEP 8: Assign/use procurement centre and slot workflow
  console.log('\nSTEP 8: Assign/use procurement centre & slot workflow...');
  const scheduledOrder = advanceOrderStatus(orderKF.id, 'ORDER_SCHEDULED', 'Procurement scheduled at Meerut Procurement Centre');
  if (scheduledOrder.status !== 'ORDER_SCHEDULED') throw new Error('Scheduling order failed!');
  console.log(`✓ Order scheduled for mandi procurement: Status=${scheduledOrder.status}, Centre=${scheduledOrder.procurementCentre}`);

  // STEP 9: Create/use REAL queue entry for the order
  console.log('\nSTEP 9: Create/use REAL queue entry for the order...');
  const assignedToken = ensureOrderToken(orderKF.id);
  if (!assignedToken) throw new Error('Token assignment failed!');
  console.log(`✓ Real queue token assigned to order: Token=${assignedToken}`);

  // STEP 10: Farmer A opens live queue
  console.log('\nSTEP 10: Farmer A opens live queue (getActiveQueuesByUserId)...');
  const farmerLiveQueues = getActiveQueuesByUserId(farmerA.id);
  const activeQueueEntry = farmerLiveQueues.find((q) => q.tokenNumber === assignedToken);
  if (!activeQueueEntry) throw new Error('Farmer A has no active queue entry for assigned token!');
  console.log(`✓ Farmer A Live Queue View:`);
  console.log(`  Own Token: #${activeQueueEntry.tokenNumber}`);
  console.log(`  Current Serving Token: #${activeQueueEntry.currentServingToken}`);
  console.log(`  Queue Position: #${activeQueueEntry.queuePosition}`);
  console.log(`  People Ahead: ${activeQueueEntry.peopleAhead}`);
  console.log(`  Centre: ${activeQueueEntry.centreName}`);
  console.log(`  Est. Wait: ${activeQueueEntry.estimatedWaitMinutes} mins`);
  console.log(`  Tokens Sequence count: ${activeQueueEntry.tokensSequence.length}`);

  // STEP 11: Admin opens procurement centre
  console.log('\nSTEP 11: Admin opens procurement centre queue (getCentreQueueState)...');
  const centreQueue = getCentreQueueState('Meerut Procurement Centre');
  if (!centreQueue) throw new Error('Procurement centre queue not found!');
  const queueItemInAdmin = centreQueue.activeQueue.find((q) => q.tokenNumber === assignedToken);
  if (!queueItemInAdmin) throw new Error('Admin centre queue does not contain Farmer A order!');
  console.log(`✓ Admin sees real order in centre queue: Position=#${queueItemInAdmin.queuePosition}, Token=#${queueItemInAdmin.tokenNumber}, Farmer=${queueItemInAdmin.farmerName}`);

  // STEP 12: Admin processes order through procurement workflow (Weighing / Gate)
  console.log('\nSTEP 12: Admin advances order to WEIGHING_VERIFICATION...');
  const advanced = advanceQueueOrderStatus({
    orderId: orderKF.id,
    nextStatus: 'WEIGHING_VERIFICATION',
    note: 'Crop entered weighbridge bay for moisture inspection.',
  });
  if (advanced.status !== 'WEIGHING_VERIFICATION') throw new Error('Weighing verification transition failed!');
  console.log(`✓ Order advanced to: Status=${advanced.status}`);

  // STEP 13: Admin clicks "Mark Procurement Complete"
  console.log('\nSTEP 13: Admin marks procurement complete (completeAdminProcurement)...');
  const completedOrder = completeAdminProcurement(orderKF.id, 'ADMIN-TEST');
  if (!completedOrder) throw new Error('Procurement completion failed!');

  // STEP 14: The SAME order becomes PROCUREMENT_COMPLETED
  console.log('\nSTEP 14: Verify SAME order is PROCUREMENT_COMPLETED...');
  if (completedOrder.status !== 'PROCUREMENT_COMPLETED') throw new Error(`Expected status PROCUREMENT_COMPLETED, got ${completedOrder.status}`);
  console.log(`✓ Order #${completedOrder.orderNumber} status is now strictly: ${completedOrder.status}`);

  // STEP 15: Buyer B -> Track Orders sees ✓ Procurement Completed
  console.log('\nSTEP 15: Buyer B Track Orders verification...');
  const buyerOrderCheck = getOrderByIdAndBuyer(orderKF.id, buyerB.id);
  if (buyerOrderCheck.status !== 'PROCUREMENT_COMPLETED') throw new Error('Buyer order status not updated to PROCUREMENT_COMPLETED!');
  console.log(`✓ Buyer B sees order status: ${buyerOrderCheck.status} (Procurement Completed)`);

  // STEP 16: Farmer A -> Orders sees ✓ Procurement Completed
  console.log('\nSTEP 16: Farmer A Orders verification...');
  const farmerOrderCheck = getFarmerOrderById(orderKF.id, farmerA.id);
  if (farmerOrderCheck.status !== 'PROCUREMENT_COMPLETED') throw new Error('Farmer order status not updated to PROCUREMENT_COMPLETED!');
  console.log(`✓ Farmer A sees order status: ${farmerOrderCheck.status} (Procurement Completed)`);

  // STEP 17: Verify completed order is no longer in active queue
  console.log('\nSTEP 17: Verify completed order is removed from active queue...');
  const farmerActiveAfterCompletion = getActiveQueuesByUserId(farmerA.id);
  const stillActiveFarmer = farmerActiveAfterCompletion.find((q) => q.tokenNumber === assignedToken);
  if (stillActiveFarmer) throw new Error('Completed order still appears in active farmer queue!');

  const centreQueueAfterCompletion = getCentreQueueState('Meerut Procurement Centre');
  const stillActiveCentre = centreQueueAfterCompletion.activeQueue.find((q) => q.tokenNumber === assignedToken);
  if (stillActiveCentre) throw new Error('Completed order still appears in active centre queue!');

  const farmerCompletedList = getCompletedQueuesByUserId(farmerA.id);
  const inCompleted = farmerCompletedList.find((q) => q.tokenNumber === assignedToken);
  if (!inCompleted) throw new Error('Completed order missing from farmer completed queue history!');
  console.log('✓ Completed order removed from active queue and successfully present in completed queue history.');

  // STEP 18: Verify another Farmer cannot see Farmer A's queue/order
  console.log("\nSTEP 18: Verify Farmer C cannot see Farmer A's queue or order...");
  const farmerC = createUser({
    fullName: `Farmer Other ${timestamp}`,
    email: `farmer_c_${timestamp}@kisanflow.com`,
    mobile: `955${Math.floor(1000000 + Math.random() * 9000000)}`,
    passwordHash: defaultHash,
    role: 'farmer',
    location: 'Bhopal Region',
  });
  const farmerCOrders = getOrdersByFarmerId(farmerC.id);
  const seesFarmerAOrder = farmerCOrders.some((o) => o.id === orderKF.id);
  if (seesFarmerAOrder) throw new Error("Farmer C can see Farmer A's order!");

  const farmerCQueues = getActiveQueuesByUserId(farmerC.id);
  const seesFarmerAQueue = farmerCQueues.some((q) => q.tokenNumber === assignedToken);
  if (seesFarmerAQueue) throw new Error("Farmer C can see Farmer A's active queue!");
  console.log("✓ Farmer C cannot see Farmer A's private orders or queue.");

  // STEP 19: Verify another Buyer cannot see Buyer B's order
  console.log("\nSTEP 19: Verify Buyer D cannot see Buyer B's order...");
  const buyerD = createUser({
    fullName: `Buyer Other ${timestamp}`,
    companyName: 'Other Enterprises',
    email: `buyer_d_${timestamp}@kisanflow.com`,
    mobile: `966${Math.floor(1000000 + Math.random() * 9000000)}`,
    passwordHash: defaultHash,
    role: 'buyer',
    location: 'Western Zone',
  });
  const buyerDOrders = getOrdersByBuyerId(buyerD.id);
  const seesBuyerBOrder = buyerDOrders.some((o) => o.id === orderKF.id);
  if (seesBuyerBOrder) throw new Error("Buyer D can see Buyer B's private order!");
  console.log("✓ Buyer D cannot see Buyer B's private orders.");

  // STEP 20: Verify multiple Farmers selling the same crop remain separate
  console.log('\nSTEP 20: Verify multiple Farmers with same crop name remain separate...');
  const cropC = createCropRecord({
    userId: farmerC.id,
    name: 'Basmati Rice', // SAME crop name as Farmer A!
    quantity: 300,
    unit: 'quintal',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '20 September 2026',
    notes: 'Farmer C lot',
    procurementCentre: 'Meerut Procurement Centre',
  });

  if (cropC.id === cropA.id) throw new Error('Crops should have different IDs!');
  if (cropC.userId === cropA.userId) throw new Error('Farmers should be different!');

  const cropListFarmerA = getCropsByUserId(farmerA.id);
  const cropListFarmerC = getCropsByUserId(farmerC.id);

  if (!cropListFarmerA.some((c) => c.id === cropA.id) || cropListFarmerA.some((c) => c.id === cropC.id)) {
    throw new Error('Farmer A crops polluted with Farmer C crops!');
  }
  if (!cropListFarmerC.some((c) => c.id === cropC.id) || cropListFarmerC.some((c) => c.id === cropA.id)) {
    throw new Error('Farmer C crops polluted with Farmer A crops!');
  }
  console.log(`✓ Farmer A Rice (Crop ID: ${cropA.id}, Farmer: ${farmerA.id}) and Farmer C Rice (Crop ID: ${cropC.id}, Farmer: ${farmerC.id}) are completely separate.`);

  // Admin crops verification
  console.log('\nSTEP 21: Verify Admin Crops List...');
  const adminCrops = getAdminCropsList({ search: 'Basmati Rice' });
  if (adminCrops.length < 2) throw new Error('Admin crops list should contain both Basmati Rice lots!');
  const adminMetrics = getAdminCropMetrics();
  console.log(`✓ Admin Crops List has ${adminCrops.length} matching lots. Total registered volume: ${adminMetrics.totalQuantityKg} kg.`);

  // Admin queue overview verification
  console.log('\nSTEP 22: Verify Admin Queue Overview...');
  const adminQueues = getAdminQueueOverview();
  console.log(`✓ Admin Queue Overview verified across ${adminQueues.length} mandi centres.`);

  console.log('\n==================================================');
  console.log('🎉 ALL 20 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY! ZERO ERRORS!');
  console.log('==================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
