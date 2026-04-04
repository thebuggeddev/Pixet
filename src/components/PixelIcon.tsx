import React, { useMemo } from 'react';
import { getGradientColor } from '../utils/colorPalette';

interface PixelIconProps {
  matrix: number[][];
  colors: string[];
  size?: number;
  gap?: number;
  className?: string;
  isHovered?: boolean;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ 
  matrix, 
  colors, 
  size = 6, 
  gap = 1,
  className = '',
  isHovered = false
}) => {
  const rows = matrix.length;
  const cols = Math.max(...matrix.map(r => r.length));

  const pixelData = useMemo(() => {
    return matrix.map((row, rIdx) => row.map((val) => {
      if (val === 0) return null;
      
      const baseColor = getGradientColor(colors, rows > 1 ? rIdx / (rows - 1) : 0);
      const c1 = baseColor;
      const c2 = colors[Math.floor(Math.random() * colors.length)];
      const c3 = colors[Math.floor(Math.random() * colors.length)];
      
      return { 
        baseColor,
        c1, c2, c3,
        duration: 0.5 + Math.random() * 1.5 // Random duration between 0.5s and 2s
      };
    }));
  }, [matrix, colors, rows]);

  return (
    <div 
      className={className}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridTemplateRows: `repeat(${rows}, ${size}px)`,
        gap: `${gap}px`
      }}
    >
      {matrix.map((row, rIdx) => 
        row.map((val, cIdx) => {
          if (val === 0) {
            return <div key={`${rIdx}-${cIdx}`} style={{ width: size, height: size }} />;
          }
          
          const data = pixelData[rIdx][cIdx]!;
          
          return (
            <div 
              key={`${rIdx}-${cIdx}`}
              className={isHovered ? 'pixel-animate' : 'pixel-transition'}
              style={{
                width: size,
                height: size,
                backgroundColor: data.baseColor,
                borderRadius: '1px',
                boxShadow: `0 0 ${size * 0.8}px ${data.baseColor}80`,
                '--c1': data.c1,
                '--c2': data.c2,
                '--c3': data.c3,
                '--c1-shadow': `${data.c1}80`,
                '--c2-shadow': `${data.c2}80`,
                '--c3-shadow': `${data.c3}80`,
                '--blur': `${size * 0.8}px`,
                animationDuration: `${data.duration}s`,
              } as React.CSSProperties}
            />
          );
        })
      )}
    </div>
  );
};
