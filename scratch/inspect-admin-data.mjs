import { getDatabase } from '../src/lib/db.js';

const db = getDatabase();

console.log('--- USERS ---');
console.log(db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all());
console.log('Sample users:', db.prepare('SELECT id, fullName, email, mobile, role FROM users LIMIT 5').all());

console.log('--- CROPS ---');
console.log('Total crops:', db.prepare('SELECT COUNT(*) as count FROM crops').get());
console.log('Harvest status counts:', db.prepare('SELECT harvestStatus, COUNT(*) as count FROM crops GROUP BY harvestStatus').all());

console.log('--- ORDERS ---');
console.log('Total orders:', db.prepare('SELECT COUNT(*) as count FROM orders').get());
console.log('Order status counts:', db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all());
console.log('Payment status counts:', db.prepare('SELECT paymentStatus, COUNT(*) as count FROM orders GROUP BY paymentStatus').all());

console.log('--- PAYMENTS ---');
console.log('Total payments:', db.prepare('SELECT COUNT(*) as count FROM payments').get());
console.log('Payment status counts:', db.prepare('SELECT status, paymentStatus, COUNT(*) as count FROM payments GROUP BY status, paymentStatus').all());
console.log('Sample payments:', db.prepare('SELECT * FROM payments LIMIT 3').all());

console.log('--- PROCUREMENT CENTRES ---');
console.log('Total centres:', db.prepare('SELECT COUNT(*) as count FROM procurement_centres').get());
console.log('Sample centres:', db.prepare('SELECT * FROM procurement_centres LIMIT 3').all());

console.log('--- BOOKINGS ---');
console.log('Total bookings:', db.prepare('SELECT COUNT(*) as count FROM bookings').get());
console.log('Booking status counts:', db.prepare('SELECT status, COUNT(*) as count FROM bookings GROUP BY status').all());
