import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'kishanflow.db');
  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrency and performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  // Create users table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      mobile TEXT UNIQUE,
      email TEXT UNIQUE,
      location TEXT,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('farmer', 'buyer', 'admin', 'supplier')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create crops table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      harvestStatus TEXT NOT NULL,
      expectedHarvestDate TEXT,
      notes TEXT,
      hasActiveBooking INTEGER DEFAULT 0,
      activeBookingId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create procurement centres table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS procurement_centres (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      distanceKm REAL NOT NULL,
      currentCrowd TEXT DEFAULT 'Low',
      estimatedWaitMins INTEGER DEFAULT 20,
      todayCapacityPercent INTEGER DEFAULT 70,
      availableSlotsCount INTEGER DEFAULT 5,
      recommendedDate TEXT,
      recommendedTimeSlot TEXT,
      isRecommended INTEGER DEFAULT 0,
      recommendationReason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create procurement slots table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS procurement_slots (
      id TEXT PRIMARY KEY,
      centreId TEXT NOT NULL,
      timeSlot TEXT NOT NULL,
      crowdLevel TEXT DEFAULT 'Low',
      estimatedWait INTEGER DEFAULT 18,
      isAvailable INTEGER DEFAULT 1,
      isRecommended INTEGER DEFAULT 0,
      FOREIGN KEY (centreId) REFERENCES procurement_centres(id)
    );
  `);

  // Create bookings table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingNumber TEXT UNIQUE NOT NULL,
      tokenNumber TEXT NOT NULL,
      userId INTEGER NOT NULL,
      cropId INTEGER,
      cropName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      centreId TEXT NOT NULL,
      centreName TEXT NOT NULL,
      centreAddress TEXT,
      date TEXT NOT NULL,
      timeSlot TEXT NOT NULL,
      estimatedWaitMins INTEGER DEFAULT 18,
      status TEXT DEFAULT 'Confirmed',
      procurementAmount REAL DEFAULT 0,
      paymentStatus TEXT,
      transactionId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create notifications table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      timestampText TEXT DEFAULT 'Just now',
      isRead INTEGER DEFAULT 0,
      icon TEXT DEFAULT 'Bell',
      relatedCropId INTEGER,
      relatedBookingId INTEGER,
      relatedToken TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create payments table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      bookingId INTEGER,
      cropName TEXT NOT NULL,
      actualQuantity REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      procurementAmount REAL NOT NULL,
      paymentStatus TEXT NOT NULL,
      transactionId TEXT,
      date TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  // Create real orders table for buyers
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNumber TEXT UNIQUE NOT NULL,
      buyerId INTEGER NOT NULL,
      farmerId INTEGER,
      farmerCropId INTEGER,
      cropId INTEGER,
      cropName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      procurementCentre TEXT,
      centreAddress TEXT,
      bookingToken TEXT,
      expectedDate TEXT,
      status TEXT NOT NULL DEFAULT 'ORDER_REQUESTED',
      statusHistory TEXT,
      paymentStatus TEXT DEFAULT 'Pending',
      totalAmount REAL DEFAULT 0,
      deliveryNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyerId) REFERENCES users(id),
      FOREIGN KEY (farmerId) REFERENCES users(id),
      FOREIGN KEY (cropId) REFERENCES crops(id),
      FOREIGN KEY (farmerCropId) REFERENCES crops(id)
    );
  `);

  // Ensure migration columns exist on orders table
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN farmerId INTEGER REFERENCES users(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN farmerCropId INTEGER REFERENCES crops(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN agreedPrice REAL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN actualQuantity REAL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN paymentId INTEGER REFERENCES payments(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN paidAt DATETIME;'); } catch {}
  try { dbInstance.exec('ALTER TABLE orders ADD COLUMN procurementCentreId TEXT REFERENCES procurement_centres(id);'); } catch {}

  // Backfill farmerId and farmerCropId from existing crop lot if null
  try {
    dbInstance.exec(`
      UPDATE orders
      SET farmerId = (SELECT userId FROM crops WHERE crops.id = orders.cropId),
          farmerCropId = cropId
      WHERE farmerId IS NULL AND cropId IS NOT NULL;
    `);
  } catch {}

  // Backfill procurementCentreId from procurement_centres matching by name or id
  try {
    dbInstance.exec(`
      UPDATE orders
      SET procurementCentreId = (
        SELECT id FROM procurement_centres 
        WHERE procurement_centres.name = orders.procurementCentre 
           OR procurement_centres.id = orders.procurementCentre
        LIMIT 1
      )
      WHERE procurementCentreId IS NULL AND procurementCentre IS NOT NULL;
    `);
  } catch {}

  // Ensure migration columns exist on payments table
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN paymentNumber TEXT;'); } catch {}
  try { dbInstance.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paymentNumber ON payments(paymentNumber);'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN orderId INTEGER REFERENCES orders(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN buyerId INTEGER REFERENCES users(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN farmerId INTEGER REFERENCES users(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN quantity REAL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN amount REAL;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT "INR";'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN status TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN paymentMethod TEXT DEFAULT "Mandi Escrow / Direct DBT";'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN completedAt DATETIME;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN failureReason TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN updatedAt DATETIME;'); } catch {}

  // Ensure optional relation columns exist on notifications table
  try { dbInstance.exec('ALTER TABLE notifications ADD COLUMN relatedCropId INTEGER;'); } catch {}
  try { dbInstance.exec('ALTER TABLE notifications ADD COLUMN relatedBookingId INTEGER;'); } catch {}
  try { dbInstance.exec('ALTER TABLE notifications ADD COLUMN relatedToken TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE notifications ADD COLUMN relatedOrderId INTEGER;'); } catch {}
  try { dbInstance.exec('ALTER TABLE notifications ADD COLUMN actionUrl TEXT;'); } catch {}

  // Ensure optional profile columns exist on users table
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN companyName TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN businessType TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN gstin TEXT;'); } catch {}
  try { dbInstance.exec('ALTER TABLE users ADD COLUMN accountStatus TEXT DEFAULT "Active";'); } catch {}

  // Create support tickets table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId TEXT UNIQUE NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      relatedOrderId INTEGER,
      relatedPaymentId INTEGER,
      status TEXT DEFAULT 'OPEN',
      adminNotes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_support_tickets_userId ON support_tickets(userId);'); } catch {}
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);'); } catch {}

  // Create supplier products table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS supplier_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierId INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'pack',
      stock INTEGER NOT NULL DEFAULT 0,
      lowStockThreshold INTEGER DEFAULT 10,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES users(id)
    );
  `);
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_supplier_products_supplierId ON supplier_products(supplierId);'); } catch {}

  // Create supplier orders table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS supplier_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNumber TEXT UNIQUE NOT NULL,
      supplierId INTEGER NOT NULL,
      farmerId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'Pending',
      deliveryAddress TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES users(id),
      FOREIGN KEY (farmerId) REFERENCES users(id),
      FOREIGN KEY (productId) REFERENCES supplier_products(id)
    );
  `);
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplierId ON supplier_orders(supplierId);'); } catch {}
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_supplier_orders_farmerId ON supplier_orders(farmerId);'); } catch {}

  // Create supplier order items table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS supplier_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES supplier_orders(id),
      FOREIGN KEY (productId) REFERENCES supplier_products(id)
    );
  `);
  try { dbInstance.exec('CREATE INDEX IF NOT EXISTS idx_supplier_order_items_orderId ON supplier_order_items(orderId);'); } catch {}

  // Ensure migration columns exist on supplier_orders
  try { dbInstance.exec("ALTER TABLE supplier_orders ADD COLUMN paymentStatus TEXT DEFAULT 'UNPAID';"); } catch {}
  try { dbInstance.exec('ALTER TABLE supplier_orders ADD COLUMN paymentId INTEGER REFERENCES payments(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE supplier_orders ADD COLUMN paidAt DATETIME;'); } catch {}
  try { dbInstance.exec('ALTER TABLE supplier_orders ADD COLUMN deliveredAt DATETIME;'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN supplierOrderId INTEGER REFERENCES supplier_orders(id);'); } catch {}
  try { dbInstance.exec('ALTER TABLE payments ADD COLUMN supplierId INTEGER REFERENCES users(id);'); } catch {}
  try { dbInstance.exec("UPDATE supplier_orders SET paymentStatus = 'UNPAID' WHERE paymentStatus IS NULL;"); } catch {}
  try { dbInstance.exec("UPDATE supplier_orders SET paymentStatus = 'PAID' WHERE UPPER(status) = 'DELIVERED' AND (paymentStatus IS NULL OR paymentStatus = 'UNPAID');"); } catch {}

  seedDatabase(dbInstance);

  return dbInstance;
}

function seedDatabase(db) {
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');
  if (!existingAdmin) {
    const adminHash = bcrypt.hashSync('Admin@12345', 10);
    db.prepare(`
      INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('System Administrator', 'admin@kishanflow.com', '9999900001', 'HQ Server', adminHash, 'admin');
  }

  // Check if supplier already exists
  const existingSupplier = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('supplier');
  if (!existingSupplier) {
    const supplierHash = bcrypt.hashSync('Supplier@12345', 10);
    db.prepare(`
      INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('AgriSupply Logistics Co.', 'supplier@kishanflow.com', '9876543210', 'Agri-Logistics Hub, Warehouse 4', supplierHash, 'supplier');
  }

  // Check if demo farmer exists
  let farmerUser = db.prepare('SELECT id, fullName FROM users WHERE email = ? LIMIT 1').get('farmer@kishanflow.com');
  if (!farmerUser) {
    const farmerHash = bcrypt.hashSync('Farmer@12345', 10);
    const res = db.prepare(`
      INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Anshika Bhandari', 'farmer@kishanflow.com', '9820123456', 'Meerut, Uttar Pradesh', farmerHash, 'farmer');
    farmerUser = { id: res.lastInsertRowid, fullName: 'Anshika Bhandari' };
  } else if (farmerUser.fullName !== 'Anshika Bhandari') {
    // Keep aligned with visual reference
    db.prepare('UPDATE users SET fullName = ?, location = ? WHERE id = ?').run('Anshika Bhandari', 'Meerut, Uttar Pradesh', farmerUser.id);
  }

  // Also check if user 7 is present and ensure consistent profile
  const user7 = db.prepare('SELECT id, fullName FROM users WHERE id = 7').get();
  if (user7 && !user7.fullName) {
    db.prepare('UPDATE users SET fullName = ? WHERE id = 7').run('Anshika Bhandari');
  }

  // Check if demo buyer exists
  const existingBuyer = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('buyer');
  if (!existingBuyer) {
    const buyerHash = bcrypt.hashSync('Buyer@12345', 10);
    db.prepare(`
      INSERT INTO users (fullName, email, mobile, location, passwordHash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Priya Sharma', 'buyer@kishanflow.com', '9820654321', 'Mumbai Central Market', buyerHash, 'buyer');
  }

  // Seed procurement centres
  const centreCount = db.prepare('SELECT count(*) as count FROM procurement_centres').get()?.count || 0;
  if (centreCount === 0) {
    const centres = [
      {
        id: 'centre-1',
        name: 'Meerut Procurement Centre',
        address: 'Mandi Samiti Compound, Delhi Road, Meerut, UP',
        distanceKm: 8.4,
        currentCrowd: 'Low',
        estimatedWaitMins: 18,
        todayCapacityPercent: 72,
        availableSlotsCount: 6,
        recommendedDate: '18 September 2026',
        recommendedTimeSlot: '11:30 AM – 12:00 PM',
        isRecommended: 1,
        recommendationReason: 'Good availability and lowest current queue for your crop quantity.',
      },
      {
        id: 'centre-2',
        name: 'Hapur Procurement Centre',
        address: 'Tehsil Road, Grain Market, Hapur, UP',
        distanceKm: 14.5,
        currentCrowd: 'Medium',
        estimatedWaitMins: 26,
        todayCapacityPercent: 84,
        availableSlotsCount: 4,
        recommendedDate: '18 September 2026',
        recommendedTimeSlot: '10:00 AM – 10:30 AM',
        isRecommended: 0,
        recommendationReason: 'Moderate queue load with steady unloading turnaround.',
      },
      {
        id: 'centre-3',
        name: 'Modinagar Procurement Centre',
        address: 'NH-58 Bypass, Near Sugar Mill, Modinagar, UP',
        distanceKm: 15.2,
        currentCrowd: 'Medium',
        estimatedWaitMins: 34,
        todayCapacityPercent: 90,
        availableSlotsCount: 3,
        recommendedDate: '18 September 2026',
        recommendedTimeSlot: '01:00 PM – 01:30 PM',
        isRecommended: 0,
        recommendationReason: 'Higher capacity but slightly higher waiting queue today.',
      },
      {
        id: 'centre-4',
        name: 'Muzaffarnagar Procurement Centre',
        address: 'Naveen Mandi Sthal, Roorkee Road, Muzaffarnagar, UP',
        distanceKm: 32.0,
        currentCrowd: 'Medium',
        estimatedWaitMins: 22,
        todayCapacityPercent: 68,
        availableSlotsCount: 5,
        recommendedDate: '19 September 2026',
        recommendedTimeSlot: '10:00 AM – 10:30 AM',
        isRecommended: 0,
        recommendationReason: 'Large capacity depot suitable for high volume harvests.',
      },
      {
        id: 'centre-5',
        name: 'Ghaziabad Procurement Centre',
        address: 'Govindpuri Mandi, Ghaziabad, UP',
        distanceKm: 22.0,
        currentCrowd: 'Low',
        estimatedWaitMins: 20,
        todayCapacityPercent: 65,
        availableSlotsCount: 5,
        recommendedDate: '18 September 2026',
        recommendedTimeSlot: '03:00 PM – 03:30 PM',
        isRecommended: 0,
        recommendationReason: 'Low crowd density with automated moisture testing.',
      },
    ];

    const insertCentre = db.prepare(`
      INSERT INTO procurement_centres (id, name, address, distanceKm, currentCrowd, estimatedWaitMins, todayCapacityPercent, availableSlotsCount, recommendedDate, recommendedTimeSlot, isRecommended, recommendationReason)
      VALUES (@id, @name, @address, @distanceKm, @currentCrowd, @estimatedWaitMins, @todayCapacityPercent, @availableSlotsCount, @recommendedDate, @recommendedTimeSlot, @isRecommended, @recommendationReason)
    `);

    for (const c of centres) {
      insertCentre.run(c);
    }

    // Seed sample slots
    const insertSlot = db.prepare(`
      INSERT INTO procurement_slots (id, centreId, timeSlot, crowdLevel, estimatedWait, isAvailable, isRecommended)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertSlot.run('slot-101', 'centre-1', '09:00 AM – 09:30 AM', 'Medium', 25, 1, 0);
    insertSlot.run('slot-102', 'centre-1', '10:00 AM – 10:30 AM', 'Low', 20, 1, 0);
    insertSlot.run('slot-103', 'centre-1', '11:30 AM – 12:00 PM', 'Low', 18, 1, 1);
    insertSlot.run('slot-104', 'centre-1', '01:00 PM – 01:30 PM', 'High', 40, 1, 0);
    insertSlot.run('slot-105', 'centre-1', '03:00 PM – 03:30 PM', 'Medium', 25, 1, 0);

    insertSlot.run('slot-201', 'centre-2', '10:00 AM – 10:30 AM', 'Medium', 26, 1, 1);
    insertSlot.run('slot-202', 'centre-2', '11:30 AM – 12:00 PM', 'Medium', 24, 1, 0);

    insertSlot.run('slot-301', 'centre-3', '01:00 PM – 01:30 PM', 'Medium', 34, 1, 1);

    insertSlot.run('slot-401', 'centre-4', '10:00 AM – 10:30 AM', 'Medium', 22, 1, 1);

    insertSlot.run('slot-501', 'centre-5', '03:00 PM – 03:30 PM', 'Low', 20, 1, 1);
  }

  // Seed default farmer data for demo farmer user(s)
  const targetUserIds = [farmerUser.id];
  if (user7 && user7.id !== farmerUser.id) {
    targetUserIds.push(user7.id);
  }

  for (const uid of targetUserIds) {
    const cropCount = db.prepare('SELECT count(*) as count FROM crops WHERE userId = ?').get(uid)?.count || 0;
    if (cropCount === 0) {
      const insertCrop = db.prepare(`
        INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertCrop.run(uid, 'Wheat', 1200, 'kg', 'Ready for Procurement', '15 Sep 2026', 'Sharbati premium high quality grain.', 1);
      insertCrop.run(uid, 'Paddy', 850, 'kg', 'Nearly Ready', '28 Sep 2026', 'Basmati long grain paddy harvest scheduled for late September.', 0);
      insertCrop.run(uid, 'Maize', 600, 'kg', 'Growing', '10 Oct 2026', 'Yellow corn variety.', 0);
    }

    const bookingCount = db.prepare('SELECT count(*) as count FROM bookings WHERE userId = ?').get(uid)?.count || 0;
    if (bookingCount === 0) {
      const wheatCrop = db.prepare('SELECT id FROM crops WHERE userId = ? AND name = ? LIMIT 1').get(uid, 'Wheat');
      const insertBooking = db.prepare(`
        INSERT INTO bookings (bookingNumber, tokenNumber, userId, cropId, cropName, quantity, unit, centreId, centreName, centreAddress, date, timeSlot, estimatedWaitMins, status, procurementAmount, paymentStatus, transactionId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // 1 Active Confirmed Booking
      insertBooking.run(
        `KF20260918-1042-${uid}`,
        'KF-247',
        uid,
        wheatCrop ? wheatCrop.id : null,
        'Wheat',
        1200,
        'kg',
        'centre-1',
        'Meerut Procurement Centre',
        'Mandi Samiti Compound, Delhi Road, Meerut, UP',
        '18 September 2026',
        '11:30 AM – 12:00 PM',
        18,
        'Confirmed',
        24600,
        'Pending',
        null
      );

      // 4 Completed Bookings to match Completed Procurements = 4
      insertBooking.run(`KF20260820-0811-${uid}`, 'KF-118', uid, null, 'Paddy', 850, 'kg', 'centre-1', 'Meerut Procurement Centre', 'Mandi Samiti Compound, Delhi Road, Meerut, UP', '20 August 2026', '10:00 AM – 10:30 AM', 15, 'Completed', 18200, 'Payment Received', 'KFPAY78231');
      insertBooking.run(`KF20260714-0402-${uid}`, 'KF-094', uid, null, 'Mustard', 450, 'kg', 'centre-1', 'Meerut Procurement Centre', 'Mandi Samiti Compound, Delhi Road, Meerut, UP', '14 July 2026', '09:30 AM – 10:00 AM', 12, 'Completed', 22500, 'Payment Received', 'KFPAY65109');
      insertBooking.run(`KF20260611-0193-${uid}`, 'KF-061', uid, null, 'Wheat', 980, 'kg', 'centre-2', 'Hapur Procurement Centre', 'Tehsil Road, Grain Market, Hapur, UP', '11 June 2026', '11:00 AM – 11:30 AM', 20, 'Completed', 20580, 'Payment Received', 'KFPAY54192');
      insertBooking.run(`KF20260502-0084-${uid}`, 'KF-032', uid, null, 'Paddy', 600, 'kg', 'centre-1', 'Meerut Procurement Centre', 'Mandi Samiti Compound, Delhi Road, Meerut, UP', '02 May 2026', '02:00 PM – 02:30 PM', 14, 'Completed', 12600, 'Payment Received', 'KFPAY43201');
    }

    const notifCount = db.prepare('SELECT count(*) as count FROM notifications WHERE userId = ?').get(uid)?.count || 0;
    if (notifCount === 0) {
      const insertNotif = db.prepare(`
        INSERT INTO notifications (userId, type, title, description, timestampText, isRead, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertNotif.run(uid, 'booking', 'Your booking for Wheat is confirmed.', 'Your wheat procurement slot is confirmed for 18 September at 11:30 AM.', '2 hours ago', 0, 'CheckCircle2');
      insertNotif.run(uid, 'payment', 'Payment of ₹24,600 has been initiated.', 'Payment for your wheat procurement has been initiated to your Aadhaar-linked account.', '4 hours ago', 0, 'CreditCard');
      insertNotif.run(uid, 'queue', 'Your token KF-247 is approaching.', 'There are 16 farmers ahead. Estimated turn in 32 minutes.', '6 hours ago', 0, 'Users');
      insertNotif.run(uid, 'payment', 'Payment Received', '₹18,200 has been credited for your paddy procurement (Txn: KFPAY78231).', '20 Aug 2026', 1, 'CheckCircle2');
    }

    const paymentCount = db.prepare('SELECT count(*) as count FROM payments WHERE userId = ?').get(uid)?.count || 0;
    if (paymentCount === 0) {
      const insertPayment = db.prepare(`
        INSERT INTO payments (userId, cropName, actualQuantity, unit, procurementAmount, paymentStatus, transactionId, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      // 1 Pending Payment
      insertPayment.run(uid, 'Wheat', 1200, 'kg', 24600, 'Payment Processing', 'Processing...', '18 September 2026');
      // Completed Payment
      insertPayment.run(uid, 'Paddy', 850, 'kg', 18200, 'Payment Received', 'KFPAY78231', '20 August 2026');
    }
  }

  // Seed initial products and orders for supplier if empty
  const supplierUser = db.prepare("SELECT id FROM users WHERE role = 'supplier' LIMIT 1").get();
  if (supplierUser) {
    const prodCount = db.prepare('SELECT COUNT(*) as c FROM supplier_products WHERE supplierId = ?').get(supplierUser.id)?.c || 0;
    if (prodCount === 0) {
      const p1 = db.prepare(`
        INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierUser.id, 'Certified Sharbati Wheat Seeds (PBW 550)', 'Seeds', 850, 'bag', 45, 10, 'Certified high germination wheat seed lot for rabi sowing.');

      const p2 = db.prepare(`
        INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierUser.id, 'Organic NPK Bio-Fertilizer 50kg', 'Fertilizers', 1250, 'bag', 60, 15, 'Granular bio-fertilizer for balanced soil nitrogen and phosphorus enrichments.');

      const p3 = db.prepare(`
        INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierUser.id, 'Micro-Drip Irrigation Lateral Kit (1 Acre)', 'Irrigation Equipment', 3400, 'kit', 6, 10, 'Inline drip emitter tubing, filters, connectors and pressure regulator.');

      const p4 = db.prepare(`
        INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierUser.id, 'Neem Oil Botanical Bio-Pesticide (1L)', 'Pesticides', 450, 'bottle', 4, 10, 'Cold-pressed azadirachtin botanical solution for pest deterrence.');

      const p5 = db.prepare(`
        INSERT INTO supplier_products (supplierId, name, category, price, unit, stock, lowStockThreshold, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierUser.id, 'Ergonomic Steel Hand Cultivator', 'Farm Tools', 650, 'unit', 28, 8, 'Heavy-duty forged carbon steel tines with treated ash-wood handle.');
    }
  }
}

// ==========================================
// USER HELPERS
// ==========================================
export function getUserById(id) {
  const db = getDatabase();
  return db.prepare('SELECT id, fullName, mobile, email, location, companyName, businessType, gstin, accountStatus, role, createdAt, updatedAt FROM users WHERE id = ?').get(id);
}

export function getUserByEmail(email) {
  if (!email) return null;
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
}

export function getUserByMobile(mobile) {
  if (!mobile) return null;
  const trimmed = mobile.trim();
  const cleaned = trimmed.replace(/[\s-]/g, '');
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE mobile = ? OR mobile = ?').get(trimmed, cleaned);
}

export function getUserByEmailOrMobile(identifier, expectedRole) {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  const cleanedMobile = trimmed.replace(/[\s-]/g, '');
  const db = getDatabase();

  // If an expected role is provided, prioritize finding a user with that exact role
  if (expectedRole) {
    const roleLower = String(expectedRole).trim().toLowerCase();
    const roleUser = db.prepare(`
      SELECT * FROM users 
      WHERE role = ?
        AND (
          LOWER(email) = LOWER(?) 
          OR mobile = ? 
          OR mobile = ?
          OR LOWER(fullName) = LOWER(?)
        )
      LIMIT 1
    `).get(roleLower, trimmed, trimmed, cleanedMobile, trimmed);

    if (roleUser) {
      return roleUser;
    }
  }

  // Fallback to checking any user across all roles (allows cross-role detection in login API)
  return db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(email) = LOWER(?) 
       OR mobile = ? 
       OR mobile = ?
       OR LOWER(fullName) = LOWER(?)
    LIMIT 1
  `).get(trimmed, trimmed, cleanedMobile, trimmed);
}

export function createUser({ fullName, mobile, email, location, passwordHash, role }) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (fullName, mobile, email, location, passwordHash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const cleanedMobile = mobile ? mobile.replace(/[\s-]/g, '').trim() : null;
  const result = stmt.run(
    fullName.trim(),
    cleanedMobile,
    email ? email.trim().toLowerCase() : null,
    location ? location.trim() : null,
    passwordHash,
    role ? role.trim().toLowerCase() : role
  );

  return getUserById(result.lastInsertRowid);
}

export function updateUserProfile(userId, { fullName, mobile, email, location, companyName, businessType, gstin }) {
  const db = getDatabase();
  const existingUser = getUserById(userId);
  if (!existingUser) {
    throw new Error('User not found.');
  }

  // Validation: Full Name
  const trimmedName = fullName !== undefined ? String(fullName).trim() : existingUser.fullName;
  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Full name is required and must be at least 2 characters.');
  }

  // Validation: Email
  let trimmedEmail = existingUser.email;
  if (email !== undefined) {
    const rawEmail = String(email || '').trim().toLowerCase();
    if (rawEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        throw new Error('Please enter a valid email address.');
      }
      const emailOwner = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? LIMIT 1').get(rawEmail, userId);
      if (emailOwner) {
        throw new Error('This email address is already registered to another user.');
      }
      trimmedEmail = rawEmail;
    } else {
      trimmedEmail = null;
    }
  }

  // Validation: Mobile
  let trimmedMobile = existingUser.mobile;
  if (mobile !== undefined) {
    const rawMobile = String(mobile || '').trim();
    if (rawMobile) {
      const digitsOnly = rawMobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      const mobileOwner = db.prepare('SELECT id FROM users WHERE mobile = ? AND id != ? LIMIT 1').get(digitsOnly, userId);
      if (mobileOwner) {
        throw new Error('This mobile number is already registered to another user.');
      }
      trimmedMobile = digitsOnly;
    } else {
      trimmedMobile = null;
    }
  }

  const trimmedLocation = location !== undefined ? (location ? String(location).trim() : null) : existingUser.location;
  const trimmedCompany = companyName !== undefined ? (companyName ? String(companyName).trim() : null) : existingUser.companyName;
  const trimmedBusinessType = businessType !== undefined ? (businessType ? String(businessType).trim() : null) : existingUser.businessType;
  const trimmedGstin = gstin !== undefined ? (gstin ? String(gstin).trim().toUpperCase() : null) : existingUser.gstin;

  db.prepare(`
    UPDATE users
    SET fullName = ?,
        mobile = ?,
        email = ?,
        location = ?,
        companyName = ?,
        businessType = ?,
        gstin = ?,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    trimmedName,
    trimmedMobile,
    trimmedEmail,
    trimmedLocation,
    trimmedCompany,
    trimmedBusinessType,
    trimmedGstin,
    userId
  );

  return getUserById(userId);
}

export function getBuyerProfileData(userId) {
  const user = getUserById(userId);
  if (!user) return null;

  const db = getDatabase();
  const orderStats = db.prepare(`
    SELECT
      COUNT(*) as totalOrders,
      SUM(CASE WHEN status IN ('COMPLETED', 'Completed', 'PROCUREMENT_COMPLETED') THEN 1 ELSE 0 END) as completedOrders,
      SUM(CASE WHEN status IN ('ORDER_REQUESTED', 'Order Placed', 'Order Requested', 'CONFIRMED', 'Confirmed', 'PROCUREMENT_SCHEDULED', 'READY_FOR_PROCUREMENT') THEN 1 ELSE 0 END) as activeOrders,
      SUM(CASE WHEN status IN ('CANCELLED', 'Cancelled', 'REJECTED') THEN 1 ELSE 0 END) as cancelledOrders,
      COALESCE(SUM(CASE WHEN status IN ('COMPLETED', 'Completed', 'PROCUREMENT_COMPLETED') THEN quantity ELSE 0 END), 0) as totalVolumeProcured
    FROM orders
    WHERE buyerId = ?
  `).get(userId);

  const paymentStats = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as totalSpent,
      COUNT(CASE WHEN status = 'PAID' THEN 1 END) as successfulPayments,
      COUNT(CASE WHEN status = 'PROCESSING' THEN 1 END) as pendingPayments
    FROM payments
    WHERE buyerId = ?
  `).get(userId);

  return {
    user: {
      id: user.id,
      buyerId: `KF-BUYER-${String(user.id).padStart(4, '0')}`,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      location: user.location,
      companyName: user.companyName || user.fullName,
      businessType: user.businessType || 'Institutional Agribusiness Buyer',
      gstin: user.gstin || null,
      accountStatus: user.accountStatus || 'Active',
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    stats: {
      totalOrders: orderStats?.totalOrders || 0,
      completedOrders: orderStats?.completedOrders || 0,
      activeOrders: orderStats?.activeOrders || 0,
      cancelledOrders: orderStats?.cancelledOrders || 0,
      totalVolumeProcured: orderStats?.totalVolumeProcured || 0,
      totalSpent: paymentStats?.totalSpent || 0,
      successfulPayments: paymentStats?.successfulPayments || 0,
      pendingPayments: paymentStats?.pendingPayments || 0,
    },
  };
}

// ==========================================
// CROPS HELPERS
// ==========================================
export function getActiveBookingForCrop(cropId, userId, cropName) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM bookings
    WHERE userId = ?
      AND (cropId = ? OR (cropName IS NOT NULL AND LOWER(cropName) = LOWER(?)))
      AND status IN ('Confirmed', 'In Queue', 'Upcoming')
    ORDER BY id DESC
    LIMIT 1
  `).get(userId, cropId, cropName || '');
}

export function getCropsByUserId(userId) {
  const db = getDatabase();
  const crops = db.prepare(`
    SELECT id, userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking, activeBookingId, createdAt, updatedAt
    FROM crops
    WHERE userId = ?
    ORDER BY createdAt DESC
  `).all(userId);

  return crops.map((crop) => {
    const activeBooking = getActiveBookingForCrop(crop.id, userId, crop.name);
    return {
      ...crop,
      hasActiveBooking: Boolean(crop.hasActiveBooking || activeBooking),
      activeBookingId: activeBooking ? String(activeBooking.id) : crop.activeBookingId,
      bookingNumber: activeBooking ? activeBooking.bookingNumber : null,
    };
  });
}

export function getCropByIdAndUser(id, userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM crops WHERE id = ? AND userId = ?
  `).get(id, userId);
}

export function createCropRecord({ userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes }) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO crops (userId, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);
  const result = stmt.run(userId, name, Number(quantity), unit || 'kg', harvestStatus, expectedHarvestDate || null, notes || null);
  return getCropByIdAndUser(result.lastInsertRowid, userId);
}

export function updateCropRecord(id, userId, updates) {
  const db = getDatabase();
  const current = getCropByIdAndUser(id, userId);
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const quantity = updates.quantity !== undefined ? Number(updates.quantity) : current.quantity;
  const unit = updates.unit !== undefined ? updates.unit : current.unit;
  const harvestStatus = updates.harvestStatus !== undefined ? updates.harvestStatus : current.harvestStatus;
  const expectedHarvestDate = updates.expectedHarvestDate !== undefined ? updates.expectedHarvestDate : current.expectedHarvestDate;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const hasActiveBooking = updates.hasActiveBooking !== undefined ? updates.hasActiveBooking : current.hasActiveBooking;
  const activeBookingId = updates.activeBookingId !== undefined ? updates.activeBookingId : current.activeBookingId;

  db.prepare(`
    UPDATE crops
    SET name = ?, quantity = ?, unit = ?, harvestStatus = ?, expectedHarvestDate = ?, notes = ?, hasActiveBooking = ?, activeBookingId = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND userId = ?
  `).run(name, quantity, unit, harvestStatus, expectedHarvestDate, notes, hasActiveBooking, activeBookingId, id, userId);

  return getCropByIdAndUser(id, userId);
}

export function deleteCropRecord(id, userId) {
  const db = getDatabase();
  const crop = getCropByIdAndUser(id, userId);
  if (!crop) return false;

  const activeBooking = getActiveBookingForCrop(id, userId, crop.name);
  if (crop.hasActiveBooking || activeBooking) {
    const error = new Error('This crop has an active procurement booking. Please manage or cancel the booking before removing this crop.');
    error.hasActiveBooking = true;
    error.booking = activeBooking;
    throw error;
  }
  const result = db.prepare('DELETE FROM crops WHERE id = ? AND userId = ?').run(id, userId);
  return result.changes > 0;
}

// ==========================================
// BOOKED CROPS HELPERS (My Crops = Active Booked Crops)
// ==========================================
export function getBookedCropsByUserId(userId) {
  const db = getDatabase();
  // Fetch active/upcoming/confirmed/in queue bookings belonging to this farmer
  const activeBookings = db.prepare(`
    SELECT * FROM bookings
    WHERE userId = ?
      AND status IN ('Confirmed', 'Upcoming', 'In Queue', 'Active')
    ORDER BY createdAt DESC
  `).all(userId);

  return activeBookings.map((booking) => {
    let crop = null;
    if (booking.cropId) {
      crop = db.prepare('SELECT * FROM crops WHERE id = ? AND userId = ?').get(booking.cropId, userId);
    }
    if (!crop && booking.cropName) {
      crop = db.prepare('SELECT * FROM crops WHERE userId = ? AND LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1').get(userId, booking.cropName);
    }

    return {
      id: crop ? crop.id : `booking-${booking.id}`,
      cropId: crop ? crop.id : null,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      tokenNumber: booking.tokenNumber,
      name: booking.cropName || crop?.name || 'Crop',
      quantity: booking.quantity !== undefined ? booking.quantity : (crop?.quantity || 0),
      unit: booking.unit || crop?.unit || 'kg',
      expectedHarvestDate: crop?.expectedHarvestDate || booking.date || 'Flexible',
      procurementCentre: booking.centreName,
      centreAddress: booking.centreAddress,
      bookingDate: booking.date,
      bookingTimeSlot: booking.timeSlot,
      status: booking.status || 'Confirmed',
      harvestStatus: crop?.harvestStatus || 'Ready for Procurement',
      hasActiveBooking: true,
      notes: crop?.notes || null,
      createdAt: booking.createdAt,
    };
  });
}

export function removeBookedCropRecord({ id, userId, bookingId, cropId }) {
  const db = getDatabase();

  let booking = null;
  const targetBookingId = bookingId || id;

  // 1. If an explicit bookingId or id is provided, search bookings table for authenticated user
  if (targetBookingId !== undefined && targetBookingId !== null) {
    const numId = Number(targetBookingId);
    if (!isNaN(numId) && numId > 0) {
      booking = db.prepare(`
        SELECT * FROM bookings
        WHERE id = ? AND userId = ?
      `).get(numId, userId);
    }
    if (!booking) {
      booking = db.prepare(`
        SELECT * FROM bookings
        WHERE bookingNumber = ? AND userId = ?
      `).get(String(targetBookingId), userId);
    }
  }

  // 2. If booking not found yet and cropId is provided, check booking by cropId
  const targetCropId = cropId || (!booking ? id : null);
  if (!booking && targetCropId !== undefined && targetCropId !== null) {
    const numCropId = Number(targetCropId);
    if (!isNaN(numCropId) && numCropId > 0) {
      booking = db.prepare(`
        SELECT * FROM bookings
        WHERE cropId = ? AND userId = ? AND status IN ('Confirmed', 'Upcoming', 'In Queue', 'Active')
        ORDER BY id DESC LIMIT 1
      `).get(numCropId, userId);
    }
  }

  // 3. Resolve the crop record
  let crop = null;
  if (booking?.cropId) {
    crop = db.prepare('SELECT * FROM crops WHERE id = ? AND userId = ?').get(booking.cropId, userId);
  }
  if (!crop && targetCropId !== undefined && targetCropId !== null) {
    const numCropId = Number(targetCropId);
    if (!isNaN(numCropId) && numCropId > 0) {
      crop = db.prepare('SELECT * FROM crops WHERE id = ? AND userId = ?').get(numCropId, userId);
    }
  }

  // If still no booking found but crop exists, check active booking by cropName
  if (!booking && crop) {
    booking = db.prepare(`
      SELECT * FROM bookings
      WHERE userId = ? AND LOWER(cropName) = LOWER(?) AND status IN ('Confirmed', 'Upcoming', 'In Queue', 'Active')
      ORDER BY id DESC LIMIT 1
    `).get(userId, crop.name);
  }

  if (!booking && !crop) {
    return { success: false, notFound: true, error: 'Crop or booking not found or does not belong to you.' };
  }

  const removedName = booking?.cropName || crop?.name || 'Crop';

  db.exec('BEGIN TRANSACTION;');
  try {
    // 4. Safely cancel the active booking so no orphaned active booking remains
    if (booking) {
      db.prepare(`
        UPDATE bookings
        SET status = 'Cancelled', cropId = NULL, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(booking.id, userId);

      createNotificationRecord({
        userId,
        type: 'booking',
        title: `Booking Cancelled: ${removedName}`,
        description: `Your booking for ${removedName} (Token: ${booking.tokenNumber}) has been cancelled and removed from active crops.`,
        icon: 'Trash2',
      });
    }

    // 5. Remove or unlock crop record
    if (crop) {
      db.prepare('DELETE FROM crops WHERE id = ? AND userId = ?').run(crop.id, userId);
    } else if (booking?.cropId) {
      db.prepare('DELETE FROM crops WHERE id = ? AND userId = ?').run(booking.cropId, userId);
    }

    db.exec('COMMIT;');
    return { success: true, removedName, bookingId: booking?.id };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// ==========================================
// CENTRES & SLOTS HELPERS
// ==========================================
export function getCentres() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM procurement_centres ORDER BY distanceKm ASC').all();
}

export function getCentreById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM procurement_centres WHERE id = ?').get(id);
}

export function getSlotsByCentreId(centreId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM procurement_slots WHERE centreId = ?').all(centreId);
}

// ==========================================
// BOOKINGS HELPERS
// ==========================================
export function getBookingsByUserId(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM bookings
    WHERE userId = ?
    ORDER BY createdAt DESC
  `).all(userId);
}

export function getActiveBookingByUserId(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM bookings
    WHERE userId = ? AND status IN ('Confirmed', 'In Queue', 'Upcoming', 'Waiting', 'Your Turn', 'Active')
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(userId);
}

export function getActiveQueuesByUserId(userId) {
  const db = getDatabase();

  // 1. Gather all active items for this farmer: from orders AND bookings
  const activeItems = [];

  // Real active orders with assigned procurement centre
  const activeOrders = db.prepare(`
    SELECT o.*, u.fullName as buyerName
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    WHERE o.farmerId = ?
      AND o.procurementCentre IS NOT NULL
      AND o.status NOT IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed', 'CANCELLED', 'Cancelled')
    ORDER BY o.id ASC
  `).all(userId);

  for (const o of activeOrders) {
    let token = o.bookingToken;
    if (!token) {
      token = `KF-${100 + o.id}`;
      db.prepare('UPDATE orders SET bookingToken = ? WHERE id = ?').run(token, o.id);
    }
    activeItems.push({
      type: 'ORDER',
      id: o.id,
      orderId: o.id,
      orderNumber: o.orderNumber,
      tokenNumber: token,
      cropId: o.farmerCropId || o.cropId,
      cropName: o.cropName,
      quantity: o.quantity,
      unit: o.unit || 'kg',
      centreName: o.procurementCentre,
      centreAddress: o.centreAddress,
      date: o.expectedDate || '18 September 2026',
      timeSlot: '10:00 AM - 12:00 PM',
      status: o.status,
      createdAt: o.createdAt,
    });
  }

  // Real active bookings (if not already represented)
  const activeBookings = db.prepare(`
    SELECT b.*
    FROM bookings b
    WHERE b.userId = ?
      AND b.status IN ('Confirmed', 'In Queue', 'Upcoming', 'Waiting', 'Your Turn', 'Active')
    ORDER BY b.id ASC
  `).all(userId);

  for (const b of activeBookings) {
    if (!activeItems.some(i => i.tokenNumber === b.tokenNumber)) {
      activeItems.push({
        type: 'BOOKING',
        id: b.id,
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        tokenNumber: b.tokenNumber,
        cropId: b.cropId,
        cropName: b.cropName,
        quantity: b.quantity,
        unit: b.unit || 'kg',
        centreId: b.centreId,
        centreName: b.centreName,
        centreAddress: b.centreAddress,
        date: b.date,
        timeSlot: b.timeSlot,
        status: b.status,
        createdAt: b.createdAt,
      });
    }
  }

  // Now, for each active item, compute REAL centre queue state
  return activeItems.map((item) => {
    let crop = null;
    if (item.cropId) {
      crop = db.prepare('SELECT * FROM crops WHERE id = ? AND userId = ?').get(item.cropId, userId);
    }
    if (!crop && item.cropName) {
      crop = db.prepare('SELECT * FROM crops WHERE userId = ? AND LOWER(name) = LOWER(?) ORDER BY id DESC LIMIT 1').get(userId, item.cropName);
    }

    const centreQueue = getCentreQueueState(item.centreName || item.centreId);
    let currentServingToken = null;
    let peopleAhead = 0;
    let queuePosition = 1;
    let estimatedWaitMinutes = 0;
    let isYourTurn = false;
    let tokensSequence = [];
    let isLive = true;
    let statusBadge = 'LIVE';

    if (centreQueue && centreQueue.activeQueue && centreQueue.activeQueue.length > 0) {
      currentServingToken = centreQueue.currentServingToken;
      const foundIdx = centreQueue.activeQueue.findIndex(
        (q) => (q.type === item.type && q.id === item.id) || q.tokenNumber === item.tokenNumber
      );

      if (foundIdx !== -1) {
        const found = centreQueue.activeQueue[foundIdx];
        queuePosition = found.queuePosition;
        peopleAhead = found.peopleAhead;
        isYourTurn = found.isServing;
        estimatedWaitMinutes = found.estimatedWaitMinutes;

        // Build tokens sequence from REAL active queue entries
        tokensSequence = centreQueue.activeQueue.slice(0, 5).map((entry) => ({
          token: entry.tokenNumber,
          label: entry.isServing ? 'Now Serving' : (entry.tokenNumber === item.tokenNumber ? 'Your Token' : 'In Queue'),
          status: entry.isServing ? (entry.status === 'WEIGHING_VERIFICATION' ? 'Weighing Bay' : 'Counter 1') : `Position #${entry.queuePosition}`,
          isServing: entry.isServing,
          isUser: entry.tokenNumber === item.tokenNumber,
        }));
      } else {
        tokensSequence = [
          { token: item.tokenNumber, label: 'Your Token', status: 'In Queue', isServing: false, isUser: true }
        ];
      }
    } else {
      currentServingToken = item.tokenNumber;
      tokensSequence = [
        { token: item.tokenNumber, label: 'Your Token', status: 'Ready', isServing: true, isUser: true }
      ];
    }

    if (isYourTurn) {
      statusBadge = 'YOUR TURN';
    }

    return {
      id: item.id,
      type: item.type,
      bookingId: item.bookingId || item.id,
      orderId: item.orderId || null,
      bookingNumber: item.bookingNumber || item.orderNumber,
      tokenNumber: item.tokenNumber,
      cropId: item.cropId,
      cropName: item.cropName || crop?.name || 'Crop',
      quantity: item.quantity !== undefined ? item.quantity : (crop?.quantity || 0),
      unit: item.unit || crop?.unit || 'kg',
      centreId: item.centreId || null,
      centreName: item.centreName,
      centreAddress: item.centreAddress || (centreQueue?.centre?.address || ''),
      date: item.date,
      timeSlot: item.timeSlot,
      status: item.status,
      statusBadge,
      isLive,
      isUpcoming: false,
      isYourTurn,
      currentServingToken,
      peopleAhead,
      queuePosition,
      estimatedWaitMinutes,
      tokensSequence,
      harvestStatus: crop?.harvestStatus || 'Ready for Procurement',
      createdAt: item.createdAt,
    };
  });
}

export function getCompletedQueuesByUserId(userId) {
  const db = getDatabase();

  const completedOrders = db.prepare(`
    SELECT o.*, u.fullName as buyerName
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    WHERE o.farmerId = ?
      AND o.status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed')
    ORDER BY o.updatedAt DESC
  `).all(userId);

  const completedBookings = db.prepare(`
    SELECT * FROM bookings
    WHERE userId = ? AND status = 'Completed'
    ORDER BY id DESC
  `).all(userId);

  const list = [];
  const seenIds = new Set();

  for (const o of completedOrders) {
    seenIds.add(`order-${o.id}`);
    list.push({
      id: o.id,
      type: 'ORDER',
      bookingId: o.id,
      orderId: o.id,
      bookingNumber: o.orderNumber,
      tokenNumber: o.bookingToken || 'KF-COMP',
      cropName: o.cropName,
      quantity: o.quantity,
      unit: o.unit || 'kg',
      centreName: o.procurementCentre || 'Designated Mandi Samiti',
      centreAddress: o.centreAddress || '',
      date: o.expectedDate || 'Completed',
      timeSlot: 'Completed',
      status: 'PROCUREMENT_COMPLETED',
      statusBadge: 'COMPLETED',
      procurementAmount: o.totalAmount || 0,
      paymentStatus: o.paymentStatus || 'Pending',
      completedAt: o.updatedAt || o.createdAt,
    });
  }

  for (const b of completedBookings) {
    if (!seenIds.has(`booking-${b.id}`)) {
      list.push({
        id: b.id,
        type: 'BOOKING',
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        tokenNumber: b.tokenNumber,
        cropName: b.cropName,
        quantity: b.quantity,
        unit: b.unit,
        centreName: b.centreName,
        centreAddress: b.centreAddress,
        date: b.date,
        timeSlot: b.timeSlot,
        status: 'Completed',
        statusBadge: 'COMPLETED',
        procurementAmount: b.procurementAmount || 0,
        paymentStatus: b.paymentStatus || 'Completed',
        completedAt: b.updatedAt || b.createdAt,
      });
    }
  }

  return list;
}

export function getBookingByIdAndUser(id, userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM bookings
    WHERE (id = ? OR bookingNumber = ?) AND userId = ?
  `).get(id, id, userId);
}

export function createBookingRecord({
  userId,
  cropId,
  cropName,
  quantity,
  unit,
  centreId,
  centreName,
  centreAddress,
  date,
  timeSlot,
  estimatedWaitMins = 18,
  replaceExisting = false,
}) {
  const db = getDatabase();

  // Check if crop already has an active booking
  let existingBooking = null;
  if (cropId) {
    existingBooking = db.prepare(`
      SELECT * FROM bookings
      WHERE userId = ? AND cropId = ? AND status IN ('Confirmed', 'In Queue', 'Upcoming')
      ORDER BY id DESC LIMIT 1
    `).get(userId, cropId);
  } else if (cropName) {
    existingBooking = db.prepare(`
      SELECT * FROM bookings
      WHERE userId = ? AND LOWER(cropName) = LOWER(?) AND status IN ('Confirmed', 'In Queue', 'Upcoming')
      ORDER BY id DESC LIMIT 1
    `).get(userId, cropName.trim());
  }

  if (existingBooking) {
    if (replaceExisting) {
      // Safely update/reschedule existing booking to the newly selected slot
      db.prepare(`
        UPDATE bookings
        SET centreId = ?, centreName = ?, centreAddress = ?, date = ?, timeSlot = ?, estimatedWaitMins = ?,
            quantity = COALESCE(?, quantity), unit = COALESCE(?, unit), status = 'Confirmed', updatedAt = CURRENT_TIMESTAMP
        WHERE id = ? AND userId = ?
      `).run(
        centreId,
        centreName,
        centreAddress || '',
        date || '18 September 2026',
        timeSlot || '11:30 AM – 12:00 PM',
        estimatedWaitMins,
        quantity ? Number(quantity) : null,
        unit || null,
        existingBooking.id,
        userId
      );

      // Create notification for rescheduled booking
      createNotificationRecord({
        userId,
        type: 'booking',
        title: `Procurement slot updated for ${cropName}`,
        description: `Your ${cropName} slot has been changed to ${date} at ${timeSlot} (${centreName}).`,
        icon: 'Calendar',
      });

      return getBookingByIdAndUser(existingBooking.id, userId);
    } else {
      const err = new Error(`An active booking already exists for ${cropName}.`);
      err.code = 'EXISTING_BOOKING_FOUND';
      err.existingBooking = existingBooking;
      throw err;
    }
  }

  const tokenNumber = `KF-${Math.floor(200 + Math.random() * 800)}`;
  const dateCompact = (date || '2026-09-18').replace(/[^0-9]/g, '').slice(0, 8) || '20260918';
  const bookingNumber = `KF${dateCompact}-${Math.floor(1000 + Math.random() * 9000)}`;

  const stmt = db.prepare(`
    INSERT INTO bookings (
      bookingNumber, tokenNumber, userId, cropId, cropName, quantity, unit,
      centreId, centreName, centreAddress, date, timeSlot, estimatedWaitMins, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
  `);

  const result = stmt.run(
    bookingNumber,
    tokenNumber,
    userId,
    cropId || null,
    cropName,
    Number(quantity),
    unit || 'kg',
    centreId,
    centreName,
    centreAddress || '',
    date || '18 September 2026',
    timeSlot || '11:30 AM – 12:00 PM',
    estimatedWaitMins
  );

  const newBookingId = result.lastInsertRowid;

  // Mark crop as active booking
  if (cropId) {
    db.prepare(`
      UPDATE crops
      SET hasActiveBooking = 1, activeBookingId = ?
      WHERE id = ? AND userId = ?
    `).run(String(newBookingId), cropId, userId);
  }

  // Create associated notification
  createNotificationRecord({
    userId,
    type: 'booking',
    title: `Your booking for ${cropName} is confirmed.`,
    description: `Your ${cropName} procurement slot is confirmed for ${date} at ${timeSlot} (Token: ${tokenNumber}).`,
    icon: 'CheckCircle2',
  });

  return getBookingByIdAndUser(newBookingId, userId);
}

export function updateBookingStatus(id, userId, status) {
  const db = getDatabase();
  const booking = getBookingByIdAndUser(id, userId);
  if (!booking) return null;

  db.prepare(`
    UPDATE bookings
    SET status = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND userId = ?
  `).run(status, booking.id, userId);

  // If cancelling, unlock crop
  if (status === 'Cancelled' && booking.cropId) {
    db.prepare(`
      UPDATE crops
      SET hasActiveBooking = 0, activeBookingId = NULL
      WHERE id = ? AND userId = ?
    `).run(booking.cropId, userId);
  }

  return getBookingByIdAndUser(booking.id, userId);
}

// ==========================================
// NOTIFICATIONS HELPERS
// ==========================================
export function getNotificationsByUserId(userId, limit = 50, offset = 0, type = null, readStatus = null) {
  const db = getDatabase();
  let query = 'SELECT * FROM notifications WHERE userId = ?';
  const params = [userId];

  if (readStatus === 'unread') {
    query += ' AND isRead = 0';
  } else if (readStatus === 'read') {
    query += ' AND isRead = 1';
  }

  if (type && type !== 'all') {
    const t = String(type).toLowerCase();
    if (t === 'booking' || t === 'bookings') {
      query += ' AND type IN (\'booking\', \'slot\')';
    } else if (t === 'token' || t === 'tokens') {
      query += ' AND (type IN (\'token\', \'booking\') AND (title LIKE \'%token%\' OR description LIKE \'%token%\' OR relatedToken IS NOT NULL))';
    } else if (t === 'queue') {
      query += ' AND type = \'queue\'';
    } else if (t === 'crop' || t === 'crops') {
      query += ' AND type = \'crop\'';
    } else if (t === 'payment' || t === 'payments') {
      query += ' AND type = \'payment\'';
    } else if (t === 'order' || t === 'orders') {
      query += ' AND type = \'order\'';
    } else if (t === 'procurement') {
      query += ' AND type = \'procurement\'';
    } else {
      query += ' AND type = ?';
      params.push(t);
    }
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit) || 50, Number(offset) || 0);

  return db.prepare(query).all(...params);
}

export function getTotalNotificationCount(userId, type = null, readStatus = null) {
  const db = getDatabase();
  let query = 'SELECT count(*) as count FROM notifications WHERE userId = ?';
  const params = [userId];

  if (readStatus === 'unread') {
    query += ' AND isRead = 0';
  } else if (readStatus === 'read') {
    query += ' AND isRead = 1';
  }

  if (type && type !== 'all') {
    const t = String(type).toLowerCase();
    if (t === 'booking' || t === 'bookings') {
      query += ' AND type IN (\'booking\', \'slot\')';
    } else if (t === 'token' || t === 'tokens') {
      query += ' AND (type IN (\'token\', \'booking\') AND (title LIKE \'%token%\' OR description LIKE \'%token%\' OR relatedToken IS NOT NULL))';
    } else if (t === 'queue') {
      query += ' AND type = \'queue\'';
    } else if (t === 'crop' || t === 'crops') {
      query += ' AND type = \'crop\'';
    } else if (t === 'payment' || t === 'payments') {
      query += ' AND type = \'payment\'';
    } else if (t === 'order' || t === 'orders') {
      query += ' AND type = \'order\'';
    } else if (t === 'procurement') {
      query += ' AND type = \'procurement\'';
    } else {
      query += ' AND type = ?';
      params.push(t);
    }
  }

  const row = db.prepare(query).get(...params);
  return row ? row.count : 0;
}

export function createNotificationRecord({
  userId,
  type = 'info',
  title,
  description,
  message,
  icon = 'Bell',
  relatedCropId = null,
  relatedBookingId = null,
  relatedToken = null,
  relatedOrderId = null,
  actionUrl = null,
}) {
  const db = getDatabase();
  const desc = message || description || '';
  const stmt = db.prepare(`
    INSERT INTO notifications (userId, type, title, description, timestampText, isRead, icon, relatedCropId, relatedBookingId, relatedToken, relatedOrderId, actionUrl)
    VALUES (?, ?, ?, ?, 'Just now', 0, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, type, title, desc, icon, relatedCropId, relatedBookingId, relatedToken, relatedOrderId, actionUrl);
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
}

export const createNotification = createNotificationRecord;

export function markNotificationRead(id, userId) {
  const db = getDatabase();
  db.prepare(`
    UPDATE notifications
    SET isRead = 1
    WHERE id = ? AND userId = ?
  `).run(id, userId);
  return true;
}

export function markAllNotificationsRead(userId) {
  const db = getDatabase();
  db.prepare(`
    UPDATE notifications
    SET isRead = 1
    WHERE userId = ?
  `).run(userId);
  return true;
}

export function getUnreadNotificationCount(userId) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT count(*) as count FROM notifications
    WHERE userId = ? AND isRead = 0
  `).get(userId);
  return row ? row.count : 0;
}

// ==========================================
// PAYMENTS HELPERS (ORDER-LINKED UNIFIED PAYMENTS)
// ==========================================
export function getPaymentsByUserId(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM payments
    WHERE userId = ? OR farmerId = ? OR buyerId = ?
    ORDER BY id DESC
  `).all(userId, userId, userId);
}

export function getPaymentsByBuyerId(buyerId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT p.*, o.orderNumber, o.status as orderStatus,
           u.fullName as farmerName, u.location as farmerLocation
    FROM payments p
    LEFT JOIN orders o ON p.orderId = o.id
    LEFT JOIN users u ON p.farmerId = u.id
    WHERE p.buyerId = ?
    ORDER BY p.id DESC
  `).all(buyerId);
}

export function getPaymentsByFarmerId(farmerId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT p.*, o.orderNumber, o.status as orderStatus,
           u.fullName as buyerName, u.mobile as buyerMobile, u.location as buyerLocation
    FROM payments p
    LEFT JOIN orders o ON p.orderId = o.id
    LEFT JOIN users u ON p.buyerId = u.id
    WHERE p.farmerId = ?
    ORDER BY p.id DESC
  `).all(farmerId);
}

export function getPaymentById(paymentId, userId = null) {
  const db = getDatabase();
  let query = `
    SELECT p.*, o.orderNumber, o.status as orderStatus,
           b.fullName as buyerName, b.location as buyerLocation,
           f.fullName as farmerName, f.location as farmerLocation
    FROM payments p
    LEFT JOIN orders o ON p.orderId = o.id
    LEFT JOIN users b ON p.buyerId = b.id
    LEFT JOIN users f ON p.farmerId = f.id
    WHERE (p.id = ? OR p.paymentNumber = ?)
  `;
  const params = [paymentId, String(paymentId)];

  if (userId) {
    query += ` AND (p.buyerId = ? OR p.farmerId = ?)`;
    params.push(userId, userId);
  }

  return db.prepare(query).get(...params) || null;
}

export function getBuyerPayableOrders(buyerId) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT o.*, u.fullName as farmerName, u.location as farmerLocation
    FROM orders o
    LEFT JOIN users u ON o.farmerId = u.id
    WHERE o.buyerId = ?
      AND o.status IN ('CONFIRMED', 'Confirmed', 'PROCUREMENT_COMPLETED', 'Completed')
      AND (o.paymentStatus IS NULL OR o.paymentStatus != 'PAID')
    ORDER BY o.id DESC
  `).all(buyerId);

  return rows.map((order) => {
    let parsedHistory = [];
    try {
      parsedHistory = JSON.parse(order.statusHistory || '[]');
    } catch {
      parsedHistory = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
    }
    return {
      ...order,
      statusHistory: parsedHistory,
    };
  });
}

export function getBuyerPaymentMetrics(buyerId) {
  const db = getDatabase();
  const completedRows = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as totalPaid, COUNT(*) as count 
    FROM payments 
    WHERE buyerId = ? AND status = 'PAID'
  `).get(buyerId);

  const pendingRows = db.prepare(`
    SELECT COALESCE(SUM(totalAmount), 0) as pendingAmount, COUNT(*) as count 
    FROM orders 
    WHERE buyerId = ? AND status IN ('CONFIRMED', 'Confirmed') AND (paymentStatus IS NULL OR paymentStatus != 'PAID') AND totalAmount > 0
  `).get(buyerId);

  const failedCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM payments 
    WHERE buyerId = ? AND status = 'FAILED'
  `).get(buyerId)?.count || 0;

  const totalPayments = (completedRows?.count || 0) + failedCount;

  return {
    totalPaid: completedRows?.totalPaid || 0,
    totalPayments,
    successfulPayments: completedRows?.count || 0,
    pendingPayments: pendingRows?.count || 0,
    pendingAmount: pendingRows?.pendingAmount || 0,
    failedPayments: failedCount,
  };
}

export function getFarmerPaymentMetrics(farmerId) {
  const db = getDatabase();
  const completedRows = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as totalEarned, COUNT(*) as count 
    FROM payments 
    WHERE farmerId = ? AND status = 'PAID'
  `).get(farmerId);

  const pendingRows = db.prepare(`
    SELECT COALESCE(SUM(totalAmount), 0) as pendingAmount, COUNT(*) as count 
    FROM orders 
    WHERE farmerId = ? AND status IN ('CONFIRMED', 'Confirmed') AND (paymentStatus IS NULL OR paymentStatus != 'PAID') AND totalAmount > 0
  `).get(farmerId);

  return {
    totalEarned: completedRows?.totalEarned || 0,
    completedCount: completedRows?.count || 0,
    pendingAmount: pendingRows?.pendingAmount || 0,
    pendingCount: pendingRows?.count || 0,
  };
}

