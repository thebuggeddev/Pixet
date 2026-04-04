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

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
  const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
  const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));
  return `rgb(${r}, ${g}, ${b})`;
};

export const getGradientColor = (colors: string[], ratio: number) => {
  if (!colors || colors.length === 0) return '#FFFFFF';
  if (colors.length === 1) return colors[0];
  
  const segments = colors.length - 1;
  const segment = Math.min(Math.floor(ratio * segments), segments - 1);
  const factor = (ratio * segments) - segment;
  
  return interpolateColor(colors[segment], colors[segment + 1], factor);
};
