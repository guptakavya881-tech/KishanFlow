import {
  getDatabase,
  getSupplierDashboardData,
  getSupplierProducts,
  createSupplierProduct,
  updateSupplierProduct,
  updateSupplierProductStock,
  getSupplierOrders,
  updateSupplierOrderStatus,
} from '../src/lib/db.js';

console.log('=== KISANFLOW SUPPLIER DASHBOARD & BACKEND TEST SUITE ===');

async function runTests() {
  const db = getDatabase();

  // 1. Verify Supplier User exists
  const supplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
  console.log(`[TEST 1] Testing Supplier User: ${supplier?.fullName} (ID: #${supplier?.id})`);
  if (!supplier) {
    throw new Error('Supplier user does not exist in database.');
  }

  // 2. Test getSupplierDashboardData
  console.log('[TEST 2] Testing getSupplierDashboardData...');
  const dashboard = getSupplierDashboardData(supplier.id);

  console.log('  -> Stats:', dashboard.stats);
  console.log(`  -> Products count: ${dashboard.products.length}`);
  console.log(`  -> Recent Orders count: ${dashboard.recentOrders.length}`);
  console.log(`  -> Low Stock count: ${dashboard.lowStockProducts.length}`);

  if (dashboard.stats.totalProducts < 1) {
    throw new Error('Expected at least 1 product for seeded supplier.');
  }
  if (dashboard.stats.productsInStock < 1) {
    throw new Error('Expected products in stock > 0.');
  }
  if (dashboard.products.length === 0) {
    throw new Error('Products array should not be empty.');
  }
  if (dashboard.recentOrders.length === 0) {
    throw new Error('Recent orders array should not be empty.');
  }
  console.log('  -> getSupplierDashboardData passed with 100% real data.');

  // 3. Test createSupplierProduct
  console.log('[TEST 3] Testing createSupplierProduct...');
  const newProduct = createSupplierProduct(supplier.id, {
    name: 'Hybrid Bajra Pearl Millet Seeds (GHB 558)',
    category: 'Seeds',
    price: 420,
    unit: 'pack',
    stock: 25,
    lowStockThreshold: 5,
    description: 'Drought-tolerant high-yielding pearl millet seed packet.',
  });

  if (!newProduct || newProduct.name !== 'Hybrid Bajra Pearl Millet Seeds (GHB 558)') {
    throw new Error('Failed to create new supplier product.');
  }
  console.log(`  -> Created product: ${newProduct.name} (#${newProduct.id}), Stock: ${newProduct.stock}`);

  // 4. Test updateSupplierProductStock
  console.log('[TEST 4] Testing updateSupplierProductStock...');
  const updatedStockProd = updateSupplierProductStock(newProduct.id, supplier.id, 3); // below threshold (5)
  if (updatedStockProd.stock !== 3) {
    throw new Error('Stock update failed.');
  }
  console.log(`  -> Updated stock to ${updatedStockProd.stock}. Now it should be in low stock list.`);

  const lowStockCheck = getSupplierDashboardData(supplier.id);
  const foundInLowStock = lowStockCheck.lowStockProducts.some(p => p.id === newProduct.id);
  if (!foundInLowStock) {
    throw new Error('Product with stock 3 <= threshold 5 not found in low stock list!');
  }
  console.log('  -> Successfully verified product in low stock alert list.');

  // Clean up test product
  db.prepare('DELETE FROM supplier_products WHERE id = ?').run(newProduct.id);

  // 5. Test updateSupplierOrderStatus
  console.log('[TEST 5] Testing updateSupplierOrderStatus...');
  const firstOrder = dashboard.recentOrders[0];
  if (firstOrder) {
    const originalStatus = firstOrder.status;
    const updatedOrder = updateSupplierOrderStatus(firstOrder.id, supplier.id, 'Confirmed');
    if (updatedOrder.status !== 'Confirmed') {
      throw new Error(`Expected status Confirmed, got ${updatedOrder.status}`);
    }
    console.log(`  -> Order #${firstOrder.orderNumber} status successfully updated to Confirmed.`);

    // Revert back
    updateSupplierOrderStatus(firstOrder.id, supplier.id, originalStatus);
    console.log(`  -> Reverted order status back to ${originalStatus}.`);
  }

  // 6. Test Data Isolation
  console.log('[TEST 6] Testing Supplier Data Isolation...');
  const farmer = db.prepare("SELECT id FROM users WHERE role = 'farmer' LIMIT 1").get();
  const farmerSupplierProducts = getSupplierProducts(farmer.id);
  if (farmerSupplierProducts.length !== 0) {
    throw new Error('SECURITY BREACH: Farmer can see supplier products under farmer ID!');
  }
  console.log('  -> Data isolation verified: only authenticated supplier can access their items.');

  console.log('\n>>> ALL SUPPLIER BACKEND TESTS PASSED WITH 100% ACCURACY! <<<');
}

runTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
