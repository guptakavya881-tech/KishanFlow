'use client';

import React from 'react';
import WheatLogo from './WheatLogo';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left text column */}
        <div className="hero-content">
          <div className="hero-logo-box">
            <WheatLogo size={76} />
            <h1 className="hero-title">
              <span className="text-green">Kishan</span>
              <span className="text-gold"> Flow</span>
            </h1>
          </div>

          <div className="hero-tagline-wrapper">
            <span className="tagline-line" />
            <h2 className="hero-tagline">From Farm to Future</h2>
            <span className="tagline-line" />
          </div>

          <p className="hero-description">
            Connecting farmers, buyers, suppliers and admins for a smarter and
            stronger agriculture ecosystem.
          </p>

          <div className="hero-quick-actions">
            <a href="#roles" className="hero-cta-btn">
              Explore Portals
            </a>
            <a href="#about" className="hero-secondary-btn">
              Learn More
            </a>
          </div>
        </div>

        {/* Right 3D Floating Island visual */}
        <div className="hero-visual-wrapper">
          <div className="floating-island-container">
            <div className="island-image-box">
              <img
                src="/images/hero_floating_island.jpg"
                alt="KishanFlow 3D Agricultural Island"
                className="floating-island-img"
              />
              {/* Floating ambient glow effect */}
              <div className="island-shadow" />
            </div>

            {/* Handwritten callout script badge */}
            <div className="handwritten-callout">
              <span className="script-line-1">Good</span>
              <span className="script-line-2">Harvests</span>
              <span className="script-line-3">Start with</span>
              <span className="script-line-4">Connection</span>
              <svg className="callout-curve-arrow" viewBox="0 0 60 20" fill="none">
                <path d="M5 15 C 25 5, 45 10, 55 18" stroke="#d49a2a" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Animated floating leaves & wheat specks */}
          <div className="floating-particle leaf-1" />
          <div className="floating-particle leaf-2" />
          <div className="floating-particle leaf-3" />
          <div className="floating-particle wheat-1" />
          <div className="floating-particle wheat-2" />
        </div>
      </div>
    </section>
  );
}
