'use client';

import React from 'react';
import Link from 'next/link';

export default function WheatLogo({ size = 44, showText = false, showTagline = false, href = '/' }) {
  const content = (
    <div className="flex items-center gap-3 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="wheat-logo-svg flex-shrink-0"
      >
        <defs>
          <linearGradient id="wheatGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c78619" />
            <stop offset="50%" stopColor="#e5a823" />
            <stop offset="100%" stopColor="#f5ca50" />
          </linearGradient>
          <linearGradient id="wheatGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8961c" />
            <stop offset="100%" stopColor="#9e6608" />
          </linearGradient>
          <linearGradient id="greenSoil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="100%" stopColor="#1b5e20" />
          </linearGradient>
          <linearGradient id="greenSoilLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4caf50" />
            <stop offset="100%" stopColor="#2e7d32" />
          </linearGradient>
        </defs>

        {/* Circular ambient background glow */}
        <circle cx="50" cy="50" r="46" fill="#fcf9ee" stroke="#f1e3c3" strokeWidth="1.5" />

        {/* Outer subtle golden halo arc */}
        <path
          d="M 28 68 C 22 46, 36 22, 60 18 C 72 16, 82 22, 84 26"
          stroke="url(#wheatGold)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
          opacity="0.6"
        />

        {/* Main Central Wheat Stalk (Central Stem) */}
        <path
          d="M 38 72 Q 46 48 70 24"
          stroke="url(#wheatGoldDark)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Golden Wheat Grains / Kernels on Stalk */}
        {/* Grain 1 - Top Tip */}
        <path
          d="M 70 24 C 74 21, 78 22, 80 25 C 78 28, 73 28, 70 24 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 2 - Right high */}
        <path
          d="M 64 30 C 72 26, 76 28, 77 33 C 72 36, 66 34, 64 30 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 3 - Left high */}
        <path
          d="M 60 33 C 55 26, 52 30, 52 35 C 56 38, 61 36, 60 33 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 4 - Right mid */}
        <path
          d="M 56 40 C 66 36, 70 39, 71 45 C 65 47, 58 45, 56 40 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 5 - Left mid */}
        <path
          d="M 52 44 C 44 38, 41 43, 42 49 C 47 51, 52 48, 52 44 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 6 - Right lower */}
        <path
          d="M 48 52 C 58 48, 62 52, 62 58 C 56 59, 50 56, 48 52 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />
        {/* Grain 7 - Left lower */}
        <path
          d="M 44 55 C 36 51, 33 56, 35 62 C 40 63, 44 60, 44 55 Z"
          fill="url(#wheatGold)"
          stroke="url(#wheatGoldDark)"
          strokeWidth="1"
        />

        {/* Secondary Inner Wheat Stalk (Left accent) */}
        <path
          d="M 32 74 Q 38 56 52 38"
          stroke="url(#wheatGold)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 52 38 C 50 33, 45 35, 43 40 C 47 43, 50 41, 52 38 Z"
          fill="url(#wheatGold)"
        />
        <path
          d="M 44 45 C 38 42, 35 46, 36 50 C 41 52, 44 49, 44 45 Z"
          fill="url(#wheatGold)"
        />

        {/* Green Arched Fertile Soil Base Furrows */}
        <path
          d="M 22 75 C 30 67, 44 66, 56 70 C 46 76, 32 78, 22 75 Z"
          fill="url(#greenSoilLight)"
        />
        <path
          d="M 20 80 C 34 70, 52 70, 68 76 C 54 84, 34 85, 20 80 Z"
          fill="url(#greenSoil)"
        />
        <path
          d="M 26 84 C 40 76, 58 77, 74 83 C 60 90, 40 90, 26 84 Z"
          fill="url(#greenSoil)"
          opacity="0.8"
        />
      </svg>

      {showText && (
        <div className="brand-text-block">
          <div className="brand-title">
            <span className="brand-name-green">Kishan</span>
            <span className="brand-name-flow">Flow</span>
          </div>
          {showTagline && (
            <span className="brand-tagline">From Farm to Future</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="brand-link flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
