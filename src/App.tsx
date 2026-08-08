import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { FloatingPetals } from './components/FloatingPetals';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Countdown } from './components/Countdown';
import { ProgramsTimeline } from './components/ProgramsTimeline';
import { TicketPasses } from './components/TicketPasses';
import { RegistrationForm } from './components/RegistrationForm';
import { PassStatusLookup } from './components/PassStatusLookup';
import { AdminPortal } from './components/AdminPortal';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { getSiteSettings } from './services/siteSettingsService';
import { startLivePresenceHeartbeat } from './services/livePresenceService';

export function App() {
  const [selectedPass, setSelectedPass] = useState<string>('Student Pass');
  const [activeView, setActiveView] = useState<'main' | 'lookup' | 'admin'>('main');
  const [showProgramsSchedule, setShowProgramsSchedule] = useState<boolean>(() => getSiteSettings().showProgramsSchedule);

  useEffect(() => {
    // Start tracking live active visitor presence
    startLivePresenceHeartbeat();

    // 1. Check URL Hash (e.g., #admin or ?admin=true)
    const checkAdminTrigger = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#admin' || search.includes('admin=true')) {
        setActiveView('admin');
      }
    };

    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);

    // Listen to site settings changes
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && typeof customEv.detail.showProgramsSchedule === 'boolean') {
        setShowProgramsSchedule(customEv.detail.showProgramsSchedule);
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
      window.removeEventListener('hashchange', checkAdminTrigger);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    };
  }, []);

  const handleCloseAdmin = () => {
    setActiveView('main');
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleSelectTicketFromPasses = (passName: string) => {
    setSelectedPass(passName);
  };

  return (
    <div className="min-h-screen bg-cream-warm text-slate-800 relative selection:bg-gold-royal selection:text-white">
      {/* Floating Canvas Flower Petals (Public Site Only - Hidden in Admin) */}
      {activeView !== 'admin' && <FloatingPetals />}

      {/* Main App View Navigation */}
      {activeView === 'admin' ? (
        <AdminPortal onClose={handleCloseAdmin} />
      ) : activeView === 'lookup' ? (
        <div className="pt-24 min-h-screen">
          <Navbar onOpenLookup={() => setActiveView('lookup')} onOpenAdmin={() => setActiveView('admin')} />
          <div className="max-w-7xl mx-auto px-4">
            <PassStatusLookup onClose={() => setActiveView('main')} />
          </div>
          <Footer onOpenLookup={() => setActiveView('lookup')} onOpenAdmin={() => setActiveView('admin')} />
        </div>
      ) : (
        <>
          <Navbar onOpenLookup={() => setActiveView('lookup')} onOpenAdmin={() => setActiveView('admin')} />
          
          <main>
            <Hero />
            <About />
            <Countdown />
            {showProgramsSchedule && <ProgramsTimeline />}
            <TicketPasses onSelectTicket={handleSelectTicketFromPasses} />
            <RegistrationForm
              selectedPassFromParent={selectedPass}
              onOpenLookup={() => setActiveView('lookup')}
            />
            <Contact />
          </main>

          <Footer onOpenLookup={() => setActiveView('lookup')} onOpenAdmin={() => setActiveView('admin')} />
        </>
      )}
      <Analytics />
    </div>
  );
}

export default App;
