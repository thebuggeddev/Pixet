import React from 'react';

export const Crosshair = ({ className = '' }: { className?: string }) => (
  <div className={`absolute w-3 h-3 pointer-events-none flex items-center justify-center z-20 ${className}`}>
    <div className="absolute w-full h-[1px] bg-white/30" />
    <div className="absolute h-full w-[1px] bg-white/30" />
  </div>
);
