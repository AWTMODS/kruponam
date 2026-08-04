import React, { useState } from 'react';
import { Image as ImageIcon, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAssetUrl } from '../utils/assetPath';

interface GalleryItem {
  id: string;
  title: string;
  category: 'pookalam' | 'culturals' | 'feast' | 'games';
  image: string;
  caption: string;
  aspect: string;
}

export const GalleryMasonry: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pookalam' | 'culturals' | 'feast' | 'games'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryItems: GalleryItem[] = [
    {
      id: 'g1',
      title: 'Grand Pookalam Competition 2025',
      category: 'pookalam',
      image: getAssetUrl('images/pookalam.png'),
      caption: 'Circular floral carpet made of marigold and fresh rose petals designed by BCA department.',
      aspect: 'h-80',
    },
    {
      id: 'g2',
      title: 'Authentic 24-Item Onasadya Feast',
      category: 'feast',
      image: getAssetUrl('images/onasadya.png'),
      caption: 'Students & faculty enjoying traditional Onasadya feast served on fresh banana leaves.',
      aspect: 'h-96',
    },
    {
      id: 'g3',
      title: 'Thiruvathirakali Dance Performance',
      category: 'culturals',
      image: getAssetUrl('images/thiruvathira.png'),
      caption: 'Graceful Thiruvathira dance by students wearing Kasavu dhotis and sarees around Nilavilakku.',
      aspect: 'h-72',
    },
    {
      id: 'g4',
      title: 'Chenda Melam Percussion Ensemble',
      category: 'culturals',
      image: getAssetUrl('images/chenda_melam.png'),
      caption: 'Traditional Chenda Melam drum rhythm performance at Krupanidhi campus entrance.',
      aspect: 'h-88',
    },
    {
      id: 'g5',
      title: 'King Mahabali Maveli Welcome',
      category: 'culturals',
      image: getAssetUrl('images/hero_illustration.png'),
      caption: 'Student dressed as King Mahabali blessing students and spreading festival joy.',
      aspect: 'h-80',
    },
    {
      id: 'g6',
      title: 'Traditional Kasavu Dress Showcase',
      category: 'culturals',
      image: getAssetUrl('images/thiruvathira.png'),
      caption: 'College students celebrating in elegant Kerala Kasavu ethnic wear.',
      aspect: 'h-72',
    },
  ];

  const filteredItems = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeFilter);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-cream-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Memories & Visual Highlights</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Celebration <span className="text-gold-gradient font-normal italic">&</span> Photo Gallery
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Glimpses of Pookalam art, Thiruvathirakali dance, Onasadya feasts, and vibrant campus moments.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'pookalam', label: 'Pookalam Contest' },
            { id: 'culturals', label: 'Dance & Music' },
            { id: 'feast', label: 'Onasadya Feast' },
            { id: 'games', label: 'Games & Contests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
                activeFilter === tab.id
                  ? 'bg-kerala-deep text-white shadow-kerala-glow scale-105'
                  : 'bg-white text-slate-700 hover:bg-gold-light/30 border border-gold-royal/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openLightbox(idx)}
              className="break-inside-avoid relative rounded-3xl overflow-hidden bg-white shadow-card-soft hover:shadow-card-hover border border-gold-royal/30 cursor-pointer group transform hover:-translate-y-1.5 transition-all duration-300"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 text-white">
                <span className="text-gold-light text-[11px] font-bold uppercase tracking-wider mb-1">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-bold leading-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-cream-warm opacity-90 line-clamp-2">
                  {item.caption}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-gold-royal">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Click for Full Screen Preview</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 hidden sm:block"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-gold-royal/40 shadow-2xl animate-fadeIn">
            <div className="relative max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={filteredItems[lightboxIndex].image}
                alt={filteredItems[lightboxIndex].title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-gold-royal text-xs font-bold uppercase tracking-wider">
                  {filteredItems[lightboxIndex].category} • Kruponam 2026
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {filteredItems[lightboxIndex].title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {filteredItems[lightboxIndex].caption}
                </p>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                {lightboxIndex + 1} / {filteredItems.length}
              </div>
            </div>
          </div>

          <button
            onClick={nextImage}
            className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 hidden sm:block"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

        </div>
      )}
    </section>
  );
};
