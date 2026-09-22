import { getDatabase, getActiveQueuesByUserId } from '../src/lib/db.js';

const db = getDatabase();

console.log('=== TESTING QUEUE EDGE CASES ===');

// 1. Farmer with no active bookings
const q8 = getActiveQueuesByUserId(8);
console.log('User 8 active queues (expected 0):', q8.length);
if (q8.length !== 0) throw new Error('User 8 should have 0 active queues');

// 2. 'Your Turn' state
db.prepare("UPDATE bookings SET status = 'Your Turn' WHERE id = 1").run();
const qTurn = getActiveQueuesByUserId(3);
console.log('User 3 with Your Turn:');
console.log('  isYourTurn:', qTurn[0]?.isYourTurn);
console.log('  statusBadge:', qTurn[0]?.statusBadge);
console.log('  peopleAhead:', qTurn[0]?.peopleAhead);
console.log('  estimatedWaitMinutes:', qTurn[0]?.estimatedWaitMinutes);

if (!qTurn[0]?.isYourTurn || qTurn[0]?.peopleAhead !== 0) {
  throw new Error('Your Turn calculation mismatch');
}

// 3. Restore back to 'Confirmed'
db.prepare("UPDATE bookings SET status = 'Confirmed' WHERE id = 1").run();
const qRestored = getActiveQueuesByUserId(3);
console.log('User 3 restored:');
console.log('  isYourTurn:', qRestored[0]?.isYourTurn);
console.log('  statusBadge:', qRestored[0]?.statusBadge);
console.log('  peopleAhead:', qRestored[0]?.peopleAhead);

console.log('=== ALL EDGE CASE TESTS PASSED! ===');
