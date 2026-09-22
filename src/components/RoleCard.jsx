'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';

export default function RoleCard({
  role,
  title,
  subtitle,
  href,
  theme = 'green',
  avatarImg,
}) {
  return (
    <div className={`role-card theme-${theme}`}>
      <div className="role-avatar-wrapper">
        {avatarImg ? (
          <img
            src={avatarImg}
            alt={title}
            className="role-avatar-img"
            loading="lazy"
            onError={(e) => {
              // Fallback to stylized SVG icon if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`role-avatar-fallback ${avatarImg ? 'hidden-initially' : 'flex'}`}
        >
          {theme === 'orange' ? (
            <Truck size={42} className="text-amber-600" />
          ) : (
            <span className="text-2xl font-bold uppercase">{role[0]}</span>
          )}
        </div>
      </div>

      <div className="role-card-content">
        <span className="role-card-prefix">Login as</span>
        <h3 className="role-card-title">{title}</h3>
        <p className="role-card-subtitle">{subtitle}</p>
      </div>

      <Link href={href} className="role-card-btn">
        <span>Login</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
