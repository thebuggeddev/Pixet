import React, { Suspense, lazy, startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Moon, Sun } from 'lucide-react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { Crosshair } from './components/Crosshair';
import { ThemeMode } from './types';
import { getRuntimeProfile, runWhenIdle } from './utils/deviceProfile';
import { warmIcons } from './utils/iconsLoader';
import { applyTheme, getInitialTheme, persistTheme, runThemeTransition } from './utils/theme';

const GalleryPage = lazy(async () => {
  const module = await import('./pages/GalleryPage');
  return { default: module.GalleryPage };
});

const EditorPage = lazy(async () => {
  const module = await import('./pages/EditorPage');
  return { default: module.EditorPage };
});

const PageLoadingFallback = (
  <div className="p-6 bg-[var(--color-bg)] transition-colors">
    <div className="border border-[color:var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] transition-colors">
      Loading workspace...
    </div>
  </div>
);

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'transition-colors',
    isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
  ].join(' ');

const prefetchEditorAssets = () => {
  void import('./pages/EditorPage');
  void import('./components/PreviewModal');
  warmIcons();
};

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    return initialTheme;
  });
  const themeToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const runtimeProfile = getRuntimeProfile();
    if (runtimeProfile.constrainedNetwork) {
      return runWhenIdle(() => {
        warmIcons();
      }, 700);
    }

    return runWhenIdle(() => {
      prefetchEditorAssets();
    }, 450);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme: ThemeMode = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
    const applyNextTheme = () => {
      applyTheme(nextTheme);
      persistTheme(nextTheme);
      startTransition(() => {
        setTheme(nextTheme);
      });
    };

    const didRunTransition = runThemeTransition({
      nextTheme,
      trigger: themeToggleRef.current,
      apply: applyNextTheme,
    });

    if (!didRunTransition) {
      applyNextTheme();
    }

    if (themeToggleRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        themeToggleRef.current,
        { scale: 0.92, rotate: nextTheme === 'light' ? -12 : 12 },
        {
          scale: 1,
          rotate: 0,
          duration: 0.24,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-sans flex flex-col transition-colors">
      <header className="border-b border-[color:var(--color-border)] relative z-30 bg-[var(--color-bg)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between border-x border-[color:var(--color-border)] relative transition-colors">
          <Crosshair className="-bottom-1.5 -left-1.5" />
          <Crosshair className="-bottom-1.5 -right-1.5" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-transparent grid grid-cols-2 gap-0.5 p-1 border border-[color:var(--color-border)] transition-colors">
              <div className="bg-[var(--color-accent)]" />
              <div className="bg-[var(--color-logo-muted)] transition-colors" />
              <div className="bg-[var(--color-logo-muted)] transition-colors" />
              <div className="bg-[var(--color-accent)]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Pixet</h1>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono tracking-widest uppercase">
            <NavLink to="/" end className={getNavLinkClassName}>
              All Icons
            </NavLink>
            <NavLink
              to="/editor"
              className={getNavLinkClassName}
              onMouseEnter={prefetchEditorAssets}
              onFocus={prefetchEditorAssets}
              onTouchStart={prefetchEditorAssets}
            >
              Editor
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <button
              ref={themeToggleRef}
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase bg-transparent border border-[color:var(--color-border)] text-[var(--color-text)] px-4 sm:px-5 py-3 hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden md:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full border-x border-b border-[color:var(--color-border)] h-12 bg-hatch relative transition-colors">
        <Crosshair className="-bottom-1.5 -left-1.5" />
        <Crosshair className="-bottom-1.5 -right-1.5" />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto border-x border-[color:var(--color-border)] relative flex flex-col transition-colors">
        <Routes>
          <Route
            path="/"
            element={(
              <Suspense fallback={PageLoadingFallback}>
                <GalleryPage theme={theme} />
              </Suspense>
            )}
          />
          <Route
            path="/editor"
            element={(
              <Suspense fallback={PageLoadingFallback}>
                <EditorPage theme={theme} />
              </Suspense>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <div className="max-w-7xl mx-auto w-full border-x border-t border-[color:var(--color-border)] h-12 bg-hatch relative mt-auto transition-colors">
        <Crosshair className="-top-1.5 -left-1.5" />
        <Crosshair className="-top-1.5 -right-1.5" />
      </div>
    </div>
  );
}
