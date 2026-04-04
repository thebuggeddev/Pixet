import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Grid, Shapes, Hash, Sparkles } from 'lucide-react';
import { icons } from './data/icons';
import { IconCard } from './components/IconCard';
import { PreviewModal } from './components/PreviewModal';
import { IconData } from './types';
import { Crosshair } from './components/Crosshair';

export default function App() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'numbers' | 'common' | 'fun'>('all');
  const [selectedIcon, setSelectedIcon] = useState<IconData | null>(null);

  const filteredIcons = icons.filter(icon => {
    const matchesSearch = icon.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || icon.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Icons', icon: Grid },
    { id: 'numbers', label: 'Numbers', icon: Hash },
    { id: 'common', label: 'Common', icon: Shapes },
    { id: 'fun', label: 'Fun', icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[var(--color-accent)]/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 relative z-30 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-x border-white/10 relative">
          <Crosshair className="-bottom-1.5 -left-1.5" />
          <Crosshair className="-bottom-1.5 -right-1.5" />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-transparent grid grid-cols-2 gap-0.5 p-1 border border-white/10">
              <div className="bg-[var(--color-accent)]" />
              <div className="bg-white/20" />
              <div className="bg-white/20" />
              <div className="bg-[var(--color-accent)]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Pixet</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest text-gray-400 uppercase">
            <a href="#" className="hover:text-white transition-colors">All Icons</a>
            <a href="#" className="hover:text-white transition-colors">Editor</a>
            <a href="#" className="hover:text-white transition-colors">Resources</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-xs font-mono tracking-widest uppercase bg-transparent border border-white/10 text-white px-6 py-3 hover:bg-white hover:text-black transition-colors hidden sm:block">
              Export All
            </button>
          </div>
        </div>
      </header>

      {/* Hatched Divider */}
      <div className="max-w-7xl mx-auto w-full border-x border-b border-white/10 h-12 bg-hatch relative">
        <Crosshair className="-bottom-1.5 -left-1.5" />
        <Crosshair className="-bottom-1.5 -right-1.5" />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto border-x border-white/10 relative flex flex-col">
        {/* Controls Section */}
        <div className="border-b border-white/10 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative bg-[#0a0a0a]">
          <Crosshair className="-bottom-1.5 -left-1.5" />
          <Crosshair className="-bottom-1.5 -right-1.5" />
          
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-widest uppercase border transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-[var(--color-accent)] text-black border-[var(--color-accent)]' 
                      : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-black' : 'text-gray-500'} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="SEARCH ICONS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 pl-11 pr-4 text-xs font-mono tracking-widest focus:outline-none focus:border-[var(--color-accent)] transition-all placeholder:text-gray-600 uppercase"
            />
          </div>
        </div>

        {/* Grid Section */}
        <div className="p-6 flex-1 bg-[#050505]">
          <motion.div 
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredIcons.map((icon) => (
                <motion.div
                  key={icon.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, type: 'spring', bounce: 0.2 }}
                >
                  <IconCard icon={icon} onClick={() => setSelectedIcon(icon)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredIcons.length === 0 && (
            <div className="py-24 text-center border border-white/10 bg-[#0a0a0a] mt-6">
              <div className="inline-flex items-center justify-center w-16 h-16 border border-white/10 bg-transparent mb-4">
                <Search className="text-gray-500" size={24} />
              </div>
              <h3 className="text-lg font-mono tracking-widest text-white mb-2 uppercase">No icons found</h3>
              <p className="text-gray-500 font-mono text-xs tracking-widest uppercase">Try adjusting your search or category filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Hatched Divider */}
      <div className="max-w-7xl mx-auto w-full border-x border-t border-white/10 h-12 bg-hatch relative mt-auto">
        <Crosshair className="-top-1.5 -left-1.5" />
        <Crosshair className="-top-1.5 -right-1.5" />
      </div>

      {/* Modal */}
      {selectedIcon && (
        <PreviewModal 
          icon={selectedIcon} 
          onClose={() => setSelectedIcon(null)} 
        />
      )}
    </div>
  );
}
