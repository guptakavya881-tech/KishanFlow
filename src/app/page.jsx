'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import RoleCard from '@/components/RoleCard';
import BenefitsBar from '@/components/BenefitsBar';
import WheatLogo from '@/components/WheatLogo';
import { Mail, Phone, MapPin, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const roleCards = [
    {
      role: 'farmer',
      title: 'Farmer',
      subtitle: 'Grow your produce, get better opportunities.',
      href: '/farmer/login',
      theme: 'green',
      avatarImg: '/images/avatar_farmer.jpg',
    },
    {
      role: 'buyer',
      title: 'Buyer',
      subtitle: 'Find fresh produce, connect with trusted farmers.',
      href: '/buyer/login',
      theme: 'blue',
      avatarImg: '/images/avatar_buyer.jpg',
    },
    {
      role: 'admin',
      title: 'Admin',
      subtitle: 'Manage users, monitor and keep the system smooth.',
      href: '/admin/login',
      theme: 'purple',
      avatarImg: '/images/avatar_admin.jpg',
    },
    {
      role: 'supplier',
      title: 'Supplier',
      subtitle: 'Supply quality products, expand your business.',
      href: '/supplier/login',
      theme: 'orange',
      avatarImg: null, // Renders the stylized golden truck
    },
  ];

  return (
    <div className="homepage-wrapper">
      <Navbar />

      <main className="main-content">
        {/* Hero Section */}
        <HeroSection />

        {/* Role Selection Grid */}
        <section id="roles" className="roles-section">
          <div className="roles-container">
            <div className="roles-grid">
              {roleCards.map((card) => (
                <RoleCard key={card.role} {...card} />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <BenefitsBar />

        {/* About Section */}
        <section id="about" className="info-section bg-white">
          <div className="section-container">
            <div className="section-header text-center">
              <span className="section-kicker">About the Platform</span>
              <h2 className="section-heading">Transforming Agricultural Commerce</h2>
              <p className="section-subtext">
                KishanFlow builds a reliable bridge between hard-working farmers, commercial & retail buyers,
                agricultural suppliers, and platform administrators.
              </p>
            </div>

            <div className="feature-grid-3">
              <div className="feature-box">
                <div className="feature-icon green">
                  <Sparkles size={24} />
                </div>
                <h3>Fair Value for Farmers</h3>
                <p>
                  Eliminating unnecessary middlemen allows farmers to receive fair compensation
                  and real-time market rate visibility.
                </p>
              </div>

              <div className="feature-box">
                <div className="feature-icon blue">
                  <ShieldCheck size={24} />
                </div>
                <h3>Farm-Fresh for Buyers</h3>
                <p>
                  Direct procurement ensures the highest quality, harvested-to-order produce
                  delivered quickly to retail buyers and consumers.
                </p>
              </div>

              <div className="feature-box">
                <div className="feature-icon orange">
                  <CheckCircle size={24} />
                </div>
                <h3>Seamless Supply Network</h3>
                <p>
                  Suppliers of seeds, fertilizers, machinery, and logistics integrate seamlessly
                  into an organized agricultural supply chain.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="info-section bg-cream">
          <div className="section-container">
            <div className="contact-card">
              <div className="contact-header text-center">
                <WheatLogo size={48} />
                <h2 className="text-2xl font-bold mt-2">Get in Touch with KishanFlow</h2>
                <p className="text-secondary text-sm">
                  Have questions or need assistance onboarding? Our team is available 24/7.
                </p>
              </div>

              <div className="contact-details-row">
                <div className="contact-detail-item">
                  <div className="contact-icon-bubble">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Helpline</h5>
                    <p className="text-secondary text-sm">+91 1800-KISHANFLOW</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-icon-bubble">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Email Support</h5>
                    <p className="text-secondary text-sm">support@kishanflow.com</p>
                  </div>
                </div>

                <div className="contact-detail-item">
                  <div className="contact-icon-bubble">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm">Headquarters</h5>
                    <p className="text-secondary text-sm">Krishi Bhavan, New Delhi, India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer-bar">
        <div className="footer-container">
          <div className="footer-left">
            <WheatLogo size={32} showText={true} />
            <p className="text-xs text-secondary mt-1">
              © {new Date().getFullYear()} KishanFlow. All rights reserved. "From Farm to Future".
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-links">
              <a href="#about" className="footer-link">About Us</a>
              <a href="#features" className="footer-link">Features</a>
              <a href="#contact" className="footer-link">Contact</a>
              <a href="/admin/login" className="footer-link">Admin Access</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
