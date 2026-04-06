import { ThemeMode } from '../types';
import { gsap } from 'gsap';

const THEME_STORAGE_KEY = 'pixet-theme';

interface RunThemeTransitionOptions {
  apply: () => void;
  nextTheme: ThemeMode;
  trigger: HTMLElement | null;
}

interface ThemeTransitionOverlay {
  root: HTMLDivElement;
  ambient: HTMLElement;
  sweep: HTMLElement;
  burst: HTMLElement;
  halo: HTMLElement;
  pixels: HTMLElement[];
}

let activeThemeTransitionCleanup: (() => void) | null = null;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === 'dark' || value === 'light';

export const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const persistTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
};

const createThemeTransitionOverlay = (
  nextTheme: ThemeMode,
  centerX: number,
  centerY: number,
): ThemeTransitionOverlay => {
  const root = document.createElement('div');
  root.className = 'theme-transition-overlay';
  root.dataset.theme = nextTheme;
  root.style.setProperty('--theme-origin-x', `${centerX}px`);
  root.style.setProperty('--theme-origin-y', `${centerY}px`);

  root.innerHTML = `
    <div class="theme-transition-overlay__ambient"></div>
    <div class="theme-transition-overlay__pixel-field"></div>
    <div class="theme-transition-overlay__sweep"></div>
    <div class="theme-transition-overlay__burst-anchor">
      <div class="theme-transition-overlay__burst"></div>
      <div class="theme-transition-overlay__halo"></div>
    </div>
  `;

  const pixelField = root.querySelector('.theme-transition-overlay__pixel-field') as HTMLElement;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const targetColumns = Math.max(20, Math.min(44, Math.round(viewportWidth / 34)));
  const pixelSize = Math.max(16, Math.ceil(viewportWidth / targetColumns));
  const cols = Math.ceil(viewportWidth / pixelSize);
  const rows = Math.ceil(viewportHeight / pixelSize);
  const fragment = document.createDocumentFragment();
  const pixelNodesWithDistance: Array<{ node: HTMLSpanElement; distance: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const node = document.createElement('span');
      node.className = 'theme-transition-overlay__pixel';
      const pattern = (row * 11 + col * 7) % 9;
      if (pattern === 2 || pattern === 5) {
        node.classList.add('theme-transition-overlay__pixel--soft');
      } else if (pattern === 0) {
        node.classList.add('theme-transition-overlay__pixel--accent');
      }
      node.style.left = `${col * pixelSize}px`;
      node.style.top = `${row * pixelSize}px`;
      node.style.width = `${pixelSize}px`;
      node.style.height = `${pixelSize}px`;
      fragment.append(node);

      const pixelCenterX = (col * pixelSize) + (pixelSize / 2);
      const pixelCenterY = (row * pixelSize) + (pixelSize / 2);
      const radialDistance = Math.hypot(pixelCenterX - centerX, pixelCenterY - centerY);
      const checkerOffset = ((row + col) % 4) * 10;
      const diagonalBias = Math.abs((col - row) % 7) * 2;
      pixelNodesWithDistance.push({
        node,
        distance: radialDistance + checkerOffset + diagonalBias,
      });
    }
  }
  pixelField.append(fragment);

  const pixels = pixelNodesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.node);

  document.body.append(root);

  return {
    root,
    ambient: root.querySelector('.theme-transition-overlay__ambient') as HTMLElement,
    sweep: root.querySelector('.theme-transition-overlay__sweep') as HTMLElement,
    burst: root.querySelector('.theme-transition-overlay__burst') as HTMLElement,
    halo: root.querySelector('.theme-transition-overlay__halo') as HTMLElement,
    pixels,
  };
};

