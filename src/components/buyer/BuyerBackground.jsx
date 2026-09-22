'use client';

import React from 'react';

/**
 * BuyerBackground
 * Calm, soft agricultural landscape background for the Buyer module.
 * Features subtle rolling hills, distant grain silhouettes, gentle clouds, and floating leaves.
 * Kept strictly at low opacity (4–7%) so text and content remain completely legible.
 */
export default function BuyerBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Soft warm agricultural tint gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f5] via-[#f7f9f4] to-[#f2f7ef]" />

      {/* SVG Agricultural Landscape */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[320px] sm:h-[400px] object-cover opacity-25"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle natural gradients */}
          <linearGradient id="bgHillFar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="bgHillMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="bgHillNear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Far rolling hills */}
        <path
          d="M0 160 C 320 110, 560 210, 880 140 C 1120 80, 1320 170, 1440 150 L 1440 320 L 0 320 Z"
          fill="url(#bgHillFar)"
        />

        {/* Mid rolling hills */}
        <path
          d="M0 210 C 260 170, 500 240, 780 190 C 1040 150, 1260 220, 1440 180 L 1440 320 L 0 320 Z"
          fill="url(#bgHillMid)"
        />

        {/* Near foreground hill with subtle crop field texture */}
        <path
          d="M0 260 C 340 230, 680 270, 1020 235 C 1220 215, 1360 240, 1440 230 L 1440 320 L 0 320 Z"
          fill="url(#bgHillNear)"
        />

        {/* Subtle crop silhouettes along bottom edge */}
        <g stroke="#15803d" strokeWidth="0.8" strokeOpacity="0.25" strokeLinecap="round">
          {/* Cluster 1 */}
          <path d="M 80 265 L 80 245 M 80 252 Q 74 246 72 248 M 80 250 Q 86 244 88 246" />
          <path d="M 88 268 L 88 248 M 88 255 Q 82 249 80 251 M 88 253 Q 94 247 96 249" />
          <path d="M 96 266 L 96 246 M 96 253 Q 90 247 88 249 M 96 251 Q 102 245 104 247" />

          {/* Cluster 2 */}
          <path d="M 420 260 L 420 238 M 420 246 Q 414 240 412 242 M 420 244 Q 426 238 428 240" />
          <path d="M 430 263 L 430 240 M 430 248 Q 424 242 422 244 M 430 246 Q 436 240 438 242" />

          {/* Cluster 3 */}
          <path d="M 880 255 L 880 232 M 880 240 Q 874 234 872 236 M 880 238 Q 886 232 888 234" />
          <path d="M 890 258 L 890 235 M 890 243 Q 884 237 882 239 M 890 241 Q 896 235 898 237" />

          {/* Cluster 4 */}
          <path d="M 1240 250 L 1240 228 M 1240 236 Q 1234 230 1232 232 M 1240 234 Q 1246 228 1248 230" />
          <path d="M 1250 252 L 1250 230 M 1250 238 Q 1244 232 1242 234 M 1250 236 Q 1256 230 1258 232" />
        </g>
      </svg>

      {/* Subtle Drifting Cloud 1 (Top Left) */}
      <div className="absolute top-12 left-16 opacity-30 anim-buyer-cloud-1 hidden md:block">
        <svg width="120" height="42" viewBox="0 0 120 42" fill="none">
          <path
            d="M 20 32 C 10 32 0 25 0 16 C 0 8 10 2 22 4 C 28 -2 46 -2 54 6 C 60 0 74 0 82 5 C 92 1 106 6 108 14 C 118 16 120 26 114 32 Z"
            fill="#d1fae5"
          />
        </svg>
      </div>

      {/* Subtle Drifting Cloud 2 (Top Right) */}
      <div className="absolute top-24 right-28 opacity-25 anim-buyer-cloud-2 hidden lg:block">
        <svg width="140" height="48" viewBox="0 0 140 48" fill="none">
          <path
            d="M 22 36 C 10 36 0 28 0 18 C 0 9 12 2 26 4 C 34 -2 54 -2 64 6 C 72 0 88 0 98 5 C 110 1 124 7 126 16 C 138 18 140 30 132 36 Z"
            fill="#dcfce7"
          />
        </svg>
      </div>

      {/* Gentle Floating Leaf 1 (Left area) */}
      <div className="absolute top-1/3 left-10 opacity-30 anim-buyer-leaf-1 hidden sm:block">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 12 12 2 22 2C22 12 12 22 2 22Z"
            fill="#16a34a"
            fillOpacity="0.6"
          />
          <path
            d="M2 22C7 17 17 7 22 2"
            stroke="#bbf7d0"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Gentle Floating Leaf 2 (Right area) */}
      <div className="absolute top-2/3 right-12 opacity-25 anim-buyer-leaf-2 hidden sm:block">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 22C2 12 12 2 22 2C22 12 12 22 2 22Z"
            fill="#22c55e"
            fillOpacity="0.5"
          />
          <path
            d="M2 22C7 17 17 7 22 2"
            stroke="#86efac"
            strokeWidth="1.2"
          />
        </svg>
      </div>
    </div>
  );
}
