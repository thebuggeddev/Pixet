import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PixelIcon } from './PixelIcon';
import { IconData } from '../types';
import { Crosshair } from './Crosshair';

interface IconCardProps {
  icon: IconData;
  onClick: () => void;
}

export const IconCard: React.FC<IconCardProps> = ({ icon, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layoutId={`card-${icon.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#0a0a0a] p-6 flex flex-col items-center justify-center cursor-pointer border border-white/10 hover:border-accent transition-colors group relative"
    >
      <Crosshair className="-top-1.5 -left-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <Crosshair className="-top-1.5 -right-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <Crosshair className="-bottom-1.5 -left-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <Crosshair className="-bottom-1.5 -right-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />

      <div className="h-24 flex items-center justify-center relative z-10">
        <motion.div layoutId={`icon-${icon.id}`}>
          <PixelIcon matrix={icon.matrix} colors={icon.colors} size={8} gap={2} isHovered={isHovered} />
        </motion.div>
      </div>
      
      <motion.div 
        layoutId={`title-${icon.id}`}
        className="mt-4 text-gray-500 text-xs font-mono tracking-widest uppercase group-hover:text-accent transition-colors relative z-10"
      >
        {icon.name}
      </motion.div>
    </motion.div>
  );
};
