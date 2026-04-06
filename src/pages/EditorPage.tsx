import React, { memo, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Palette, Droplets, Blend, Check, Copy, Download, Shuffle, Loader2 } from 'lucide-react';
import { IconData, ThemeMode } from '../types';
import { Crosshair } from '../components/Crosshair';
import { PixelIcon } from '../components/PixelIcon';
import { getRuntimeProfile } from '../utils/deviceProfile';
import { downloadPNG, generateSVGString } from '../utils/exportUtils';
import { getCachedIcons, loadIcons } from '../utils/iconsLoader';

type EditorColorMode = 'solid' | 'gradient';
type EditorCanvasMode = 'transparent' | 'solid' | 'gradient';

interface EditorPageProps {
  theme: ThemeMode;
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

interface EditorLibraryIconCardProps {
  icon: IconData;
  isActive: boolean;
  onSelect: (iconId: string) => void;
  theme: ThemeMode;
}

const editorIconsPromise = loadIcons();

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const toHex = (value: number) => value.toString(16).padStart(2, '0');

const hslToHex = (h: number, s: number, l: number) => {
  const saturation = s / 100;
  const lightness = l / 100;
  const channel = (n: number) => {
    const k = (n + (h / 30)) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const color = lightness - (a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))));
    return Math.round(255 * color);
  };

  return `#${toHex(channel(0))}${toHex(channel(8))}${toHex(channel(4))}`;
};

const createRandomSolidColor = () =>
  hslToHex(randomBetween(0, 359), randomBetween(66, 95), randomBetween(44, 62));

const createRandomGradientColors = () => {
  const startHue = randomBetween(0, 359);
  const hueOffset = randomBetween(38, 150);
  const endHue = (startHue + hueOffset) % 360;

  return [
    hslToHex(startHue, randomBetween(68, 96), randomBetween(44, 64)),
    hslToHex(endHue, randomBetween(66, 96), randomBetween(44, 64)),
  ] as const;
};

const ColorField: React.FC<ColorFieldProps> = ({ id, label, value, onChange }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
      {label}
    </label>
    <div className="flex items-center gap-3 border border-[color:var(--color-border)] px-3 py-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-12 cursor-pointer border border-[color:var(--color-border)] bg-transparent p-1"
      />
      <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-text)]">
        {value}
      </span>
    </div>
  </div>
);

const EditorLibraryIconCard: React.FC<EditorLibraryIconCardProps> = memo(({
  icon,
  isActive,
  onSelect,
  theme,
}) => (
  <button
    onClick={() => onSelect(icon.id)}
    className={`editor-library-card group border p-3 text-left transition-colors relative ${
      isActive
        ? 'border-[var(--color-accent)] bg-[var(--color-hover-surface)]'
        : 'border-[color:var(--color-border)] bg-[var(--color-bg)] hover:border-[color:var(--color-border-strong)]'
    }`}
  >
    <div className="h-16 flex items-center justify-center mb-4">
      <PixelIcon matrix={icon.matrix} colors={icon.colors} size={6} gap={2} theme={theme} renderQuality="compact" />
    </div>
    <div className={`text-[10px] font-mono tracking-widest uppercase truncate ${
      isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'
    }`}
    >
      {icon.name}
    </div>
  </button>
));

EditorLibraryIconCard.displayName = 'EditorLibraryIconCard';

