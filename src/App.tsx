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
    if (hash === '#admin' || search.includes('admin') || pathname.includes('admin')) {
      return 'admin';
    }
    if (hash === '#driver' || search.includes('driver') || pathname.includes('driver')) {
      return 'driver';
    }
    return 'main';
  });
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [showProgramsSchedule, setShowProgramsSchedule] = useState<boolean>(() => getSiteSettings().showProgramsSchedule);
  const [comingSoonMode, setComingSoonMode] = useState<boolean>(() => getSiteSettings().comingSoonMode);

  useEffect(() => {
    // Start tracking live active visitor presence
    startLivePresenceHeartbeat();

    // 1. Check URL Hash and query params (e.g. #admin, /admin.html, /driver.html, #driver, ?view=driver)
    const checkUrlRouting = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      if (hash === '#admin' || search.includes('admin') || pathname.includes('admin')) {
        setActiveView('admin');
      } else if (
        hash === '#driver' ||
        search.includes('driver') ||
        pathname.includes('driver')
      ) {
        setActiveView('driver');
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

  const handleCloseAdmin = () => {
    setActiveView('main');
    if (window.location.hash === '#admin' || window.location.pathname.includes('admin') || window.location.search.includes('admin')) {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleSelectTicketFromPasses = (passName: string) => {
    setSelectedPass(passName);
  };

  const handleOpenLookup = (query?: string) => {
    setLookupQuery(typeof query === 'string' ? query : '');
    setActiveView('lookup');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-cream-warm text-slate-800 relative selection:bg-gold-royal selection:text-white">
      {/* Floating Canvas Flower Petals (Public Site Only - Hidden in Admin or Coming Soon) */}
      {activeView !== 'admin' && !comingSoonMode && <FloatingPetals />}

      {/* Main App View Navigation */}
      {activeView === 'admin' ? (
        <AdminPortal onClose={handleCloseAdmin} />
      ) : activeView === 'driver' ? (
        <DriverRegistrationForm
          onBackToHome={() => {
            setActiveView('main');
            if (window.location.hash === '#driver' || window.location.search.includes('driver')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          onOpenLookup={handleOpenLookup}
          onOpenAdmin={() => setActiveView('admin')}
        />
      ) : activeView === 'lookup' ? (
        <div className="pt-24 min-h-screen">
          <Navbar onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} />
          <div className="max-w-7xl mx-auto px-4">
            <PassStatusLookup onClose={() => setActiveView('main')} initialQuery={lookupQuery} />
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
          <Navbar onOpenLookup={handleOpenLookup} onOpenAdmin={() => setActiveView('admin')} />
          
          <main>
            <Hero onOpenLookup={handleOpenLookup} />
            <About />
            <Countdown />
            {showProgramsSchedule && <ProgramsTimeline />}
            <TicketPasses onSelectTicket={handleSelectTicketFromPasses} />
            <BookingGuidelines onOpenLookup={handleOpenLookup} />
            <RegistrationForm
              selectedPassFromParent={selectedPass}
              onOpenLookup={handleOpenLookup}
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
