import React, { memo, useCallback, useState } from 'react';
import { PixelIcon } from './PixelIcon';
import { IconData, PreviewOrigin, ThemeMode } from '../types';
import { Crosshair } from './Crosshair';

interface IconCardProps {
  icon: IconData;
  onSelect: (icon: IconData, origin: PreviewOrigin) => void;
  theme: ThemeMode;
  compactMode?: boolean;
  reducedEffects?: boolean;
  showCrosshair?: boolean;
}

const IconCardComponent: React.FC<IconCardProps> = ({
  icon,
  onSelect,
  theme,
  compactMode = false,
  reducedEffects = false,
  showCrosshair = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const enableHoverAnimation = !compactMode && !reducedEffects;

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onSelect(icon, {
      top: bounds.top,
      left: bounds.left,
      width: bounds.width,
      height: bounds.height,
    });
  }, [icon, onSelect]);

  return (
    <button
      type="button"
      data-icon-card
      onMouseEnter={enableHoverAnimation ? () => setIsHovered(true) : undefined}
      onMouseLeave={enableHoverAnimation ? () => setIsHovered(false) : undefined}
      onClick={handleClick}
      className="icon-card bg-[var(--color-surface)] p-6 flex flex-col items-center justify-center border border-[color:var(--color-border)] hover:border-[var(--color-accent)] group relative"
      aria-label={`Open ${icon.name} icon preview`}
    >
      {showCrosshair && (
        <>
          <Crosshair className="-top-1.5 -left-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          <Crosshair className="-top-1.5 -right-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          <Crosshair className="-bottom-1.5 -left-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          <Crosshair className="-bottom-1.5 -right-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      <div className="h-24 flex items-center justify-center relative z-10">
        <div className="relative z-10">
          <PixelIcon
            matrix={icon.matrix}
            colors={icon.colors}
            size={8}
            gap={2}
            isHovered={enableHoverAnimation && isHovered}
            renderQuality={enableHoverAnimation && isHovered ? 'full' : 'compact'}
            theme={theme}
          />
        </div>
      </div>
      
      <div className="mt-4 text-[var(--color-text-muted)] text-xs font-mono tracking-widest uppercase group-hover:text-[var(--color-accent)] transition-colors relative z-10">
        {icon.name}
      </div>
    </button>
  );
};

export const IconCard = memo(IconCardComponent);
IconCard.displayName = 'IconCard';
