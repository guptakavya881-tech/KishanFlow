'use client';

import React from 'react';

/**
 * AdminBackground
 * Soft, elegant agricultural background for the Admin Portal.
 * Blends warm cream/off-white tints with faint rolling hill silhouettes,
 * subtle grain stalks, and gentle natural contours at low opacity.
 * Kept strictly subdued so typography, stats cards, and tables remain 100% legible.
 */
export default function AdminBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Soft warm agricultural tint gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f5] via-[#f7f9f4] to-[#f2f7ef]" />

      {/* SVG Agricultural Landscape Contours */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[320px] sm:h-[400px] object-cover opacity-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="adminHillFar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="adminHillMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="adminHillNear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#86efac" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Far rolling hills */}
        <path
          d="M0 160 C 320 110, 560 210, 880 140 C 1120 80, 1320 170, 1440 150 L 1440 320 L 0 320 Z"
          fill="url(#adminHillFar)"
        />

        {/* Mid rolling hills */}
        <path
          d="M0 210 C 260 170, 500 240, 780 190 C 1040 150, 1260 220, 1440 180 L 1440 320 L 0 320 Z"
          fill="url(#adminHillMid)"
        />

        {/* Near foreground hill */}
        <path
          d="M0 260 C 340 230, 680 270, 1020 235 C 1220 215, 1360 240, 1440 230 L 1440 320 L 0 320 Z"
          fill="url(#adminHillNear)"
        />

        {/* Subtle crop & wheat silhouettes along horizon */}
        <g stroke="#15803d" strokeWidth="0.8" strokeOpacity="0.22" strokeLinecap="round">
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

      {/* Gentle Floating Leaf Accents */}
      <div className="absolute top-1/4 left-8 opacity-20 hidden md:block">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M2 22C2 12 12 2 22 2C22 12 12 22 2 22Z" fill="#16a34a" fillOpacity="0.5" />
          <path d="M2 22C7 17 17 7 22 2" stroke="#bbf7d0" strokeWidth="1.2" />
        </svg>
      </div>

      <div className="absolute top-2/3 right-10 opacity-20 hidden md:block">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M2 22C2 12 12 2 22 2C22 12 12 22 2 22Z" fill="#22c55e" fillOpacity="0.4" />
          <path d="M2 22C7 17 17 7 22 2" stroke="#86efac" strokeWidth="1.2" />
        </svg>
      </div>
    </div>
  );
}
