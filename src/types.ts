export type PixelMatrix = number[][];

export interface IconData {
  id: string;
  name: string;
  category: 'numbers' | 'common' | 'fun';
  matrix: PixelMatrix;
  colors: string[];
}
