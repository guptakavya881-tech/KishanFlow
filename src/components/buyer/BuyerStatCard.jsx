'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sprout,
  Package,
  Truck,
  IndianRupee,
  ArrowUpRight,
} from 'lucide-react';

const ICON_MAP = {
  Wheat: Sprout,
  Package: Package,
  Truck: Truck,
  IndianRupee: IndianRupee,
};

export default function BuyerStatCard({
  title,
  value,
  unit,
  highlight,
  iconName,
  link = '/buyer/dashboard',
}) {
  const Icon = ICON_MAP[iconName] || Sprout;

  return (
    <Link href={link} className="buyer-stat-card">
      {/* Top row: Icon and Quick arrow */}
      <div className="buyer-stat-top">
        <div className="buyer-stat-icon-wrap">
          <Icon size={22} className="stroke-[2.2]" />
        </div>

        <span style={{ color: '#9ca3af', display: 'flex' }}>
          <ArrowUpRight size={18} />
        </span>
      </div>

      {/* Main Stat Metric */}
      <div>
        <p className="buyer-stat-label">
          {title}
        </p>
        <div className="buyer-stat-val-row">
          <span className="buyer-stat-val">
            {value}
          </span>
          <span className="buyer-stat-unit">
            {unit}
          </span>
        </div>
      </div>

      {/* Bottom Highlight Badge */}
      {highlight && (
        <div className="buyer-stat-footer">
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '6px',
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}>
            {highlight}
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d' }}>
            View &rarr;
          </span>
        </div>
      )}
    </Link>
  );
}
