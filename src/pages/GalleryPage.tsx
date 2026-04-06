import React, {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';
import { Search, Grid, Shapes, Hash, Sparkles, Loader2 } from 'lucide-react';
import { IconCard } from '../components/IconCard';
import { Crosshair } from '../components/Crosshair';
import { IconData, PreviewOrigin, ThemeMode } from '../types';
import { getRuntimeProfile } from '../utils/deviceProfile';
import { getCachedIcons, loadIcons } from '../utils/iconsLoader';

type IconCategoryFilter = 'all' | IconData['category'];

const categories = [
  { id: 'all', label: 'All Icons', icon: Grid },
  { id: 'numbers', label: 'Numbers', icon: Hash },
  { id: 'common', label: 'Common', icon: Shapes },
  { id: 'fun', label: 'Fun', icon: Sparkles },
] as const;

interface GalleryPageProps {
  theme: ThemeMode;
}

const PreviewModal = lazy(async () => {
  const module = await import('../components/PreviewModal');
  return { default: module.PreviewModal };
});

export const GalleryPage: React.FC<GalleryPageProps> = ({ theme }) => {
  const runtimeProfile = useMemo(() => getRuntimeProfile(), []);
  const [allIcons, setAllIcons] = useState<IconData[]>(() => getCachedIcons() ?? []);
  const [isLoadingIcons, setIsLoadingIcons] = useState(() => allIcons.length === 0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<IconCategoryFilter>('all');
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<PreviewOrigin | null>(null);
  const [visibleCount, setVisibleCount] = useState(() => runtimeProfile.galleryInitialBatch);
  const deferredSearch = useDeferredValue(search);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const previousRenderedCountRef = useRef(0);

  useEffect(() => {
    if (allIcons.length > 0) {
      setIsLoadingIcons(false);
      return undefined;
    }

    let isCancelled = false;
    setIsLoadingIcons(true);

    loadIcons()
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

  const filteredIcons = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return allIcons.filter((icon) => {
      const matchesSearch = normalizedSearch.length === 0
        || icon.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory = category === 'all' || icon.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [allIcons, category, deferredSearch]);

  const visibleIcons = useMemo(
    () => filteredIcons.slice(0, visibleCount),
    [filteredIcons, visibleCount],
  );
  const hasMoreIcons = visibleIcons.length < filteredIcons.length;
  const isDenseMode = runtimeProfile.lowEndDevice || visibleIcons.length > 84;

  const loadMoreIcons = useCallback(() => {
    setVisibleCount((currentCount) => {
      if (currentCount >= filteredIcons.length) return currentCount;
      const baseIncrement = isDenseMode
        ? Math.max(16, Math.floor(runtimeProfile.galleryBatchIncrement * 0.72))
        : runtimeProfile.galleryBatchIncrement;
      const remaining = filteredIcons.length - currentCount;
      const boostedIncrement = remaining > (baseIncrement * 2)
        ? Math.round(baseIncrement * 1.35)
        : baseIncrement;
      return Math.min(currentCount + boostedIncrement, filteredIcons.length);
    });
  }, [filteredIcons.length, isDenseMode, runtimeProfile.galleryBatchIncrement]);

  useEffect(() => {
    setVisibleCount(runtimeProfile.galleryInitialBatch);
    previousRenderedCountRef.current = 0;
  }, [filteredIcons, runtimeProfile.galleryInitialBatch]);

  useEffect(() => {
    if (!hasMoreIcons) return undefined;

    const sentinel = sentinelRef.current;
    if (!sentinel || !('IntersectionObserver' in window)) return undefined;

    let frameId: number | null = null;
    let queued = false;

    const queueLoad = () => {
      if (queued) return;
      queued = true;
      frameId = window.requestAnimationFrame(() => {
        queued = false;
        loadMoreIcons();
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible) return;
      queueLoad();
    }, {
      root: null,
      rootMargin: runtimeProfile.lowEndDevice ? '300px 0px' : '520px 0px',
      threshold: 0,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [hasMoreIcons, loadMoreIcons, runtimeProfile.lowEndDevice]);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    if (visibleIcons.length === 0) {
      previousRenderedCountRef.current = 0;
      return undefined;
    }

    const previousCount = previousRenderedCountRef.current;
    previousRenderedCountRef.current = visibleIcons.length;

    const shouldAnimateInitialOnly = previousCount === 0;
    if (
      !shouldAnimateInitialOnly
      || runtimeProfile.reduceEffects
      || runtimeProfile.maxBatchAnimationCards === 0
      || isDenseMode
    ) {
      return undefined;
    }

    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-icon-card]'));
    const animatingCards = cards.slice(0, runtimeProfile.maxBatchAnimationCards);
    if (animatingCards.length === 0) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        animatingCards,
        { autoAlpha: 0, y: 14, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: runtimeProfile.mediumDevice ? 0.22 : 0.28,
          ease: 'power2.out',
          stagger: runtimeProfile.mediumDevice ? 0.008 : 0.012,
          overwrite: 'auto',
          clearProps: 'opacity,transform,visibility',
        },
      );
    }, grid);

    return () => {
      ctx.revert();
    };
  }, [isDenseMode, runtimeProfile.maxBatchAnimationCards, runtimeProfile.mediumDevice, runtimeProfile.reduceEffects, visibleIcons.length]);

  const handleCategoryChange = useCallback((nextCategory: IconCategoryFilter) => {
    startTransition(() => {
      setCategory(nextCategory);
    });
  }, []);

  const handleSelectIcon = useCallback((icon: IconData, origin: PreviewOrigin) => {
    setSelectedOrigin(origin);
    setSelectedIcon(icon);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedIcon(null);
    setSelectedOrigin(null);
  }, []);

  return (
    <>
      <div className="border-b border-[color:var(--color-border)] p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative bg-[var(--color-surface)] transition-colors">
        <Crosshair className="-bottom-1.5 -left-1.5" />
        <Crosshair className="-bottom-1.5 -right-1.5" />

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[var(--color-accent-contrast)]' : 'text-[var(--color-text-soft)]'} />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)] transition-colors" size={16} />
          <input
            type="text"
            placeholder="SEARCH ICONS..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent border border-[color:var(--color-border)] py-3 pl-11 pr-4 text-xs font-mono tracking-widest text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-search-placeholder)] uppercase"
          />
        </div>
      </div>

      <div className="p-6 flex-1 bg-[var(--color-bg)] transition-colors">
        <div
          ref={gridRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          {visibleIcons.map((icon) => (
            <IconCard
              key={icon.id}
              icon={icon}
              onSelect={handleSelectIcon}
              theme={theme}
              compactMode={runtimeProfile.compactIconRendering || isDenseMode}
              reducedEffects={runtimeProfile.reduceEffects || isDenseMode}
              showCrosshair={!isDenseMode}
            />
          ))}
        </div>

        {isLoadingIcons && allIcons.length === 0 && (
          <div className="py-24 text-center border border-[color:var(--color-border)] bg-[var(--color-surface)] mt-6 transition-colors">
            <h3 className="text-base font-mono tracking-widest text-[var(--color-text)] mb-2 uppercase">Loading icon library</h3>
            <p className="text-[var(--color-text-muted)] font-mono text-xs tracking-widest uppercase">Fetching icons for your device profile...</p>
          </div>
        )}

        {!isLoadingIcons && filteredIcons.length === 0 && (
          <div className="py-24 text-center border border-[color:var(--color-border)] bg-[var(--color-surface)] mt-6 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-[color:var(--color-border)] bg-transparent mb-4 transition-colors">
              <Search className="text-[var(--color-text-soft)]" size={24} />
            </div>
            <h3 className="text-lg font-mono tracking-widest text-[var(--color-text)] mb-2 uppercase">No icons found</h3>
            <p className="text-[var(--color-text-muted)] font-mono text-xs tracking-widest uppercase">Try adjusting your search or category filter.</p>
          </div>
        )}

        {filteredIcons.length > 0 && hasMoreIcons && (
          <div ref={sentinelRef} className="mt-6 flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 text-[var(--color-text-muted)] animate-spin" />
            <span className="sr-only">Loading more icons</span>
          </div>
        )}
      </div>

      {selectedIcon && (
        <Suspense fallback={null}>
          <PreviewModal
            icon={selectedIcon}
            onClose={handleClosePreview}
            origin={selectedOrigin}
            theme={theme}
          />
        </Suspense>
      )}
    </>
  );
};
