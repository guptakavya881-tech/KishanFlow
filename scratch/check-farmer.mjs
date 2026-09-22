import { getDatabase } from '../src/lib/db.js';

const db = getDatabase();
const farmers = db.prepare("SELECT id, fullName, email, mobile, role FROM users WHERE role = 'farmer'").all();
console.log('Farmers in DB:', farmers);
