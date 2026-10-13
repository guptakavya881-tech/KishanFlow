'use client';

import React from 'react';
import { Sprout, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BenefitsBar() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Sprout,
      title: t('landing.benefit1Title', 'Direct Farm to Market'),
      desc: t('landing.benefit1Desc', 'No middlemen, better rates'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.benefit2Title', 'Verified Community'),
      desc: t('landing.benefit2Desc', 'Trusted & safe transactions'),
    },
    {
      icon: Truck,
      title: t('landing.benefit3Title', 'Wide Network'),
      desc: t('landing.benefit3Desc', 'Farmers, buyers & suppliers'),
    },
    {
      icon: Headphones,
      title: t('landing.benefit4Title', '24/7 Support'),
      desc: t('landing.benefit4Desc', "We're here to help"),
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
