'use client';

import React from 'react';
import { Sprout, ShieldCheck, Truck, Headphones } from 'lucide-react';

export default function BenefitsBar() {
  const benefits = [
    {
      icon: Sprout,
      title: 'Direct Farm to Market',
      desc: 'No middlemen, better rates',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Community',
      desc: 'Trusted & safe transactions',
    },
    {
      icon: Truck,
      title: 'Wide Network',
      desc: 'Farmers, buyers & suppliers',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      desc: "We're here to help",
    },
  ];

  return (
    <section className="benefits-section">
      <div className="benefits-container">
        {benefits.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="benefit-item">
              <div className="benefit-icon-circle">
                <Icon size={20} className="benefit-icon" />
              </div>
              <div className="benefit-text">
                <h4 className="benefit-title">{item.title}</h4>
                <p className="benefit-desc">{item.desc}</p>
              </div>
              {index < benefits.length - 1 && <div className="benefit-divider" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