export const runThemeTransition = ({
  apply,
  nextTheme,
  trigger,
}: RunThemeTransitionOptions) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!trigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  if (activeThemeTransitionCleanup) {
    activeThemeTransitionCleanup();
  }

  const documentRoot = document.documentElement;
  const bounds = trigger.getBoundingClientRect();
  const centerX = bounds.left + (bounds.width / 2);
  const centerY = bounds.top + (bounds.height / 2);
  const overlay = createThemeTransitionOverlay(nextTheme, centerX, centerY);

  documentRoot.classList.add('theme-transitioning');

  let isCleanedUp = false;
  let hasAppliedTheme = false;
  const runApply = () => {
    if (hasAppliedTheme) return;
    hasAppliedTheme = true;
    apply();
  };

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    documentRoot.classList.remove('theme-transitioning');
    overlay.root.remove();
    if (activeThemeTransitionCleanup === cleanup) {
      activeThemeTransitionCleanup = null;
    }
  };
  activeThemeTransitionCleanup = cleanup;

  const timeline = gsap.timeline({
    defaults: {
      ease: 'power2.out',
      overwrite: 'auto',
    },
    onComplete: () => {
      cleanup();
    },
    onInterrupt: cleanup,
  });

  const pixelStaggerIn = overlay.pixels.length > 0
    ? Math.min(0.001, 0.42 / overlay.pixels.length)
    : 0;
  const pixelStaggerOut = overlay.pixels.length > 0
    ? Math.min(0.0007, 0.3 / overlay.pixels.length)
    : 0;

  gsap.set(overlay.root, { autoAlpha: 0 });
  gsap.set(overlay.ambient, { autoAlpha: 0, force3D: true });
  gsap.set(overlay.sweep, { xPercent: -110, rotate: -5, autoAlpha: 0, force3D: true });
  gsap.set(overlay.burst, { scale: 0.22, autoAlpha: 0, transformOrigin: '50% 50%', force3D: true });
  gsap.set(overlay.halo, { scale: 0.22, autoAlpha: 0, transformOrigin: '50% 50%', force3D: true });
  gsap.set(overlay.pixels, {
    scale: 0.58,
    autoAlpha: 0,
    rotation: (index: number) => (((index * 13) % 7) - 3) * 1.1,
    transformOrigin: '50% 50%',
    force3D: true,
  });

  timeline.to(overlay.root, { autoAlpha: 1, duration: 0.01 }, 0);
  timeline.to(
    overlay.ambient,
    {
      autoAlpha: 0.28,
      duration: 0.12,
      ease: 'power1.out',
    },
    0,
  );
  timeline.to(
    overlay.ambient,
    {
      autoAlpha: 0,
      duration: 0.26,
      ease: 'power2.inOut',
    },
    0.12,
  );
  timeline.to(
    overlay.sweep,
    {
      xPercent: 110,
      rotate: 5,
      autoAlpha: 0.62,
      duration: 0.42,
      ease: 'power2.inOut',
    },
    0.02,
  );
  timeline.to(
    overlay.burst,
    {
      scale: 1.4,
      autoAlpha: 0.86,
      duration: 0.18,
      ease: 'power2.out',
    },
    0,
  );
  timeline.to(
    overlay.burst,
    {
      scale: 2.08,
      autoAlpha: 0,
      duration: 0.18,
      ease: 'power2.inOut',
    },
    0.18,
  );
  timeline.to(
    overlay.halo,
    {
      scale: 1.65,
      autoAlpha: 0.55,
      duration: 0.22,
      ease: 'power1.out',
    },
    0.03,
  );
  timeline.to(
    overlay.halo,
    {
      autoAlpha: 0,
      duration: 0.18,
      ease: 'power1.in',
    },
    0.25,
  );
  timeline.to(overlay.pixels, {
    autoAlpha: 1,
    scale: 1,
    rotation: 0,
    duration: 0.16,
    ease: 'expo.out',
    stagger: pixelStaggerIn,
  }, 0);
  timeline.call(runApply, [], 0.11);
  timeline.to(overlay.pixels, {
    autoAlpha: 0,
    scale: 0.92,
    duration: 0.16,
    ease: 'power2.inOut',
    stagger: pixelStaggerOut,
  }, 0.24);
  timeline.to(
    overlay.root,
    {
      autoAlpha: 0,
      duration: 0.1,
      ease: 'none',
    },
    0.5,
  );

  return true;
};
