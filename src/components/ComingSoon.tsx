import React, { useState, useEffect } from 'react';
import { getAssetUrl } from '../utils/assetPath';
import { 
  Search, 
  Ticket, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  PartyPopper, 
  Utensils, 
  Music, 
  ArrowRight, 
  Phone, 
  Mail,
  GraduationCap,
  Truck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ComingSoonProps {
  onOpenAdmin?: () => void;
  onOpenLookup?: (query?: string, mode?: 'student' | 'driver') => void;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onOpenAdmin, onOpenLookup }) => {
  const [quickQuery, setQuickQuery] = useState('');

  // Fire celebratory festive confetti once on mount
  useEffect(() => {
    try {
      const end = Date.now() + 800;
      const colors = ['#f59e0b', '#eab308', '#ef4444', '#10b981', '#ffffff'];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (_) { }
  }, []);

  const handleQuickLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenLookup) {
      onOpenLookup(quickQuery.trim(), 'student');
    }
  };

  return (
    <div className="min-h-screen bg-cream-gradient text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Kerala Design Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-br from-gold-light/40 via-amber-200/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-royal/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-kerala-mint/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="py-5 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-kerala-deep via-gold-royal to-floral-yellow p-0.5 shadow-gold-glow">
            <div className="w-full h-full bg-cream-warm rounded-full flex items-center justify-center text-2xl">
              🌼
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-kerala-deep flex items-center gap-2">
              Kruponam
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-light/60 text-gold-dark font-sans font-extrabold border border-gold-royal/30">
                2026
              </span>
            </span>
            <p className="text-[11px] text-slate-600 font-sans hidden sm:block">Krupanidhi Degree College Cultural Committee</p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          {onOpenLookup && (
            <button
              onClick={() => onOpenLookup()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/90 hover:bg-white text-kerala-deep border border-gold-royal/40 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <Ticket className="w-4 h-4 text-gold-dark" />
              <span>Check My Pass</span>
            </button>
          )}

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Admin Portal"
              className="p-2 rounded-xl text-slate-500 hover:text-kerala-deep hover:bg-gold-light/30 transition-all border border-transparent hover:border-gold-royal/20"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Center Content Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full text-center z-10 space-y-8">
        
        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 via-gold-light/60 to-amber-100 border border-gold-royal/40 text-gold-dark shadow-md animate-fade-in">
          <PartyPopper className="w-4 h-4 text-amber-600 animate-bounce" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider font-sans text-kerala-dark">
            Bookings Officially Closed • Housefull!
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Hero Title & Thank You Message */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-kerala-deep leading-tight">
            Thank You for <span className="text-gold-gradient italic">Booking!</span>
          </h1>
          <p className="font-sans text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
            We are deeply grateful for the overwhelming response and enthusiastic support from our students, alumni, faculty, and guests. Ticket reservations for <strong className="text-kerala-deep">Kruponam 2026</strong> are officially closed.
          </p>
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-900 bg-gold-light/30 px-4 py-1.5 rounded-full border border-gold-royal/20">
            <Calendar className="w-4 h-4 text-gold-dark" />
            <span>Grand Cultural Extravaganza & Royal Onasadya Feast</span>
          </div>
        </div>

        {/* Quick Pass Lookup Card */}
        {onOpenLookup && (
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border-2 border-gold-royal/40 shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-royal to-amber-400 flex items-center justify-center text-white shadow-sm">
                  <Search className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg">Already Booked Your Pass?</h3>
                  <p className="text-xs text-slate-500">Check approval status or download your pass & QR code</p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                Lookup Active
              </span>
            </div>

            <form onSubmit={handleQuickLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Enter Phone Number, Email, or Ticket ID..."
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-royal focus:border-gold-royal transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-royal to-amber-500 hover:from-amber-400 hover:to-gold-royal text-slate-950 font-bold text-sm shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>Lookup Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between pt-1 text-xs text-slate-500 gap-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Instant pass download & gate QR code
              </span>
              <button
                type="button"
                onClick={() => onOpenLookup(undefined, 'driver')}
                className="text-amber-800 hover:text-amber-900 font-bold hover:underline inline-flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                Vehicle Driver Pass Lookup
              </button>
            </div>
          </div>
        )}

        {/* Poster Card Showcase */}
        <div className="relative z-10 rounded-3xl p-3 bg-white/95 shadow-2xl border-2 border-gold-royal/40 backdrop-blur-md max-w-md w-full transform hover:scale-[1.01] transition-transform duration-500 group">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-cream-soft to-amber-50">
            <img
              src={getAssetUrl('images/hero_poster.jpg?v=3')}
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
                  <p className="text-xs font-bold text-kerala-deep">Krupanidhi Degree College</p>
                  <p className="text-[11px] text-slate-500">Official Onam Celebration</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-gold-royal to-amber-400 text-kerala-dark text-xs font-black uppercase tracking-wider shadow-sm">
                Bookings Closed
              </span>
            </div>
          </div>
        </div>

        {/* Event Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-3xl pt-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gold-royal/30 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Ticket className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Housefull</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All Passes Allocated</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gold-royal/30 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Utensils className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Royal Onasadya</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Authentic Kerala Feast</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gold-royal/30 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Music className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Chenda Melam</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Live Traditional Beats</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gold-royal/30 text-center shadow-sm">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Campus Event</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Krupanidhi Institutions</p>
          </div>
        </div>

        {/* Important Guidelines Notice for Attendees */}
        <div className="w-full max-w-3xl bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-300/60 text-left text-xs sm:text-sm text-slate-700 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Important Instructions for Confirmed Attendees:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs sm:text-[13px] leading-relaxed">
            <li><strong>Mandatory College ID:</strong> All attendees must carry their original college ID card along with their digital or printed Kruponam Pass for entry gate verification.</li>
            <li><strong>Traditional Dress Code:</strong> Traditional Kerala attire (Kasavu Mundu, Saree, or festive ethnic wear) is warmly encouraged to celebrate the spirit of Onam.</li>
            <li><strong>Entry Verification:</strong> Keep your pass QR code readily available on your phone for quick scanning at the welcome desk.</li>
          </ul>
        </div>

        {/* Help & Support Assistance */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600 pt-1">
          <span className="font-semibold text-slate-700">Need pass assistance?</span>
          <a
            href="mailto:kruponam@krupanidhi.edu.in"
            className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-900 font-medium hover:underline"
          >
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>kruponam@krupanidhi.edu.in</span>
          </a>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>Cultural Helpdesk & Pass Support</span>
          </span>
        </div>

      </main>

      {/* Footer Bar */}
      <footer className="py-6 px-4 text-center text-xs text-slate-500 border-t border-gold-royal/20 z-10 space-y-2">
        <p className="font-serif italic font-semibold text-slate-700 text-sm">
          Celebrate Tradition. Celebrate Together. Happy Onam 2026!
        </p>
        <p>© 2026 Krupanidhi Degree College Cultural Committee • Designed by HyreBit Innovations LLP</p>
        {onOpenAdmin && (
          <div className="pt-1">
            <button
              onClick={onOpenAdmin}
              className="text-[11px] text-slate-400 hover:text-amber-800 transition-colors underline"
            >
              Organizers & Admin Portal
            </button>
          </div>
        )}
      </footer>

    </div>
  );
};

// Export alias as well
export const ThanksForBooking = ComingSoon;
export default ComingSoon;