export function createOrderPayment({ orderId, buyerId, paymentMethod }) {
  const db = getDatabase();
  const order = db.prepare(`SELECT * FROM orders WHERE (id = ? OR orderNumber = ?) AND buyerId = ?`).get(orderId, String(orderId), buyerId);
  if (!order) {
    throw new Error('Order not found or unauthorized.');
  }

  if (['CANCELLED', 'Cancelled'].includes(order.status)) {
    throw new Error('Cannot process payment for a cancelled order.');
  }

  const eligibleStatuses = ['CONFIRMED', 'Confirmed', 'PROCUREMENT_COMPLETED', 'Completed'];
  if (!eligibleStatuses.includes(order.status)) {
    throw new Error(`Order is not eligible for payment. Current status: ${order.status}`);
  }

  if (order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid') {
    throw new Error('This order has already been paid.');
  }

  const amount = Number(order.totalAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount not available for this order.');
  }

  const paymentNumber = `KF-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  const method = paymentMethod || 'Mandi Escrow / Direct DBT';
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const existingPayment = db.prepare(`SELECT * FROM payments WHERE orderId = ? AND buyerId = ? ORDER BY id DESC LIMIT 1`).get(order.id, buyerId);

  let paymentId;
  if (existingPayment && existingPayment.status !== 'PAID') {
    db.prepare(`
      UPDATE payments 
      SET status = 'PROCESSING', amount = ?, quantity = ?, paymentMethod = ?, failureReason = NULL, createdAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, order.quantity, method, existingPayment.id);
    paymentId = existingPayment.id;
  } else {
    const res = db.prepare(`
      INSERT INTO payments (
        paymentNumber, orderId, buyerId, farmerId, cropName, quantity, actualQuantity, unit,
        amount, procurementAmount, userId, currency, status, paymentStatus, paymentMethod, transactionId, date, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'PROCESSING', 'Payment Processing', ?, NULL, ?, CURRENT_TIMESTAMP)
    `).run(
      paymentNumber,
      order.id,
      buyerId,
      order.farmerId,
      order.cropName,
      order.quantity,
      order.quantity,
      order.unit || 'kg',
      amount,
      amount,
      buyerId,
      method,
      dateFormatted
    );
    paymentId = res.lastInsertRowid;
  }

  db.prepare(`UPDATE orders SET paymentStatus = 'PROCESSING', paymentId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(paymentId, order.id);

  return getPaymentById(paymentId, buyerId);
}

export function completeOrderPayment(paymentId, { transactionId = null, method } = {}) {
  const db = getDatabase();
  const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(paymentId);
  if (!payment) {
    throw new Error('Payment record not found.');
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE payments
    SET status = 'PAID', paymentStatus = 'Payment Received', completedAt = ?, transactionId = ?, paymentMethod = COALESCE(?, paymentMethod)
    WHERE id = ?
  `).run(now, transactionId, method, payment.id);

  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(payment.orderId);
  if (order) {
    let history = [];
    try {
      history = JSON.parse(order.statusHistory || '[]');
    } catch {
      history = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
    }
    history.push({
      status: order.status,
      timestamp: now,
      actor: payment.buyerId,
      note: `Payment of ₹${Number(payment.amount).toLocaleString('en-IN')} completed.`,
    });

    db.prepare(`
      UPDATE orders
      SET paymentStatus = 'PAID', paidAt = ?, statusHistory = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(now, JSON.stringify(history), order.id);

    createNotificationRecord({
      userId: payment.buyerId,
      type: 'payment',
      title: 'Payment Successful',
      description: `Payment for order ${order.orderNumber} has been received successfully.`,
      icon: 'CheckCircle',
      relatedOrderId: order.id,
      relatedCropId: order.farmerCropId,
      actionUrl: '/buyer/purchase-history',
    });

    createNotificationRecord({
      userId: payment.farmerId,
      type: 'payment',
      title: 'Payment Received',
      description: `Payment received for order ${order.orderNumber}.`,
      icon: 'IndianRupee',
      relatedOrderId: order.id,
      relatedCropId: order.farmerCropId,
      actionUrl: '/farmer/payments',
    });
  }

  return getPaymentById(payment.id, payment.buyerId);
}

export function failOrderPayment(paymentId, reason = 'Payment processing failed') {
  const db = getDatabase();
  const payment = db.prepare(`SELECT * FROM payments WHERE id = ?`).get(paymentId);
  if (!payment) {
    throw new Error('Payment record not found.');
  }

  db.prepare(`
    UPDATE payments
    SET status = 'FAILED', paymentStatus = 'Payment Failed', failureReason = ?
    WHERE id = ?
  `).run(reason, payment.id);

  db.prepare(`
    UPDATE orders
    SET paymentStatus = 'FAILED', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(payment.orderId);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.orderId);
  createNotificationRecord({
    userId: payment.buyerId,
    type: 'payment',
    title: 'Payment Failed',
    description: `Payment for order ${order ? order.orderNumber : payment.paymentNumber} could not be processed. ${reason}`,
    icon: 'AlertCircle',
    relatedOrderId: payment.orderId,
    actionUrl: '/buyer/payments',
  });

  db.prepare(`
    UPDATE payments
    SET status = 'FAILED', paymentStatus = 'Payment Failed', failureReason = ?
    WHERE id = ?
  `).run(reason, payment.id);

  db.prepare(`
    UPDATE orders
    SET paymentStatus = 'FAILED', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(payment.orderId);

  return getPaymentById(payment.id, payment.buyerId);
}

// ==========================================
// AGGREGATED DASHBOARD STATS
// ==========================================
export function getFarmerDashboardData(userId) {
  const db = getDatabase();
  const user = getUserById(userId);
  const bookedCrops = getBookedCropsByUserId(userId);
  const bookings = getBookingsByUserId(userId);
  const upcomingBookings = bookings.filter((b) =>
    b.status === 'Confirmed' || b.status === 'Upcoming' || b.status === 'In Queue' || b.status === 'Waiting' || b.status === 'Active'
  );
  const upcomingBooking = upcomingBookings[0] || null;
  const notifications = getNotificationsByUserId(userId, 5);
  const unreadCount = getUnreadNotificationCount(userId);
  const payments = getPaymentsByFarmerId(userId);
  const paymentMetrics = getFarmerPaymentMetrics(userId);

  const completedCount = bookings.filter((b) => b.status === 'Completed').length;

  return {
    user,
    crops: bookedCrops,
    bookedCrops,
    upcomingBooking,
    upcomingBookings,
    bookings,
    notifications,
    unreadNotificationCount: unreadCount,
    unreadCount: unreadCount,
    payments,
    paymentMetrics,
    orderMetrics: getFarmerOrderMetrics(userId),
    stats: {
      activeCropsCount: bookedCrops.length,
      upcomingBookingsCount: upcomingBookings.length,
      completedProcurementsCount: completedCount,
      pendingPaymentsCount: paymentMetrics.pendingCount,
      pendingPaymentsAmount: paymentMetrics.pendingAmount,
      totalEarnedAmount: paymentMetrics.totalEarned,
      orderRequestsCount: getFarmerOrderMetrics(userId).newRequests,
      confirmedOrdersCount: getFarmerOrderMetrics(userId).confirmedOrders,
    },
  };
}

// ==========================================
// BUYER DATA & PRODUCE HELPERS
// ==========================================
export function getBuyerEligibleCrops({ search, cropName, status, location, sortBy, minQuantity, limit, offset } = {}) {
  const db = getDatabase();

  // Allowed statuses for buyers: 'Ready for Procurement' and 'Nearly Ready'
  // 'Growing' is strictly excluded from buyer procurement listings!
  let baseQuery = `
    SELECT 
      c.id,
      c.name,
      c.quantity,
      c.unit,
      c.harvestStatus,
      c.expectedHarvestDate,
      c.notes,
      c.createdAt,
      u.location AS farmerLocation,
      b.centreName,
      b.centreAddress,
      b.status AS bookingStatus
    FROM crops c
    JOIN users u ON c.userId = u.id
    LEFT JOIN bookings b ON (b.cropId = c.id OR (b.userId = c.userId AND LOWER(b.cropName) = LOWER(c.name) AND b.status IN ('Confirmed', 'Upcoming', 'In Queue')))
    WHERE c.harvestStatus IN ('Ready for Procurement', 'Nearly Ready')
  `;

  const params = [];

  if (cropName && cropName !== 'All' && cropName !== 'All Crops') {
    baseQuery += ` AND LOWER(c.name) = LOWER(?)`;
    params.push(cropName.trim());
  }

  if (status && status !== 'All' && status !== 'All Statuses') {
    if (status.toLowerCase() === 'available now') {
      baseQuery += ` AND c.harvestStatus = 'Ready for Procurement'`;
    } else if (status.toLowerCase() === 'coming soon') {
      baseQuery += ` AND c.harvestStatus = 'Nearly Ready'`;
    } else {
      baseQuery += ` AND LOWER(c.harvestStatus) = LOWER(?)`;
      params.push(status.trim());
    }
  }

  if (location && location !== 'All' && location !== 'All Locations') {
    baseQuery += ` AND LOWER(u.location) LIKE LOWER(?)`;
    params.push(`%${location.trim()}%`);
  }

  if (minQuantity !== undefined && minQuantity !== null && minQuantity !== '' && !isNaN(minQuantity)) {
    baseQuery += ` AND c.quantity >= ?`;
    params.push(Number(minQuantity));
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    baseQuery += ` AND (LOWER(c.name) LIKE ? OR LOWER(COALESCE(c.notes, '')) LIKE ? OR LOWER(COALESCE(u.location, '')) LIKE ? OR LOWER(COALESCE(b.centreName, '')) LIKE ?)`;
    params.push(term, term, term, term);
  }

  // Dynamic sorting
  if (sortBy === 'quantity-desc') {
    baseQuery += ` ORDER BY c.quantity DESC, c.id DESC`;
  } else if (sortBy === 'quantity-asc') {
    baseQuery += ` ORDER BY c.quantity ASC, c.id DESC`;
  } else if (sortBy === 'harvest-date') {
    baseQuery += ` ORDER BY c.expectedHarvestDate ASC, c.id DESC`;
  } else {
    // Default: recently added
    baseQuery += ` ORDER BY c.id DESC`;
  }

  if (limit) {
    baseQuery += ` LIMIT ?`;
    params.push(Number(limit));
    if (offset) {
      baseQuery += ` OFFSET ?`;
      params.push(Number(offset));
    }
  }

  const rows = db.prepare(baseQuery).all(...params);

  // Map to safe DTO without private farmer details (never expose phone, address, userId, etc.)
  const crops = rows.map((row) => {
    const isReady = row.harvestStatus === 'Ready for Procurement';
    return {
      id: row.id,
      lotId: `LOT-KF-${String(row.id).padStart(4, '0')}`,
      cropName: row.name,
      quantity: row.quantity,
      unit: row.unit || 'kg',
      harvestStatus: row.harvestStatus,
      expectedHarvestDate: row.expectedHarvestDate || 'Immediate',
      notes: row.notes || null,
      location: row.farmerLocation || 'Regional Mandi Zone',
      procurementCentre: row.centreName || 'Designated KishanFlow Mandi',
      centreAddress: row.centreAddress || null,
      availabilityStatus: isReady ? 'Available Now' : 'Coming Soon',
      verificationStatus: 'Verified Produce',
      createdAt: row.createdAt,
    };
  });

  // Query distinct filter options dynamically from actual farmer records in DB
  const availableCropNames = db.prepare(`
    SELECT DISTINCT name FROM crops 
    WHERE harvestStatus IN ('Ready for Procurement', 'Nearly Ready')
    ORDER BY name ASC
  `).all().map((r) => r.name);

  const availableLocations = db.prepare(`
    SELECT DISTINCT u.location FROM crops c
    JOIN users u ON c.userId = u.id
    WHERE c.harvestStatus IN ('Ready for Procurement', 'Nearly Ready')
      AND u.location IS NOT NULL AND u.location != ''
    ORDER BY u.location ASC
  `).all().map((r) => r.location);

  const availableStatuses = ['Available Now', 'Coming Soon'];

  return {
    crops,
    totalCount: crops.length,
    availableCropNames,
    availableLocations,
    availableStatuses,
  };
}

export function getBuyerDashboardData(buyerId) {
  const db = getDatabase();
  const buyer = getUserById(buyerId);

  // 1. Available Produce: count of real farmer crops with status Ready for Procurement or Nearly Ready
  const eligibleCropsCountRow = db.prepare(`
    SELECT COUNT(*) as count FROM crops
    WHERE harvestStatus IN ('Ready for Procurement', 'Nearly Ready')
  `).get();
  const availableProduceCount = eligibleCropsCountRow ? eligibleCropsCountRow.count : 0;

  // 2. Buyer's actual orders (currently 0 if no orders placed yet)
  let activeOrdersCount = 0;
  let readyForDeliveryCount = 0;
  let pendingPaymentsAmount = 0;
  let recentOrders = [];

  const ordersTableExists = db.prepare(`
    SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='orders'
  `).get()?.count > 0;

  if (ordersTableExists) {
    const activeOrdersRow = db.prepare(`
      SELECT count(*) as count FROM orders WHERE buyerId = ? AND status NOT IN ('Completed', 'COMPLETED', 'Delivered', 'Cancelled', 'CANCELLED')
    `).get(buyerId);
    activeOrdersCount = activeOrdersRow ? activeOrdersRow.count : 0;

    const readyDeliveryRow = db.prepare(`
      SELECT count(*) as count FROM orders WHERE buyerId = ? AND status = 'Ready for Delivery'
    `).get(buyerId);
    readyForDeliveryCount = readyDeliveryRow ? readyDeliveryRow.count : 0;

    const pendingPaymentsRow = db.prepare(`
      SELECT SUM(totalAmount) as total FROM orders WHERE buyerId = ? AND paymentStatus = 'Pending'
    `).get(buyerId);
    pendingPaymentsAmount = pendingPaymentsRow?.total || 0;

    recentOrders = db.prepare(`
      SELECT * FROM orders WHERE buyerId = ? ORDER BY id DESC LIMIT 5
    `).all(buyerId);
  }

  // 3. Available crops preview (top 4 eligible farmer crops)
  const eligibleResult = getBuyerEligibleCrops({ limit: 4 });
  const previewCrops = eligibleResult.crops;

  // 4. Notifications for this buyer
  const notifications = getNotificationsByUserId(buyerId, 5);
  const unreadCount = getUnreadNotificationCount(buyerId);

  return {
    buyer,
    stats: {
      availableProduce: availableProduceCount,
      activeOrders: activeOrdersCount,
      readyForDelivery: readyForDeliveryCount,
      pendingPayments: pendingPaymentsAmount,
    },
    availableCrops: previewCrops,
    recentOrders,
    notifications,
    unreadNotificationCount: unreadCount,
  };
}

// ==========================================
// BUYER ORDERS HELPERS
// ==========================================
export function createBuyerOrder({
  buyerId,
  cropId,
  cropName,
  quantity,
  unit,
  procurementCentre,
  centreAddress,
  expectedDate,
  deliveryNotes,
  agreedPrice,
  totalAmount,
}) {
  const db = getDatabase();

  if (!cropId) {
    throw new Error('A valid farmer crop listing must be selected.');
  }

  // Validate crop from crops table
  const realCrop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
  if (!realCrop) {
    throw new Error('Referenced crop listing does not exist.');
  }

  // Check harvest status - Growing is strictly blocked
  if (realCrop.harvestStatus === 'Growing') {
    throw new Error('Orders cannot be placed for crops that are still growing.');
  }

  const finalCropName = realCrop.name;
  const finalUnit = realCrop.unit || 'kg';
  const finalQuantity = Number(quantity);

  if (isNaN(finalQuantity) || finalQuantity <= 0) {
    throw new Error('Please specify a valid quantity greater than 0.');
  }

  // Check if requested quantity exceeds farmer's available quantity (Requirement 19)
  if (finalQuantity > realCrop.quantity) {
    throw new Error('Requested quantity exceeds available quantity.');
  }

  const farmerId = realCrop.userId;
  const farmerCropId = realCrop.id;

  // Price and total calculation (Section 6: No fake price invented)
  const finalAgreedPrice = agreedPrice !== undefined && agreedPrice !== null && !isNaN(Number(agreedPrice)) && Number(agreedPrice) > 0
    ? Number(agreedPrice)
    : null;
  const finalTotalAmount = totalAmount !== undefined && totalAmount !== null && !isNaN(Number(totalAmount)) && Number(totalAmount) > 0
    ? Number(totalAmount)
    : (finalAgreedPrice ? Math.round(finalQuantity * finalAgreedPrice * 100) / 100 : 0);

  // Fetch farmer booking details if available
  let centre = procurementCentre || 'Designated KishanFlow Mandi';
  let address = centreAddress || null;
  let token = null;

  const booking = db.prepare(`
    SELECT * FROM bookings 
    WHERE (cropId = ? OR (userId = ? AND LOWER(cropName) = LOWER(?)))
      AND status IN ('Confirmed', 'Upcoming', 'In Queue')
    ORDER BY id DESC LIMIT 1
  `).get(realCrop.id, realCrop.userId, realCrop.name);

  if (booking) {
    centre = booking.centreName || centre;
    address = booking.centreAddress || address;
    token = booking.tokenNumber || null;
  }

  // Generate unique human-readable order number: KF-ORD-XXXXXX
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const orderNumber = `KF-ORD-${randomSuffix}`;

  const initialStatus = 'ORDER_REQUESTED';
  const initialHistory = JSON.stringify([
    {
      status: initialStatus,
      timestamp: new Date().toISOString(),
      actor: buyerId,
      note: 'Procurement order request submitted by buyer.',
    },
  ]);

  const stmt = db.prepare(`
    INSERT INTO orders (
      orderNumber, buyerId, farmerId, farmerCropId, cropId, cropName, quantity, unit,
      procurementCentre, centreAddress, bookingToken, expectedDate,
      status, statusHistory, paymentStatus, agreedPrice, totalAmount, deliveryNotes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?)
  `);

  const result = stmt.run(
    orderNumber,
    buyerId,
    farmerId,
    farmerCropId,
    cropId,
    finalCropName,
    finalQuantity,
    finalUnit,
    centre,
    address,
    token,
    expectedDate || realCrop.expectedHarvestDate || 'Immediate',
    initialStatus,
    initialHistory,
    finalAgreedPrice,
    finalTotalAmount,
    deliveryNotes || null
  );

  // Update available quantity on the real farmer crop record (Requirement 7)
  db.prepare(`
    UPDATE crops
    SET quantity = MAX(0, quantity - ?),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(finalQuantity, realCrop.id);

  // Send real notification to the FARMER (Requirement 15)
  createNotificationRecord({
    userId: farmerId,
    type: 'order',
    title: 'New order request received',
    description: `A buyer has placed an order request for ${finalQuantity} ${finalUnit} of ${finalCropName} (Order: ${orderNumber}).`,
    icon: 'Package',
    relatedCropId: farmerCropId,
  });

  // Send real notification to the BUYER
  createNotificationRecord({
    userId: buyerId,
    type: 'order',
    title: 'Order Request Sent',
    description: `Your order request for ${finalQuantity} ${finalUnit} of ${finalCropName} has been submitted to the farmer (Order: ${orderNumber}).`,
    icon: 'Package',
    relatedOrderId: result.lastInsertRowid,
    actionUrl: `/buyer/track-orders?orderId=${result.lastInsertRowid}`,
  });

  return getOrderByIdAndBuyer(result.lastInsertRowid, buyerId);
}

export function getOrdersByBuyerId(buyerId, { status, search } = {}) {
  const db = getDatabase();
  let query = `
    SELECT * FROM orders
    WHERE buyerId = ?
  `;
  const params = [buyerId];

  if (status && status !== 'All' && status !== 'all') {
    const s = status.toLowerCase();
    if (s === 'in progress' || s === 'active') {
      query += ` AND status IN ('ORDER_REQUESTED', 'CONFIRMED', 'Confirmed', 'Procurement Scheduled', 'Ready for Procurement', 'At Procurement Centre', 'Weighing', 'Procurement Completed', 'Payment Processing')`;
    } else if (s === 'pending' || s === 'requested' || s === 'order_requested') {
      query += ` AND status IN ('ORDER_REQUESTED', 'Order Placed', 'Pending')`;
    } else if (s === 'confirmed') {
      query += ` AND status IN ('CONFIRMED', 'Confirmed')`;
    } else if (s === 'completed') {
      query += ` AND status IN ('COMPLETED', 'Completed')`;
    } else if (s === 'cancelled') {
      query += ` AND status IN ('CANCELLED', 'Cancelled')`;
    } else {
      query += ` AND LOWER(status) = LOWER(?)`;
      params.push(status.trim());
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(orderNumber) LIKE ? OR LOWER(cropName) LIKE ? OR LOWER(COALESCE(procurementCentre, '')) LIKE ?)`;
    params.push(term, term, term);
  }

  query += ` ORDER BY id DESC`;

  const rows = db.prepare(query).all(...params);

  return rows.map((order) => {
    let parsedHistory = [];
    try {
      parsedHistory = JSON.parse(order.statusHistory || '[]');
    } catch {
      parsedHistory = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
    }
    return {
      ...order,
      statusHistory: parsedHistory,
    };
  });
}

export function getOrderByIdAndBuyer(orderIdOrNumber, buyerId) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM orders
    WHERE (id = ? OR orderNumber = ?) AND buyerId = ?
    LIMIT 1
  `).get(orderIdOrNumber, String(orderIdOrNumber), buyerId);

  if (!row) return null;

  let parsedHistory = [];
  try {
    parsedHistory = JSON.parse(row.statusHistory || '[]');
  } catch {
    parsedHistory = [{ status: row.status, timestamp: row.createdAt, note: 'Order created.' }];
  }

  return {
    ...row,
    statusHistory: parsedHistory,
  };
}

export function updateOrderStatus(orderId, buyerId, newStatus, note) {
  const db = getDatabase();
  const current = getOrderByIdAndBuyer(orderId, buyerId);
  if (!current) return null;

  const history = Array.isArray(current.statusHistory) ? current.statusHistory : [];
  history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    actor: buyerId,
    note: note || `Order updated to ${newStatus}.`,
  });

  db.prepare(`
    UPDATE orders
    SET status = ?, statusHistory = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND buyerId = ?
  `).run(newStatus, JSON.stringify(history), current.id, buyerId);

  // Restore quantity on real farmer crop record if order is cancelled (Requirement 7 & 31)
  if (['CANCELLED', 'Cancelled'].includes(newStatus) && current.farmerCropId && current.quantity > 0) {
    try {
      db.prepare(`
        UPDATE crops
        SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(current.quantity, current.farmerCropId);
    } catch {}
  }

  return getOrderByIdAndBuyer(current.id, buyerId);
}

export function getBuyerOrderMetrics(buyerId) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT status FROM orders WHERE buyerId = ?
  `).all(buyerId);

  const total = rows.length;
  const active = rows.filter(r => !['Completed', 'COMPLETED', 'Cancelled', 'CANCELLED'].includes(r.status)).length;
  const completed = rows.filter(r => ['Completed', 'COMPLETED'].includes(r.status)).length;
  const pending = rows.filter(r => ['ORDER_REQUESTED', 'Order Placed', 'Pending', 'Order Requested'].includes(r.status)).length;

  return {
    totalOrders: total,
    activeOrders: active,
    completedOrders: completed,
    pendingRequests: pending,
  };
}

// ==========================================
// FARMER ORDERS HELPERS (REAL TWO-SIDED FLOW)
// ==========================================
export function getOrdersByFarmerId(farmerId, { status, search } = {}) {
  const db = getDatabase();
  let query = `
    SELECT o.*, u.fullName AS buyerName, u.mobile AS buyerMobile, u.location AS buyerLocation
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    WHERE o.farmerId = ?
  `;
  const params = [farmerId];

  if (status && status !== 'All' && status !== 'all') {
    const s = status.toLowerCase();
    if (s === 'requested' || s === 'order_requested' || s === 'new') {
      query += ` AND o.status IN ('ORDER_REQUESTED', 'Order Placed', 'Order Requested')`;
    } else if (s === 'confirmed') {
      query += ` AND o.status IN ('CONFIRMED', 'Confirmed')`;
    } else if (s === 'active') {
      query += ` AND o.status NOT IN ('COMPLETED', 'Completed', 'CANCELLED', 'Cancelled')`;
    } else if (s === 'completed') {
      query += ` AND o.status IN ('COMPLETED', 'Completed')`;
    } else if (s === 'cancelled') {
      query += ` AND o.status IN ('CANCELLED', 'Cancelled')`;
    } else {
      query += ` AND LOWER(o.status) = LOWER(?)`;
      params.push(status.trim());
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(o.orderNumber) LIKE ? OR LOWER(o.cropName) LIKE ? OR LOWER(COALESCE(u.fullName, '')) LIKE ? OR LOWER(COALESCE(o.procurementCentre, '')) LIKE ?)`;
    params.push(term, term, term, term);
  }

  query += ` ORDER BY o.id DESC`;

  const rows = db.prepare(query).all(...params);

  return rows.map((order) => {
    let parsedHistory = [];
    try {
      parsedHistory = JSON.parse(order.statusHistory || '[]');
    } catch {
      parsedHistory = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
    }
    return {
      ...order,
      statusHistory: parsedHistory,
    };
  });
}

export function getFarmerOrderMetrics(farmerId) {
  const db = getDatabase();
  const rows = db.prepare(`SELECT status FROM orders WHERE farmerId = ?`).all(farmerId);
  const total = rows.length;
  const newRequests = rows.filter(r => ['ORDER_REQUESTED', 'Order Placed', 'Order Requested'].includes(r.status)).length;
  const confirmed = rows.filter(r => ['CONFIRMED', 'Confirmed'].includes(r.status)).length;
  const active = rows.filter(r => !['COMPLETED', 'Completed', 'CANCELLED', 'Cancelled'].includes(r.status)).length;
  const completed = rows.filter(r => ['COMPLETED', 'Completed'].includes(r.status)).length;

  return {
    totalOrders: total,
    newRequests,
    confirmedOrders: confirmed,
    activeOrders: active,
    completedOrders: completed,
  };
}

export function getFarmerOrderById(orderIdOrNumber, farmerId) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT o.*, u.fullName AS buyerName, u.mobile AS buyerMobile, u.location AS buyerLocation
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    WHERE (o.id = ? OR o.orderNumber = ?) AND o.farmerId = ?
    LIMIT 1
  `).get(orderIdOrNumber, String(orderIdOrNumber), farmerId);

  if (!row) return null;

  let parsedHistory = [];
  try {
    parsedHistory = JSON.parse(row.statusHistory || '[]');
  } catch {
    parsedHistory = [{ status: row.status, timestamp: row.createdAt, note: 'Order created.' }];
  }

  return {
    ...row,
    statusHistory: parsedHistory,
  };
}

export function confirmFarmerOrder(orderIdOrNumber, farmerId, { agreedPrice, totalAmount } = {}) {
  const db = getDatabase();
  const current = getFarmerOrderById(orderIdOrNumber, farmerId);
  if (!current) {
    throw new Error('Order not found or unauthorized.');
  }

  const validPending = ['ORDER_REQUESTED', 'Order Placed', 'Order Requested'];
  if (!validPending.includes(current.status)) {
    throw new Error(`Only pending order requests can be confirmed. Current status: ${current.status}`);
  }

  // If agreedPrice or totalAmount is specified by farmer, update price
  let newAgreedPrice = current.agreedPrice;
  let newTotalAmount = current.totalAmount;

  if (agreedPrice !== undefined && agreedPrice !== null && !isNaN(Number(agreedPrice)) && Number(agreedPrice) > 0) {
    newAgreedPrice = Number(agreedPrice);
    newTotalAmount = Math.round(current.quantity * newAgreedPrice * 100) / 100;
  } else if (totalAmount !== undefined && totalAmount !== null && !isNaN(Number(totalAmount)) && Number(totalAmount) > 0) {
    newTotalAmount = Number(totalAmount);
    newAgreedPrice = Math.round((newTotalAmount / current.quantity) * 100) / 100;
  }

  const history = Array.isArray(current.statusHistory) ? current.statusHistory : [];
  history.push({
    status: 'CONFIRMED',
    timestamp: new Date().toISOString(),
    actor: farmerId,
    note: newTotalAmount > 0
      ? `Order confirmed by farmer at agreed price of ₹${newTotalAmount}.`
      : 'Order confirmed by farmer.',
  });

  db.prepare(`
    UPDATE orders
    SET status = 'CONFIRMED', agreedPrice = ?, totalAmount = ?, statusHistory = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND farmerId = ?
  `).run(newAgreedPrice, newTotalAmount, JSON.stringify(history), current.id, farmerId);

  // Send notification to buyer (Requirement 15)
  createNotificationRecord({
    userId: current.buyerId,
    type: 'order',
    title: 'Order Confirmed',
    description: `Your order ${current.orderNumber} has been confirmed by the farmer.`,
    icon: 'CheckCircle',
    relatedOrderId: current.id,
    actionUrl: `/buyer/track-orders?orderId=${current.id}`,
  });

  return getFarmerOrderById(current.id, farmerId);
}

// ==========================================
// FARMER SET PAYMENT DETAILS (CONFIRMED ORDERS)
// ==========================================
export function setFarmerOrderPayment(orderIdOrNumber, farmerId, { finalQuantity, pricePerUnit, totalAmount, notes } = {}) {
  const db = getDatabase();
  const current = getFarmerOrderById(orderIdOrNumber, farmerId);
  if (!current) {
    throw new Error('Order not found or access unauthorized.');
  }

  // Ensure only the farmer who owns the order can set payment
  if (Number(current.farmerId) !== Number(farmerId)) {
    throw new Error('Unauthorized. You can only set payment for your own orders.');
  }

  // Allowed statuses: confirmed or procurement stages
  const allowedStatuses = [
    'CONFIRMED', 'Confirmed',
    'PROCUREMENT_SCHEDULED', 'Procurement Scheduled',
    'READY_FOR_PROCUREMENT', 'Ready for Procurement',
    'PROCUREMENT_COMPLETED', 'Procurement Completed',
    'COMPLETED', 'Completed',
  ];
  if (!allowedStatuses.includes(current.status)) {
    throw new Error(`Payment can only be set for confirmed orders. Current order status: ${current.status}`);
  }

  // Do not allow changing amount if payment is already PAID
  if (current.paymentStatus === 'PAID' || current.paymentStatus === 'Paid') {
    throw new Error('Payment for this order has already been completed and cannot be modified.');
  }

  // Validate final quantity
  const qty = finalQuantity !== undefined && finalQuantity !== null && !isNaN(Number(finalQuantity))
    ? Number(finalQuantity)
    : (current.actualQuantity && current.actualQuantity > 0 ? Number(current.actualQuantity) : Number(current.quantity));

  if (isNaN(qty) || qty <= 0) {
    throw new Error('Final quantity must be a valid number greater than 0.');
  }

  // Validate price per unit
  let rate = pricePerUnit !== undefined && pricePerUnit !== null && !isNaN(Number(pricePerUnit))
    ? Number(pricePerUnit)
    : (current.agreedPrice && current.agreedPrice > 0 ? Number(current.agreedPrice) : null);

  if ((!rate || isNaN(rate) || rate <= 0) && totalAmount !== undefined && totalAmount !== null && Number(totalAmount) > 0) {
    rate = Math.round((Number(totalAmount) / qty) * 100) / 100;
  }

  if (!rate || isNaN(rate) || rate <= 0) {
    throw new Error('Price per unit must be a valid positive number.');
  }

  // Calculate total: Total Amount = Final Quantity × Price Per Unit
  const calculatedTotal = Math.round(qty * rate * 100) / 100;

  // Append entry to statusHistory
  const history = Array.isArray(current.statusHistory) ? current.statusHistory : [];
  history.push({
    status: current.status,
    timestamp: new Date().toISOString(),
    actor: farmerId,
    note: notes || `Farmer set payment details: ${qty} ${current.unit || 'kg'} @ ₹${rate}/${current.unit || 'kg'} = ₹${calculatedTotal}.`,
  });

  // Check for existing payment record
  let existingPayment = db.prepare(`
    SELECT * FROM payments 
    WHERE orderId = ? AND farmerId = ? AND buyerId = ?
    ORDER BY id DESC LIMIT 1
  `).get(current.id, farmerId, current.buyerId);

  let paymentId;
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (existingPayment && existingPayment.status !== 'PAID') {
    db.prepare(`
      UPDATE payments
      SET amount = ?, procurementAmount = ?, quantity = ?, actualQuantity = ?,
          unit = ?, status = 'PENDING', paymentStatus = 'Payment Pending',
          date = COALESCE(date, ?), updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(calculatedTotal, calculatedTotal, qty, qty, current.unit || 'kg', dateFormatted, existingPayment.id);
    paymentId = existingPayment.id;
  } else if (!existingPayment) {
    const paymentNumber = `KF-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const insertPayment = db.prepare(`
      INSERT INTO payments (
        paymentNumber, orderId, buyerId, farmerId, cropName, quantity, actualQuantity, unit,
        amount, procurementAmount, userId, currency, status, paymentStatus, paymentMethod, transactionId, date, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'PENDING', 'Payment Pending', 'Mandi Escrow / Direct DBT', NULL, ?, CURRENT_TIMESTAMP)
    `);
    const res = insertPayment.run(
      paymentNumber,
      current.id,
      current.buyerId,
      farmerId,
      current.cropName,
      qty,
      qty,
      current.unit || 'kg',
      calculatedTotal,
      calculatedTotal,
      current.buyerId,
      dateFormatted
    );
    paymentId = res.lastInsertRowid;
  } else {
    paymentId = existingPayment.id;
  }

  // Update order record
  db.prepare(`
    UPDATE orders
    SET quantity = ?, actualQuantity = ?, agreedPrice = ?, totalAmount = ?,
        paymentStatus = 'PENDING', paymentId = ?, statusHistory = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND farmerId = ?
  `).run(qty, qty, rate, calculatedTotal, paymentId, JSON.stringify(history), current.id, farmerId);

  // Send real notification to BUYER
  createNotificationRecord({
    userId: current.buyerId,
    type: 'payment',
    title: 'Payment Details Set',
    description: `Farmer has set the payment amount of ₹${calculatedTotal.toLocaleString('en-IN')} for order ${current.orderNumber}. You can now proceed to pay.`,
    icon: 'IndianRupee',
    relatedOrderId: current.id,
    actionUrl: '/buyer/payments',
  });

  return {
    order: getFarmerOrderById(current.id, farmerId),
    payment: getPaymentById(paymentId, farmerId),
  };
}

export function advanceOrderStatus(orderId, nextStatus, note, actorId) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  let history = [];
  try {
    history = JSON.parse(order.statusHistory || '[]');
  } catch {
    history = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
  }

  history.push({
    status: nextStatus,
    timestamp: new Date().toISOString(),
    actor: actorId || null,
    note: note || `Order advanced to ${nextStatus}.`,
  });

  db.prepare(`
    UPDATE orders
    SET status = ?, statusHistory = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextStatus, JSON.stringify(history), order.id);

  // Restore quantity on real farmer crop record if order is cancelled or rejected (Requirement 7 & 31)
  if (['CANCELLED', 'Cancelled', 'REJECTED', 'Rejected'].includes(nextStatus) && order.farmerCropId && order.quantity > 0) {
    try {
      db.prepare(`
        UPDATE crops
        SET quantity = quantity + ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.quantity, order.farmerCropId);
    } catch {}
  }

  // Send real notifications to buyer according to nextStatus
  if (nextStatus === 'CONFIRMED') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'order',
      title: 'Order Confirmed',
      description: `Your order ${order.orderNumber} for ${order.quantity} ${order.unit} of ${order.cropName} has been confirmed by the farmer.`,
      icon: 'CheckCircle',
      relatedOrderId: order.id,
      actionUrl: `/buyer/track-orders?orderId=${order.id}`,
    });
  } else if (nextStatus === 'PROCUREMENT_SCHEDULED') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'procurement',
      title: 'Procurement Schedule Confirmed',
      description: `Procurement slot scheduled for order ${order.orderNumber} at ${order.procurementCentre || 'Mandi Centre'}.`,
      icon: 'Calendar',
      relatedOrderId: order.id,
      actionUrl: `/buyer/track-orders?orderId=${order.id}`,
    });
  } else if (nextStatus === 'READY_FOR_PROCUREMENT') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'procurement',
      title: 'Order Ready for Procurement',
      description: `Order ${order.orderNumber} is verified and ready for mandi weighment & procurement.`,
      icon: 'Truck',
      relatedOrderId: order.id,
      actionUrl: `/buyer/track-orders?orderId=${order.id}`,
    });
  } else if (nextStatus === 'PROCUREMENT_COMPLETED') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'procurement',
      title: 'Procurement Completed',
      description: `Procurement completed successfully for order ${order.orderNumber} (${order.cropName}).`,
      icon: 'CheckCircle2',
      relatedOrderId: order.id,
      actionUrl: `/buyer/purchase-history`,
    });
  } else if (nextStatus === 'COMPLETED') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'order',
      title: 'Order Completed',
      description: `Order ${order.orderNumber} has been marked as fully completed.`,
      icon: 'CheckCircle2',
      relatedOrderId: order.id,
      actionUrl: `/buyer/purchase-history`,
    });
  } else if (nextStatus === 'CANCELLED' || nextStatus === 'REJECTED') {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'order',
      title: nextStatus === 'REJECTED' ? 'Order Request Rejected' : 'Order Cancelled',
      description: note || `Order ${order.orderNumber} was cancelled.`,
      icon: 'AlertTriangle',
      relatedOrderId: order.id,
      actionUrl: `/buyer/orders`,
    });
  }

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
}

