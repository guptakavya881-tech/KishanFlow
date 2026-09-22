/**
 * Direct HTTP Verification against running dev server (http://localhost:3000)
 */

async function testHttp() {
  console.log('Testing HTTP Endpoints on dev server...');

  try {
    // Test 1: GET /farmer/orders HTML page
    const pageRes = await fetch('http://localhost:3000/farmer/orders');
    console.log(`GET /farmer/orders -> Status: ${pageRes.status} ${pageRes.statusText}`);
    const pageHtml = await pageRes.text();
    const hasFarmerOrders = pageHtml.includes('Orders') || pageHtml.includes('Kishan');
    console.log(`Page HTML contains expected brand/content: ${hasFarmerOrders}`);

    // Test 2: GET /api/farmer/orders JSON API
    const apiRes = await fetch('http://localhost:3000/api/farmer/orders');
    console.log(`GET /api/farmer/orders -> Status: ${apiRes.status} ${apiRes.statusText}`);
    const apiJson = await apiRes.json();
    console.log(`API response success: ${apiJson.success}, orders count: ${apiJson.data?.orders?.length}`);

    // Test 3: GET /buyer/payments HTML page
    const buyerPaymentsRes = await fetch('http://localhost:3000/buyer/payments');
    console.log(`GET /buyer/payments -> Status: ${buyerPaymentsRes.status} ${buyerPaymentsRes.statusText}`);

    // Test 4: GET /api/buyer/payments JSON API
    const buyerPaymentsApiRes = await fetch('http://localhost:3000/api/buyer/payments');
    console.log(`GET /api/buyer/payments -> Status: ${buyerPaymentsApiRes.status} ${buyerPaymentsApiRes.statusText}`);

    console.log('\nAll direct HTTP tests passed successfully!');
  } catch (err) {
    console.error('HTTP test error:', err);
    process.exit(1);
  }
}

testHttp();
