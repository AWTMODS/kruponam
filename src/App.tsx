import { useState, useEffect } from 'react';
import { FloatingPetals } from './components/FloatingPetals';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Countdown } from './components/Countdown';
import { ProgramsTimeline } from './components/ProgramsTimeline';
import { TicketPasses } from './components/TicketPasses';
import { BookingGuidelines } from './components/BookingGuidelines';
import { RegistrationForm } from './components/RegistrationForm';
import { PassStatusLookup } from './components/PassStatusLookup';
import { AdminPortal } from './components/AdminPortal';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { ComingSoon } from './components/ComingSoon';
import { DriverRegistrationForm } from './components/DriverRegistrationForm';
import { getSiteSettings } from './services/siteSettingsService';
import { startLivePresenceHeartbeat } from './services/livePresenceService';

export function App() {
  const [selectedPass, setSelectedPass] = useState<string>('Student Pass');
  const [activeView, setActiveView] = useState<'main' | 'lookup' | 'admin' | 'driver'>(() => {
    if (typeof window === 'undefined') return 'main';
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // Priority 1: If user explicitly navigated to a main anchor like #home, #registration, etc., always show main
    const mainSectionHashes = ['#home', '#about', '#programs', '#tickets', '#registration', '#guidelines', '#contact'];
    if (mainSectionHashes.includes(hash)) {
      return 'main';
    }

    // Priority 2: Direct Registration page routes (/registration.html, /registration, /register.html, /register, ?view=registration)
    if (
      pathname.includes('registration') ||
      pathname.includes('register') ||
      search.includes('view=registration')
    ) {
      return 'main';
    }

    // Priority 3: Admin portal routes (/admin.html, /admin, #admin, ?admin=true)
    if (hash === '#admin' || search.includes('admin') || pathname.includes('admin')) {
      return 'admin';
    }

    // Priority 4: Driver registration routes (/driver.html, /driver, #driver, ?view=driver)
    if (hash === '#driver' || search.includes('driver') || pathname.includes('driver')) {
      return 'driver';
    }

    return 'main';
  });
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupMode, setLookupMode] = useState<'student' | 'driver'>('student');
  const [showProgramsSchedule, setShowProgramsSchedule] = useState<boolean>(() => getSiteSettings().showProgramsSchedule);
  const [comingSoonMode, setComingSoonMode] = useState<boolean>(() => getSiteSettings().comingSoonMode);

  useEffect(() => {
    // Start tracking live active visitor presence
    startLivePresenceHeartbeat();

    // 1. Check URL Hash and query params (e.g. #admin, /admin.html, /driver.html, /registration.html, #home)
    const checkUrlRouting = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      const mainSectionHashes = ['#home', '#about', '#programs', '#tickets', '#registration', '#guidelines', '#contact'];
      
      // If user clicks a main anchor like #home (e.g. /admin.html#home), switch to main and clean URL
      if (mainSectionHashes.includes(hash)) {
        setActiveView('main');
        if (pathname.includes('admin') || pathname.includes('driver')) {
          window.history.replaceState(null, '', hash === '#home' ? '/' : `/${hash}`);
        }
        setTimeout(() => {
          if (hash === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const el = document.getElementById(hash.substring(1));
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 100);
        return;
      }

      // Direct registration routes (/registration.html, /registration, /register.html, /register)
      if (
        pathname.includes('registration') ||
        pathname.includes('register') ||
        search.includes('view=registration')
      ) {
        setActiveView('main');
        setTimeout(() => {
          const el = document.getElementById('registration');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
        return;
      }

      if (hash === '#admin' || search.includes('admin') || pathname.includes('admin')) {
        setActiveView('admin');
        return;
      }
      
      if (hash === '#driver' || search.includes('driver') || pathname.includes('driver')) {
        setActiveView('driver');
        return;
      }
    };

    checkUrlRouting();
    window.addEventListener('hashchange', checkUrlRouting);
    window.addEventListener('popstate', checkUrlRouting);

    // Listen to site settings changes
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        if (typeof customEv.detail.showProgramsSchedule === 'boolean') {
          setShowProgramsSchedule(customEv.detail.showProgramsSchedule);
        }
        if (typeof customEv.detail.comingSoonMode === 'boolean') {
          setComingSoonMode(customEv.detail.comingSoonMode);
        }
      }
    };
    window.addEventListener('kruponam-site-settings-changed', handleSettingsChanged);

    // 2. Secret Keyboard Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveView((prev) => (prev === 'admin' ? 'main' : 'admin'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkUrlRouting);
      window.removeEventListener('popstate', checkUrlRouting);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('registration') ||
        window.location.pathname.includes('register') ||
        window.location.search.includes('view=registration'))
    ) {
      setTimeout(() => {
        const el = document.getElementById('registration');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
    }
  }, []);

  const handleCloseAdmin = () => {
    setActiveView('main');
    window.history.replaceState(null, '', '/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectTicketFromPasses = (passName: string) => {
    setSelectedPass(passName);
  };

  const handleOpenLookup = (query?: string, mode?: 'student' | 'driver') => {
    setLookupQuery(typeof query === 'string' ? query : '');
    setLookupMode(mode || 'student');
    setActiveView('lookup');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenDriver = () => {
    setActiveView('driver');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!window.location.pathname.includes('driver')) {
      window.history.pushState(null, '', '/driver.html');
    }
  };

  return (
    <div className="min-h-screen bg-cream-warm text-slate-800 relative selection:bg-gold-royal selection:text-white">
      {/* Floating Canvas Flower Petals (Public Site Only - Hidden in Admin) */}
      {activeView !== 'admin' && <FloatingPetals />}

      {/* Main App View Navigation */}
      {activeView === 'admin' ? (
        <AdminPortal onClose={handleCloseAdmin} />
      ) : activeView === 'driver' ? (
        <DriverRegistrationForm
          onBackToHome={() => {
            setActiveView('main');
            window.history.replaceState(null, '', '/');
          }}
          onOpenLookup={handleOpenLookup}
          onOpenAdmin={() => setActiveView('admin')}
        />
      ) : activeView === 'lookup' ? (
        <div className="pt-24 min-h-screen">
          <Navbar onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} onOpenDriver={handleOpenDriver} />
          <div className="max-w-7xl mx-auto px-4">
            <PassStatusLookup onClose={() => setActiveView('main')} initialQuery={lookupQuery} initialMode={lookupMode} />
          </div>
          <Footer onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} />
        </div>
      ) : comingSoonMode ? (
        <ComingSoon
          onOpenAdmin={() => setActiveView('admin')}
          onOpenLookup={handleOpenLookup}
        />
      ) : (
        <>
          <Navbar onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} onOpenDriver={handleOpenDriver} />
          
          <main>
            <Hero onOpenLookup={handleOpenLookup} onOpenDriver={handleOpenDriver} />
            <About />
            <Countdown />
            {showProgramsSchedule && <ProgramsTimeline />}
            <TicketPasses onSelectTicket={handleSelectTicketFromPasses} onOpenDriver={handleOpenDriver} />
            <BookingGuidelines onOpenLookup={handleOpenLookup} />
            <RegistrationForm
              selectedPassFromParent={selectedPass}
              onOpenLookup={handleOpenLookup}
              onOpenDriver={handleOpenDriver}
            />
            <Contact />
          </main>

          <Footer onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} />
        </>
      )}
    </div>
  );
}

export default App;
