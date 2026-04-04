import { getGradientColor } from './colorPalette';

export const generateSVGString = (matrix: number[][], colors: string[], size: number = 16, gap: number = 2) => {
  const rows = matrix.length;
  const cols = Math.max(...matrix.map(r => r.length));
  const width = cols * size + (cols - 1) * gap;
  const height = rows * size + (rows - 1) * gap;

  let rects = '';
  matrix.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      if (val) {
        const color = getGradientColor(colors, rows > 1 ? rIdx / (rows - 1) : 0);
        const x = cIdx * (size + gap);
        const y = rIdx * (size + gap);
        rects += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" rx="2" />\n`;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${rects}</svg>`;
};

export const downloadPNG = (matrix: number[][], colors: string[], filename: string) => {
  const size = 32; // High res for download
  const gap = 4;
  const rows = matrix.length;
  const cols = Math.max(...matrix.map(r => r.length));
  const width = cols * size + (cols - 1) * gap;
  const height = rows * size + (rows - 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  matrix.forEach((row, rIdx) => {
    row.forEach((val, cIdx) => {
      if (val) {
        const color = getGradientColor(colors, rows > 1 ? rIdx / (rows - 1) : 0);
        ctx.fillStyle = color;
        const x = cIdx * (size + gap);
        const y = rIdx * (size + gap);
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, size, size, 4);
        } else {
          ctx.rect(x, y, size, size);
        }
        ctx.fill();
      }
    });
  });

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.toLowerCase().replace(/\s+/g, '-')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
