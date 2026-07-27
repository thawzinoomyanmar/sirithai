import React from 'react';

interface PeacockLogoProps {
  className?: string;
  size?: number | string;
}

export const PeacockLogo: React.FC<PeacockLogoProps> = ({ 
  className = '', 
  size = '100%' 
}) => {
  return (
    <svg 
      viewBox="0 0 120 120" 
      width={size} 
      height={size} 
      className={`select-none ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Peacock Crest & Head Gradient */}
        <linearGradient id="crestGrad" x1="50" y1="20" x2="75" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Head and Neck Gradient (Top-right to Bottom-left) */}
        <linearGradient id="headNeckGrad" x1="75" y1="30" x2="40" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="50%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Upper Body / Wing Gradient (Purple/Magenta) */}
        <linearGradient id="upperBodyGrad" x1="37" y1="45" x2="65" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Tail 1 (Magenta-Purple) */}
        <linearGradient id="tail1Grad" x1="38" y1="47" x2="69" y2="69" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Tail 2 (Vibrant Pink/Rose) */}
        <linearGradient id="tail2Grad" x1="38" y1="50" x2="71" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>

        {/* Tail 3 (Orange-Red) */}
        <linearGradient id="tail3Grad" x1="39" y1="54" x2="72" y2="83" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>

        {/* Tail 4 (Yellow-Orange) */}
        <linearGradient id="tail4Grad" x1="40" y1="58" x2="73" y2="87" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        
        {/* Soft Shadow Filter for 3D overlap appearance */}
        <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="1.2" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Layer 1: Lowest Tail Feather (Yellow-Orange) */}
      <path 
        d="M 40,58 C 34,68 35,79 47,85 C 58,91 74,90 74,86 C 74,83 63,78 57,71 C 51,64 45,61 40,58 Z" 
        fill="url(#tail4Grad)"
        filter="url(#softShadow)"
      />

      {/* Layer 2: Second Tail Feather (Orange-Red) */}
      <path 
        d="M 39,54 C 34,63 36,74 46,80 C 56,86 72,84 72,80 C 72,77 62,72 56,65 C 50,58 44,56 39,54 Z" 
        fill="url(#tail3Grad)"
        filter="url(#softShadow)"
      />

      {/* Layer 3: Third Tail Feather (Pink/Rose) */}
      <path 
        d="M 38,50 C 33,59 36,69 45,74 C 54,79 70,77 70,73 C 70,70 61,66 56,59 C 51,52 43,52 38,50 Z" 
        fill="url(#tail2Grad)"
        filter="url(#softShadow)"
      />

      {/* Layer 4: Fourth Tail Feather (Magenta-Purple) */}
      <path 
        d="M 38,47 C 34,54 38,63 46,67 C 54,71 68,69 68,65 C 68,62 60,59 56,53 C 51,47 43,49 38,47 Z" 
        fill="url(#tail1Grad)"
        filter="url(#softShadow)"
      />

      {/* Layer 5: Upper Body / Wing Crescent (Purple/Magenta) */}
      <path 
        d="M 37,45 C 36,49 42,56 50,56 C 58,56 65,51 65,45 C 65,39 58,36 53,36 C 48,36 41,40 37,45 Z" 
        fill="url(#upperBodyGrad)"
        filter="url(#softShadow)"
      />

      {/* Layer 6: Head & Neck Ribbon (Cyan-Blue) */}
      <path 
        d="M 49,38 C 47,38 45,37 43,37 C 41,37 42,39 44,40 C 49,43 54,48 57,53 C 60,58 64,60 68,54 C 72,48 74,40 70,36 C 66,32 58,31 52,34 C 47,36 49,38 49,38 Z" 
        fill="url(#headNeckGrad)"
        filter="url(#softShadow)"
      />
      
      {/* Head details & beak overlay */}
      <path 
        d="M 49,38 C 50,38 52,36 56,35 C 64,33 72,39 74,47 C 76,55 71,61 63,63 C 58,64.5 52,63 46,58 C 40,53 37,47 37,45 C 37,44 38,44 39,45 C 43,49 48,52 54,52 C 62,52 68,46 66,39 C 65,36 61,34 58,35 C 55,36 51,38 49,38 Z" 
        fill="url(#headNeckGrad)"
      />

      {/* Peacock Crest Feathers */}
      {/* Crest Stem 1 */}
      <path 
        d="M 58,35 C 58,30 63,24 67,23" 
        stroke="url(#crestGrad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      {/* Crest Tip 1 */}
      <circle cx="67" cy="23" r="2.2" fill="url(#crestGrad)" />

      {/* Crest Stem 2 */}
      <path 
        d="M 60,34 C 62,29 67,25 71,25" 
        stroke="url(#crestGrad)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      {/* Crest Tip 2 */}
      <circle cx="71" cy="25" r="2.2" fill="url(#crestGrad)" />

      {/* Peacock Eye */}
      <circle cx="56.5" cy="38.5" r="1.2" fill="#1E293B" />
      {/* Highlight in eye */}
      <circle cx="56.2" cy="38.2" r="0.4" fill="#FFFFFF" />
    </svg>
  );
};
