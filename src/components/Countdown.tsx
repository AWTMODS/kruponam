import React, { useState, useEffect } from 'react';
import { Timer, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Countdown: React.FC = () => {
  const eventTargetDate = new Date('2026-09-11T08:00:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isEventStarted, setIsEventStarted] = useState(false);
  const [testCelebrationMode, setTestCelebrationMode] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = eventTargetDate - now;

      if (difference <= 0 || testCelebrationMode) {
        setIsEventStarted(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsEventStarted(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [eventTargetDate, testCelebrationMode]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#FACC15', '#0D472B', '#EA580C', '#FFFFFF'],
    });
  };

  const handleTestToggle = () => {
    const nextState = !testCelebrationMode;
    setTestCelebrationMode(nextState);
    if (nextState) {
      triggerConfetti();
    }
  };

  return (
    <section id="countdown" className="py-16 bg-gradient-to-r from-kerala-dark via-kerala-deep to-kerala-dark text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-royal/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-royal/20 border border-gold-royal/40 text-gold-light text-xs font-bold uppercase tracking-widest">
            <Timer className="w-3.5 h-3.5 text-gold-royal" />
            <span>Countdown to Grand Onasadya & Festivities</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {isEventStarted ? '🌸 Celebration Status' : 'T-Minus To Kruponam 2026'}
          </h2>
        </div>

        {isEventStarted ? (
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-gold-royal/30 via-gold-amber/40 to-gold-royal/30 rounded-3xl p-8 border-2 border-gold-royal shadow-2xl text-center space-y-4 animate-pulseGlow">
            <div className="w-16 h-16 rounded-full bg-gold-royal/40 mx-auto flex items-center justify-center text-3xl shadow-inner">
              🎉
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-black text-gold-light tracking-wide">
              The Celebration Has Begun!
            </h3>
            <p className="text-cream-warm text-base max-w-md mx-auto">
              Welcome to Kruponam 2026 at Krupanidhi Degree College! Join us at the main quadrangle for Onasadya feast, Chenda Melam, and Thiruvathira.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={triggerConfetti}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold-royal text-kerala-dark font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-gold-light transition-all"
              >
                <PartyPopper className="w-4 h-4" />
                <span>Launch Confetti 🎉</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="kasavu-card rounded-2xl p-4 sm:p-6 text-center shadow-2xl backdrop-blur-md transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-kerala-deep tracking-tight">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-gold-dark mt-2 font-sans">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-8">
          <button
            onClick={handleTestToggle}
            className="text-[11px] font-semibold text-gold-light/70 hover:text-gold-light underline tracking-wider transition-colors"
          >
            {testCelebrationMode ? "↺ Reset Countdown View" : "⚡ Preview 'Celebration Begun' Banner State"}
          </button>
        </div>

      </div>
    </section>
  );
};
