import React, { memo, useMemo } from 'react';
import { ThemeMode } from '../types';
import { getGradientColor, getThemeAdjustedPalette, withAlpha } from '../utils/colorPalette';

interface PixelIconProps {
  matrix: number[][];
  colors: string[];
  size?: number;
  gap?: number;
  className?: string;
  isHovered?: boolean;
  theme?: ThemeMode;
  renderQuality?: 'full' | 'compact';
}

const buildPixelShadow = (color: string, size: number, theme: ThemeMode) => {
  if (theme === 'light') {
    return [
      `0 0 0 1px rgba(24, 19, 14, 0.12)`,
      `0 0 ${Math.max(size * 0.55, 2)}px ${withAlpha(color, 0.16)}`,
    ].join(', ');
  }

  return `0 0 ${size * 0.8}px ${withAlpha(color, 0.5)}`;
};

const getPaletteIndex = (rowIndex: number, columnIndex: number, offset: number, length: number) =>
  (rowIndex * 7 + columnIndex * 11 + offset) % length;

const getAnimationDuration = (rowIndex: number, columnIndex: number) =>
  0.65 + (((rowIndex * 5) + (columnIndex * 3)) % 8) * 0.18;

type FullPixelData = {
  baseColor: string;
  c1: string;
  c2: string;
  c3: string;
  shadow1: string;
  shadow2: string;
  shadow3: string;
  duration: number;
};

type CompactPixelData = {
  baseColor: string;
  shadow1: string;
};

const PixelIconComponent: React.FC<PixelIconProps> = ({ 
  matrix, 
  colors, 
  size = 6, 
  gap = 1,
  className = '',
  isHovered = false,
  theme = 'dark' as ThemeMode,
  renderQuality = 'full',
}) => {
  const rows = matrix.length;
  const cols = Math.max(...matrix.map(r => r.length));
  const isCompact = renderQuality === 'compact';
  const renderColors = useMemo(() => getThemeAdjustedPalette(colors, theme), [colors, theme]);

  const pixelData = useMemo(() => {
    if (isCompact) {
      return matrix.map((row, rIdx) => row.map((val) => {
        if (val === 0) return null;

        const baseColor = getGradientColor(renderColors, rows > 1 ? rIdx / (rows - 1) : 0);
        return {
          baseColor,
          shadow1: theme === 'light' ? '0 0 0 1px rgba(24, 19, 14, 0.08)' : 'none',
        } as CompactPixelData;
      }));
    }

    return matrix.map((row, rIdx) => row.map((val, cIdx) => {
      if (val === 0) return null;

      const baseColor = getGradientColor(renderColors, rows > 1 ? rIdx / (rows - 1) : 0);
      const c1 = baseColor;
      const c2 = renderColors[getPaletteIndex(rIdx, cIdx, 1, renderColors.length)];
      const c3 = renderColors[getPaletteIndex(rIdx, cIdx, 2, renderColors.length)];

      return {
        baseColor,
        c1, c2, c3,
        shadow1: buildPixelShadow(c1, size, theme),
        shadow2: buildPixelShadow(c2, size, theme),
        shadow3: buildPixelShadow(c3, size, theme),
        duration: getAnimationDuration(rIdx, cIdx),
      } as FullPixelData;
    }));
  }, [isCompact, matrix, renderColors, rows, size, theme]);

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
          
          const data = pixelData[rIdx][cIdx];
          if (!data) {
            return <div key={`${rIdx}-${cIdx}`} style={{ width: size, height: size }} />;
          }

          if (isCompact) {
            const compactData = data as CompactPixelData;

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: compactData.baseColor,
                  borderRadius: theme === 'light' ? '2px' : '1px',
                  boxShadow: compactData.shadow1 === 'none' ? undefined : compactData.shadow1,
                }}
              />
            );
          }

          const fullData = data as FullPixelData;

          return (
            <div 
              key={`${rIdx}-${cIdx}`}
              className={isHovered ? 'pixel-animate' : 'pixel-transition'}
              style={{
                width: size,
                height: size,
                backgroundColor: fullData.baseColor,
                borderRadius: theme === 'light' ? '2px' : '1px',
                boxShadow: fullData.shadow1,
                '--c1': fullData.c1,
                '--c2': fullData.c2,
                '--c3': fullData.c3,
                '--shadow-1': fullData.shadow1,
                '--shadow-2': fullData.shadow2,
                '--shadow-3': fullData.shadow3,
                animationDuration: `${fullData.duration}s`,
              } as React.CSSProperties}
            />
          );
        })
      )}
    </div>
  );
};

export const PixelIcon = memo(PixelIconComponent);
PixelIcon.displayName = 'PixelIcon';
