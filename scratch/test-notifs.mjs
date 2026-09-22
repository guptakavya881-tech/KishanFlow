import { getDatabase } from '../src/lib/db.js';

const db = getDatabase();

console.log('Notification types:');
console.log(db.prepare("SELECT type, count(*) as count FROM notifications GROUP BY type").all());

console.log('\nUnread notifications:');
console.log(db.prepare("SELECT isRead, count(*) as count FROM notifications GROUP BY isRead").all());

console.log('\nSample distinct titles:');
console.log(db.prepare("SELECT DISTINCT title, type FROM notifications LIMIT 10").all());
