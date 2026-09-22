import { getDatabase, createBuyerOrder, confirmFarmerOrder } from '../src/lib/db.js';

async function testPaymentEndpoint() {
  const db = getDatabase();
  // The fallback farmer when no auth cookie is present:
  const activeFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id DESC LIMIT 1").get();
  const otherFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' AND id != ? LIMIT 1").get(activeFarmer.id);
  const buyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' LIMIT 1").get();

  // Find or create crop for activeFarmer
  let cropActive = db.prepare("SELECT * FROM crops WHERE userId = ? LIMIT 1").get(activeFarmer.id);
  if (!cropActive) {
    const res = db.prepare("INSERT INTO crops (userId, name, quantity, unit, harvestStatus) VALUES (?, 'Organic Mustard', 500, 'kg', 'Ready for Procurement')").run(activeFarmer.id);
    cropActive = db.prepare("SELECT * FROM crops WHERE id = ?").get(res.lastInsertRowid);
  }

  // Find or create crop for otherFarmer
  let cropOther = db.prepare("SELECT * FROM crops WHERE userId = ? LIMIT 1").get(otherFarmer.id);
  if (!cropOther) {
    const res = db.prepare("INSERT INTO crops (userId, name, quantity, unit, harvestStatus) VALUES (?, 'Wheat Lot', 500, 'kg', 'Ready for Procurement')").run(otherFarmer.id);
    cropOther = db.prepare("SELECT * FROM crops WHERE id = ?").get(res.lastInsertRowid);
  }

  console.log(`Active Farmer in Dev: ID=${activeFarmer.id} (${activeFarmer.fullName})`);
  console.log(`Other Farmer: ID=${otherFarmer.id} (${otherFarmer.fullName})`);

  // 1. Test cross-farmer access: try to set payment on otherFarmer's order
  console.log('\n--- Test Cross-Farmer Security via HTTP ---');
  const orderOther = createBuyerOrder({
    buyerId: buyer.id,
    cropId: cropOther.id,
    quantity: 100,
  });
  confirmFarmerOrder(orderOther.id, otherFarmer.id);

  const crossRes = await fetch(`http://localhost:3000/api/farmer/orders/${orderOther.id}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ finalQuantity: 100, pricePerUnit: 25 }),
  });
  console.log(`Cross-farmer set payment status: ${crossRes.status} (expected 403)`);
  if (crossRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cross-farmer payment setup, got ${crossRes.status}`);
  }

  // 2. Test authorized farmer setting payment on their own order
  console.log('\n--- Test Authorized Farmer Payment Setup via HTTP ---');
  const orderOwn = createBuyerOrder({
    buyerId: buyer.id,
    cropId: cropActive.id,
    quantity: 5,
  });
  confirmFarmerOrder(orderOwn.id, activeFarmer.id);

  const ownRes = await fetch(`http://localhost:3000/api/farmer/orders/${orderOwn.id}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      finalQuantity: 5,
      pricePerUnit: 30,
      notes: 'Mandi deduction applied',
    }),
  });
  console.log(`Authorized farmer set payment status: ${ownRes.status} (expected 200)`);
  const ownJson = await ownRes.json();
  console.log(`Authorized farmer response success: ${ownJson.success}`);
  console.log(`Order totalAmount: ₹${ownJson.data?.order?.totalAmount} (expected 150)`);
  console.log(`Order paymentStatus: ${ownJson.data?.order?.paymentStatus} (expected PENDING)`);

  if (!ownJson.success || ownJson.data?.order?.totalAmount !== 150 || ownJson.data?.order?.paymentStatus !== 'PENDING') {
    throw new Error('Authorized farmer payment setup verification failed');
  }

  // Clean up
  db.prepare("UPDATE orders SET paymentId = NULL WHERE id IN (?, ?)").run(orderOther.id, orderOwn.id);
  db.prepare("DELETE FROM payments WHERE orderId IN (?, ?)").run(orderOther.id, orderOwn.id);
  db.prepare("DELETE FROM orders WHERE id IN (?, ?)").run(orderOther.id, orderOwn.id);
  console.log('\nAll HTTP payment tests passed and cleaned up successfully!');
}

testPaymentEndpoint().catch((err) => {
  console.error(err);
  process.exit(1);
});
