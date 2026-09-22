'use client';

import React from 'react';

// Hero Farm Landscape Banner Illustration (Matches top right of reference image banner)
export function HeroFarmLandscape({ className = '' }) {
  return (
    <div className={`relative w-full max-w-[440px] h-24 sm:h-28 overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        className="w-full h-full object-contain"
        viewBox="0 0 380 105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hillBack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ecfccb" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="treeGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="treeGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
        </defs>

        {/* Floating Tagline with Leaf Icon on Left */}
        <g transform="translate(14, 18)">
          {/* Small 2-leaf sprout */}
          <path d="M 0 16 C 0 8, 8 4, 14 6 C 14 12, 6 16, 0 16 Z" fill="#15803d" />
          <path d="M 0 16 C 4 11, 10 9, 14 6" stroke="#86efac" strokeWidth="0.8" />
          <path d="M 14 6 C 12 1, 18 0, 20 4 C 18 8, 14 7, 14 6 Z" fill="#22c55e" />

          {/* Text: Healthy Crops */}
          <text x="26" y="14" fill="#166534" fontSize="13" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif">
            Healthy Crops
          </text>
          {/* Text: Better Future in elegant script */}
          <text x="36" y="29" fill="#15803d" fontSize="12" fontStyle="italic" fontWeight="600" fontFamily="Georgia, serif">
            Better Future
          </text>
        </g>

        {/* Soft Layered Rolling Hills on Right */}
        {/* Distant Hill 1 */}
        <path
          d="M 130 80 C 180 50, 250 55, 310 40 C 340 32, 365 38, 380 42 L 380 105 L 130 105 Z"
          fill="url(#hillBack)"
          opacity="0.9"
        />
        {/* Subtle furrow wave */}
        <path d="M 160 82 C 220 58, 290 60, 360 46" stroke="#bef264" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

        {/* Middle Hill 2 */}
        <path
          d="M 160 88 C 210 65, 275 68, 325 56 C 350 50, 370 54, 380 58 L 380 105 L 160 105 Z"
          fill="url(#hillMid)"
          opacity="0.9"
        />
        {/* Fore Hill 3 */}
        <path
          d="M 190 98 C 240 78, 295 80, 340 72 C 360 68, 372 70, 380 74 L 380 105 L 190 105 Z"
          fill="url(#hillFront)"
          opacity="0.85"
        />

        {/* Tree Groves on Ridges */}
        <g transform="translate(300, 32)">
          <ellipse cx="0" cy="8" rx="8" ry="12" fill="url(#treeGrad1)" />
          <ellipse cx="10" cy="5" rx="10" ry="14" fill="url(#treeGrad2)" />
          <ellipse cx="22" cy="9" rx="8" ry="11" fill="url(#treeGrad1)" />
          <ellipse cx="32" cy="12" rx="7" ry="9" fill="url(#treeGrad2)" />
        </g>

        <g transform="translate(248, 48)">
          <ellipse cx="0" cy="6" rx="7" ry="10" fill="url(#treeGrad2)" opacity="0.8" />
          <ellipse cx="9" cy="4" rx="8" ry="11" fill="url(#treeGrad1)" opacity="0.85" />
          <ellipse cx="18" cy="7" rx="6" ry="9" fill="url(#treeGrad2)" opacity="0.75" />
        </g>
      </svg>
    </div>
  );
}

// Friendly Indian Farmer Character Illustration (Matches reference image Find Best Slot card)
export function FarmerIllustration({ className = 'w-44 h-44' }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-[#eef7ee] border border-emerald-100 shadow-2xs ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full z-10 select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Sun Glow */}
        <circle cx="100" cy="70" r="55" fill="#fef9c3" opacity="0.6" />

        {/* Distant Rolling Fields in Circle */}
        <path d="M 15 130 Q 55 105 100 115 T 185 108 L 185 190 L 15 190 Z" fill="#bbf7d0" />
        <path d="M 10 145 Q 60 125 115 135 T 190 128 L 190 190 L 10 190 Z" fill="#86efac" />
        <path d="M 5 160 Q 70 145 130 152 T 195 146 L 195 190 L 5 190 Z" fill="#4ade80" />

        {/* Farmer Body Kurta */}
        <path
          d="M 62 110 L 138 110 L 150 195 L 50 195 Z"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        {/* Kurta Placket & Collar */}
        <path d="M 94 110 L 106 110 L 104 146 L 96 146 Z" fill="#e2e8f0" />
        <circle cx="100" cy="120" r="1.5" fill="#64748b" />
        <circle cx="100" cy="130" r="1.5" fill="#64748b" />
        <circle cx="100" cy="140" r="1.5" fill="#64748b" />

        {/* Farmer Neck */}
        <rect x="91" y="96" width="18" height="16" fill="#fbcfe8" rx="4" />

        {/* Farmer Face */}
        <ellipse cx="100" cy="78" rx="23" ry="24" fill="#fed7aa" />

        {/* Ears */}
        <ellipse cx="76" cy="78" rx="4" ry="7" fill="#fed7aa" />
        <ellipse cx="124" cy="78" rx="4" ry="7" fill="#fed7aa" />

        {/* Turban (Pagri) - Beautiful Indian Mustard/Orange Folded Pagri */}
        <path
          d="M 64 68 C 62 44, 138 44, 136 68 C 142 76, 58 76, 64 68 Z"
          fill="#f59e0b"
        />
        <path
          d="M 62 60 C 74 46, 126 46, 138 60 C 132 72, 68 72, 62 60 Z"
          fill="#ea580c"
        />
        <path
          d="M 66 50 C 78 38, 122 38, 134 50 C 128 62, 72 62, 66 50 Z"
          fill="#f59e0b"
        />
        {/* Turban Fan Top / Crest */}
        <path
          d="M 90 38 Q 100 24 110 38 Q 100 32 90 38 Z"
          fill="#ea580c"
        />

        {/* Eyebrows & Eyes */}
        <path d="M 85 70 Q 92 68 97 71" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <path d="M 103 71 Q 108 68 115 70" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="91" cy="75" r="2.2" fill="#0f172a" />
        <circle cx="109" cy="75" r="2.2" fill="#0f172a" />

        {/* Nose */}
        <path d="M 99 76 Q 102 82 99 84 Q 96 84 95 82" stroke="#d97706" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Characteristic Indian Farmer Moustache (Proud curled mustache) */}
        <path
          d="M 86 86 C 92 88, 97 89, 100 87 C 103 89, 108 88, 114 86 C 117 84, 119 86, 117 88 C 112 94, 102 94, 100 90 C 98 94, 88 94, 83 88 C 81 86, 83 84, 86 86 Z"
          fill="#1e293b"
        />

        {/* Smile under mustache */}
        <path d="M 94 94 Q 100 97 106 94" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" />

        {/* Digital Tablet in Hands (Right side) */}
        <g transform="translate(108, 126)">
          <rect x="0" y="0" width="36" height="46" rx="4" fill="#1e293b" />
          <rect x="3" y="3" width="30" height="40" rx="2" fill="#0284c7" />
          {/* Screen chart lines */}
          <line x1="7" y1="14" x2="29" y2="14" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="22" x2="23" y2="22" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="30" x2="27" y2="30" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
          {/* Hand holding tablet */}
          <ellipse cx="3" cy="24" rx="5" ry="7" fill="#fed7aa" />
          <ellipse cx="36" cy="28" rx="4" ry="6" fill="#fed7aa" />
        </g>

        {/* Vegetable Basket on Left */}
        <g transform="translate(36, 136)">
          {/* Woven Basket */}
          <ellipse cx="28" cy="36" rx="22" ry="14" fill="#b45309" />
          <path d="M 8 36 C 8 50, 48 50, 48 36 Z" fill="#92400e" stroke="#78350f" strokeWidth="1" />
          {/* Vegetables spilling out: Carrots, Tomatoes, Greens */}
          {/* Tomato */}
          <circle cx="20" cy="30" r="8" fill="#dc2626" />
          <circle cx="21" cy="28" r="2.5" fill="#f87171" opacity="0.6" />
          <path d="M 20 23 L 20 21" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
          {/* Carrot */}
          <path d="M 28 20 L 38 34 L 34 36 Z" fill="#ea580c" />
          <path d="M 28 20 L 26 16 M 28 20 L 29 15" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" />
          {/* Greens */}
          <ellipse cx="36" cy="28" rx="7" ry="5" fill="#22c55e" />
          <ellipse cx="14" cy="33" rx="6" ry="4" fill="#16a34a" />
        </g>
      </svg>
    </div>
  );
}

// Sidebar Tractor Landscape Footer (Matches bottom of sidebar in reference image)
export function SidebarTractorFooter() {
  return (
    <div className="w-full mt-auto pt-3 overflow-hidden pointer-events-none select-none">
      <svg
        viewBox="0 0 240 76"
        className="w-full h-auto text-emerald-300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sideHill1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
          <linearGradient id="sideHill2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>

        {/* Distant Hills */}
        <path d="M 0 38 Q 60 18, 120 32 T 240 22 L 240 76 L 0 76 Z" fill="url(#sideHill1)" />
        <path d="M 0 50 Q 80 34, 160 44 T 240 38 L 240 76 L 0 76 Z" fill="url(#sideHill2)" opacity="0.8" />

        {/* Small Green Tractor on Right */}
        <g transform="translate(176, 38) scale(0.65)">
          {/* Tractor Body */}
          <rect x="10" y="10" width="26" height="15" fill="#15803d" rx="2" />
          {/* Cabin / Hood */}
          <rect x="22" y="3" width="12" height="12" fill="#166534" rx="2" />
          <rect x="25" y="5" width="7" height="6" fill="#86efac" opacity="0.6" rx="1" />
          {/* Exhaust Pipe */}
          <line x1="8" y1="12" x2="8" y2="4" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="8" cy="3" r="1.5" fill="#64748b" />
          {/* Front Small Wheel */}
          <circle cx="10" cy="25" r="6" fill="#1e293b" />
          <circle cx="10" cy="25" r="2.5" fill="#cbd5e1" />
          {/* Rear Big Wheel */}
          <circle cx="30" cy="23" r="9" fill="#1e293b" />
          <circle cx="30" cy="23" r="4.5" fill="#e2e8f0" />
          <circle cx="30" cy="23" r="2" fill="#475569" />
        </g>
      </svg>
    </div>
  );
}

// Gorgeous Realistic Wheat Stalk Vector Icon (Matches Wheat card in reference image)
export function WheatVectorIcon({ className = 'w-12 h-12' }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full drop-shadow-2xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wheatStalkGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="grainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Background Soft Glow Circle */}
        <circle cx="30" cy="30" r="26" fill="#fefce8" />

        {/* Central Arching Stems */}
        <path d="M 18 52 Q 26 34 42 12" stroke="url(#wheatStalkGold)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 14 52 Q 22 38 32 24" stroke="url(#wheatStalkGold)" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

        {/* Tip Awns (Fine beard hairs of wheat) */}
        <line x1="42" y1="12" x2="48" y2="4" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="40" y1="15" x2="52" y2="10" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="38" y1="19" x2="50" y2="17" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

        {/* Wheat Grains (Alternating left and right) */}
        <ellipse cx="42" cy="14" rx="3.2" ry="5.5" transform="rotate(35 42 14)" fill="url(#grainGrad)" />
        <ellipse cx="38" cy="18" rx="3.2" ry="5.5" transform="rotate(-30 38 18)" fill="url(#grainGrad)" />
        <ellipse cx="40" cy="22" rx="3.4" ry="6" transform="rotate(40 40 22)" fill="url(#grainGrad)" />
        <ellipse cx="34" cy="25" rx="3.4" ry="6" transform="rotate(-35 34 25)" fill="url(#grainGrad)" />
        <ellipse cx="36" cy="30" rx="3.6" ry="6" transform="rotate(42 36 30)" fill="url(#grainGrad)" />
        <ellipse cx="29" cy="32" rx="3.6" ry="6" transform="rotate(-38 29 32)" fill="url(#grainGrad)" />
        <ellipse cx="31" cy="38" rx="3.5" ry="6" transform="rotate(45 31 38)" fill="url(#grainGrad)" />
        <ellipse cx="24" cy="40" rx="3.5" ry="6" transform="rotate(-40 24 40)" fill="url(#grainGrad)" />

        {/* Secondary Left Stalk Grains */}
        <ellipse cx="32" cy="24" rx="2.8" ry="4.8" transform="rotate(30 32 24)" fill="url(#grainGrad)" />
        <ellipse cx="27" cy="28" rx="2.8" ry="4.8" transform="rotate(-30 27 28)" fill="url(#grainGrad)" />
        <ellipse cx="28" cy="35" rx="3" ry="5" transform="rotate(35 28 35)" fill="url(#grainGrad)" />
      </svg>
    </div>
  );
}

// Gorgeous Paddy/Rice Stalk Vector Icon (Matches Paddy card in reference image)
export function PaddyVectorIcon({ className = 'w-12 h-12' }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full drop-shadow-2xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="paddyGreen" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#86efac" />
          </linearGradient>
          <linearGradient id="paddyGrain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>

        {/* Background Soft Glow Circle */}
        <circle cx="30" cy="30" r="26" fill="#f0fdf4" />

        {/* Gracefully Drooping Rice Panicle Stem */}
        <path d="M 16 52 C 22 36, 30 24, 46 22 C 50 22, 52 28, 48 34" stroke="url(#paddyGreen)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 16 52 C 20 40, 26 32, 38 28" stroke="url(#paddyGreen)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

        {/* Slender Paddy Leaves at Base */}
        <path d="M 16 52 C 12 40, 10 30, 8 20 C 14 26, 18 38, 16 52 Z" fill="#22c55e" />
        <path d="M 16 52 C 20 42, 24 36, 32 30 C 26 40, 20 46, 16 52 Z" fill="#15803d" />

        {/* Drooping Golden Grains along curved panicle */}
        <ellipse cx="45" cy="22" rx="2.8" ry="4.8" transform="rotate(70 45 22)" fill="url(#paddyGrain)" />
        <ellipse cx="49" cy="26" rx="2.8" ry="5" transform="rotate(95 49 26)" fill="url(#paddyGrain)" />
        <ellipse cx="48" cy="32" rx="2.8" ry="5" transform="rotate(115 48 32)" fill="url(#paddyGrain)" />
        <ellipse cx="44" cy="38" rx="2.8" ry="5" transform="rotate(130 44 38)" fill="url(#paddyGrain)" />

        <ellipse cx="40" cy="25" rx="2.6" ry="4.5" transform="rotate(50 40 25)" fill="url(#paddyGrain)" />
        <ellipse cx="36" cy="28" rx="2.6" ry="4.5" transform="rotate(40 36 28)" fill="url(#paddyGrain)" />
        <ellipse cx="31" cy="33" rx="2.6" ry="4.5" transform="rotate(35 31 33)" fill="url(#paddyGrain)" />
        <ellipse cx="26" cy="38" rx="2.6" ry="4.5" transform="rotate(30 26 38)" fill="url(#paddyGrain)" />
      </svg>
    </div>
  );
}

// Gorgeous Maize/Corn Cob Vector Icon (Matches Maize card in reference image)
export function MaizeVectorIcon({ className = 'w-12 h-12' }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full drop-shadow-2xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cornKernel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="cornHusk" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>

        {/* Background Soft Glow Circle */}
        <circle cx="30" cy="30" r="26" fill="#fefce8" />

        {/* Left Green Wrapping Husk Leaf */}
        <path
          d="M 28 54 C 18 48, 12 36, 14 18 C 22 26, 26 40, 28 54 Z"
          fill="url(#cornHusk)"
        />

        {/* Right Green Wrapping Husk Leaf */}
        <path
          d="M 32 54 C 42 48, 48 36, 46 20 C 38 28, 34 40, 32 54 Z"
          fill="url(#cornHusk)"
        />

        {/* Main Golden Corn Cob */}
        <path
          d="M 22 46 C 20 32, 22 18, 30 12 C 38 18, 40 32, 38 46 C 35 50, 25 50, 22 46 Z"
          fill="url(#cornKernel)"
          stroke="#ca8a04"
          strokeWidth="1.2"
        />

        {/* Corn Silk Hairs at top */}
        <path d="M 30 12 Q 28 6 25 4 M 30 12 Q 32 5 35 3 M 30 12 Q 34 7 38 6" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" />

        {/* Corn Kernel Grid Detail */}
        <line x1="26" y1="18" x2="34" y2="18" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="24" y1="23" x2="36" y2="23" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="23" y1="28" x2="37" y2="28" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="23" y1="33" x2="37" y2="33" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="24" y1="38" x2="36" y2="38" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="25" y1="43" x2="35" y2="43" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />

        {/* Vertical kernel lines */}
        <line x1="27" y1="16" x2="27" y2="45" stroke="#ca8a04" strokeWidth="0.8" opacity="0.6" />
        <line x1="30" y1="13" x2="30" y2="46" stroke="#ca8a04" strokeWidth="0.8" opacity="0.6" />
        <line x1="33" y1="16" x2="33" y2="45" stroke="#ca8a04" strokeWidth="0.8" opacity="0.6" />

        {/* Base Stalk */}
        <path d="M 28 50 L 28 56 C 28 58, 32 58, 32 56 L 32 50 Z" fill="#15803d" />
      </svg>
    </div>
  );
}

// Mustard Vector Icon (Golden yellow mustard blossoms with green pod stems)
export function MustardVectorIcon({ className = 'w-12 h-12' }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full drop-shadow-2xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="30" cy="30" r="26" fill="#fefce8" />
        {/* Main stem */}
        <path d="M 28 54 Q 30 36 34 16" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 30 38 Q 22 30 18 24" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 32 30 Q 40 24 44 20" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
        {/* Mustard Flower Clusters (Bright Yellow) */}
        <circle cx="34" cy="14" r="5" fill="#facc15" stroke="#eab308" strokeWidth="1" />
        <circle cx="28" cy="18" r="4.5" fill="#fde047" />
        <circle cx="38" cy="19" r="4.5" fill="#eab308" />
        <circle cx="18" cy="22" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
        <circle cx="44" cy="18" r="4.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
        <circle cx="34" cy="14" r="2" fill="#ca8a04" />
      </svg>
    </div>
  );
}

// Sugarcane Vector Icon
export function SugarcaneVectorIcon({ className = 'w-12 h-12' }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full drop-shadow-2xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="30" cy="30" r="26" fill="#f0fdf4" />
        {/* Stalk 1 */}
        <path d="M 24 54 L 24 16" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="21" y1="42" x2="27" y2="42" stroke="#14532d" strokeWidth="1.5" />
        <line x1="21" y1="30" x2="27" y2="30" stroke="#14532d" strokeWidth="1.5" />
        <line x1="21" y1="18" x2="27" y2="18" stroke="#14532d" strokeWidth="1.5" />
        {/* Stalk 2 */}
        <path d="M 34 54 L 34 22" stroke="#22c55e" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="31" y1="46" x2="37" y2="46" stroke="#14532d" strokeWidth="1.5" />
        <line x1="31" y1="34" x2="37" y2="34" stroke="#14532d" strokeWidth="1.5" />
        {/* Top Leaf sprays */}
        <path d="M 24 16 Q 16 10 10 12" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 24 16 Q 32 8 38 10" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 34 22 Q 42 16 48 20" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Generic Crop Icon for other crops
export function GenericCropIcon({ name = '', className = 'w-12 h-12' }) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('wheat')) return <WheatVectorIcon className={className} />;
  if (lower.includes('paddy') || lower.includes('rice')) return <PaddyVectorIcon className={className} />;
  if (lower.includes('maize') || lower.includes('corn')) return <MaizeVectorIcon className={className} />;
  if (lower.includes('mustard') || lower.includes('sarson')) return <MustardVectorIcon className={className} />;
  if (lower.includes('sugar') || lower.includes('cane') || lower.includes('ganna')) return <SugarcaneVectorIcon className={className} />;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <div className="w-full h-full rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shadow-2xs">
        🌱
      </div>
    </div>
  );
}