export const EditorPage: React.FC<EditorPageProps> = ({ theme }) => {
  const runtimeProfile = useMemo(() => getRuntimeProfile(), []);
  const [allIcons, setAllIcons] = useState<IconData[]>(() => getCachedIcons() ?? []);
  const [isLoadingIcons, setIsLoadingIcons] = useState(() => allIcons.length === 0);
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconId, setSelectedIconId] = useState('');
  const [colorMode, setColorMode] = useState<EditorColorMode>('solid');
  const [canvasMode, setCanvasMode] = useState<EditorCanvasMode>('transparent');
  const [solidColor, setSolidColor] = useState('#e58a63');
  const [gradientStart, setGradientStart] = useState('#e58a63');
  const [gradientEnd, setGradientEnd] = useState('#4cc9f0');
  const [canvasSolidColor, setCanvasSolidColor] = useState('#111111');
  const [canvasGradientStart, setCanvasGradientStart] = useState('#111111');
  const [canvasGradientEnd, setCanvasGradientEnd] = useState('#2d2d2d');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [visibleLibraryCount, setVisibleLibraryCount] = useState(() => runtimeProfile.editorInitialBatch);
  const deferredSearch = useDeferredValue(iconSearch);
  const editorWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const librarySentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (allIcons.length > 0) {
      setIsLoadingIcons(false);
      return undefined;
    }

    let isCancelled = false;
    setIsLoadingIcons(true);

    editorIconsPromise
      .then((loadedIcons) => {
        if (isCancelled) return;
        setAllIcons(loadedIcons);
        setIsLoadingIcons(false);
      })
      .catch(() => {
        if (isCancelled) return;
        setAllIcons([]);
        setIsLoadingIcons(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [allIcons.length]);

  useEffect(() => {
    if (!selectedIconId && allIcons.length > 0) {
      setSelectedIconId(allIcons[0].id);
    }
  }, [allIcons, selectedIconId]);

  const selectedIcon = useMemo(
    () => allIcons.find((icon) => icon.id === selectedIconId) ?? allIcons[0],
    [allIcons, selectedIconId],
  );

  const filteredIcons = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    if (!normalizedSearch) return allIcons;

    return allIcons.filter((icon) =>
      icon.name.toLowerCase().includes(normalizedSearch)
      || icon.category.toLowerCase().includes(normalizedSearch),
    );
  }, [allIcons, deferredSearch]);
  const visibleLibraryIcons = useMemo(
    () => filteredIcons.slice(0, visibleLibraryCount),
    [filteredIcons, visibleLibraryCount],
  );
  const hasMoreLibraryIcons = visibleLibraryIcons.length < filteredIcons.length;

  const editorColors = useMemo(
    () => (colorMode === 'solid'
      ? [solidColor, solidColor, solidColor]
      : [gradientStart, gradientEnd]),
    [colorMode, gradientEnd, gradientStart, solidColor],
  );

  const gradientPreview = useMemo(
    () => `linear-gradient(130deg, ${editorColors[0]}, ${editorColors[editorColors.length - 1]})`,
    [editorColors],
  );
  const previewCanvasStyle = useMemo<React.CSSProperties>(() => {
    if (canvasMode === 'solid') {
      return { backgroundColor: canvasSolidColor };
    }

    if (canvasMode === 'gradient') {
      return {
        backgroundImage: `linear-gradient(135deg, ${canvasGradientStart}, ${canvasGradientEnd})`,
      };
    }

    return {};
  }, [canvasGradientEnd, canvasGradientStart, canvasMode, canvasSolidColor]);

  const handleCopySvg = async () => {
    if (!selectedIcon) return;

    const svgString = generateSVGString(selectedIcon.matrix, editorColors, { theme });
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadPng = () => {
    if (!selectedIcon) return;

    downloadPNG(selectedIcon.matrix, editorColors, `${selectedIcon.name}-custom`, { theme });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const randomizeSolidFill = useCallback(() => {
    setSolidColor(createRandomSolidColor());
  }, []);

  const randomizeGradientFill = useCallback(() => {
    const [nextStart, nextEnd] = createRandomGradientColors();
    setGradientStart(nextStart);
    setGradientEnd(nextEnd);
  }, []);

  const randomizeCurrentFill = useCallback(() => {
    if (colorMode === 'solid') {
      randomizeSolidFill();
      return;
    }

    randomizeGradientFill();
  }, [colorMode, randomizeGradientFill, randomizeSolidFill]);

  const loadMoreLibraryIcons = useCallback(() => {
    setVisibleLibraryCount((current) => {
      if (current >= filteredIcons.length) {
        return current;
      }

      const remaining = filteredIcons.length - current;
      const boostedIncrement = remaining > (runtimeProfile.editorBatchIncrement * 2)
        ? Math.round(runtimeProfile.editorBatchIncrement * 1.35)
        : runtimeProfile.editorBatchIncrement;
      return Math.min(current + boostedIncrement, filteredIcons.length);
    });
  }, [filteredIcons.length, runtimeProfile.editorBatchIncrement]);

  useEffect(() => {
    setVisibleLibraryCount(runtimeProfile.editorInitialBatch);
  }, [filteredIcons, runtimeProfile.editorInitialBatch]);

  useEffect(() => {
    if (!hasMoreLibraryIcons) return undefined;

    const sentinel = librarySentinelRef.current;
    if (!sentinel || !('IntersectionObserver' in window)) return undefined;

    let frameId: number | null = null;
    let queued = false;

    const queueLoad = () => {
      if (queued) return;
      queued = true;
      frameId = window.requestAnimationFrame(() => {
        queued = false;
        loadMoreLibraryIcons();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible) return;
      queueLoad();
    }, {
      root: null,
      rootMargin: runtimeProfile.lowEndDevice ? '280px 0px' : '500px 0px',
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [hasMoreLibraryIcons, loadMoreLibraryIcons, runtimeProfile.lowEndDevice]);

  const handleSelectLibraryIcon = useCallback((iconId: string) => {
    setSelectedIconId(iconId);
    const target = editorWorkspaceRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const isEditorAlreadyNearViewportTop = rect.top >= 16 && rect.top <= (window.innerHeight * 0.35);
    if (isEditorAlreadyNearViewportTop) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const visibleLibraryCards = useMemo(() => (
    visibleLibraryIcons.map((icon) => (
      <EditorLibraryIconCard
        key={icon.id}
        icon={icon}
        isActive={selectedIconId === icon.id}
        onSelect={handleSelectLibraryIcon}
        theme={theme}
      />
    ))
  ), [handleSelectLibraryIcon, selectedIconId, theme, visibleLibraryIcons]);

  if (!selectedIcon) {
    if (isLoadingIcons) {
      return (
        <div className="p-6 text-sm font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
          Loading icon editor library...
        </div>
      );
    }

    return (
      <div className="p-6 text-sm font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
        No icons available for editing.
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[color:var(--color-border)] p-6 flex flex-col gap-5 relative bg-[var(--color-surface)] transition-colors">
        <Crosshair className="-bottom-1.5 -left-1.5" />
        <Crosshair className="-bottom-1.5 -right-1.5" />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-2">
              Pixel Editor
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Recolor Any Icon With Solid Or Gradient Styles
            </h2>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors" size={16} />
            <input
              type="text"
              placeholder="FIND ICON IN LIBRARY..."
              value={iconSearch}
              onChange={(event) => setIconSearch(event.target.value)}
              className="w-full bg-transparent border border-[color:var(--color-border)] py-3 pl-11 pr-4 text-xs font-mono tracking-widest text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-search-placeholder)] uppercase"
            />
          </div>
        </div>
      </div>

      <div ref={editorWorkspaceRef} className="p-6 flex-1 bg-[var(--color-bg)] transition-colors space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-6">
          <section className="relative border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors">
            <Crosshair className="-top-1.5 -left-1.5" />
            <Crosshair className="-top-1.5 -right-1.5" />
            <Crosshair className="-bottom-1.5 -left-1.5" />
            <Crosshair className="-bottom-1.5 -right-1.5" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                Live Preview
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 border border-[color:var(--color-border)] text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                  {selectedIcon.name}
                </div>
                <div className="px-3 py-1 border border-[color:var(--color-border)] text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                  Canvas: {canvasMode}
                </div>
              </div>
            </div>

            <div
              className={`border border-[color:var(--color-border)] min-h-[290px] flex items-center justify-center p-8 relative ${
                canvasMode === 'transparent' ? 'editor-transparent-canvas' : ''
              }`}
              style={previewCanvasStyle}
            >
              <div className="relative z-10">
                <PixelIcon
                  matrix={selectedIcon.matrix}
                  colors={editorColors}
                  size={16}
                  gap={4}
                  theme={theme}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCopySvg}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent border border-[color:var(--color-border)] text-[var(--color-text)] font-mono text-xs tracking-widest uppercase hover:bg-[var(--color-hover-surface)] transition-colors"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? 'COPIED!' : 'Copy SVG'}
              </button>
              <button
                onClick={handleDownloadPng}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-[var(--color-accent-contrast)] font-mono text-xs tracking-widest uppercase hover:bg-[var(--color-accent-strong)] transition-colors"
              >
                {downloaded ? <Check size={16} /> : <Download size={16} />}
                {downloaded ? 'SAVED!' : 'Download PNG'}
              </button>
            </div>
          </section>

          <section className="relative border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors">
            <Crosshair className="-top-1.5 -left-1.5" />
            <Crosshair className="-top-1.5 -right-1.5" />
            <Crosshair className="-bottom-1.5 -left-1.5" />
            <Crosshair className="-bottom-1.5 -right-1.5" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                Color Mode
              </div>
              <button
                onClick={randomizeCurrentFill}
                className="inline-flex items-center gap-2 py-2 px-3 border border-[color:var(--color-border)] text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[color:var(--color-border-strong)] transition-colors"
              >
                <Shuffle size={12} />
                Randomize
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => startTransition(() => setColorMode('solid'))}
                className={`flex items-center justify-center gap-2 py-3 border font-mono text-xs tracking-widest uppercase transition-colors ${
                  colorMode === 'solid'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                <Droplets size={14} />
                Solid
              </button>
              <button
                onClick={() => startTransition(() => setColorMode('gradient'))}
                className={`flex items-center justify-center gap-2 py-3 border font-mono text-xs tracking-widest uppercase transition-colors ${
                  colorMode === 'gradient'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                <Blend size={14} />
                Gradient
              </button>
            </div>

            {colorMode === 'solid' ? (
              <div className="space-y-4">
                <ColorField
                  id="editor-solid-color"
                  label="Solid Color"
                  value={solidColor}
                  onChange={setSolidColor}
                />
                <button
                  onClick={randomizeSolidFill}
                  className="w-full py-2.5 border border-[color:var(--color-border)] text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[color:var(--color-border-strong)] transition-colors"
                >
                  Randomize Solid
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <ColorField
                  id="editor-gradient-start"
                  label="Gradient Start"
                  value={gradientStart}
                  onChange={setGradientStart}
                />
                <ColorField
                  id="editor-gradient-end"
                  label="Gradient End"
                  value={gradientEnd}
                  onChange={setGradientEnd}
                />
                <button
                  onClick={randomizeGradientFill}
                  className="w-full py-2.5 border border-[color:var(--color-border)] text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[color:var(--color-border-strong)] transition-colors"
                >
                  Randomize Gradient
                </button>
              </div>
            )}

            <div className="mt-6 border border-[color:var(--color-border)] p-4">
              <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                <Palette size={14} />
                Active Fill
              </div>
              <div
                className="h-10 border border-[color:var(--color-border)]"
                style={{ backgroundImage: gradientPreview }}
              />
            </div>

            <div className="mt-6 text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)] mb-4">
              Canvas Background
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => startTransition(() => setCanvasMode('transparent'))}
                className={`py-2.5 border font-mono text-[10px] tracking-widest uppercase transition-colors ${
                  canvasMode === 'transparent'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                Transparent
              </button>
              <button
                onClick={() => startTransition(() => setCanvasMode('solid'))}
                className={`py-2.5 border font-mono text-[10px] tracking-widest uppercase transition-colors ${
                  canvasMode === 'solid'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => startTransition(() => setCanvasMode('gradient'))}
                className={`py-2.5 border font-mono text-[10px] tracking-widest uppercase transition-colors ${
                  canvasMode === 'gradient'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:text-[var(--color-text)]'
                }`}
              >
                Gradient
              </button>
            </div>

            {canvasMode === 'solid' && (
              <ColorField
                id="editor-canvas-solid"
                label="Canvas Solid Color"
                value={canvasSolidColor}
                onChange={setCanvasSolidColor}
              />
            )}

            {canvasMode === 'gradient' && (
              <div className="space-y-4">
                <ColorField
                  id="editor-canvas-gradient-start"
                  label="Canvas Gradient Start"
                  value={canvasGradientStart}
                  onChange={setCanvasGradientStart}
                />
                <ColorField
                  id="editor-canvas-gradient-end"
                  label="Canvas Gradient End"
                  value={canvasGradientEnd}
                  onChange={setCanvasGradientEnd}
                />
              </div>
            )}
          </section>
        </div>

        <section className="relative border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors">
          <Crosshair className="-top-1.5 -left-1.5" />
          <Crosshair className="-top-1.5 -right-1.5" />
          <Crosshair className="-bottom-1.5 -left-1.5" />
          <Crosshair className="-bottom-1.5 -right-1.5" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <h3 className="text-sm font-mono tracking-widest uppercase text-[var(--color-text)]">
              Icon Library
            </h3>
            <div className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
              Showing {visibleLibraryIcons.length} of {filteredIcons.length}
            </div>
          </div>

          {isLoadingIcons ? (
            <div className="py-12 text-center border border-[color:var(--color-border)] bg-[var(--color-bg)]">
              <p className="text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                Loading icon library...
              </p>
            </div>
          ) : filteredIcons.length === 0 ? (
            <div className="py-12 text-center border border-[color:var(--color-border)] bg-[var(--color-bg)]">
              <p className="text-xs font-mono tracking-widest uppercase text-[var(--color-text-muted)]">
                No icons match this search.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-7 gap-4">
                {visibleLibraryCards}
              </div>

              {hasMoreLibraryIcons && (
                <div ref={librarySentinelRef} className="mt-6 py-2 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-[var(--color-text-muted)] animate-spin" />
                  <span className="sr-only">Loading more editor icons</span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
};
