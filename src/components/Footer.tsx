import React from 'react';
import { Heart, ArrowUp, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
  onOpenLookup?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLookup }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-b from-kerala-dark via-slate-950 to-black text-white pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gold-royal via-gold-amber to-gold-royal" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-royal text-kerala-dark flex items-center justify-center text-xl font-bold shadow-gold-glow">
                🌼
              </div>
              <span className="font-serif text-3xl font-bold text-white tracking-tight">
                Kruponam <span className="text-gold-royal text-xl font-sans">2026</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The premier annual Onam cultural extravaganza organized by Krupanidhi Degree College, Bengaluru. Celebrating tradition, unity, music, dance, and togetherness.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-gold-light font-medium">
              <span>🌺 Celebrate Tradition. Celebrate Together.</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-gold-royal uppercase tracking-wider">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#home" className="hover:text-gold-royal transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-gold-royal transition-colors">About Kruponam</a></li>
              <li><a href="#event-info" className="hover:text-gold-royal transition-colors">Event Details</a></li>
              <li><a href="#programs" className="hover:text-gold-royal transition-colors">Program Schedule</a></li>
              <li><a href="#tickets" className="hover:text-gold-royal transition-colors">Ticket Passes</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-gold-royal uppercase tracking-wider">
              Student Pass & Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#registration" className="hover:text-gold-royal transition-colors">Pass Registration (₹700)</a></li>
              {onOpenLookup && (
                <li>
                  <button onClick={onOpenLookup} className="hover:text-gold-royal transition-colors text-left flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-gold-royal" />
                    <span>Check Pass Status</span>
                  </button>
                </li>
              )}
              <li><a href="#gallery" className="hover:text-gold-royal transition-colors">Photo Gallery</a></li>
              <li><a href="#faq" className="hover:text-gold-royal transition-colors">FAQ & Guidelines</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-gold-royal uppercase tracking-wider">
              College Venue
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Krupanidhi Degree College<br />
              Chikkabellandur, Carmelaram Rd,<br />
              Off Sarjapur Rd, Bengaluru - 560035
            </p>
            <p className="text-xs text-slate-400 font-mono">
              kruponam@krupanidhi.edu.in
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by Krupanidhi Degree College
          </p>

          <p>© 2026 Krupanidhi Degree College. All Rights Reserved.</p>

          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-white/10 hover:bg-gold-royal hover:text-kerala-dark text-white transition-all duration-300 flex items-center gap-1.5 font-bold"
            title="Scroll to Top"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
