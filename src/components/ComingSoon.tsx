import React from 'react';
import { getAssetUrl } from '../utils/assetPath';
import { Sparkles } from 'lucide-react';

interface ComingSoonProps {
  onOpenAdmin?: () => void;
  onOpenLookup?: () => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = () => {
  return (
    <div className="min-h-screen bg-cream-gradient text-slate-800 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Background Decorative Kerala Design Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-gold-light/30 via-kerala-mint/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-royal/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-kerala-mint/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="py-6 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-center sm:justify-start z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-kerala-deep via-gold-royal to-floral-yellow p-0.5 shadow-gold-glow">
            <div className="w-full h-full bg-cream-warm rounded-full flex items-center justify-center text-xl">
              🌼
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-kerala-deep flex items-center gap-2">
              Kruponam
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-light/50 text-gold-dark font-sans font-extrabold border border-gold-royal/30">
                2026
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Center Poster Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full text-center z-10 space-y-6">
        
        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-light/60 via-amber-100 to-gold-light/60 border border-gold-royal/40 text-gold-dark shadow-sm">
          <Sparkles className="w-4 h-4 text-gold-dark animate-pulse" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans">
            Official Onam Cultural Extravaganza
          </span>
          <span className="w-2 h-2 rounded-full bg-gold-royal animate-ping" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-kerala-deep">
            Kruponam <span className="text-gold-gradient font-normal italic">2026</span>
          </h1>
          <p className="font-serif italic text-lg sm:text-2xl text-slate-700 font-medium">
            Coming Soon
          </p>
        </div>

        {/* Poster Card Showcase */}
        <div className="relative z-10 rounded-3xl p-3 bg-white/95 shadow-2xl border-2 border-gold-royal/40 backdrop-blur-md max-w-md w-full transform hover:scale-[1.01] transition-transform duration-500 group">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-cream-soft to-amber-50">
            <img
              src={getAssetUrl('images/hero_poster.jpg?v=2')}
              alt="Kruponam 2026 Official Poster King Mahabali Krupanidhi Institutions"
              className="w-full h-auto object-cover max-h-[580px] rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-700"
            />
            
            {/* Top Overlay Badge */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold-royal/40 shadow-md flex items-center gap-1.5 text-xs font-bold text-kerala-deep">
              <span className="text-amber-500 animate-pulse">👑</span>
              <span>King Mahabali's Welcome</span>
            </div>

            {/* Bottom Overlay Pill */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg p-3 rounded-2xl border border-gold-royal/30 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-light/40 flex items-center justify-center text-xl shadow-inner">
                  🌴
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-kerala-deep">Traditional Onam Extravaganza</p>
                  <p className="text-[11px] text-slate-500">Website Opening Soon</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-gold-royal text-kerala-dark text-xs font-black uppercase tracking-wider shadow-sm">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer Bar */}
      <footer className="py-6 px-4 text-center text-xs text-slate-500 border-t border-gold-royal/20 z-10 space-y-1">
        <p className="font-serif italic font-medium text-slate-600">
          Celebrate Tradition. Celebrate Together.
        </p>
        <p>© 2026 HyreBit Innovations LLP. All Rights Reserved.</p>
      </footer>

    </div>
  );
};