// ==========================================
// BUYER PURCHASE HISTORY (REAL COMPLETED PURCHASES)
// ==========================================
export function getBuyerPurchaseHistory(buyerId, { search = '', status = 'ALL', paymentStatus = 'ALL', sortBy = 'newest' } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      o.*,
      p.id as paymentRecordId,
      p.paymentNumber,
      p.amount as paidAmount,
      p.currency as paymentCurrency,
      p.paymentMethod,
      p.transactionId,
      p.status as paymentRecordStatus,
      p.completedAt as paymentCompletedAt,
      u.fullName as farmerName,
      u.mobile as farmerMobile,
      u.location as farmerLocation
    FROM orders o
    LEFT JOIN payments p ON (p.orderId = o.id AND p.status = 'PAID')
    LEFT JOIN users u ON o.farmerId = u.id
    WHERE o.buyerId = ?
      AND o.status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed')
  `;
  const params = [buyerId];

  if (status && status !== 'ALL' && status !== 'All') {
    query += ' AND o.status = ?';
    params.push(status);
  }

  if (paymentStatus && paymentStatus !== 'ALL' && paymentStatus !== 'All') {
    query += ' AND o.paymentStatus = ?';
    params.push(paymentStatus);
  }

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    query += " AND (LOWER(o.orderNumber) LIKE ? OR LOWER(o.cropName) LIKE ? OR LOWER(COALESCE(u.fullName, '')) LIKE ?)";
    params.push(s, s, s);
  }

  if (sortBy === 'oldest') {
    query += ' ORDER BY o.id ASC';
  } else {
    query += ' ORDER BY o.id DESC';
  }

  const rows = db.prepare(query).all(...params);

  return rows.map((r) => {
    let parsedHistory = [];
    try {
      parsedHistory = JSON.parse(r.statusHistory || '[]');
    } catch {
      parsedHistory = [{ status: r.status, timestamp: r.createdAt, note: 'Order created.' }];
    }

    return {
      id: r.id,
      orderNumber: r.orderNumber,
      buyerId: r.buyerId,
      farmerId: r.farmerId,
      farmerCropId: r.farmerCropId,
      cropName: r.cropName,
      quantity: r.quantity,
      actualQuantity: r.actualQuantity || r.quantity,
      unit: r.unit || 'kg',
      procurementCentre: r.procurementCentre,
      centreAddress: r.centreAddress,
      bookingToken: r.bookingToken,
      expectedDate: r.expectedDate,
      status: r.status,
      paymentStatus: r.paymentStatus || (r.paidAmount ? 'PAID' : 'PENDING'),
      totalAmount: r.totalAmount,
      agreedPrice: r.agreedPrice,
      paidAt: r.paidAt || r.paymentCompletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      statusHistory: parsedHistory,
      farmer: {
        id: r.farmerId,
        name: r.farmerName || 'Registered Farmer',
        mobile: r.farmerMobile,
        location: r.farmerLocation,
      },
      payment: r.paymentRecordId ? {
        id: r.paymentRecordId,
        paymentNumber: r.paymentNumber,
        amount: r.paidAmount,
        currency: r.paymentCurrency || 'INR',
        method: r.paymentMethod,
        transactionId: r.transactionId,
        status: r.paymentRecordStatus,
        completedAt: r.paymentCompletedAt,
      } : null,
    };
  });
}

// ==========================================
// ADMIN DASHBOARD REAL DATA & METRICS
// ==========================================
export function getAdminDashboardData(adminId = null) {
  const db = getDatabase();

  let admin = null;
  if (adminId) {
    admin = getUserById(adminId);
  }
  if (!admin) {
    admin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get() || null;
  }

  // 1. Statistics Cards (8 metrics)
  const totalFarmers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'").get()?.count || 0;
  const totalBuyers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'buyer'").get()?.count || 0;
  const activeCrops = db.prepare("SELECT COUNT(*) as count FROM crops").get()?.count || 0;
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get()?.count || 0;
  
  const pendingOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE status NOT IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed', 'Delivered', 'Cancelled', 'CANCELLED')
  `).get()?.count || 0;

  const completedOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed', 'Delivered')
  `).get()?.count || 0;
  const completedBookings = db.prepare(`
    SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'
  `).get()?.count || 0;
  const completedProcurement = completedOrders + completedBookings;

  const pendingPaymentsRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount 
    FROM payments 
    WHERE status = 'PENDING' OR paymentStatus LIKE '%Pending%'
  `).get();
  const pendingPaymentsCount = pendingPaymentsRow?.count || 0;

  const procurementCentresCount = db.prepare("SELECT COUNT(*) as count FROM procurement_centres").get()?.count || 0;

  // 2. Procurement Overview
  const pendingProcurementCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE status IN ('ORDER_REQUESTED', 'Pending', 'Waiting')
  `).get()?.count || 0;

  const scheduledProcurementCount = (
    (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('CONFIRMED', 'PROCUREMENT_SCHEDULED')").get()?.count || 0) +
    (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status IN ('Confirmed', 'Upcoming')").get()?.count || 0)
  );

  const atCentreCount = (
    (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('READY_FOR_PROCUREMENT')").get()?.count || 0) +
    (db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status IN ('In Queue', 'Waiting', 'Active')").get()?.count || 0)
  );

  // 3. Recent Orders
  const recentOrdersRaw = db.prepare(`
    SELECT 
      o.id,
      o.orderNumber,
      o.cropName,
      o.quantity,
      o.unit,
      o.status,
      o.paymentStatus,
      o.totalAmount,
      o.createdAt,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      f.fullName as farmerName
    FROM orders o
    LEFT JOIN users b ON o.buyerId = b.id
    LEFT JOIN users f ON o.farmerId = f.id
    ORDER BY o.id DESC
    LIMIT 10
  `).all();

  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber || `KF-ORD-${o.id}`,
    cropName: o.cropName,
    buyerName: o.buyerCompany || o.buyerName || 'Registered Buyer',
    farmerName: o.farmerName || 'Registered Farmer',
    quantity: o.quantity,
    unit: o.unit || 'kg',
    status: o.status || 'CONFIRMED',
    paymentStatus: o.paymentStatus || 'Pending',
    totalAmount: o.totalAmount || 0,
    createdAt: o.createdAt,
  }));

  // 4. Payment Overview
  const pendingPay = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
    FROM payments 
    WHERE status = 'PENDING' OR paymentStatus LIKE '%Pending%'
  `).get();

  const processingPay = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
    FROM payments 
    WHERE status = 'PROCESSING' OR paymentStatus LIKE '%Processing%'
  `).get();

  const paidPay = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
    FROM payments 
    WHERE status = 'PAID' OR paymentStatus LIKE '%Received%' OR paymentStatus LIKE '%Paid%'
  `).get();

  const failedPay = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount 
    FROM payments 
    WHERE status = 'FAILED' OR paymentStatus LIKE '%Failed%'
  `).get();

  const paymentOverview = {
    pending: { count: pendingPay?.count || 0, amount: pendingPay?.amount || 0 },
    processing: { count: processingPay?.count || 0, amount: processingPay?.amount || 0 },
    paid: { count: paidPay?.count || 0, amount: paidPay?.amount || 0 },
    failed: { count: failedPay?.count || 0, amount: failedPay?.amount || 0 },
    totalVolume: paidPay?.amount || 0,
  };

  // 5. Users Overview
  const recentFarmers = db.prepare(`
    SELECT id, fullName, email, mobile, location, createdAt 
    FROM users WHERE role = 'farmer' 
    ORDER BY id DESC LIMIT 3
  `).all();

  const recentBuyers = db.prepare(`
    SELECT id, fullName, email, mobile, companyName, location, createdAt 
    FROM users WHERE role = 'buyer' 
    ORDER BY id DESC LIMIT 3
  `).all();

  // 6. Procurement Centres
  const centres = db.prepare(`
    SELECT id, name, address, distanceKm, currentCrowd, estimatedWaitMins, todayCapacityPercent, availableSlotsCount 
    FROM procurement_centres 
    ORDER BY name ASC
  `).all();

  // 7. Recent Activity (Synthesized from actual platform events)
  const activities = [];

  // Recent users
  const recentUsers = db.prepare(`
    SELECT id, fullName, role, createdAt, location, companyName 
    FROM users 
    WHERE role IN ('farmer', 'buyer') 
    ORDER BY id DESC LIMIT 4
  `).all();
  recentUsers.forEach((u) => {
    activities.push({
      id: `user-${u.id}`,
      type: u.role === 'farmer' ? 'FARMER_REGISTERED' : 'BUYER_REGISTERED',
      title: u.role === 'farmer' ? `New Farmer Registered: ${u.fullName}` : `New Buyer Registered: ${u.companyName || u.fullName}`,
      description: u.location ? `Registered from ${u.location}` : `Registered on KishanFlow`,
      timestamp: u.createdAt,
      badgeText: u.role === 'farmer' ? 'Farmer' : 'Buyer',
      badgeColor: u.role === 'farmer' ? 'green' : 'amber',
    });
  });

  // Recent orders
  const recentOrderActivities = db.prepare(`
    SELECT o.id, o.orderNumber, o.cropName, o.quantity, o.unit, o.status, o.createdAt, u.fullName as buyerName 
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    ORDER BY o.id DESC LIMIT 4
  `).all();
  recentOrderActivities.forEach((o) => {
    activities.push({
      id: `order-${o.id}`,
      type: o.status === 'PROCUREMENT_COMPLETED' ? 'PROCUREMENT_COMPLETED' : 'ORDER_EVENT',
      title: `Order #${o.orderNumber || o.id}: ${o.cropName} (${o.quantity} ${o.unit || 'kg'})`,
      description: `Status: ${o.status.replace(/_/g, ' ')} • Buyer: ${o.buyerName || 'Buyer'}`,
      timestamp: o.createdAt,
      badgeText: o.status.replace(/_/g, ' '),
      badgeColor: o.status === 'PROCUREMENT_COMPLETED' ? 'green' : 'blue',
    });
  });

  // Recent payments
  const recentPaymentActivities = db.prepare(`
    SELECT p.id, p.paymentNumber, p.amount, p.currency, p.status, p.paymentStatus, p.completedAt, p.createdAt, p.cropName 
    FROM payments p
    ORDER BY p.id DESC LIMIT 3
  `).all();
  recentPaymentActivities.forEach((p) => {
    const isPaid = p.status === 'PAID' || (p.paymentStatus && p.paymentStatus.includes('Received'));
    activities.push({
      id: `payment-${p.id}`,
      type: 'PAYMENT_EVENT',
      title: `Payment ${p.paymentNumber || `#${p.id}`}: ₹${(p.amount || 0).toLocaleString('en-IN')}`,
      description: `${p.cropName || 'Crop produce'} • ${isPaid ? 'Settlement successful' : (p.paymentStatus || 'Pending')}`,
      timestamp: p.completedAt || p.createdAt,
      badgeText: isPaid ? 'Paid' : 'Processing',
      badgeColor: isPaid ? 'emerald' : 'amber',
    });
  });

  // Sort activities chronologically (newest first)
  activities.sort((a, b) => {
    const tA = new Date(a.timestamp || 0).getTime();
    const tB = new Date(b.timestamp || 0).getTime();
    return tB - tA;
  });

  return {
    admin,
    stats: {
      totalFarmers,
      totalBuyers,
      activeCrops,
      totalOrders,
      pendingOrders,
      completedProcurement,
      pendingPayments: pendingPaymentsCount,
      procurementCentres: procurementCentresCount,
    },
    procurementOverview: {
      pending: pendingProcurementCount,
      scheduled: scheduledProcurementCount,
      atCentre: atCentreCount,
      completed: completedProcurement,
    },
    recentOrders,
    paymentOverview,
    usersOverview: {
      farmersCount: totalFarmers,
      buyersCount: totalBuyers,
      recentFarmers,
      recentBuyers,
    },
    procurementCentres: centres,
    recentActivity: activities.slice(0, 8),
  };
}

