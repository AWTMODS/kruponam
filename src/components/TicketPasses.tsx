import React, { useState, useEffect } from 'react';
import { Ticket, CheckCircle2, ArrowDown } from 'lucide-react';
import { getSiteSettings } from '../services/siteSettingsService';

interface PassProps {
  onSelectTicket?: (ticketType: string) => void;
}

export const TicketPasses: React.FC<PassProps> = ({ onSelectTicket }) => {
  const [ticketAmount, setTicketAmount] = useState<number>(() => getSiteSettings().ticketAmount);

  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && typeof customEv.detail.ticketAmount === 'number') {
        setTicketAmount(customEv.detail.ticketAmount);
      }
    };
    window.addEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    };
  }, []);

  const passes = [
    {
      id: 'General Pass',
      name: 'General Pass',
      price: `₹${ticketAmount}`,
      subtitle: 'For Krupanidhi Students & Alumni',
      popular: false,
      badge: 'College ID Required',
      features: [
        'Full Day Access to All Events',
        'Traditional Onasadya 24-Item Feast',
        'Entry to Games & Cultural Contests',
        'Digital Pass Badge Generator',
      ],
      ctaText: `Register & Pay ₹${ticketAmount}`,
      icon: Ticket,
      borderColor: 'border-slate-200',
      buttonBg: 'bg-kerala-deep text-white hover:bg-kerala-emerald',
    },
  ];

  const handleSelect = (passId: string) => {
    if (onSelectTicket) {
      onSelectTicket(passId);
    }
    const elem = document.getElementById('registration');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="tickets" className="py-20 lg:py-28 bg-cream-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Ticket className="w-3.5 h-3.5" />
            <span>Select Your Event Pass</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Tickets <span className="text-gold-gradient font-normal italic">&</span> Event Passes
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Registration is 100% free for college students and faculty. Reserve your pass to secure Onasadya feast tokens!
          </p>
        </div>

        <div className="flex justify-center">
          {passes.map((pass) => {
            const Icon = pass.icon;
            return (
              <div
                key={pass.id}
                className={`bg-white rounded-3xl p-8 border-2 ${pass.borderColor} shadow-card-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between relative group w-full max-w-md ${
                  pass.popular ? 'bg-gradient-to-b from-white via-cream-warm to-white' : ''
                }`}
              >
                {pass.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold-royal text-kerala-dark px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                    {pass.badge}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gold-light/30 flex items-center justify-center text-gold-dark">
                      <Icon className="w-6 h-6" />
                    </div>

                    {!pass.popular && (
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {pass.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1">
                    {pass.name}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mb-6 font-medium">
                    {pass.subtitle}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <span className="font-serif text-3xl font-extrabold text-kerala-deep">
                      {pass.price}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                      No Hidden Charges • Campus Entry
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pass.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelect(pass.id)}
                  className={`w-full py-3.5 rounded-full text-xs uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-2 group-hover:scale-105 ${pass.buttonBg}`}
                >
                  <span>{pass.ctaText}</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
