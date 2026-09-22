async function test() {
  try {
    // 1. Farmers list
    const resFarmers = await fetch('http://localhost:3000/api/admin/farmers');
    const fData = await resFarmers.json();
    console.log('Farmers API:', fData.success, 'Count:', fData.data?.farmers?.length);
    if (fData.data?.farmers?.length > 0) {
      const firstFarmer = fData.data.farmers[0];
      console.log('Sample Farmer:', firstFarmer.fullName, firstFarmer.email, firstFarmer.mobile);
      
      // Test farmer details
      const resDetails = await fetch(`http://localhost:3000/api/admin/farmers?id=${firstFarmer.id}`);
      const dData = await resDetails.json();
      console.log('Farmer Details API:', dData.success, 'Crops:', dData.data?.crops?.length, 'Orders:', dData.data?.orders?.length, 'Bookings:', dData.data?.bookings?.length);
    }

    // 2. Buyers list
    const resBuyers = await fetch('http://localhost:3000/api/admin/buyers');
    const bData = await resBuyers.json();
    console.log('Buyers API:', bData.success, 'Count:', bData.data?.buyers?.length);
    if (bData.data?.buyers?.length > 0) {
      const firstBuyer = bData.data.buyers[0];
      console.log('Sample Buyer:', firstBuyer.fullName, firstBuyer.companyName, firstBuyer.email);

      // Test buyer details
      const resBDetails = await fetch(`http://localhost:3000/api/admin/buyers?id=${firstBuyer.id}`);
      const bdData = await resBDetails.json();
      console.log('Buyer Details API:', bdData.success, 'Orders:', bdData.data?.orders?.length, 'Payments:', bdData.data?.payments?.length);
    }

    // 3. Notifications
    const resNotifs = await fetch('http://localhost:3000/api/admin/notifications');
    const nData = await resNotifs.json();
    console.log('Notifs API:', nData.success, 'Count:', nData.data?.notifications?.length, 'Unread:', nData.data?.unreadCount);

    // 4. Admin Dashboard API check for strict user separation
    const resDash = await fetch('http://localhost:3000/api/admin/dashboard');
    const dashData = await resDash.json();
    console.log('Dashboard API:', dashData.success, 'Stats Farmers:', dashData.data?.stats?.totalFarmers, 'Stats Buyers:', dashData.data?.stats?.totalBuyers);
    console.log('Dashboard UsersOverview Farmers:', dashData.data?.usersOverview?.farmersCount, 'RecentFarmers:', dashData.data?.usersOverview?.recentFarmers?.length);
    console.log('Dashboard UsersOverview Buyers:', dashData.data?.usersOverview?.buyersCount, 'RecentBuyers:', dashData.data?.usersOverview?.recentBuyers?.length);
  } catch (err) {
    console.error(err);
  }
}

test();
