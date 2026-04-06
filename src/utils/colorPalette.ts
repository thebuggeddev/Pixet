import { ThemeMode } from '../types';

export const palettes = {
  sunset: ['#FF007A', '#FF6000', '#FFD600'],
  ocean: ['#00F0FF', '#0080FF', '#0000FF'],
  neon: ['#FF00FF', '#8000FF', '#00FFFF'],
  cyber: ['#00FFCC', '#0088FF', '#FF00FF'],
  fire: ['#FF0000', '#FF8800', '#FFFF00'],
  nature: ['#00FF88', '#00AA00', '#005500'],
  mono: ['#FFFFFF', '#AAAAAA', '#555555'],
  candy: ['#FF00AA', '#FF88FF', '#FFFFFF'],
  gold: ['#FFD700', '#FFA500', '#FF8C00'],
  synth: ['#F72585', '#7209B7', '#3A0CA3', '#4361EE', '#4CC9F0'],
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const LIGHT_INK = { r: 24, g: 19, b: 14 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (color: string): RgbColor => {
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color.trim());
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color.trim());
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return { r: 255, g: 255, b: 255 };
};

const rgbToCss = ({ r, g, b }: RgbColor) => `rgb(${r}, ${g}, ${b})`;

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
  const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
  const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));
  return `rgb(${r}, ${g}, ${b})`;
};

const mixWithColor = (color: string, target: RgbColor, factor: number) => {
  const rgb = parseColor(color);
  const amount = clamp(factor, 0, 1);

  return rgbToCss({
    r: Math.round(rgb.r + (target.r - rgb.r) * amount),
    g: Math.round(rgb.g + (target.g - rgb.g) * amount),
    b: Math.round(rgb.b + (target.b - rgb.b) * amount),
  });
};

const getRelativeLuminance = (color: string) => {
  const { r, g, b } = parseColor(color);
  const [rr, gg, bb] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * rr) + (0.7152 * gg) + (0.0722 * bb);
};

export const getGradientColor = (colors: string[], ratio: number) => {
  if (!colors || colors.length === 0) return '#FFFFFF';
  if (colors.length === 1) return colors[0];
  
  const segments = colors.length - 1;
  const segment = Math.min(Math.floor(ratio * segments), segments - 1);
  const factor = (ratio * segments) - segment;
  
  return interpolateColor(colors[segment], colors[segment + 1], factor);
};

export const getThemeAdjustedColor = (color: string, theme: ThemeMode) => {
  if (theme === 'dark') return color;

  const luminance = getRelativeLuminance(color);
  const darkenFactor = clamp((luminance - 0.42) / 0.45, 0, 0.72);
  const adjustedColor = darkenFactor > 0
    ? mixWithColor(color, LIGHT_INK, darkenFactor)
    : color;

  return adjustedColor;
};

export const getThemeAdjustedPalette = (colors: string[], theme: ThemeMode) =>
  colors.map((color) => getThemeAdjustedColor(color, theme));

export const withAlpha = (color: string, alpha: number) => {
  const { r, g, b } = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
};
