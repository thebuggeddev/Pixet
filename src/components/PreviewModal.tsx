import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Download, Copy, Check, Moon, Sun } from 'lucide-react';
import { PixelIcon } from './PixelIcon';
import { IconData, PreviewOrigin, ThemeMode } from '../types';
import { generateSVGString, downloadPNG } from '../utils/exportUtils';
import { Crosshair } from './Crosshair';

interface PreviewModalProps {
  icon: IconData;
  onClose: () => void;
  origin: PreviewOrigin | null;
  theme: ThemeMode;
}

const getPanelTransform = (panel: HTMLDivElement, origin: PreviewOrigin | null) => {
  if (!origin) {
    return {
      x: 0,
      y: 24,
      scaleX: 0.94,
      scaleY: 0.94,
      opacity: 0,
    };
  }

  const panelBounds = panel.getBoundingClientRect();
  const originCenterX = origin.left + (origin.width / 2);
  const originCenterY = origin.top + (origin.height / 2);
  const panelCenterX = panelBounds.left + (panelBounds.width / 2);
  const panelCenterY = panelBounds.top + (panelBounds.height / 2);

  return {
    x: originCenterX - panelCenterX,
    y: originCenterY - panelCenterY,
    scaleX: Math.max(origin.width / panelBounds.width, 0.22),
    scaleY: Math.max(origin.height / panelBounds.height, 0.22),
    opacity: 0.16,
  };
};

export const PreviewModal: React.FC<PreviewModalProps> = ({ icon, onClose, origin, theme }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>(theme);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const skipPreviewThemeAnimationRef = useRef(true);

  useEffect(() => {
    setPreviewTheme(theme);
    setCopied(false);
    setDownloaded(false);
    skipPreviewThemeAnimationRef.current = true;
  }, [icon.id, theme]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return undefined;

    closingRef.current = false;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set([overlay, panel], { clearProps: 'all' });
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    const modalContent = panel.querySelectorAll<HTMLElement>('[data-modal-content]');
    const ctx = gsap.context(() => {
      const fromTransform = getPanelTransform(panel, origin);
      const timeline = gsap.timeline();

      gsap.set(panel, { transformOrigin: 'center center' });
      gsap.set(modalContent, { opacity: 0, y: 12 });

      timeline.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: 'power1.out' },
        0,
      );
      timeline.fromTo(
        panel,
        fromTransform,
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
          clearProps: 'opacity',
        },
        0,
      );
      timeline.to(
        modalContent,
        {
          opacity: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        },
        0.12,
      );
    }, panel);

    return () => {
      ctx.revert();
      document.body.style.overflow = previousOverflow;
    };
  }, [icon.id, origin]);

  useEffect(() => {
    const iconNode = iconRef.current;
    if (!iconNode) return;

    if (skipPreviewThemeAnimationRef.current) {
      skipPreviewThemeAnimationRef.current = false;
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.fromTo(
      iconNode,
      { autoAlpha: 0.6, scale: 0.965, y: 6 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.22,
        ease: 'power2.out',
        clearProps: 'opacity,transform,visibility',
      },
    );
  }, [previewTheme]);

  const handleRequestClose = useCallback(() => {
    if (closingRef.current) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }

    closingRef.current = true;

    const modalContent = panel.querySelectorAll<HTMLElement>('[data-modal-content]');
    const toTransform = getPanelTransform(panel, origin);

    const timeline = gsap.timeline({
      onComplete: onClose,
    });

    timeline.to(
      modalContent,
      {
        opacity: 0,
        y: 8,
        duration: 0.14,
        stagger: 0.02,
        ease: 'power1.in',
      },
      0,
    );
    timeline.to(
      overlay,
      {
        opacity: 0,
        duration: 0.18,
        ease: 'power1.out',
      },
      0.02,
    );
    timeline.to(
      panel,
      {
        ...toTransform,
        duration: 0.24,
        ease: 'power2.in',
      },
      0,
    );
  }, [onClose, origin]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleRequestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRequestClose]);

  const handleCopySvg = () => {
    const svgString = generateSVGString(icon.matrix, icon.colors, { theme: previewTheme });
    navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPNG(icon.matrix, icon.colors, icon.name, { theme: previewTheme });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        ref={overlayRef}
        onClick={handleRequestClose}
        className="absolute inset-0 bg-[var(--color-overlay)] transition-colors"
      />
      
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`icon-preview-title-${icon.id}`}
        className="modal-panel relative w-full max-w-lg bg-[var(--color-bg)] border border-[color:var(--color-border)] shadow-2xl z-10 transition-colors"
      >
        <Crosshair className="-top-1.5 -left-1.5" />
        <Crosshair className="-top-1.5 -right-1.5" />
        <Crosshair className="-bottom-1.5 -left-1.5" />
        <Crosshair className="-bottom-1.5 -right-1.5" />

        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={handleRequestClose}
            className="p-2 bg-transparent border border-[color:var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[color:var(--color-border-strong)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="absolute top-4 left-4 z-20 inline-flex items-center border border-[color:var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setPreviewTheme('dark')}
            aria-label="Show dark icon variant"
            title="Dark variant"
            aria-pressed={previewTheme === 'dark'}
            className={`h-7 w-7 inline-flex items-center justify-center transition-colors ${
              previewTheme === 'dark'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]'
            }`}
          >
            <Moon size={12} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewTheme('light')}
            aria-label="Show light icon variant"
            title="Light variant"
            aria-pressed={previewTheme === 'light'}
            className={`h-7 w-7 inline-flex items-center justify-center transition-colors ${
              previewTheme === 'light'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]'
            }`}
          >
            <Sun size={12} />
          </button>
        </div>

        <div data-modal-content className="p-12 flex flex-col items-center justify-center relative bg-hatch transition-colors">

          <div ref={iconRef} className="relative z-10">
            <PixelIcon matrix={icon.matrix} colors={icon.colors} size={16} gap={4} theme={previewTheme} />
          </div>
        </div>

        <div data-modal-content className="p-8 bg-[var(--color-surface)] border-t border-[color:var(--color-border)] transition-colors">
          <div
            id={`icon-preview-title-${icon.id}`}
            className="text-2xl font-bold mb-2 font-sans tracking-tight text-[var(--color-text)]"
          >
            {icon.name}
          </div>
          
          <div className="flex items-center gap-2 mb-8">
            <span className="px-3 py-1 border border-[color:var(--color-border)] text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
              {icon.category}
            </span>
            <span className="px-3 py-1 border border-[color:var(--color-border)] text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
              {icon.matrix[0].length}x{icon.matrix.length}
            </span>
            <span className="px-3 py-1 border border-[color:var(--color-border)] text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
              {previewTheme}
            </span>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleCopySvg}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent border border-[color:var(--color-border)] text-[var(--color-text)] font-mono text-xs tracking-widest uppercase hover:bg-[var(--color-hover-surface)] transition-colors"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? 'COPIED!' : 'Copy SVG'}
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-[var(--color-accent-contrast)] font-mono text-xs tracking-widest uppercase hover:bg-[var(--color-accent-strong)] transition-colors"
            >
              {downloaded ? <Check size={16} /> : <Download size={16} />}
              {downloaded ? 'SAVED!' : 'Download PNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
