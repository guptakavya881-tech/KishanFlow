import { getDatabase } from '../src/lib/db.js';

const db = getDatabase();

console.log('Roles in users table:');
console.log(db.prepare("SELECT role, count(*) as count FROM users GROUP BY role").all());

console.log('\nSample farmers:');
const farmers = db.prepare(`
  SELECT u.id, u.fullName, u.email, u.mobile, u.location, u.createdAt, u.accountStatus,
         COUNT(c.id) as cropCount
  FROM users u
  LEFT JOIN crops c ON c.userId = u.id
  WHERE u.role = 'farmer'
  GROUP BY u.id
  LIMIT 3
`).all();
console.log(farmers);

console.log('\nSample buyers:');
const buyers = db.prepare(`
  SELECT u.id, u.fullName, u.companyName, u.email, u.mobile, u.location, u.createdAt, u.accountStatus,
         COUNT(o.id) as orderCount
  FROM users u
  LEFT JOIN orders o ON o.buyerId = u.id
  WHERE u.role = 'buyer'
  GROUP BY u.id
  LIMIT 3
`).all();
console.log(buyers);

console.log('\nNotifications table structure & count:');
console.log('Total notifications:', db.prepare("SELECT count(*) as count FROM notifications").get());
console.log('Sample notifications:', db.prepare("SELECT * FROM notifications ORDER BY id DESC LIMIT 3").all());