// ==========================================
// ADMIN FARMERS MANAGEMENT
// ==========================================
export function getAdminFarmers({ search = '', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      u.id, 
      u.fullName, 
      u.email, 
      u.mobile, 
      u.location, 
      u.createdAt, 
      COALESCE(u.accountStatus, 'Active') as accountStatus,
      COUNT(DISTINCT c.id) as cropCount,
      COUNT(DISTINCT o.id) as orderCount
    FROM users u
    LEFT JOIN crops c ON c.userId = u.id
    LEFT JOIN orders o ON o.farmerId = u.id
    WHERE u.role = 'farmer'
  `;
  const params = [];

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(u.fullName) LIKE ? OR LOWER(COALESCE(u.email, '')) LIKE ? OR COALESCE(u.mobile, '') LIKE ? OR LOWER(COALESCE(u.location, '')) LIKE ?)`;
    params.push(s, s, s, s);
  }

  query += ` GROUP BY u.id ORDER BY u.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function getAdminFarmerDetails(farmerId) {
  const db = getDatabase();
  const farmer = db.prepare("SELECT id, fullName, email, mobile, location, createdAt, COALESCE(accountStatus, 'Active') as accountStatus FROM users WHERE id = ? AND role = 'farmer'").get(farmerId);
  if (!farmer) return null;

  const crops = db.prepare("SELECT id, name, quantity, unit, harvestStatus, expectedHarvestDate, notes, createdAt FROM crops WHERE userId = ? ORDER BY id DESC").all(farmerId);

  const orders = db.prepare(`
    SELECT o.id, o.orderNumber, o.cropName, o.quantity, o.unit, o.status, o.paymentStatus, o.totalAmount, o.createdAt, u.fullName as buyerName
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    WHERE o.farmerId = ?
    ORDER BY o.id DESC
  `).all(farmerId);

  const bookings = db.prepare(`
    SELECT id, bookingNumber, tokenNumber, cropName, quantity, unit, centreName, date, timeSlot, status, estimatedWaitMins, createdAt
    FROM bookings
    WHERE userId = ?
    ORDER BY id DESC
  `).all(farmerId);

  return {
    farmer,
    crops,
    orders,
    bookings,
  };
}

// ==========================================
// ADMIN BUYERS MANAGEMENT
// ==========================================
export function getAdminBuyers({ search = '', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      u.id, 
      u.fullName, 
      u.companyName,
      u.email, 
      u.mobile, 
      u.location, 
      u.createdAt, 
      COALESCE(u.accountStatus, 'Active') as accountStatus,
      COUNT(DISTINCT o.id) as orderCount,
      COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) as totalPaidAmount
    FROM users u
    LEFT JOIN orders o ON o.buyerId = u.id
    LEFT JOIN payments p ON p.buyerId = u.id
    WHERE u.role = 'buyer'
  `;
  const params = [];

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(u.fullName) LIKE ? OR LOWER(COALESCE(u.companyName, '')) LIKE ? OR LOWER(COALESCE(u.email, '')) LIKE ? OR COALESCE(u.mobile, '') LIKE ? OR LOWER(COALESCE(u.location, '')) LIKE ?)`;
    params.push(s, s, s, s, s);
  }

  query += ` GROUP BY u.id ORDER BY u.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function getAdminBuyerDetails(buyerId) {
  const db = getDatabase();
  const buyer = db.prepare("SELECT id, fullName, companyName, businessType, gstin, email, mobile, location, createdAt, COALESCE(accountStatus, 'Active') as accountStatus FROM users WHERE id = ? AND role = 'buyer'").get(buyerId);
  if (!buyer) return null;

  const orders = db.prepare(`
    SELECT o.id, o.orderNumber, o.cropName, o.quantity, o.unit, o.status, o.paymentStatus, o.totalAmount, o.createdAt, u.fullName as farmerName
    FROM orders o
    LEFT JOIN users u ON o.farmerId = u.id
    WHERE o.buyerId = ?
    ORDER BY o.id DESC
  `).all(buyerId);

  const payments = db.prepare(`
    SELECT id, paymentNumber, cropName, amount, currency, status, paymentMethod, transactionId, completedAt, createdAt
    FROM payments
    WHERE buyerId = ? OR userId = ?
    ORDER BY id DESC
  `).all(buyerId, buyerId);

  return {
    buyer,
    orders,
    payments,
  };
}

