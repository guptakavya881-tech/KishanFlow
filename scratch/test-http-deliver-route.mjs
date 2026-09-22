/**
 * Test HTTP deliver endpoint directly: PATCH /api/supplier/orders
 */
async function testHttpDeliverEndpoint() {
  console.log('Testing HTTP /api/supplier/orders deliver action...');

  // Order 17 was paid in the previous test
  const res = await fetch('http://localhost:3000/api/supplier/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: 17,
      action: 'deliver',
    }),
  });

  const json = await res.json();
  console.log('HTTP Deliver Response status:', res.status);
  console.log('HTTP Deliver Response json:', json);

  if (res.status === 200 && json.success && json.data.status === 'DELIVERED' && json.data.paymentStatus === 'PAID') {
    console.log('✓ HTTP Deliver endpoint works flawlessly!');
  } else {
    console.error('✗ Failed HTTP deliver test');
    process.exit(1);
  }
}

testHttpDeliverEndpoint().catch((err) => {
  console.error(err);
  process.exit(1);
});
