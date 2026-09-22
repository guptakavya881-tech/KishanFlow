'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import BuyerHero from '@/components/buyer/BuyerHero';
import BuyerStatCard from '@/components/buyer/BuyerStatCard';
import BuyerSearchSection from '@/components/buyer/BuyerSearchSection';
import ProcurementJourney from '@/components/buyer/ProcurementJourney';
import ProducePreviewCard from '@/components/buyer/ProducePreviewCard';
import OrderPreviewCard from '@/components/buyer/OrderPreviewCard';
import NotificationPreview from '@/components/buyer/NotificationPreview';
import BuyerProfileCard from '@/components/buyer/BuyerProfileCard';
import { ArrowRight, Headphones, Sprout, Package, RefreshCw } from 'lucide-react';

export default function BuyerDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/buyer/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      } else {
        setError(json.error || 'Failed to load buyer metrics.');
      }
    } catch (err) {
      console.error('Error loading buyer dashboard data:', err);
      setError('Network error while connecting to KishanFlow service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = dashboardData?.stats || {
    availableProduce: 0,
    activeOrders: 0,
    readyForDelivery: 0,
    pendingPayments: 0,
  };

  const availableCrops = dashboardData?.availableCrops || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const notifications = dashboardData?.notifications || [];
  const unreadCount = dashboardData?.unreadNotificationCount || 0;

  // Real data-driven summary stat cards
  const summaryCards = [
    {
      id: 'available-produce',
      title: 'Available Produce',
      value: String(stats.availableProduce),
      unit: 'Lots',
      highlight: stats.availableProduce > 0 ? `${stats.availableProduce} lots ready` : 'Waiting for farmer listings',
      iconName: 'Wheat',
      link: '/buyer/browse',
    },
    {
      id: 'active-orders',
      title: 'Active Orders',
      value: String(stats.activeOrders),
      unit: 'Orders',
      highlight: stats.activeOrders > 0 ? `${stats.activeOrders} active` : 'No active orders',
      iconName: 'Package',
      link: '/buyer/orders',
    },
    {
      id: 'ready-delivery',
      title: 'Ready for Delivery',
      value: String(stats.readyForDelivery),
      unit: 'Shipments',
      highlight: stats.readyForDelivery > 0 ? `${stats.readyForDelivery} ready` : 'No orders ready',
      iconName: 'Truck',
      link: '/buyer/track-orders',
    },
    {
      id: 'pending-payments',
      title: 'Pending Payments',
      value: stats.pendingPayments > 0 ? `₹${stats.pendingPayments.toLocaleString('en-IN')}` : '₹0',
      unit: '',
      highlight: stats.pendingPayments > 0 ? 'Pending payment' : 'No pending payments',
      iconName: 'IndianRupee',
      link: '/buyer/payments',
    },
  ];

  return (
    <BuyerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Welcoming Hero Banner */}
        <BuyerHero />

        {/* 2. Four Summary Stat Cards (100% Data-Driven) */}
        <div className="buyer-stats-grid">
          {summaryCards.map((stat) => (
            <BuyerStatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              unit={stat.unit}
              highlight={stat.highlight}
              iconName={stat.iconName}
              link={stat.link}
            />
          ))}
        </div>

        {/* 3. Main Buyer Search Action Section */}
        <BuyerSearchSection />

        {/* 4. Your Procurement Journey (6-step visual workflow) */}
        <ProcurementJourney />

        {/* 5. Main Dashboard Split Layout */}
        <div className="buyer-saas-grid">
          {/* Left / Main Column (Available Produce & Orders) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Available Produce Preview (Strictly Real Farmer Produce) */}
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2 className="buyer-section-title">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d' }} />
                    Available Near You
                  </h2>
                  <p className="buyer-section-subtitle">
                    Fresh produce registered directly by verified KishanFlow farmers
                  </p>
                </div>

                <Link
                  href="/buyer/browse"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    textDecoration: 'none',
                  }}
                >
                  <span>Browse All Lots</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Real Crops Grid or Empty State */}
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#15803d' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading available farmer produce...</p>
                </div>
              ) : availableCrops.length > 0 ? (
                <div className="buyer-produce-grid">
                  {availableCrops.map((item) => (
                    <ProducePreviewCard key={item.id} produce={item} />
                  ))}
                </div>
              ) : (
                <div className="buyer-empty-box" style={{ margin: '12px 0' }}>
                  <div className="buyer-empty-icon-wrap">
                    <Sprout size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    No crops available yet 🌱
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#4b5563', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    Farmer crop listings will appear here when farmers add produce for procurement.
                  </p>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
                    Check back soon.
                  </span>
                </div>
              )}
            </div>

            {/* Active Orders Preview (Strictly Real Orders) */}
            <div>
              <div className="buyer-section-header">
                <div>
                  <h2 className="buyer-section-title">
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                    Recent Orders
                  </h2>
                  <p className="buyer-section-subtitle">
                    Live dispatch status and procurement allocation history
                  </p>
                </div>

                <Link
                  href="/buyer/orders"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                  }}
                >
                  <span>View All Orders</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Real Orders or Empty State */}
              {recentOrders.length > 0 ? (
                <div className="buyer-orders-grid">
                  {recentOrders.map((order) => (
                    <OrderPreviewCard key={order.orderId || order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '36px 20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1.5px dashed #e5e7eb',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Package size={22} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1f2937', margin: 0 }}>
                    No active orders yet
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, maxWidth: '360px' }}>
                    When you place crop procurement orders, their allocation and delivery tracking will appear here.
                  </p>
                  <Link
                    href="/buyer/browse"
                    style={{
                      marginTop: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#15803d',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    Browse Produce to Order
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Buyer Profile & Notifications) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Buyer Profile Card */}
            <BuyerProfileCard />

            {/* Real Notifications Widget */}
            <NotificationPreview notifications={notifications} unreadCount={unreadCount} />

            {/* Quick Mandi Support Help Box */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)',
              borderRadius: '20px',
              padding: '20px 22px',
              border: '1.5px solid #dcfce7',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Headphones size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                    Mandi Procurement Desk
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700 }}>
                    Official APMC Support
                  </span>
                </div>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: '0.76rem', color: '#4b5563', lineHeight: 1.4 }}>
                Direct mandi allocation desk for bulk institutional procurements and weighment quality disputes.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 800, color: '#166534' }}>Toll Free: 1800-KISHANFLOW</span>
                <Link
                  href="/buyer/help"
                  style={{
                    color: '#15803d',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>Help Desk</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