// ==========================================
// ADMIN NOTIFICATIONS MANAGEMENT
// ==========================================
export function getAdminNotifications({ type = 'ALL', search = '', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      n.id,
      n.userId,
      n.type,
      n.title,
      n.description,
      n.timestampText,
      n.isRead,
      n.icon,
      n.relatedOrderId,
      n.relatedBookingId,
      n.relatedCropId,
      n.createdAt,
      u.fullName as userName,
      u.role as userRole
    FROM notifications n
    LEFT JOIN users u ON n.userId = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type && type !== 'ALL' && type !== 'All') {
    query += ` AND LOWER(n.type) = ?`;
    params.push(type.toLowerCase());
  }

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(n.title) LIKE ? OR LOWER(COALESCE(n.description, '')) LIKE ? OR LOWER(COALESCE(u.fullName, '')) LIKE ?)`;
    params.push(s, s, s);
  }

  query += ` ORDER BY n.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const notifications = db.prepare(query).all(...params);
  const unreadCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE isRead = 0").get()?.count || 0;
  const totalCount = db.prepare("SELECT COUNT(*) as count FROM notifications").get()?.count || 0;

  return {
    notifications,
    unreadCount,
    totalCount,
  };
}

export function markAdminNotificationRead(notificationId) {
  const db = getDatabase();
  db.prepare("UPDATE notifications SET isRead = 1 WHERE id = ?").run(notificationId);
  return true;
}

export function markAllAdminNotificationsRead() {
  const db = getDatabase();
  db.prepare("UPDATE notifications SET isRead = 1").run();
  return true;
}

// ==========================================
// ADMIN PROCUREMENT CENTRES MANAGEMENT
// ==========================================
export function getAdminCentresList({ search = '' } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM orders o WHERE o.procurementCentre = c.name OR o.procurementCentre = c.id) as assignedOrdersCount,
      (SELECT COUNT(*) FROM orders o WHERE (o.procurementCentre = c.name OR o.procurementCentre = c.id) AND o.status NOT IN ('COMPLETED', 'Completed', 'CANCELLED', 'Cancelled')) as activeOrdersCount,
      (SELECT COUNT(*) FROM orders o WHERE (o.procurementCentre = c.name OR o.procurementCentre = c.id) AND o.status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed')) as completedProcurementCount,
      (SELECT COUNT(*) FROM bookings b WHERE b.centreId = c.id OR b.centreName = c.name) as bookingsCount
    FROM procurement_centres c
    WHERE 1=1
  `;
  const params = [];

  if (search && search.trim()) {
    const s = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(c.name) LIKE ? OR LOWER(c.address) LIKE ?)`;
    params.push(s, s);
  }

  query += ` ORDER BY c.name ASC`;
  return db.prepare(query).all(...params);
}

export function getAdminCentreDetails(centreId) {
  const db = getDatabase();
  const centre = db.prepare(`
    SELECT * FROM procurement_centres 
    WHERE id = ? OR name = ? OR ('centre-' || ?) = id OR id = ('centre-' || ?)
    LIMIT 1
  `).get(centreId, centreId, centreId, centreId);
  if (!centre) return null;

  // Real assigned orders using procurementCentreId or procurementCentre
  const assignedOrders = db.prepare(`
    SELECT 
      o.*,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      b.mobile as buyerMobile,
      b.email as buyerEmail,
      f.fullName as farmerName,
      f.mobile as farmerMobile
    FROM orders o
    LEFT JOIN users b ON o.buyerId = b.id
    LEFT JOIN users f ON o.farmerId = f.id
    WHERE o.procurementCentreId = ? OR o.procurementCentre = ? OR o.procurementCentre = ?
    ORDER BY o.id DESC
  `).all(centre.id, centre.name, centre.id);

  // Real upcoming bookings
  const upcomingBookings = db.prepare(`
    SELECT 
      b.*,
      u.fullName as farmerName,
      u.mobile as farmerMobile
    FROM bookings b
    LEFT JOIN users u ON b.userId = u.id
    WHERE b.centreId = ? OR b.centreName = ?
    ORDER BY b.id DESC
  `).all(centre.id, centre.name);

  // Compute live operational metrics from real database records
  const totalOrders = assignedOrders.length;
  const pendingOrders = assignedOrders.filter(o => 
    !['COMPLETED', 'Completed', 'CANCELLED', 'Cancelled'].includes(o.status)
  ).length;
  const completedOrders = assignedOrders.filter(o => 
    ['PROCUREMENT_COMPLETED', 'Procurement Completed', 'COMPLETED', 'Completed'].includes(o.status)
  ).length;
  const currentQueue = upcomingBookings.filter(b => 
    !['Completed', 'Cancelled'].includes(b.status)
  ).length;

  return {
    centre: {
      ...centre,
      totalOrders,
      pendingOrders,
      completedOrders,
      currentQueue,
      centreStatus: centre.status || 'Active',
      location: centre.address || 'APMC Samiti Yard',
    },
    assignedOrders,
    upcomingBookings,
  };
}

