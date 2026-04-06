export type PixelMatrix = number[][];
export type ThemeMode = 'dark' | 'light';

export interface PreviewOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface IconData {
  id: string;
  name: string;
  category: 'numbers' | 'common' | 'fun';
  matrix: PixelMatrix;
  colors: string[];
}
