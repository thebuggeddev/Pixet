import { IconData } from '../types';

let iconsCache: IconData[] | null = null;
let iconsPromise: Promise<IconData[]> | null = null;

export const getCachedIcons = () => iconsCache;

export const loadIcons = (): Promise<IconData[]> => {
  if (iconsCache) {
    return Promise.resolve(iconsCache);
  }

  if (!iconsPromise) {
    iconsPromise = import('../data/icons')
      .then(({ icons }) => {
        iconsCache = icons;
        return icons;
      })
      .finally(() => {
        iconsPromise = null;
      });
  }

  return iconsPromise;
};

export const warmIcons = () => {
  void loadIcons();
};
