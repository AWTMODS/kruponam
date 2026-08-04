import { useState } from 'react';
import { FloatingPetals } from './components/FloatingPetals';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { EventDetails } from './components/EventDetails';
import { Countdown } from './components/Countdown';
import { ProgramsTimeline } from './components/ProgramsTimeline';
import { TicketPasses } from './components/TicketPasses';
import { RegistrationForm } from './components/RegistrationForm';
import { PassStatusLookup } from './components/PassStatusLookup';
import { AdminPortal } from './components/AdminPortal';
import { GalleryMasonry } from './components/GalleryMasonry';
import { Organizers } from './components/Organizers';
import { Sponsors } from './components/Sponsors';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function App() {
  const [selectedPass, setSelectedPass] = useState<string>('Student Pass');
  const [activeView, setActiveView] = useState<'main' | 'lookup' | 'admin'>('main');

  const handleSelectTicketFromPasses = (passName: string) => {
    setSelectedPass(passName);
  };

  return (
    <div className="min-h-screen bg-cream-warm text-slate-800 relative selection:bg-gold-royal selection:text-white">
      {/* Floating Canvas Flower Petals */}
      <FloatingPetals />

      {/* Main App Navigation */}
      {activeView === 'admin' ? (
        <AdminPortal onClose={() => setActiveView('main')} />
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
            <EventDetails />
            <Countdown />
            <ProgramsTimeline />
            <TicketPasses onSelectTicket={handleSelectTicketFromPasses} />
            <RegistrationForm
              selectedPassFromParent={selectedPass}
              onOpenLookup={() => setActiveView('lookup')}
            />
            <GalleryMasonry />
            <Organizers />
            <Sponsors />
            <FAQ />
            <Contact />
          </main>

          <Footer onOpenLookup={() => setActiveView('lookup')} onOpenAdmin={() => setActiveView('admin')} />
        </>
      )}
    </div>
  );
}

export default App;
