import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, Check } from 'lucide-react';
import { PixelIcon } from './PixelIcon';
import { IconData } from '../types';
import { generateSVGString, downloadPNG } from '../utils/exportUtils';
import { Crosshair } from './Crosshair';

interface PreviewModalProps {
  icon: IconData | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ icon, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!icon) return null;

  const handleCopySvg = () => {
    const svgString = generateSVGString(icon.matrix, icon.colors);
    navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPNG(icon.matrix, icon.colors, icon.name);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          layoutId={`card-${icon.id}`}
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#050505] border border-white/10 shadow-2xl z-10"
        >
          <Crosshair className="-top-1.5 -left-1.5" />
          <Crosshair className="-top-1.5 -right-1.5" />
          <Crosshair className="-bottom-1.5 -left-1.5" />
          <Crosshair className="-bottom-1.5 -right-1.5" />

          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={onClose}
              className="p-2 bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-12 flex flex-col items-center justify-center relative">
            <motion.div layoutId={`icon-${icon.id}`} className="relative z-10">
              <PixelIcon matrix={icon.matrix} colors={icon.colors} size={16} gap={4} />
            </motion.div>
          </div>

          <div className="p-8 bg-[#0a0a0a] border-t border-white/10">
            <motion.div layoutId={`title-${icon.id}`} className="text-2xl font-bold text-white mb-2 font-sans tracking-tight">
              {icon.name}
            </motion.div>
            
            <div className="flex items-center gap-2 mb-8">
              <span className="px-3 py-1 border border-white/10 text-xs font-mono text-gray-400 uppercase tracking-widest">
                {icon.category}
              </span>
              <span className="px-3 py-1 border border-white/10 text-xs font-mono text-gray-400 uppercase tracking-widest">
                {icon.matrix[0].length}x{icon.matrix.length}
              </span>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleCopySvg}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-transparent border border-white/10 text-white font-mono text-xs tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                {copied ? 'COPIED!' : 'Copy SVG'}
              </button>
              <button 
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-black font-mono text-xs tracking-widest uppercase hover:bg-[#d47a53] transition-colors"
              >
                {downloaded ? <Check size={16} /> : <Download size={16} />}
                {downloaded ? 'SAVED!' : 'Download PNG'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
