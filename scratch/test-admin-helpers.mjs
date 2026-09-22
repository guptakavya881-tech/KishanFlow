import {
  getAdminFarmers,
  getAdminFarmerDetails,
  getAdminBuyers,
  getAdminBuyerDetails,
  getAdminNotifications
} from '../src/lib/db.js';

console.log('Testing getAdminFarmers:');
const farmers = getAdminFarmers();
console.log('Total farmers returned:', farmers.length);
console.log('First farmer:', farmers[0]);

if (farmers[0]) {
  console.log('\nTesting getAdminFarmerDetails:');
  const details = getAdminFarmerDetails(farmers[0].id);
  console.log('Farmer:', details.farmer.fullName);
  console.log('Crops count:', details.crops.length);
  console.log('Orders count:', details.orders.length);
  console.log('Bookings count:', details.bookings.length);
}

console.log('\nTesting getAdminBuyers:');
const buyers = getAdminBuyers();
console.log('Total buyers returned:', buyers.length);
console.log('First buyer:', buyers[0]);

if (buyers[0]) {
  console.log('\nTesting getAdminBuyerDetails:');
  const bDetails = getAdminBuyerDetails(buyers[0].id);
  console.log('Buyer:', bDetails.buyer.fullName);
  console.log('Orders count:', bDetails.orders.length);
  console.log('Payments count:', bDetails.payments.length);
}

console.log('\nTesting getAdminNotifications:');
const notifs = getAdminNotifications();
console.log('Notifications returned:', notifs.notifications.length);
console.log('Unread count:', notifs.unreadCount);
console.log('First notification:', notifs.notifications[0]);