// ==========================================
// ADMIN ORDERS MANAGEMENT
// ==========================================
export function getAdminOrdersList({ search = '', status = 'ALL', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      o.*,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      b.email as buyerEmail,
      b.mobile as buyerMobile,
      f.fullName as farmerName,
      f.mobile as farmerMobile,
      f.location as farmerLocation
    FROM orders o
    LEFT JOIN users b ON o.buyerId = b.id
    LEFT JOIN users f ON o.farmerId = f.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL' && status !== 'All') {
    const s = status.toUpperCase();
    if (s === 'REQUESTED' || s === 'ORDER_REQUESTED') {
      query += ` AND o.status IN ('ORDER_REQUESTED', 'Order Placed', 'Order Requested', 'Pending')`;
    } else if (s === 'CONFIRMED') {
      query += ` AND o.status IN ('CONFIRMED', 'Confirmed')`;
    } else if (s === 'PROCUREMENT_SCHEDULED') {
      query += ` AND o.status IN ('PROCUREMENT_SCHEDULED', 'Procurement Scheduled', 'Scheduled')`;
    } else if (s === 'READY_FOR_PROCUREMENT') {
      query += ` AND o.status IN ('READY_FOR_PROCUREMENT', 'Ready for Procurement')`;
    } else if (s === 'PROCUREMENT_COMPLETED') {
      query += ` AND o.status IN ('PROCUREMENT_COMPLETED', 'Procurement Completed')`;
    } else if (s === 'COMPLETED') {
      query += ` AND o.status IN ('COMPLETED', 'Completed', 'Delivered')`;
    } else if (s === 'CANCELLED') {
      query += ` AND o.status IN ('CANCELLED', 'Cancelled')`;
    } else {
      query += ` AND UPPER(o.status) = ?`;
      params.push(s);
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(o.orderNumber) LIKE ? OR 
      LOWER(o.cropName) LIKE ? OR 
      LOWER(COALESCE(b.fullName, '')) LIKE ? OR 
      LOWER(COALESCE(b.companyName, '')) LIKE ? OR 
      LOWER(COALESCE(f.fullName, '')) LIKE ? OR 
      LOWER(COALESCE(o.procurementCentre, '')) LIKE ?
    )`;
    params.push(term, term, term, term, term, term);
  }

  query += ` ORDER BY o.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);

  // Parse statusHistory for each order
  return orders.map((order) => {
    let history = [];
    try {
      history = JSON.parse(order.statusHistory || '[]');
    } catch {
      history = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
    }
    return {
      ...order,
      statusHistory: history,
    };
  });
}

export function getAdminOrderDetails(orderId) {
  const db = getDatabase();
  const order = db.prepare(`
    SELECT 
      o.*,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      b.email as buyerEmail,
      b.mobile as buyerMobile,
      b.location as buyerLocation,
      f.fullName as farmerName,
      f.mobile as farmerMobile,
      f.email as farmerEmail,
      f.location as farmerLocation
    FROM orders o
    LEFT JOIN users b ON o.buyerId = b.id
    LEFT JOIN users f ON o.farmerId = f.id
    WHERE o.id = ? OR o.orderNumber = ?
    LIMIT 1
  `).get(orderId, String(orderId));

  if (!order) return null;

  let history = [];
  try {
    history = JSON.parse(order.statusHistory || '[]');
  } catch {
    history = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
  }

  // Related crop listing
  let crop = null;
  if (order.farmerCropId || order.cropId) {
    crop = db.prepare("SELECT * FROM crops WHERE id = ?").get(order.farmerCropId || order.cropId) || null;
  }

  // Related payment record if any
  let payment = null;
  if (order.paymentId || order.id) {
    payment = db.prepare("SELECT * FROM payments WHERE id = ? OR orderId = ? ORDER BY id DESC LIMIT 1").get(order.paymentId || 0, order.id) || null;
  }

  // Related procurement centre info
  let centre = null;
  if (order.procurementCentre) {
    centre = db.prepare("SELECT * FROM procurement_centres WHERE name = ? OR id = ?").get(order.procurementCentre, order.procurementCentre) || null;
  }

  // Determine procurement and payment timestamps from real audit history
  let procurementDate = null;
  if (order.status === 'PROCUREMENT_COMPLETED' || order.status === 'Procurement Completed') {
    const completedHistory = history.find(h =>
      String(h.status || '').toUpperCase().includes('PROCUREMENT_COMPLETED') ||
      String(h.status || '').toUpperCase().includes('COMPLETED')
    );
    procurementDate = completedHistory?.timestamp || order.updatedAt;
  }

  const paymentDate = order.paidAt || payment?.completedAt || payment?.date || null;

  return {
    ...order,
    statusHistory: history,
    crop,
    payment,
    centre,
    procurementStatus: order.status,
    procurementDate,
    paymentDate,
  };
}

export function completeAdminProcurement(orderIdentifier, adminId, extra = {}) {
  const db = getDatabase();
  let order = null;

  // 1. Resolve order by primary ID or orderNumber
  const directId = orderIdentifier || extra?.orderId;
  if (directId) {
    order = db.prepare('SELECT * FROM orders WHERE id = ? OR orderNumber = ?').get(directId, String(directId));
  }

  // 2. Resolve by tokenNumber if not yet found
  const token = extra?.tokenNumber || (typeof orderIdentifier === 'string' && orderIdentifier.startsWith('KF-') ? orderIdentifier : null);
  if (!order && token) {
    order = db.prepare("SELECT * FROM orders WHERE bookingToken = ? AND status NOT IN ('CANCELLED', 'Cancelled') ORDER BY id DESC").get(token);
    if (!order) {
      // Fallback: any order with this token
      order = db.prepare('SELECT * FROM orders WHERE bookingToken = ? ORDER BY id DESC').get(token);
    }
  }

  // 3. Resolve by bookingId if not yet found
  const bookingId = extra?.bookingId;
  if (!order && bookingId) {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR bookingNumber = ?').get(bookingId, String(bookingId));
    if (booking) {
      if (booking.tokenNumber) {
        order = db.prepare("SELECT * FROM orders WHERE bookingToken = ? AND status NOT IN ('CANCELLED', 'Cancelled') ORDER BY id DESC").get(booking.tokenNumber);
      }
      if (!order && booking.userId) {
        order = db.prepare(`
          SELECT * FROM orders 
          WHERE farmerId = ? AND (farmerCropId = ? OR LOWER(cropName) = LOWER(?)) 
            AND status NOT IN ('CANCELLED', 'Cancelled')
          ORDER BY id DESC
        `).get(booking.userId, booking.cropId, booking.cropName);
      }
    }
  }

  // 4. Resolve by farmerId + farmerCropId / cropName if passed
  if (!order && extra?.farmerId) {
    order = db.prepare(`
      SELECT * FROM orders 
      WHERE farmerId = ? AND (farmerCropId = ? OR LOWER(cropName) = LOWER(?))
        AND status NOT IN ('CANCELLED', 'Cancelled')
      ORDER BY id DESC
    `).get(extra.farmerId, extra.farmerCropId, extra.cropName || '');
  }

  // 5. If genuinely no order could be resolved, throw precise error required by Requirement/Step 5
  if (!order) {
    throw new Error('Order not found for this queue entry.');
  }

  const currentStatus = (order.status || '').toUpperCase();
  if (['CANCELLED', 'Cancelled'].includes(order.status)) {
    throw new Error('Cannot complete procurement for a cancelled order.');
  }

  // Step 6: Prevent duplicate completion. Return existing record without duplicating history or erroring out.
  if (['PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed'].includes(currentStatus)) {
    if (order.bookingToken) {
      try {
        db.prepare("UPDATE bookings SET status = 'Completed', updatedAt = CURRENT_TIMESTAMP WHERE tokenNumber = ? AND status != 'Completed'").run(order.bookingToken);
      } catch {}
    }
    if (extra?.bookingId) {
      try {
        db.prepare("UPDATE bookings SET status = 'Completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND status != 'Completed'").run(extra.bookingId);
      } catch {}
    }
    return getAdminOrderDetails(order.id);
  }

  const now = new Date().toISOString();
  let history = [];
  try {
    history = JSON.parse(order.statusHistory || '[]');
  } catch {
    history = [{ status: order.status, timestamp: order.createdAt, note: 'Order created.' }];
  }

  history.push({
    status: 'PROCUREMENT_COMPLETED',
    timestamp: now,
    actor: adminId || 'ADMIN',
    note: `Procurement marked as completed at ${order.procurementCentre || 'APMC Mandi Samiti'} by Administrator.`,
  });

  db.prepare(`
    UPDATE orders
    SET status = 'PROCUREMENT_COMPLETED',
        statusHistory = ?,
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(history), order.id);

  // Sync related booking if exists (Requirement 26 & 32)
  if (order.bookingToken) {
    try {
      db.prepare("UPDATE bookings SET status = 'Completed', updatedAt = CURRENT_TIMESTAMP WHERE tokenNumber = ? AND status != 'Completed'").run(order.bookingToken);
    } catch {}
  }
  if (extra?.bookingId) {
    try {
      db.prepare("UPDATE bookings SET status = 'Completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND status != 'Completed'").run(extra.bookingId);
    } catch {}
  }

  // Send real notifications
  if (order.buyerId) {
    createNotificationRecord({
      userId: order.buyerId,
      type: 'procurement',
      title: 'Procurement Completed',
      description: `Procurement completed successfully for order ${order.orderNumber} (${order.cropName}) at ${order.procurementCentre || 'Mandi Centre'}.`,
      icon: 'CheckCircle2',
      relatedOrderId: order.id,
      actionUrl: `/buyer/track-orders?orderId=${order.id}`,
    });
  }

  if (order.farmerId) {
    createNotificationRecord({
      userId: order.farmerId,
      type: 'procurement',
      title: 'Procurement Completed',
      description: `Procurement completed for order ${order.orderNumber} (${order.cropName}). Set final payment details to proceed.`,
      icon: 'CheckCircle2',
      relatedOrderId: order.id,
      actionUrl: `/farmer/orders`,
    });
  }

  return getAdminOrderDetails(order.id);
}

// ==========================================
// ADMIN PAYMENTS MANAGEMENT
// ==========================================
export function getAdminPaymentsList({ search = '', status = 'ALL', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      p.*,
      o.orderNumber,
      o.cropName as orderCropName,
      o.quantity as orderQuantity,
      o.unit as orderUnit,
      o.status as orderStatus,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      b.email as buyerEmail,
      b.mobile as buyerMobile,
      f.fullName as farmerName,
      f.mobile as farmerMobile
    FROM payments p
    LEFT JOIN orders o ON p.orderId = o.id
    LEFT JOIN users b ON (p.buyerId = b.id OR o.buyerId = b.id)
    LEFT JOIN users f ON (p.farmerId = f.id OR o.farmerId = f.id)
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL' && status !== 'All') {
    const s = status.toUpperCase();
    if (s === 'PAID') {
      query += ` AND (p.status = 'PAID' OR p.paymentStatus LIKE '%Paid%' OR p.paymentStatus LIKE '%Received%')`;
    } else if (s === 'PENDING') {
      query += ` AND (p.status = 'PENDING' OR p.paymentStatus LIKE '%Pending%')`;
    } else if (s === 'PROCESSING') {
      query += ` AND (p.status = 'PROCESSING' OR p.paymentStatus LIKE '%Processing%')`;
    } else if (s === 'FAILED') {
      query += ` AND (p.status = 'FAILED' OR p.paymentStatus LIKE '%Failed%')`;
    } else {
      query += ` AND UPPER(COALESCE(p.status, '')) = ?`;
      params.push(s);
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(COALESCE(p.paymentNumber, '')) LIKE ? OR 
      LOWER(COALESCE(o.orderNumber, '')) LIKE ? OR 
      LOWER(COALESCE(b.fullName, '')) LIKE ? OR 
      LOWER(COALESCE(b.companyName, '')) LIKE ? OR 
      LOWER(COALESCE(f.fullName, '')) LIKE ? OR 
      LOWER(COALESCE(p.cropName, '')) LIKE ? OR
      LOWER(COALESCE(p.transactionId, '')) LIKE ?
    )`;
    params.push(term, term, term, term, term, term, term);
  }

  query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function getAdminPaymentMetrics() {
  const db = getDatabase();

  const totalPayments = db.prepare("SELECT COUNT(*) as count FROM payments").get()?.count || 0;

  const paidRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
    FROM payments
    WHERE status = 'PAID' OR paymentStatus LIKE '%Paid%' OR paymentStatus LIKE '%Received%'
  `).get();

  const pendingRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
    FROM payments
    WHERE status = 'PENDING' OR paymentStatus LIKE '%Pending%'
  `).get();

  const processingRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
    FROM payments
    WHERE status = 'PROCESSING' OR paymentStatus LIKE '%Processing%'
  `).get();

  const failedRow = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
    FROM payments
    WHERE status = 'FAILED' OR paymentStatus LIKE '%Failed%'
  `).get();

  return {
    totalPayments,
    paidCount: paidRow?.count || 0,
    totalPaidAmount: paidRow?.totalAmount || 0,
    pendingCount: pendingRow?.count || 0,
    pendingAmount: pendingRow?.totalAmount || 0,
    processingCount: processingRow?.count || 0,
    processingAmount: processingRow?.totalAmount || 0,
    failedCount: failedRow?.count || 0,
    failedAmount: failedRow?.totalAmount || 0,
  };
}

export function getAdminPaymentDetails(paymentId) {
  const db = getDatabase();
  const payment = db.prepare(`
    SELECT 
      p.*,
      o.orderNumber,
      o.cropName as orderCropName,
      o.quantity as orderQuantity,
      o.unit as orderUnit,
      o.status as orderStatus,
      o.procurementCentre,
      o.createdAt as orderDate,
      b.fullName as buyerName,
      b.companyName as buyerCompany,
      b.email as buyerEmail,
      b.mobile as buyerMobile,
      b.location as buyerLocation,
      f.fullName as farmerName,
      f.mobile as farmerMobile,
      f.location as farmerLocation
    FROM payments p
    LEFT JOIN orders o ON p.orderId = o.id
    LEFT JOIN users b ON (p.buyerId = b.id OR o.buyerId = b.id)
    LEFT JOIN users f ON (p.farmerId = f.id OR o.farmerId = f.id)
    WHERE p.id = ? OR p.paymentNumber = ?
    LIMIT 1
  `).get(paymentId, String(paymentId));

  if (!payment) return null;

  if (payment.orderId) {
    payment.order = db.prepare("SELECT * FROM orders WHERE id = ?").get(payment.orderId) || null;
  }

  return payment;
}

// ==========================================
// REAL PROCUREMENT QUEUE & TOKEN MANAGEMENT
// ==========================================
export function ensureOrderToken(orderId) {
  const db = getDatabase();
  const order = db.prepare('SELECT id, bookingToken, procurementCentre FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  if (order.bookingToken) return order.bookingToken;

  const tokenNumber = `KF-${100 + Number(order.id)}`;
  db.prepare('UPDATE orders SET bookingToken = ? WHERE id = ?').run(tokenNumber, order.id);
  return tokenNumber;
}

export function getCentreQueueState(centreIdOrName) {
  if (!centreIdOrName) return null;
  const db = getDatabase();
  let centre = db.prepare('SELECT * FROM procurement_centres WHERE id = ? OR name = ? LIMIT 1').get(centreIdOrName, centreIdOrName);
  if (!centre) {
    centre = db.prepare('SELECT * FROM procurement_centres WHERE LOWER(name) LIKE LOWER(?) LIMIT 1').get(`%${centreIdOrName}%`);
  }
  if (!centre) return null;

  // Active orders for this centre
  const activeOrders = db.prepare(`
    SELECT 
      o.id,
      o.orderNumber,
      o.bookingToken,
      o.farmerId,
      o.farmerCropId,
      o.cropName,
      o.quantity,
      o.unit,
      o.procurementCentre,
      o.centreAddress,
      o.expectedDate,
      o.status,
      o.createdAt,
      u.fullName as farmerName,
      u.mobile as farmerMobile,
      b.fullName as buyerName
    FROM orders o
    LEFT JOIN users u ON o.farmerId = u.id
    LEFT JOIN users b ON o.buyerId = b.id
    WHERE (o.procurementCentre = ? OR o.procurementCentre = ?)
      AND o.status NOT IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed', 'CANCELLED', 'Cancelled')
    ORDER BY o.id ASC
  `).all(centre.name, centre.id);

  // Active bookings for this centre (if not already represented by an order)
  const activeBookings = db.prepare(`
    SELECT 
      bk.id,
      bk.bookingNumber,
      bk.tokenNumber,
      bk.userId as farmerId,
      bk.cropId as farmerCropId,
      bk.cropName,
      bk.quantity,
      bk.unit,
      bk.centreName as procurementCentre,
      bk.centreAddress,
      bk.date as expectedDate,
      bk.status,
      bk.createdAt,
      u.fullName as farmerName,
      u.mobile as farmerMobile,
      NULL as buyerName
    FROM bookings bk
    LEFT JOIN users u ON bk.userId = u.id
    WHERE (bk.centreId = ? OR bk.centreName = ?)
      AND bk.status NOT IN ('Completed', 'Cancelled')
    ORDER BY bk.id ASC
  `).all(centre.id, centre.name);

  // Merge into activeQueue deterministically
  const queueEntries = [];
  const seenTokens = new Set();

  for (const o of activeOrders) {
    let token = o.bookingToken;
    if (!token) {
      token = `KF-${100 + o.id}`;
      db.prepare('UPDATE orders SET bookingToken = ? WHERE id = ?').run(token, o.id);
    }
    seenTokens.add(token);
    queueEntries.push({
      type: 'ORDER',
      id: o.id,
      orderId: o.id,
      orderNumber: o.orderNumber,
      tokenNumber: token,
      farmerId: o.farmerId,
      farmerName: o.farmerName || 'Registered Farmer',
      farmerMobile: o.farmerMobile || '',
      cropName: o.cropName,
      quantity: o.quantity,
      unit: o.unit || 'kg',
      buyerName: o.buyerName || 'Verified Buyer',
      status: o.status,
      expectedDate: o.expectedDate,
      createdAt: o.createdAt,
    });
  }

  for (const b of activeBookings) {
    if (!seenTokens.has(b.tokenNumber)) {
      seenTokens.add(b.tokenNumber);

      // Attempt to resolve real matched order for this booking
      let matchedOrder = db.prepare(`
        SELECT id, orderNumber, buyerId, status 
        FROM orders 
        WHERE bookingToken = ? AND status NOT IN ('CANCELLED', 'Cancelled')
        LIMIT 1
      `).get(b.tokenNumber);

      if (!matchedOrder && b.farmerCropId) {
        matchedOrder = db.prepare(`
          SELECT id, orderNumber, buyerId, status
          FROM orders
          WHERE farmerId = ? AND (farmerCropId = ? OR LOWER(cropName) = LOWER(?)) 
            AND status NOT IN ('CANCELLED', 'Cancelled')
          ORDER BY id DESC
          LIMIT 1
        `).get(b.farmerId, b.farmerCropId, b.cropName);
      }

      let buyerName = 'APMC Mandi Direct';
      if (matchedOrder?.buyerId) {
        const buyerUser = db.prepare('SELECT fullName FROM users WHERE id = ?').get(matchedOrder.buyerId);
        if (buyerUser?.fullName) buyerName = buyerUser.fullName;
      }

      queueEntries.push({
        type: 'BOOKING',
        id: b.id,
        bookingId: b.id,
        orderId: matchedOrder ? matchedOrder.id : null,
        orderNumber: matchedOrder ? matchedOrder.orderNumber : null,
        bookingNumber: b.bookingNumber,
        tokenNumber: b.tokenNumber,
        farmerId: b.farmerId,
        farmerCropId: b.farmerCropId,
        farmerName: b.farmerName || 'Registered Farmer',
        farmerMobile: b.farmerMobile || '',
        cropName: b.cropName,
        quantity: b.quantity,
        unit: b.unit || 'kg',
        buyerName: buyerName,
        status: b.status,
        expectedDate: b.expectedDate,
        createdAt: b.createdAt,
      });
    }
  }

  // Sort deterministically by id
  queueEntries.sort((a, b) => a.id - b.id);

  const activeQueueLength = queueEntries.length;
  const currentServingToken = queueEntries.length > 0 ? queueEntries[0].tokenNumber : null;

  // Add position, peopleAhead, estimatedWaitMinutes, isServing
  const activeQueue = queueEntries.map((item, idx) => {
    const isServing = idx === 0;
    const peopleAhead = idx;
    const queuePosition = idx + 1;
    const waitMinsPerFarmer = centre.estimatedWaitMins || 18;
    const estimatedWaitMinutes = isServing ? 0 : peopleAhead * waitMinsPerFarmer;

    return {
      ...item,
      queuePosition,
      peopleAhead,
      isServing,
      estimatedWaitMinutes,
    };
  });

  // Completed items count at this centre
  const completedOrdersCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE (procurementCentre = ? OR procurementCentre = ?) 
      AND status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed')
  `).get(centre.name, centre.id)?.count || 0;

  const completedBookingsCount = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE (centreId = ? OR centreName = ?) 
      AND status = 'Completed'
  `).get(centre.id, centre.name)?.count || 0;

  const totalCompleted = completedOrdersCount + completedBookingsCount;

  // Recent completed procurements at this centre
  const completedProcurements = db.prepare(`
    SELECT 
      o.id,
      o.orderNumber,
      COALESCE(o.bookingToken, 'KF-COMP') as tokenNumber,
      o.cropName,
      o.quantity,
      o.unit,
      o.status,
      o.updatedAt as completedAt,
      u.fullName as farmerName,
      b.fullName as buyerName
    FROM orders o
    LEFT JOIN users u ON o.farmerId = u.id
    LEFT JOIN users b ON o.buyerId = b.id
    WHERE (o.procurementCentre = ? OR o.procurementCentre = ?)
      AND o.status IN ('PROCUREMENT_COMPLETED', 'COMPLETED', 'Completed')
    ORDER BY o.updatedAt DESC LIMIT 20
  `).all(centre.name, centre.id);

  const ordersWaiting = activeQueue.filter(i => !['IN_QUEUE', 'WEIGHING_VERIFICATION', 'Your Turn', 'Being Processed'].includes(i.status)).length;
  const ordersProcessing = activeQueue.filter(i => ['IN_QUEUE', 'WEIGHING_VERIFICATION', 'Your Turn', 'Being Processed'].includes(i.status)).length;

  return {
    centre,
    currentServingToken,
    activeQueueLength,
    ordersWaiting,
    ordersProcessing,
    completedProcurementsCount: totalCompleted,
    availableCapacity: Math.max(0, 100 - (centre.todayCapacityPercent || 50)),
    queueStatus: activeQueueLength > 0 ? 'Active' : 'No active queue at this procurement centre.',
    activeQueue,
    completedProcurements,
  };
}

