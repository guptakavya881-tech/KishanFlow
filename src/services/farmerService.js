// KisanFlow - Service Layer for Farmer Module Data Management

import {
  INITIAL_FARMER_PROFILE,
  INITIAL_CROPS,
  MOCK_PROCUREMENT_CENTRES,
  MOCK_SLOTS_BY_CENTRE,
  INITIAL_BOOKINGS,
  INITIAL_LIVE_QUEUE,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROCUREMENT_TRACKING,
  INITIAL_PAYMENTS,
} from '@/data/farmerMockData';

const STORAGE_KEYS = {
  PROFILE: 'kf_farmer_profile',
  CROPS: 'kf_farmer_crops',
  BOOKINGS: 'kf_farmer_bookings',
  NOTIFICATIONS: 'kf_farmer_notifications',
  PAYMENTS: 'kf_farmer_payments',
  PROCUREMENT: 'kf_farmer_procurement',
  SETUP_DONE: 'kf_farmer_setup_completed',
};

// Safe localStorage access helper
function getStoredData(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
}

function setStoredData(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error writing ${key} to localStorage:`, err);
  }
}

export const farmerService = {
  // --- Setup Completion Status ---
  hasCompletedSetup: () => {
    return getStoredData(STORAGE_KEYS.SETUP_DONE, true); // Default true for initial demo view, togglable
  },

  setCompletedSetup: (status = true) => {
    setStoredData(STORAGE_KEYS.SETUP_DONE, status);
  },

  // --- Profile ---
  getFarmerProfile: () => {
    return getStoredData(STORAGE_KEYS.PROFILE, INITIAL_FARMER_PROFILE);
  },

  updateFarmerProfile: (updates) => {
    const current = farmerService.getFarmerProfile();
    const updated = { ...current, ...updates };
    setStoredData(STORAGE_KEYS.PROFILE, updated);
    return updated;
  },

  // --- Crops ---
  getCrops: () => {
    return getStoredData(STORAGE_KEYS.CROPS, INITIAL_CROPS);
  },

  getCropById: (id) => {
    const crops = farmerService.getCrops();
    return crops.find((c) => String(c.id) === String(id)) || null;
  },

  addCrop: (cropData) => {
    const crops = farmerService.getCrops();
    const newCrop = {
      id: `crop-${Date.now()}`,
      name: cropData.name,
      quantity: Number(cropData.quantity),
      unit: cropData.unit || 'kg',
      harvestStatus: cropData.harvestStatus || 'Growing',
      expectedHarvestDate: cropData.expectedHarvestDate || '15 Sep 2026',
      notes: cropData.notes || '',
      hasActiveBooking: false,
      activeBookingId: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [...crops, newCrop];
    setStoredData(STORAGE_KEYS.CROPS, updated);
    return newCrop;
  },

  updateCrop: (id, cropData) => {
    const crops = farmerService.getCrops();
    const updated = crops.map((crop) => {
      if (String(crop.id) === String(id)) {
        return {
          ...crop,
          name: cropData.name !== undefined ? cropData.name : crop.name,
          quantity: cropData.quantity !== undefined ? Number(cropData.quantity) : crop.quantity,
          unit: cropData.unit !== undefined ? cropData.unit : crop.unit,
          harvestStatus: cropData.harvestStatus !== undefined ? cropData.harvestStatus : crop.harvestStatus,
          expectedHarvestDate: cropData.expectedHarvestDate !== undefined ? cropData.expectedHarvestDate : crop.expectedHarvestDate,
          notes: cropData.notes !== undefined ? cropData.notes : crop.notes,
        };
      }
      return crop;
    });
    setStoredData(STORAGE_KEYS.CROPS, updated);
    return updated.find((c) => String(c.id) === String(id));
  },

  removeCrop: (id) => {
    const crops = farmerService.getCrops();
    const target = crops.find((c) => String(c.id) === String(id));
    if (target && target.hasActiveBooking) {
      throw new Error('This crop has an active procurement booking and cannot be removed until the booking is cancelled.');
    }
    const filtered = crops.filter((c) => String(c.id) !== String(id));
    setStoredData(STORAGE_KEYS.CROPS, filtered);
    return true;
  },

  // --- AI Recommendations & Centres ---
  getRecommendations: (cropName, quantity) => {
    return {
      recommendedCentre: MOCK_PROCUREMENT_CENTRES[0],
      recommendedDate: '18 September 2026',
      recommendedTimeSlot: '11:30 AM – 12:00 PM',
      alternatives: MOCK_PROCUREMENT_CENTRES,
    };
  },

  getCentres: () => MOCK_PROCUREMENT_CENTRES,

  getCentreById: (id) => {
    return MOCK_PROCUREMENT_CENTRES.find((c) => String(c.id) === String(id)) || MOCK_PROCUREMENT_CENTRES[0];
  },

  getAvailableSlots: (centreId) => {
    return MOCK_SLOTS_BY_CENTRE[centreId] || MOCK_SLOTS_BY_CENTRE['centre-1'];
  },

  // --- Bookings ---
  getBookings: () => {
    return getStoredData(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },

  getBookingById: (id) => {
    const bookings = farmerService.getBookings();
    return bookings.find((b) => String(b.id) === String(id) || String(b.bookingNumber) === String(id)) || bookings[0] || null;
  },

  createBooking: ({ cropId, cropName, quantity, unit, centreId, centreName, date, timeSlot }) => {
    const bookings = farmerService.getBookings();
    const tokenNum = `KF-${Math.floor(200 + Math.random() * 800)}`;
    const bookingNum = `KF20260918-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber: bookingNum,
      tokenNumber: tokenNum,
      cropName,
      cropId,
      quantity: Number(quantity),
      unit: unit || 'kg',
      centreId,
      centreName: centreName || 'Meerut Procurement Centre',
      centreAddress: 'Mandi Samiti Compound, Delhi Road, Meerut, UP',
      date: date || '18 September 2026',
      timeSlot: timeSlot || '11:30 AM – 12:00 PM',
      estimatedWaitMins: 18,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    const updatedBookings = [newBooking, ...bookings];
    setStoredData(STORAGE_KEYS.BOOKINGS, updatedBookings);

    // Update crop active booking flag
    if (cropId) {
      const crops = farmerService.getCrops();
      const updatedCrops = crops.map((c) => {
        if (String(c.id) === String(cropId)) {
          return { ...c, hasActiveBooking: true, activeBookingId: newBooking.id };
        }
        return c;
      });
      setStoredData(STORAGE_KEYS.CROPS, updatedCrops);
    }

    // Mark setup as completed
    farmerService.setCompletedSetup(true);

    // Add Notification
    farmerService.addNotification({
      type: 'booking',
      title: 'Your booking for Wheat is confirmed.',
      description: `Your ${cropName} procurement slot is confirmed for ${newBooking.date} at ${newBooking.timeSlot} (Token: ${tokenNum}).`,
      icon: 'CheckCircle2',
    });

    return newBooking;
  },

  changeBookingSlot: (bookingId, newDate, newTimeSlot) => {
    const bookings = farmerService.getBookings();
    let updatedBooking = null;

    const updated = bookings.map((b) => {
      if (String(b.id) === String(bookingId)) {
        if (b.status !== 'Confirmed') {
          throw new Error('Only upcoming active bookings can be rescheduled.');
        }
        updatedBooking = {
          ...b,
          date: newDate,
          timeSlot: newTimeSlot,
        };
        return updatedBooking;
      }
      return b;
    });

    setStoredData(STORAGE_KEYS.BOOKINGS, updated);

    if (updatedBooking) {
      farmerService.addNotification({
        type: 'booking',
        title: 'SLOT UPDATED',
        description: `Your procurement slot for ${updatedBooking.cropName} has been updated to ${newDate} at ${newTimeSlot}.`,
        icon: 'CheckCircle2',
      });
    }

    return updatedBooking;
  },

  cancelBooking: (bookingId) => {
    const bookings = farmerService.getBookings();
    let cropToFree = null;

    const updated = bookings.map((b) => {
      if (String(b.id) === String(bookingId)) {
        cropToFree = b.cropId;
        return { ...b, status: 'Cancelled' };
      }
      return b;
    });

    setStoredData(STORAGE_KEYS.BOOKINGS, updated);

    if (cropToFree) {
      const crops = farmerService.getCrops();
      const updatedCrops = crops.map((c) => {
        if (String(c.id) === String(cropToFree)) {
          return { ...c, hasActiveBooking: false, activeBookingId: null };
        }
        return c;
      });
      setStoredData(STORAGE_KEYS.CROPS, updatedCrops);
    }

    return true;
  },

  // --- Queue ---
  getQueue: () => {
    const activeBooking = farmerService.getBookings().find((b) => b.status === 'Confirmed');
    if (activeBooking) {
      return {
        ...INITIAL_LIVE_QUEUE,
        yourToken: activeBooking.tokenNumber,
        centreName: activeBooking.centreName,
      };
    }
    return INITIAL_LIVE_QUEUE;
  },

  // --- Notifications ---
  getNotifications: () => {
    return getStoredData(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationRead: (id) => {
    const notifications = farmerService.getNotifications();
    const updated = notifications.map((n) => (String(n.id) === String(id) ? { ...n, isRead: true } : n));
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  markAllNotificationsRead: () => {
    const notifications = farmerService.getNotifications();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  addNotification: (notifData) => {
    const notifications = farmerService.getNotifications();
    const newNotif = {
      id: `notif-${Date.now()}`,
      type: notifData.type || 'info',
      title: notifData.title,
      description: notifData.description,
      timestamp: 'Just now',
      isRead: false,
      icon: notifData.icon || 'Bell',
    };
    const updated = [newNotif, ...notifications];
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
    return newNotif;
  },

  // --- Procurement Tracking ---
  getProcurementStatus: () => {
    return getStoredData(STORAGE_KEYS.PROCUREMENT, INITIAL_PROCUREMENT_TRACKING);
  },

  // --- Payments ---
  getPayments: () => {
    return getStoredData(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  },
};
