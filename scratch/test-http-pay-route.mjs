/**
 * Test HTTP pay endpoint directly: POST /api/farmer/supplier-orders/[id]/pay
 */
import {
  getDatabase,
  createSupplierOrderForFarmer,
  confirmSupplierOrder,
} from '../src/lib/db.js';

async function testHttpPaymentEndpoint() {
  console.log('Testing HTTP /api/farmer/supplier-orders/[id]/pay endpoint...');
  const db = getDatabase();
  const farmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
  const supplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
  const product = db.prepare('SELECT * FROM supplier_products WHERE supplierId = ? LIMIT 1').get(supplier.id);

  // Create order
  const order = createSupplierOrderForFarmer(farmer.id, {
    productId: product.id,
    quantity: 1,
    deliveryAddress: 'Http Route Test Yard',
  });

  // Supplier confirms order
  confirmSupplierOrder(order.id, supplier.id);

  // Call POST /api/farmer/supplier-orders/[id]/pay
  const payUrl = `http://localhost:3000/api/farmer/supplier-orders/${order.id}/pay`;
  console.log('Posting to:', payUrl);

  const res = await fetch(payUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethod: 'UPI / Bharat QR (Simulated Instant)',
    }),
  });

  const json = await res.json();
  console.log('HTTP Response status:', res.status);
  console.log('HTTP Response json:', json);

  if (res.status === 200 && json.success && json.data.paymentStatus === 'PAID') {
    console.log('✓ HTTP Payment endpoint works flawlessly!');
  } else {
    console.error('✗ Failed HTTP payment test');
    process.exit(1);
  }
}

testHttpPaymentEndpoint().catch((err) => {
  console.error(err);
  process.exit(1);
});