export function getAdminQueueOverview() {
  const db = getDatabase();
  const centres = db.prepare('SELECT id, name FROM procurement_centres ORDER BY name ASC').all();
  return centres.map(c => getCentreQueueState(c.id)).filter(Boolean);
}

export function advanceQueueOrderStatus({ orderId, nextStatus, note, adminId }) {
  if (nextStatus === 'PROCUREMENT_COMPLETED') {
    return completeAdminProcurement(orderId, adminId);
  }
  return advanceOrderStatus(orderId, nextStatus, note || `Status updated to ${nextStatus} by Administrator.`, adminId || 'ADMIN');
}

// ==========================================
// ADMIN CROP LISTINGS MANAGEMENT
// ==========================================
export function getAdminCropsList({ search = '', status = 'ALL', limit = 100, offset = 0 } = {}) {
  const db = getDatabase();

  let query = `
    SELECT 
      c.*,
      u.fullName as farmerName,
      u.mobile as farmerMobile,
      u.email as farmerEmail,
      u.location as farmerLocation,
      COALESCE(
        (SELECT procurementCentre FROM orders WHERE (farmerCropId = c.id OR (farmerCropId IS NULL AND cropId = c.id)) AND procurementCentre IS NOT NULL LIMIT 1),
        (SELECT centreName FROM bookings WHERE (cropId = c.id OR (userId = c.userId AND LOWER(cropName) = LOWER(c.name))) AND centreName IS NOT NULL LIMIT 1),
        'Designated Mandi Samiti'
      ) as procurementCentre,
      (SELECT COUNT(*) FROM orders WHERE (farmerCropId = c.id OR (farmerCropId IS NULL AND cropId = c.id))) as ordersCount,
      (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE (farmerCropId = c.id OR (farmerCropId IS NULL AND cropId = c.id)) AND status NOT IN ('CANCELLED', 'Cancelled')) as totalOrderedQty
    FROM crops c
    LEFT JOIN users u ON c.userId = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL' && status !== 'All') {
    const s = status.toLowerCase();
    if (s === 'ready for procurement' || s === 'available now') {
      query += ` AND c.harvestStatus = 'Ready for Procurement'`;
    } else if (s === 'nearly ready' || s === 'coming soon') {
      query += ` AND c.harvestStatus = 'Nearly Ready'`;
    } else if (s === 'growing' || s === 'not currently available') {
      query += ` AND c.harvestStatus = 'Growing'`;
    } else {
      query += ` AND LOWER(c.harvestStatus) = LOWER(?)`;
      params.push(status.trim());
    }
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(c.name) LIKE ? OR 
      LOWER(COALESCE(u.fullName, '')) LIKE ? OR 
      LOWER(COALESCE(u.location, '')) LIKE ?
    )`;
    params.push(term, term, term);
  }

  query += ` ORDER BY c.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map((c) => {
    const isReady = c.harvestStatus === 'Ready for Procurement';
    const isNearly = c.harvestStatus === 'Nearly Ready';
    const listingStatus = isReady ? 'Available Now' : isNearly ? 'Coming Soon' : 'Inactive';
    const lotCount = (c.ordersCount && c.ordersCount > 0) ? c.ordersCount : 1;
    return {
      ...c,
      lotId: `LOT-KF-${String(c.id).padStart(4, '0')}`,
      listingStatus,
      lotCount,
      expectedHarvestDate: c.expectedHarvestDate || 'Immediate',
    };
  });
}

export function getAdminCropMetrics() {
  const db = getDatabase();
  const total = db.prepare('SELECT COUNT(*) as count FROM crops').get()?.count || 0;
  const ready = db.prepare("SELECT COUNT(*) as count FROM crops WHERE harvestStatus = 'Ready for Procurement'").get()?.count || 0;
  const nearlyReady = db.prepare("SELECT COUNT(*) as count FROM crops WHERE harvestStatus = 'Nearly Ready'").get()?.count || 0;
  const growing = db.prepare("SELECT COUNT(*) as count FROM crops WHERE harvestStatus = 'Growing'").get()?.count || 0;
  const totalQuantity = db.prepare("SELECT COALESCE(SUM(quantity), 0) as sum FROM crops").get()?.sum || 0;

  return {
    totalCrops: total,
    readyCount: ready,
    nearlyReadyCount: nearlyReady,
    growingCount: growing,
    totalQuantityKg: totalQuantity,
  };
}

export function getAdminCropDetails(cropId) {
  const db = getDatabase();
  const crop = db.prepare(`
    SELECT c.*, u.fullName as farmerName, u.mobile as farmerMobile, u.email as farmerEmail, u.location as farmerLocation
    FROM crops c
    LEFT JOIN users u ON c.userId = u.id
    WHERE c.id = ?
  `).get(cropId);
  if (!crop) return null;

  // Resolve procurement centre from order or booking
  const procCentre = db.prepare(`
    SELECT procurementCentre FROM orders 
    WHERE (farmerCropId = ? OR (farmerCropId IS NULL AND cropId = ?)) AND procurementCentre IS NOT NULL 
    LIMIT 1
  `).get(crop.id, crop.id)?.procurementCentre || db.prepare(`
    SELECT centreName FROM bookings 
    WHERE (cropId = ? OR (userId = ? AND LOWER(cropName) = LOWER(?))) AND centreName IS NOT NULL 
    LIMIT 1
  `).get(crop.id, crop.userId, crop.name)?.centreName || 'Designated Mandi Samiti';

  crop.procurementCentre = procCentre;
  crop.lotId = `LOT-KF-${String(crop.id).padStart(4, '0')}`;
  crop.listingStatus = crop.harvestStatus === 'Ready for Procurement' ? 'Available Now' : crop.harvestStatus === 'Nearly Ready' ? 'Coming Soon' : 'Inactive';

  // Real orders/lots associated strictly with this exact crop record (differentiating farmers by crop.id)
  const orders = db.prepare(`
    SELECT 
      o.id, 
      o.orderNumber, 
      o.quantity, 
      o.unit, 
      o.status, 
      o.paymentStatus,
      COALESCE(o.procurementCentre, ?) as procurementCentre,
      o.bookingToken,
      o.totalAmount, 
      o.createdAt, 
      b.fullName as buyerName
    FROM orders o
    LEFT JOIN users b ON o.buyerId = b.id
    WHERE (o.farmerCropId = ? OR (o.farmerCropId IS NULL AND o.cropId = ?))
    ORDER BY o.id DESC
  `).all(procCentre, crop.id, crop.id);

  const lots = orders.map((ord) => ({
    lotId: ord.bookingToken ? `LOT-${ord.bookingToken}` : `LOT-ORD-${ord.id}`,
    orderId: ord.orderNumber || `KF-ORD-${ord.id}`,
    cropName: crop.name,
    farmerName: crop.farmerName || 'Registered Farmer',
    buyerName: ord.buyerName || 'Verified Buyer',
    quantity: ord.quantity,
    unit: ord.unit || crop.unit || 'kg',
    procurementCentre: ord.procurementCentre || procCentre,
    orderStatus: ord.status,
    procurementStatus: ord.status === 'PROCUREMENT_COMPLETED' ? 'COMPLETED' : ord.status,
    paymentStatus: ord.paymentStatus || 'Pending',
    createdAt: ord.createdAt,
  }));

  crop.lotCount = lots.length > 0 ? lots.length : 1;
  crop.ordersCount = orders.length;

  return {
    crop,
    orders,
    lots,
  };
}

// ==========================================
// PASSWORD CHANGE HELPER
// ==========================================
export function changeUserPassword(userId, currentPassword, newPassword) {
  const db = getDatabase();
  const user = db.prepare('SELECT id, passwordHash FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found.');
  }
  if (!currentPassword || !newPassword) {
    throw new Error('Current password and new password are required.');
  }
  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error('Current password is incorrect.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }
  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);
  return true;
}

// ==========================================
// SUPPORT TICKETS HELPERS
// ==========================================
export function createSupportTicket({
  userId,
  role,
  subject,
  category,
  description,
  relatedOrderId = null,
  relatedPaymentId = null,
}) {
  const db = getDatabase();

  if (!subject || !subject.trim()) {
    throw new Error('Subject is required.');
  }
  if (!category || !category.trim()) {
    throw new Error('Category is required.');
  }
  if (!description || !description.trim()) {
    throw new Error('Description is required.');
  }

  // Generate unique Ticket ID
  let ticketId = '';
  let exists = true;
  while (exists) {
    ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const row = db.prepare('SELECT id FROM support_tickets WHERE ticketId = ?').get(ticketId);
    if (!row) exists = false;
  }

  const stmt = db.prepare(`
    INSERT INTO support_tickets (
      ticketId, userId, role, subject, category, description, relatedOrderId, relatedPaymentId, status, adminNotes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NULL)
  `);

  const result = stmt.run(
    ticketId,
    userId,
    (role || 'user').toLowerCase(),
    subject.trim(),
    category.trim(),
    description.trim(),
    relatedOrderId ? Number(relatedOrderId) : null,
    relatedPaymentId ? Number(relatedPaymentId) : null
  );

  // Notify user about ticket creation
  try {
    const userRole = (role || 'user').toLowerCase();
    createNotificationRecord({
      userId,
      type: 'support',
      title: `Support Ticket Created: ${ticketId}`,
      description: `Your ticket regarding "${subject.trim().slice(0, 45)}" has been registered.`,
      icon: 'HelpCircle',
      actionUrl: userRole === 'farmer' ? '/farmer/support' : (userRole === 'buyer' ? '/buyer/support' : '/admin/support'),
    });
  } catch {}

  return db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(result.lastInsertRowid);
}

export function getUserSupportTickets(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM support_tickets
    WHERE userId = ?
    ORDER BY id DESC
  `).all(userId);
}

export function getAdminSupportTickets({ status, category, search, limit = 50, offset = 0 } = {}) {
  const db = getDatabase();
  let query = `
    SELECT st.*, u.fullName as userName, u.email as userEmail, u.mobile as userMobile
    FROM support_tickets st
    LEFT JOIN users u ON st.userId = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND UPPER(st.status) = UPPER(?)';
    params.push(status.trim());
  }

  if (category && category !== 'ALL') {
    query += ' AND LOWER(st.category) = LOWER(?)';
    params.push(category.trim());
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (
      LOWER(st.ticketId) LIKE ? OR
      LOWER(st.subject) LIKE ? OR
      LOWER(st.description) LIKE ? OR
      LOWER(COALESCE(u.fullName, '')) LIKE ? OR
      LOWER(COALESCE(u.email, '')) LIKE ?
    )`;
    params.push(term, term, term, term, term);
  }

  query += ' ORDER BY st.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit) || 50, Number(offset) || 0);

  return db.prepare(query).all(...params);
}

export function updateSupportTicketStatus(ticketId, { status, adminNotes }) {
  const db = getDatabase();
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE ticketId = ? OR id = ?').get(ticketId, ticketId);
  if (!ticket) {
    throw new Error('Ticket not found.');
  }

  const newStatus = status ? status.toUpperCase() : ticket.status;
  const notes = adminNotes !== undefined ? adminNotes : ticket.adminNotes;

  db.prepare(`
    UPDATE support_tickets
    SET status = ?, adminNotes = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, notes, ticket.id);

  // Notify the user if status changed
  if (status && status.toUpperCase() !== ticket.status) {
    try {
      createNotificationRecord({
        userId: ticket.userId,
        type: 'support',
        title: `Ticket ${ticket.ticketId} Update: ${newStatus}`,
        description: `Your ticket has been marked as ${newStatus}.${notes ? ` Response: "${notes.slice(0, 50)}"` : ''}`,
        icon: 'CheckCircle2',
        actionUrl: ticket.role === 'farmer' ? '/farmer/support' : (ticket.role === 'buyer' ? '/buyer/support' : '/admin/support'),
      });
    } catch {}
  }

  return db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticket.id);
}

// ==========================================
// ADMIN ANALYTICS & REPORTS
// ==========================================
export function getAdminAnalytics({ timeRange = 'ALL' } = {}) {
  const db = getDatabase();
  const tr = String(timeRange || 'ALL').toUpperCase();

  let timeFilterUsers = '';
  let timeFilterCrops = '';
  let timeFilterOrders = '';
  let timeFilterPayments = '';
  let timeFilterTickets = '';
  let timeFilterBookings = '';

  if (tr === 'TODAY') {
    timeFilterUsers = " AND date(createdAt) >= date('now')";
    timeFilterCrops = " AND date(createdAt) >= date('now')";
    timeFilterOrders = " AND date(createdAt) >= date('now')";
    timeFilterPayments = " AND (date(createdAt) >= date('now') OR date(date) >= date('now'))";
    timeFilterTickets = " AND date(createdAt) >= date('now')";
    timeFilterBookings = " AND (date(createdAt) >= date('now') OR date(date) >= date('now'))";
  } else if (tr === '7D' || tr === 'LAST 7 DAYS') {
    timeFilterUsers = " AND datetime(createdAt) >= datetime('now', '-7 days')";
    timeFilterCrops = " AND datetime(createdAt) >= datetime('now', '-7 days')";
    timeFilterOrders = " AND datetime(createdAt) >= datetime('now', '-7 days')";
    timeFilterPayments = " AND (datetime(createdAt) >= datetime('now', '-7 days') OR datetime(date) >= datetime('now', '-7 days'))";
    timeFilterTickets = " AND datetime(createdAt) >= datetime('now', '-7 days')";
    timeFilterBookings = " AND (datetime(createdAt) >= datetime('now', '-7 days') OR datetime(date) >= datetime('now', '-7 days'))";
  } else if (tr === '30D' || tr === 'LAST 30 DAYS') {
    timeFilterUsers = " AND datetime(createdAt) >= datetime('now', '-30 days')";
    timeFilterCrops = " AND datetime(createdAt) >= datetime('now', '-30 days')";
    timeFilterOrders = " AND datetime(createdAt) >= datetime('now', '-30 days')";
    timeFilterPayments = " AND (datetime(createdAt) >= datetime('now', '-30 days') OR datetime(date) >= datetime('now', '-30 days'))";
    timeFilterTickets = " AND datetime(createdAt) >= datetime('now', '-30 days')";
    timeFilterBookings = " AND (datetime(createdAt) >= datetime('now', '-30 days') OR datetime(date) >= datetime('now', '-30 days'))";
  }

  // Users metrics
  const totalUsersAll = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
  const farmersCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'farmer'").get()?.c || 0;
  const buyersCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'buyer'").get()?.c || 0;
  const suppliersCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'supplier'").get()?.c || 0;
  const activeUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE LOWER(COALESCE(accountStatus, 'active')) = 'active'").get()?.c || 0;
  const periodUsers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE 1=1 ${timeFilterUsers}`).get()?.c || 0;

  // Crops metrics
  const totalCropsAll = db.prepare('SELECT COUNT(*) as c FROM crops').get()?.c || 0;
  const periodCrops = db.prepare(`SELECT COUNT(*) as c FROM crops WHERE 1=1 ${timeFilterCrops}`).get()?.c || 0;
  const readyCrops = db.prepare("SELECT COUNT(*) as c FROM crops WHERE harvestStatus = 'Ready for Procurement'").get()?.c || 0;
  const nearlyReadyCrops = db.prepare("SELECT COUNT(*) as c FROM crops WHERE harvestStatus = 'Nearly Ready'").get()?.c || 0;
  const growingCrops = db.prepare("SELECT COUNT(*) as c FROM crops WHERE harvestStatus = 'Growing'").get()?.c || 0;
  const totalCropVolumeKg = db.prepare("SELECT COALESCE(SUM(quantity), 0) as s FROM crops").get()?.s || 0;

  // Orders metrics
  const totalOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE 1=1 ${timeFilterOrders}`).get()?.c || 0;
  const deliveredOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status IN ('DELIVERED', 'Delivered', 'COMPLETED', 'Completed', 'PROCUREMENT_COMPLETED') ${timeFilterOrders}`).get()?.c || 0;
  const pendingOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status NOT IN ('DELIVERED', 'Delivered', 'COMPLETED', 'Completed', 'PROCUREMENT_COMPLETED', 'CANCELLED', 'Cancelled') ${timeFilterOrders}`).get()?.c || 0;
  const cancelledOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status IN ('CANCELLED', 'Cancelled') ${timeFilterOrders}`).get()?.c || 0;
  const totalOrderValue = db.prepare(`SELECT COALESCE(SUM(CASE WHEN status NOT IN ('CANCELLED', 'Cancelled') THEN totalAmount ELSE 0 END), 0) as s FROM orders WHERE 1=1 ${timeFilterOrders}`).get()?.s || 0;

  // Payments metrics (STRICT RULE: Paid volume sums ONLY status = 'PAID' / SUCCESS / COMPLETED)
  const totalPaymentsCount = db.prepare(`SELECT COUNT(*) as c FROM payments WHERE 1=1 ${timeFilterPayments}`).get()?.c || 0;
  
  const paidStats = db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(COALESCE(amount, procurementAmount, 0)), 0) as sum
    FROM payments
    WHERE (
      UPPER(COALESCE(status, '')) IN ('PAID', 'SUCCESS', 'COMPLETED') 
      OR UPPER(COALESCE(paymentStatus, '')) IN ('PAID', 'SUCCESS', 'COMPLETED')
    ) ${timeFilterPayments}
  `).get();

  const pendingStats = db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(COALESCE(amount, procurementAmount, 0)), 0) as sum
    FROM payments
    WHERE (
      UPPER(COALESCE(status, '')) IN ('PENDING', 'PROCESSING', 'INITIATED') 
      OR UPPER(COALESCE(paymentStatus, '')) IN ('PENDING', 'PROCESSING', 'INITIATED')
    ) ${timeFilterPayments}
  `).get();

  const failedStats = db.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(COALESCE(amount, procurementAmount, 0)), 0) as sum
    FROM payments
    WHERE (
      UPPER(COALESCE(status, '')) IN ('FAILED', 'REJECTED') 
      OR UPPER(COALESCE(paymentStatus, '')) IN ('FAILED', 'REJECTED')
    ) ${timeFilterPayments}
  `).get();

  // Procurement Centres & Queues
  const totalCentres = db.prepare('SELECT COUNT(*) as c FROM procurement_centres').get()?.c || 0;
  const avgWaitTime = Math.round(db.prepare('SELECT COALESCE(AVG(estimatedWaitMins), 0) as a FROM procurement_centres').get()?.a || 0);
  const avgCapacityPercent = Math.round(db.prepare('SELECT COALESCE(AVG(todayCapacityPercent), 0) as a FROM procurement_centres').get()?.a || 0);
  const totalBookings = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE 1=1 ${timeFilterBookings}`).get()?.c || 0;
  const activeTokens = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status IN ('Confirmed', 'In Queue', 'Waiting', 'Upcoming', 'Active') ${timeFilterBookings}`).get()?.c || 0;
  const servedTokens = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE status IN ('Completed', 'Delivered', 'Procured') ${timeFilterBookings}`).get()?.c || 0;

  // Support Tickets metrics
  const totalTickets = db.prepare(`SELECT COUNT(*) as c FROM support_tickets WHERE 1=1 ${timeFilterTickets}`).get()?.c || 0;
  const openTickets = db.prepare(`SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) = 'OPEN' ${timeFilterTickets}`).get()?.c || 0;
  const inProgressTickets = db.prepare(`SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) = 'IN_PROGRESS' ${timeFilterTickets}`).get()?.c || 0;
  const resolvedTickets = db.prepare(`SELECT COUNT(*) as c FROM support_tickets WHERE UPPER(status) IN ('RESOLVED', 'CLOSED') ${timeFilterTickets}`).get()?.c || 0;

  // Centre Performance List
  const centresList = db.prepare(`
    SELECT 
      pc.id,
      pc.name,
      pc.address,
      pc.distanceKm,
      pc.currentCrowd,
      pc.estimatedWaitMins,
      pc.todayCapacityPercent,
      COUNT(b.id) as bookingsCount
    FROM procurement_centres pc
    LEFT JOIN bookings b ON pc.id = b.centreId
    GROUP BY pc.id
    ORDER BY bookingsCount DESC, pc.name ASC
  `).all();

  // Recent Orders for Drilldown
  const recentOrders = db.prepare(`
    SELECT o.id, o.orderNumber, o.cropName, o.quantity, o.unit, o.totalAmount, o.status, o.createdAt,
           u.fullName as buyerName, f.fullName as farmerName
    FROM orders o
    LEFT JOIN users u ON o.buyerId = u.id
    LEFT JOIN users f ON o.farmerId = f.id
    ORDER BY o.id DESC
    LIMIT 6
  `).all();

  // Recent Payments for Drilldown
  const recentPayments = db.prepare(`
    SELECT p.id, p.paymentNumber, p.cropName, COALESCE(p.amount, p.procurementAmount, 0) as amount, 
           COALESCE(p.status, p.paymentStatus) as status, p.transactionId, p.date, p.createdAt,
           u.fullName as buyerName, f.fullName as farmerName
    FROM payments p
    LEFT JOIN users u ON p.buyerId = u.id
    LEFT JOIN users f ON p.farmerId = f.id
    ORDER BY p.id DESC
    LIMIT 6
  `).all();

  return {
    timeRange: tr,
    users: {
      total: totalUsersAll,
      farmers: farmersCount,
      buyers: buyersCount,
      suppliers: suppliersCount,
      active: activeUsers,
      inPeriod: periodUsers,
    },
    crops: {
      total: totalCropsAll,
      inPeriod: periodCrops,
      ready: readyCrops,
      nearlyReady: nearlyReadyCrops,
      growing: growingCrops,
      totalVolumeKg: totalCropVolumeKg,
    },
    orders: {
      total: totalOrders,
      delivered: deliveredOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      totalValue: totalOrderValue,
    },
    payments: {
      totalCount: totalPaymentsCount,
      paidAmount: paidStats?.sum || 0,
      paidCount: paidStats?.count || 0,
      pendingAmount: pendingStats?.sum || 0,
      pendingCount: pendingStats?.count || 0,
      failedAmount: failedStats?.sum || 0,
      failedCount: failedStats?.count || 0,
    },
    centres: {
      total: totalCentres,
      avgWaitTime,
      avgCapacityPercent,
      totalBookings,
      activeTokens,
      servedTokens,
      list: centresList,
    },
    support: {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      resolved: resolvedTickets,
    },
    recentOrders,
    recentPayments,
  };
}

