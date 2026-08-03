import React from 'react';

interface PeacockLogoProps {
  className?: string;
  size?: number | string;
}

export const PeacockLogo: React.FC<PeacockLogoProps> = ({ 
  className = '', 
  size
}) => {
  return (
    <img 
      src="/icon-192.png" 
      alt="Siri Thai App Icon" 
      className={`rounded-2xl object-cover select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  );
};
