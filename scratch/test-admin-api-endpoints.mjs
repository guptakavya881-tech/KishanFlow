import { getDatabase, getUserByEmail } from '../src/lib/db.js';

async function testApi() {
  const db = getDatabase();
  const admin = getUserByEmail('admin@kisanflow.com') || db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
  console.log('Admin user found:', admin ? `ID=${admin.id}, Email=${admin.email}` : 'None');

  // Test crops API route logic
  const { GET: getCrops } = await import('../src/app/api/admin/crops/route.js');
  const req1 = new Request('http://localhost:3000/api/admin/crops?search=Rice');
  // Mock getCurrentUser for the test or test the route directly
}

testApi();
