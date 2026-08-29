import React, { useState } from 'react';

interface NarisLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'badge';
  colorMode?: 'light' | 'dark' | 'pink';
}

export const NarisLogo: React.FC<NarisLogoProps> = ({
  className = '',
  variant = 'full'
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Naris Logo Image File */}
      <div className="relative group shrink-0 flex items-center">
        {!imgError ? (
          <img
            src="/naris-vietnam-logo.png"
            alt="Naris Cosmetics Logo"
            className="h-9 md:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            onError={() => {
              // Fallback to secondary official logo image file if needed
              setImgError(true);
            }}
          />
        ) : (
          <img
            src="/naris-logo.png"
            alt="Naris Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
        )}
      </div>

      {variant !== 'compact' && (
        <div className="flex items-center">
          <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 border border-pink-200 shadow-xs">
            Parasola Edition
          </span>
        </div>
      )}
    </div>
  );
};