export function getAdminReportsExportCsv({ timeRange = 'ALL' } = {}) {
  const analytics = getAdminAnalytics({ timeRange });
  
  let csv = 'KishanFlow OPERATIONS & ANALYTICS REPORT\n';
  csv += `Generated At,${new Date().toISOString()}\n`;
  csv += `Time Filter,${analytics.timeRange}\n\n`;

  csv += 'METRIC SUMMARY\n';
  csv += 'Category,Metric,Value\n';
  csv += `Users,Total Registered Users,${analytics.users.total}\n`;
  csv += `Users,Farmers Count,${analytics.users.farmers}\n`;
  csv += `Users,Buyers Count,${analytics.users.buyers}\n`;
  csv += `Users,Suppliers Count,${analytics.users.suppliers}\n`;
  csv += `Users,Active Accounts,${analytics.users.active}\n`;
  csv += `Crops,Total Crop Listings,${analytics.crops.total}\n`;
  csv += `Crops,Ready For Procurement,${analytics.crops.ready}\n`;
  csv += `Crops,Nearly Ready,${analytics.crops.nearlyReady}\n`;
  csv += `Crops,Total Crop Volume (kg),${analytics.crops.totalVolumeKg}\n`;
  csv += `Orders,Total Orders,${analytics.orders.total}\n`;
  csv += `Orders,Delivered Orders,${analytics.orders.delivered}\n`;
  csv += `Orders,Pending Orders,${analytics.orders.pending}\n`;
  csv += `Orders,Total Order Value (INR),${analytics.orders.totalValue}\n`;
  csv += `Payments,Total Payment Records,${analytics.payments.totalCount}\n`;
  csv += `Payments,Paid Volume (INR),${analytics.payments.paidAmount}\n`;
  csv += `Payments,Paid Transactions Count,${analytics.payments.paidCount}\n`;
  csv += `Payments,Pending Payment Volume (INR),${analytics.payments.pendingAmount}\n`;
  csv += `Payments,Pending Transactions Count,${analytics.payments.pendingCount}\n`;
  csv += `Centres,Procurement Centres,${analytics.centres.total}\n`;
  csv += `Centres,Average Waiting Time (mins),${analytics.centres.avgWaitTime}\n`;
  csv += `Centres,Total Bookings,${analytics.centres.totalBookings}\n`;
  csv += `Centres,Active Tokens,${analytics.centres.activeTokens}\n`;
  csv += `Centres,Served Tokens,${analytics.centres.servedTokens}\n`;
  csv += `Support,Total Tickets,${analytics.support.total}\n`;
  csv += `Support,Open Tickets,${analytics.support.open}\n`;
  csv += `Support,Resolved Tickets,${analytics.support.resolved}\n\n`;

  csv += 'PROCUREMENT CENTRES STATUS\n';
  csv += 'Centre ID,Centre Name,Address,Distance (km),Crowd Level,Est Wait (mins),Capacity (%),Bookings\n';
  for (const c of analytics.centres.list) {
    csv += `"${c.id}","${(c.name||'').replace(/"/g, '""')}","${(c.address||'').replace(/"/g, '""')}",${c.distanceKm},"${c.currentCrowd}",${c.estimatedWaitMins},${c.todayCapacityPercent}%,${c.bookingsCount}\n`;
  }
  csv += '\n';

  csv += 'RECENT ORDERS\n';
  csv += 'Order ID,Order Number,Buyer,Farmer,Crop,Quantity,Total Amount (INR),Status,Date\n';
  for (const o of analytics.recentOrders) {
    csv += `${o.id},"${o.orderNumber}","${(o.buyerName||'').replace(/"/g, '""')}","${(o.farmerName||'').replace(/"/g, '""')}","${(o.cropName||'').replace(/"/g, '""')}",${o.quantity} ${o.unit},${o.totalAmount},"${o.status}","${o.createdAt}"\n`;
  }
  csv += '\n';

  csv += 'RECENT PAYMENTS\n';
  csv += 'Payment ID,Payment Number,Buyer,Farmer,Crop,Amount (INR),Status,Date\n';
  for (const p of analytics.recentPayments) {
    csv += `${p.id},"${p.paymentNumber || ''}","${(p.buyerName||'').replace(/"/g, '""')}","${(p.farmerName||'').replace(/"/g, '""')}","${(p.cropName||'').replace(/"/g, '""')}",${p.amount},"${p.status}","${p.date || p.createdAt}"\n`;
  }

  return csv;
}

// ==========================================
// SUPPLIER HELPERS
// ==========================================
export function getSupplierDashboardData(supplierId) {
  const db = getDatabase();

  // Quick Stats
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM supplier_products WHERE supplierId = ?').get(supplierId)?.c || 0;
  const productsInStock = db.prepare('SELECT COUNT(*) as c FROM supplier_products WHERE supplierId = ? AND stock > 0').get(supplierId)?.c || 0;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM supplier_orders WHERE supplierId = ? AND UPPER(status) = 'PENDING'").get(supplierId)?.c || 0;
  const completedOrders = db.prepare("SELECT COUNT(*) as c FROM supplier_orders WHERE supplierId = ? AND UPPER(status) IN ('DELIVERED', 'COMPLETED')").get(supplierId)?.c || 0;
  const lowStockCount = db.prepare('SELECT COUNT(*) as c FROM supplier_products WHERE supplierId = ? AND stock <= lowStockThreshold').get(supplierId)?.c || 0;

  // Products
  const products = db.prepare(`
    SELECT * FROM supplier_products
    WHERE supplierId = ?
    ORDER BY id DESC
    LIMIT 6
  `).all(supplierId);

  // Recent Orders (with farmer details)
  const recentOrders = db.prepare(`
    SELECT so.*, u.fullName as farmerName, u.mobile as farmerMobile, u.email as farmerEmail, u.location as farmerLocation,
           sp.unit as productUnit, sp.category as productCategory
    FROM supplier_orders so
    LEFT JOIN users u ON so.farmerId = u.id
    LEFT JOIN supplier_products sp ON so.productId = sp.id
    WHERE so.supplierId = ?
    ORDER BY so.id DESC
    LIMIT 6
  `).all(supplierId);

  // Low Stock Products
  const lowStockProducts = db.prepare(`
    SELECT * FROM supplier_products
    WHERE supplierId = ? AND stock <= lowStockThreshold
    ORDER BY stock ASC
  `).all(supplierId);

  return {
    stats: {
      totalProducts,
      productsInStock,
      pendingOrders,
      completedOrders,
      lowStockCount,
    },
    products,
    recentOrders,
    lowStockProducts,
  };
}

export function getSupplierProducts(supplierId, { category, search, lowStockOnly } = {}) {
  const db = getDatabase();
  let query = 'SELECT * FROM supplier_products WHERE supplierId = ?';
  const params = [supplierId];

  if (category && category !== 'ALL') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category.trim());
  }

  if (lowStockOnly) {
    query += ' AND stock <= lowStockThreshold';
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ' AND (LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(description) LIKE ?)';
    params.push(term, term, term);
  }

  query += ' ORDER BY id DESC';
  return db.prepare(query).all(...params);
}

export function createSupplierProduct(supplierId, {
  name,
  category,
  price,
  unit = 'pack',
  stock = 0,
  lowStockThreshold = 10,
  description = '',
}) {
  const db = getDatabase();

  if (!name || !name.trim()) {
    throw new Error('Product name is required.');
  }
  if (!category || !category.trim()) {
    throw new Error('Category is required.');
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    throw new Error('Please enter a valid product price.');
  }

  const numPrice = Number(price);
  const numStock = Math.max(0, parseInt(stock, 10) || 0);
  const numThreshold = Math.max(1, parseInt(lowStockThreshold, 10) || 10);

  const stmt = db.prepare(`
    INSERT INTO supplier_products (
      supplierId, name, category, price, unit, stock, lowStockThreshold, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    supplierId,
    name.trim(),
    category.trim(),
    numPrice,
    unit || 'pack',
    numStock,
    numThreshold,
    description ? description.trim() : ''
  );

  return db.prepare('SELECT * FROM supplier_products WHERE id = ?').get(res.lastInsertRowid);
}

export function updateSupplierProduct(productId, supplierId, {
  name,
  category,
  price,
  unit,
  stock,
  lowStockThreshold,
  description,
}) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM supplier_products WHERE id = ? AND supplierId = ?').get(productId, supplierId);
  if (!existing) {
    throw new Error('Product not found or unauthorized.');
  }

  const updatedName = name !== undefined ? name.trim() : existing.name;
  const updatedCategory = category !== undefined ? category.trim() : existing.category;
  const updatedPrice = price !== undefined ? Number(price) : existing.price;
  const updatedUnit = unit !== undefined ? unit.trim() : existing.unit;
  const updatedStock = stock !== undefined ? Math.max(0, parseInt(stock, 10)) : existing.stock;
  const updatedThreshold = lowStockThreshold !== undefined ? Math.max(1, parseInt(lowStockThreshold, 10)) : existing.lowStockThreshold;
  const updatedDesc = description !== undefined ? (description ? description.trim() : '') : existing.description;

  db.prepare(`
    UPDATE supplier_products
    SET name = ?, category = ?, price = ?, unit = ?, stock = ?, lowStockThreshold = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND supplierId = ?
  `).run(
    updatedName,
    updatedCategory,
    updatedPrice,
    updatedUnit,
    updatedStock,
    updatedThreshold,
    updatedDesc,
    productId,
    supplierId
  );

  return db.prepare('SELECT * FROM supplier_products WHERE id = ?').get(productId);
}

export function updateSupplierProductStock(productId, supplierId, newStock) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM supplier_products WHERE id = ? AND supplierId = ?').get(productId, supplierId);
  if (!existing) {
    throw new Error('Product not found or unauthorized.');
  }

  const stockVal = Math.max(0, parseInt(newStock, 10) || 0);

  db.prepare(`
    UPDATE supplier_products
    SET stock = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND supplierId = ?
  `).run(stockVal, productId, supplierId);

  return db.prepare('SELECT * FROM supplier_products WHERE id = ?').get(productId);
}

export function getSupplierOrders(supplierId, { status, limit = 50 } = {}) {
  const db = getDatabase();
  let query = `
    SELECT so.*, u.fullName as farmerName, u.mobile as farmerMobile, u.email as farmerEmail, u.location as farmerLocation,
           sp.unit as productUnit, sp.category as productCategory
    FROM supplier_orders so
    LEFT JOIN users u ON so.farmerId = u.id
    LEFT JOIN supplier_products sp ON so.productId = sp.id
    WHERE so.supplierId = ?
  `;
  const params = [supplierId];

  if (status && status.trim().toUpperCase() !== 'ALL') {
    query += ' AND UPPER(so.status) = UPPER(?)';
    params.push(status.trim());
  }

  query += ' ORDER BY so.id DESC LIMIT ?';
  params.push(Number(limit) || 50);

  return db.prepare(query).all(...params);
}

export function confirmSupplierOrder(orderId, supplierId) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND supplierId = ?').get(orderId, supplierId);
  if (!order) {
    throw new Error('Order not found or unauthorized.');
  }

  const currentStatus = String(order.status || '').toUpperCase();
  if (currentStatus !== 'PENDING') {
    throw new Error(`Order cannot be confirmed. Current status is ${order.status}.`);
  }

  db.prepare(`
    UPDATE supplier_orders
    SET status = 'CONFIRMED', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND supplierId = ?
  `).run(orderId, supplierId);

  // Farmer notification after Supplier confirmation (Part 13)
  try {
    createNotificationRecord({
      userId: order.farmerId,
      type: 'order',
      title: `Order Confirmed: #${order.orderNumber}`,
      description: `Your supplier order #${order.orderNumber} has been confirmed. Please complete payment.`,
      icon: 'CheckCircle2',
      actionUrl: '/farmer/supplier-orders',
    });
  } catch (err) {
    console.error('Error creating farmer confirmation notification:', err);
  }

  return db.prepare(`
    SELECT so.*, u.fullName as farmerName, u.mobile as farmerMobile, u.email as farmerEmail, u.location as farmerLocation
    FROM supplier_orders so
    LEFT JOIN users u ON so.farmerId = u.id
    WHERE so.id = ?
  `).get(orderId);
}

export function payFarmerSupplierOrder(orderId, farmerId, { paymentMethod } = {}) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND farmerId = ?').get(orderId, farmerId);
  if (!order) {
    throw new Error('Order not found or unauthorized.');
  }

  const currentStatus = String(order.status || '').toUpperCase();
  const currentPaymentStatus = String(order.paymentStatus || 'UNPAID').toUpperCase();

  if (currentStatus === 'PENDING') {
    throw new Error('Order must be confirmed by supplier before payment.');
  }
  if (currentStatus === 'CANCELLED') {
    throw new Error('Cannot pay for a cancelled order.');
  }
  if (currentStatus !== 'CONFIRMED') {
    throw new Error(`Order is not eligible for payment. Current status: ${order.status}`);
  }
  if (currentPaymentStatus === 'PAID') {
    throw new Error('This order has already been paid.');
  }

  const amount = Number(order.totalAmount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Valid order amount required for payment.');
  }

  const paymentNumber = `KF-PAY-INP-${Math.floor(100000 + Math.random() * 900000)}`;
  const method = paymentMethod || 'Mandi Escrow / Direct DBT (Test)';
  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const now = new Date().toISOString();
  const txnId = `KFPAY-${Date.now()}`;

  // Insert payment record into unified payments table
  const payStmt = db.prepare(`
    INSERT INTO payments (
      paymentNumber, supplierOrderId, buyerId, farmerId, supplierId, cropName, quantity, actualQuantity,
      unit, amount, procurementAmount, userId, currency, status, paymentStatus, paymentMethod, transactionId, date, completedAt, createdAt
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'PAID', 'Payment Received', ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const payRes = payStmt.run(
    paymentNumber,
    order.id,
    farmerId,
    order.supplierId,
    order.productName,
    order.quantity,
    order.quantity,
    'units',
    amount,
    amount,
    farmerId,
    method,
    txnId,
    dateFormatted,
    now
  );
  const paymentId = payRes.lastInsertRowid;

  // Update supplier_orders: paymentStatus = 'PAID', order status remains 'CONFIRMED'
  db.prepare(`
    UPDATE supplier_orders
    SET paymentStatus = 'PAID', paymentId = ?, paidAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND farmerId = ?
  `).run(paymentId, orderId, farmerId);

  // Farmer notification after payment (Part 13)
  try {
    createNotificationRecord({
      userId: farmerId,
      type: 'payment',
      title: 'Payment Successful',
      description: `Payment for order #${order.orderNumber} was successful.`,
      icon: 'CheckCircle2',
      actionUrl: '/farmer/supplier-orders',
    });
  } catch (err) {
    console.error('Error creating farmer payment notification:', err);
  }

  // Supplier notification after Farmer payment (Part 13)
  try {
    createNotificationRecord({
      userId: order.supplierId,
      type: 'payment',
      title: `Payment Received: #${order.orderNumber}`,
      description: `Payment received for order #${order.orderNumber}. The order is ready for delivery.`,
      icon: 'CreditCard',
      actionUrl: '/supplier/orders',
    });
  } catch (err) {
    console.error('Error creating supplier payment notification:', err);
  }

  return db.prepare(`
    SELECT so.*,
           s.fullName as supplierName, s.email as supplierEmail, s.mobile as supplierMobile,
           sp.unit as productUnit, sp.category as productCategory
    FROM supplier_orders so
    LEFT JOIN users s ON so.supplierId = s.id
    LEFT JOIN supplier_products sp ON so.productId = sp.id
    WHERE so.id = ?
  `).get(orderId);
}

export function markSupplierOrderDelivered(orderId, supplierId) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND supplierId = ?').get(orderId, supplierId);
  if (!order) {
    throw new Error('Order not found or unauthorized.');
  }

  const currentStatus = String(order.status || '').toUpperCase();
  const currentPaymentStatus = String(order.paymentStatus || 'UNPAID').toUpperCase();

  if (currentStatus === 'DELIVERED') {
    throw new Error('Order is already delivered.');
  }
  if (currentStatus !== 'CONFIRMED') {
    throw new Error(`Cannot deliver order. Order must be confirmed first. Current status: ${order.status}`);
  }
  if (currentPaymentStatus !== 'PAID') {
    throw new Error('Order must be fully paid before it can be marked as delivered.');
  }

  db.prepare(`
    UPDATE supplier_orders
    SET status = 'DELIVERED', deliveredAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND supplierId = ?
  `).run(orderId, supplierId);

  // Farmer notification after delivery (Part 13)
  try {
    createNotificationRecord({
      userId: order.farmerId,
      type: 'order',
      title: 'Order Delivered',
      description: `Your order #${order.orderNumber} has been marked as delivered.`,
      icon: 'Truck',
      actionUrl: '/farmer/supplier-orders',
    });
  } catch (err) {
    console.error('Error creating farmer delivery notification:', err);
  }

  return db.prepare(`
    SELECT so.*, u.fullName as farmerName, u.mobile as farmerMobile, u.email as farmerEmail, u.location as farmerLocation
    FROM supplier_orders so
    LEFT JOIN users u ON so.farmerId = u.id
    WHERE so.id = ?
  `).get(orderId);
}

export function updateSupplierOrderStatus(orderId, supplierId, newStatus) {
  const s = String(newStatus || '').toUpperCase();
  if (s === 'CONFIRMED') {
    return confirmSupplierOrder(orderId, supplierId);
  }
  if (s === 'DELIVERED') {
    return markSupplierOrderDelivered(orderId, supplierId);
  }
  if (s === 'CANCELLED') {
    const db = getDatabase();
    const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND supplierId = ?').get(orderId, supplierId);
    if (!order) throw new Error('Order not found or unauthorized.');

    // If transitioning to Cancelled, restore product inventory
    if (order.status.toUpperCase() !== 'CANCELLED') {
      db.prepare(`
        UPDATE supplier_products
        SET stock = stock + ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.quantity, order.productId);
    }

    db.prepare(`
      UPDATE supplier_orders
      SET status = 'CANCELLED', updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND supplierId = ?
    `).run(orderId, supplierId);

    return db.prepare('SELECT * FROM supplier_orders WHERE id = ?').get(orderId);
  }

  throw new Error(`Invalid status transition to ${newStatus}. Valid transitions are Confirmed or Delivered.`);
}

export function cancelFarmerSupplierOrder(orderId, farmerId) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND farmerId = ?').get(orderId, farmerId);
  if (!order) {
    throw new Error('Order not found or unauthorized.');
  }

  if (String(order.status || '').toUpperCase() !== 'PENDING') {
    throw new Error(`Only pending orders can be cancelled. Current status is ${order.status}.`);
  }

  // Restore inventory
  db.prepare(`
    UPDATE supplier_products
    SET stock = stock + ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(order.quantity, order.productId);

  db.prepare(`
    UPDATE supplier_orders
    SET status = 'CANCELLED', updatedAt = CURRENT_TIMESTAMP
    WHERE id = ? AND farmerId = ?
  `).run(orderId, farmerId);

  // Notify supplier of cancellation
  try {
    createNotification({
      userId: order.supplierId,
      type: 'order',
      title: `Order #${order.orderNumber} Cancelled by Farmer`,
      description: `Farmer has cancelled order #${order.orderNumber} for ${order.quantity}x ${order.productName}. Stock has been automatically restored.`,
      icon: 'XCircle',
      actionUrl: '/supplier/orders',
    });
  } catch (err) {
    console.error('Error creating supplier cancellation notification:', err);
  }

  return db.prepare('SELECT * FROM supplier_orders WHERE id = ?').get(orderId);
}

export function getFarmerSupplierOrders(farmerId, { status, limit = 50 } = {}) {
  const db = getDatabase();
  let query = `
    SELECT so.*,
           s.fullName as supplierName, s.email as supplierEmail, s.mobile as supplierMobile, s.location as supplierLocation,
           sp.unit as productUnit, sp.category as productCategory, sp.description as productDescription
     FROM supplier_orders so
    LEFT JOIN users s ON so.supplierId = s.id
    LEFT JOIN supplier_products sp ON so.productId = sp.id
    WHERE so.farmerId = ?
  `;
  const params = [farmerId];

  if (status && status.trim().toUpperCase() !== 'ALL') {
    query += ' AND UPPER(so.status) = UPPER(?)';
    params.push(status.trim());
  }

  query += ' ORDER BY so.id DESC LIMIT ?';
  params.push(Number(limit) || 50);

  return db.prepare(query).all(...params);
}

export function createSupplierOrderForFarmer(farmerId, { productId, quantity, deliveryAddress }) {
  const db = getDatabase();

  // Validate farmer
  const farmer = db.prepare("SELECT id, fullName, location FROM users WHERE id = ? AND role = 'farmer'").get(farmerId);
  if (!farmer) {
    throw new Error('Authenticated farmer account required.');
  }

  // Validate product
  const numProductId = Number(productId);
  if (!numProductId) {
    throw new Error('Valid product selection is required.');
  }

  const product = db.prepare('SELECT * FROM supplier_products WHERE id = ?').get(numProductId);
  if (!product) {
    throw new Error('Selected agricultural input product was not found.');
  }

  const supplier = db.prepare("SELECT id, fullName FROM users WHERE id = ? AND role = 'supplier'").get(product.supplierId);
  if (!supplier) {
    throw new Error('Supplier for this product is currently unavailable.');
  }

  const numQty = parseInt(quantity, 10);
  if (isNaN(numQty) || numQty <= 0) {
    throw new Error('Please enter a valid order quantity (at least 1).');
  }

  if (product.stock < numQty) {
    throw new Error(`Insufficient inventory available. Only ${product.stock} ${product.unit || 'units'} left in warehouse.`);
  }

  const unitPrice = Number(product.price);
  const totalAmount = unitPrice * numQty;
  const address = (deliveryAddress && deliveryAddress.trim()) || farmer.location || 'Farmer Registered Mandi District';

  // Generate unique order number
  const orderNumber = `SO-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

  // Deduct stock from supplier_products
  db.prepare(`
    UPDATE supplier_products
    SET stock = stock - ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(numQty, numProductId);

  // Insert into supplier_orders
  const orderRes = db.prepare(`
    INSERT INTO supplier_orders (
      orderNumber, supplierId, farmerId, productId, productName, quantity, unitPrice, totalAmount, status, paymentStatus, deliveryAddress
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'UNPAID', ?)
  `).run(orderNumber, product.supplierId, farmerId, numProductId, product.name, numQty, unitPrice, totalAmount, address);

  const orderId = orderRes.lastInsertRowid;

  // Insert into supplier_order_items
  try {
    db.prepare(`
      INSERT INTO supplier_order_items (
        orderId, productId, productName, quantity, unitPrice, totalPrice
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, numProductId, product.name, numQty, unitPrice, totalAmount);
  } catch (err) {
    console.warn('Could not insert into supplier_order_items:', err.message);
  }

  // Create notification for Supplier (Part 13)
  try {
    createNotificationRecord({
      userId: product.supplierId,
      type: 'order',
      title: `New Supplier Order: #${orderNumber}`,
      description: `New supplier order #${orderNumber} received.`,
      icon: 'Package',
      actionUrl: '/supplier/orders',
    });
  } catch (err) {
    console.error('Error notifying supplier:', err);
  }

  // Create notification for Farmer (Part 13)
  try {
    createNotificationRecord({
      userId: farmerId,
      type: 'order',
      title: `Order Placed: #${orderNumber}`,
      description: `Your order #${orderNumber} for ${numQty}x ${product.name} has been placed.`,
      icon: 'Package',
      actionUrl: '/farmer/supplier-orders',
    });
  } catch (err) {
    console.error('Error notifying farmer:', err);
  }

  return db.prepare(`
    SELECT so.*,
           s.fullName as supplierName, s.email as supplierEmail, s.mobile as supplierMobile,
           sp.unit as productUnit, sp.category as productCategory
    FROM supplier_orders so
    LEFT JOIN users s ON so.supplierId = s.id
    LEFT JOIN supplier_products sp ON so.productId = sp.id
    WHERE so.id = ?
  `).get(orderId);
}

export function getAvailableSupplierProducts({ category, search } = {}) {
  const db = getDatabase();
  let query = `
    SELECT sp.*, u.fullName as supplierName, u.location as supplierLocation
    FROM supplier_products sp
    JOIN users u ON sp.supplierId = u.id
    WHERE sp.stock > 0
  `;
  const params = [];

  if (category && category !== 'ALL') {
    query += ' AND LOWER(sp.category) = LOWER(?)';
    params.push(category.trim());
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ' AND (LOWER(sp.name) LIKE ? OR LOWER(sp.category) LIKE ? OR LOWER(sp.description) LIKE ?)';
    params.push(term, term, term);
  }

  query += ' ORDER BY sp.id DESC';
  return db.prepare(query).all(...params);
}



