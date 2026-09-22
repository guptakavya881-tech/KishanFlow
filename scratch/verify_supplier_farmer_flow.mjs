import assert from 'node:assert';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING COMPLETE SUPPLIER ↔ FARMER ORDER TESTS');
  console.log('====================================================');

  const BASE_URL = 'http://localhost:3000';

  // Helper for logging in
  async function login(identifier, password, role) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role }),
    });
    const cookie = res.headers.get('set-cookie');
    const data = await res.json();
    return { status: res.status, cookie, user: data.user };
  }

  // ========================================================
  // TEST A: FARMER CREATES ORDER
  // ========================================================
  console.log('\n--- TEST A: FARMER CREATES ORDER ---');
  const farmerAuth = await login('farmer@kishanflow.com', 'Farmer@12345', 'farmer');
  console.log('1. Farmer login:', farmerAuth.status, farmerAuth.user.fullName, `(ID: ${farmerAuth.user.id})`);
  assert.strictEqual(farmerAuth.status, 200, 'Farmer login must succeed');

  // 2. Fetch available supplier products
  const productsRes = await fetch(`${BASE_URL}/api/farmer/supplier-products`, {
    headers: { cookie: farmerAuth.cookie },
  });
  console.log('2. GET /api/farmer/supplier-products status:', productsRes.status);
  const productsData = await productsRes.json();
  assert.ok(productsData.success, 'Catalog fetch must succeed');
  assert.ok(productsData.data.length > 0, 'Must have active supplier products');

  // Pick a product belonging to AgriSupply Logistics Co. (supplierId: 2)
  const targetProduct = productsData.data.find(p => p.name.includes('Sharbati Wheat Seeds')) || productsData.data[0];
  console.log(`   Selected Product: "${targetProduct.name}" (ID: ${targetProduct.id}, Supplier ID: ${targetProduct.supplierId}, Stock: ${targetProduct.stock}, Price: ₹${targetProduct.price})`);

  // 3 & 4. Place an order for 2 units
  const orderQty = 2;
  const initialStock = targetProduct.stock;
  const orderRes = await fetch(`${BASE_URL}/api/farmer/supplier-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: farmerAuth.cookie,
    },
    body: JSON.stringify({
      productId: targetProduct.id,
      quantity: orderQty,
      deliveryAddress: 'Village Kanker, Block 2, Meerut Mandi Area',
    }),
  });
  console.log('3. POST /api/farmer/supplier-orders status:', orderRes.status);
  const orderData = await orderRes.json();
  assert.strictEqual(orderRes.status, 201, 'Order placement must return 201');
  assert.ok(orderData.success, 'Order creation must be successful');
  const createdOrder = orderData.data;
  console.log(`4. Order Created: ${createdOrder.orderNumber} (ID: ${createdOrder.id}, Status: ${createdOrder.status})`);
  assert.strictEqual(createdOrder.status, 'Pending', 'Initial status must be Pending');
  assert.strictEqual(createdOrder.quantity, orderQty, 'Quantity must match');

  // 5 & 6. Verify Farmer can see order in "My Supplier Orders"
  const farmerOrdersRes = await fetch(`${BASE_URL}/api/farmer/supplier-orders`, {
    headers: { cookie: farmerAuth.cookie },
  });
  const farmerOrdersData = await farmerOrdersRes.json();
  assert.ok(farmerOrdersData.success, 'Fetch farmer supplier orders must succeed');
  const foundFarmerOrder = farmerOrdersData.data.find(o => o.id === createdOrder.id);
  assert.ok(foundFarmerOrder, 'Created order must be in farmer list');
  console.log('5. Farmer sees order in My Supplier Orders:', foundFarmerOrder.orderNumber, 'Status:', foundFarmerOrder.status);

  // Check inventory reduction
  const productsAfterRes = await fetch(`${BASE_URL}/api/farmer/supplier-products`, {
    headers: { cookie: farmerAuth.cookie },
  });
  const productsAfterData = await productsAfterRes.json();
  const productAfter = productsAfterData.data.find(p => p.id === targetProduct.id);
  console.log(`6. Stock reduced from ${initialStock} -> ${productAfter.stock} (Deducted: ${orderQty})`);
  assert.strictEqual(productAfter.stock, initialStock - orderQty, 'Stock must be correctly decremented');

  // ========================================================
  // TEST B: SUPPLIER RECEIVES ORDER
  // ========================================================
  console.log('\n--- TEST B: SUPPLIER RECEIVES ORDER ---');
  const supplierAuth = await login('supplier@kishanflow.com', 'Supplier@12345', 'supplier');
  console.log('1. Supplier login:', supplierAuth.status, supplierAuth.user.fullName, `(ID: ${supplierAuth.user.id})`);
  assert.strictEqual(supplierAuth.status, 200, 'Supplier login must succeed');

  // 2 & 3. Check Supplier Dashboard
  const dashRes = await fetch(`${BASE_URL}/api/supplier/dashboard`, {
    headers: { cookie: supplierAuth.cookie },
  });
  const dashData = await dashRes.json();
  assert.ok(dashData.success, 'Supplier dashboard fetch must succeed');
  const dashRecentOrder = dashData.data.recentOrders.find(o => o.id === createdOrder.id);
  assert.ok(dashRecentOrder, 'Order must appear in Supplier Recent Orders');
  console.log('2. Order found in Supplier Dashboard Recent Orders:', dashRecentOrder.orderNumber);

  // 4, 5 & 6. Check Supplier Orders page
  const supplierOrdersRes = await fetch(`${BASE_URL}/api/supplier/orders`, {
    headers: { cookie: supplierAuth.cookie },
  });
  const supplierOrdersData = await supplierOrdersRes.json();
  assert.ok(supplierOrdersData.success, 'Supplier orders fetch must succeed');
  const foundSupplierOrder = supplierOrdersData.data.find(o => o.id === createdOrder.id);
  assert.ok(foundSupplierOrder, 'Order must appear in Supplier Orders table');
  console.log('3. Supplier sees order:', {
    orderNumber: foundSupplierOrder.orderNumber,
    farmer: foundSupplierOrder.farmerName,
    product: foundSupplierOrder.productName,
    quantity: foundSupplierOrder.quantity,
    total: foundSupplierOrder.totalAmount,
    status: foundSupplierOrder.status,
  });
  assert.strictEqual(foundSupplierOrder.orderNumber, createdOrder.orderNumber);
  assert.strictEqual(foundSupplierOrder.farmerName, farmerAuth.user.fullName);
  assert.strictEqual(foundSupplierOrder.quantity, orderQty);
  assert.strictEqual(foundSupplierOrder.totalAmount, targetProduct.price * orderQty);

  // ========================================================
  // TEST C: STATUS SYNCHRONIZATION
  // ========================================================
  console.log('\n--- TEST C: STATUS SYNCHRONIZATION ---');
  const statuses = ['Confirmed', 'Shipped', 'Delivered'];

  for (const newStatus of statuses) {
    // 1. Supplier updates status
    const updateRes = await fetch(`${BASE_URL}/api/supplier/orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: supplierAuth.cookie,
      },
      body: JSON.stringify({ orderId: createdOrder.id, status: newStatus }),
    });
    const updateData = await updateRes.json();
    assert.ok(updateData.success, `Supplier update to ${newStatus} must succeed`);
    console.log(`1. Supplier changed status to: ${newStatus}`);

    // 2. Farmer checks status
    const checkFarmerRes = await fetch(`${BASE_URL}/api/farmer/supplier-orders`, {
      headers: { cookie: farmerAuth.cookie },
    });
    const checkFarmerData = await checkFarmerRes.json();
    const farmerUpdatedOrder = checkFarmerData.data.find(o => o.id === createdOrder.id);
    assert.strictEqual(farmerUpdatedOrder.status, newStatus, `Farmer must see status ${newStatus}`);
    console.log(`2. Farmer sees synced status: ${farmerUpdatedOrder.status} ✓`);
  }

  // Test Cancellation & Stock Restoration
  console.log('\n--- TEST C2: CANCELLATION & STOCK RESTORATION ---');
  // Place a 2nd order to cancel
  const order2Res = await fetch(`${BASE_URL}/api/farmer/supplier-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: farmerAuth.cookie },
    body: JSON.stringify({ productId: targetProduct.id, quantity: 1 }),
  });
  const order2Data = await order2Res.json();
  const order2 = order2Data.data;
  const stockBeforeCancel = (await (await fetch(`${BASE_URL}/api/farmer/supplier-products`, { headers: { cookie: farmerAuth.cookie } })).json()).data.find(p => p.id === targetProduct.id).stock;

  // Supplier cancels order
  await fetch(`${BASE_URL}/api/supplier/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: supplierAuth.cookie },
    body: JSON.stringify({ orderId: order2.id, status: 'Cancelled' }),
  });

  const stockAfterCancel = (await (await fetch(`${BASE_URL}/api/farmer/supplier-products`, { headers: { cookie: farmerAuth.cookie } })).json()).data.find(p => p.id === targetProduct.id).stock;
  console.log(`Stock before cancel: ${stockBeforeCancel}, Stock after cancel: ${stockAfterCancel} (Restored +1)`);
  assert.strictEqual(stockAfterCancel, stockBeforeCancel + 1, 'Cancelled order must restore product stock');

  // ========================================================
  // TEST D: SECURITY & AUTHORIZATION
  // ========================================================
  console.log('\n--- TEST D: SECURITY & AUTHORIZATION ---');
  // 1. Supplier cannot place farmer orders
  const supplierAsFarmerRes = await fetch(`${BASE_URL}/api/farmer/supplier-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: supplierAuth.cookie },
    body: JSON.stringify({ productId: targetProduct.id, quantity: 1 }),
  });
  console.log('Supplier attempting farmer order creation status:', supplierAsFarmerRes.status);
  assert.strictEqual(supplierAsFarmerRes.status, 401, 'Supplier cannot place farmer orders');

  // 2. Supplier cannot see other supplier's orders
  // Check supplier 2's orders vs supplier 39's orders
  const supplierOrdersList = (await (await fetch(`${BASE_URL}/api/supplier/orders`, { headers: { cookie: supplierAuth.cookie } })).json()).data;
  for (const o of supplierOrdersList) {
    assert.strictEqual(o.supplierId, supplierAuth.user.id, `Order ${o.id} must belong to authenticated supplier ${supplierAuth.user.id}`);
  }
  console.log(`All ${supplierOrdersList.length} orders in Supplier list belong strictly to Supplier ID ${supplierAuth.user.id} ✓`);

  // ========================================================
  // TEST E: UI PAGES & CSS RENDERING
  // ========================================================
  console.log('\n--- TEST E: UI PAGES & CSS RENDERING ---');
  const pagesToTest = [
    { url: '/supplier/dashboard', cookie: supplierAuth.cookie },
    { url: '/supplier/orders', cookie: supplierAuth.cookie },
    { url: '/supplier/support', cookie: supplierAuth.cookie },
    { url: '/supplier/help', cookie: supplierAuth.cookie },
    { url: '/supplier/settings', cookie: supplierAuth.cookie },
    { url: '/farmer/supplier-orders', cookie: farmerAuth.cookie },
  ];

  for (const p of pagesToTest) {
    const res = await fetch(`${BASE_URL}${p.url}`, {
      headers: { cookie: p.cookie },
    });
    console.log(`Route ${p.url} -> HTTP ${res.status}`);
    assert.strictEqual(res.status, 200, `Route ${p.url} must return 200 OK`);
    const html = await res.text();
    assert.ok(html.length > 500, `Route ${p.url} must return non-trivial HTML`);
  }

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
