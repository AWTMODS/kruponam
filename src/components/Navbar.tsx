import { useState, useEffect } from 'react';
import { Menu, X, Ticket, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenLookup?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLookup, onOpenAdmin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Secret 5-tap on logo triggers Admin Portal
  const handleLogoClick = (e: React.MouseEvent) => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 5) {
      e.preventDefault();
      setLogoClickCount(0);
      if (onOpenAdmin) onOpenAdmin();
    }
    // Reset click count after 3 seconds of inactivity
    setTimeout(() => setLogoClickCount(0), 3000);
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Programs', href: '#programs' },
    { name: 'Tickets', href: '#tickets' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-nav py-3 shadow-md'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & College Emblem (Secret 5x click triggers Admin) */}
          <a href="#home" onClick={handleLogoClick} className="flex items-center gap-3 group select-none">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-kerala-deep via-gold-royal to-floral-yellow p-0.5 shadow-gold-glow transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-cream-warm rounded-full flex items-center justify-center">
                <span className="text-xl">🌼</span>
              </div>
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-kerala-deep group-hover:text-gold-dark transition-colors flex items-center gap-1.5">
                Kruponam
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-light/40 text-gold-dark font-sans font-semibold border border-gold-royal/30 hidden sm:inline-block">
                  2026
                </span>
              </span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-sans hidden md:block">
                Krupanidhi Degree College
              </p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-gold-royal/20 shadow-sm">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-kerala-deep hover:bg-cream-warm/80 rounded-full transition-all duration-200 relative group"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons (Public only - Admin button removed) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {onOpenLookup && (
              <button
                onClick={onOpenLookup}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-kerala-deep bg-white/80 hover:bg-cream-soft rounded-full border border-gold-royal/30 transition-all flex items-center gap-1.5"
                title="Check Pass Status & Download Badge"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold-royal" />
                <span>Check Pass Status</span>
              </button>
            )}

            <a
              href="#registration"
              className="relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep rounded-full shadow-kerala-glow hover:shadow-gold-glow transition-all duration-300 hover:scale-105 active:scale-95 group overflow-hidden"
            >
              <Ticket className="w-3.5 h-3.5 text-gold-royal group-hover:rotate-12 transition-transform" />
              <span>Register Pass</span>
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-kerala-deep hover:bg-gold-light/20 rounded-xl transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-cream-warm/95 backdrop-blur-xl border-b border-gold-royal/30 shadow-2xl p-6 transition-all animate-fadeIn">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-gold-light/30 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{link.name}</span>
                <span className="text-gold-royal text-xs">→</span>
              </a>
            ))}

            <div className="pt-4 border-t border-gold-royal/20 flex flex-col gap-2.5">
              {onOpenLookup && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLookup();
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-800 bg-white border border-gold-royal/40 rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-gold-royal" />
                  Check Pass Status
                </button>
              )}

              <a
                href="#registration"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-bold text-white bg-gradient-to-r from-kerala-deep to-kerala-emerald rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4 text-gold-royal" />
                Register Pass (₹700)
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
