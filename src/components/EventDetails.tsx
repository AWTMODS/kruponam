import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, CheckCircle2, Utensils, Navigation, ExternalLink, X } from 'lucide-react';

export const EventDetails: React.FC = () => {
  const [showMapModal, setShowMapModal] = useState(false);

  const eventCards = [
    {
      icon: Calendar,
      title: 'Event Date',
      value: '6 September 2026',
      subtext: 'Sunday • Malayalam Month Chingam',
      color: 'from-amber-500/10 to-gold-light/20',
      borderColor: 'border-gold-royal/30',
      iconColor: 'text-gold-dark',
    },
    {
      icon: Clock,
      title: 'Timings',
      value: '8:00 AM onwards',
      subtext: 'Full Day Cultural Extravaganza',
      color: 'from-emerald-500/10 to-kerala-mint/30',
      borderColor: 'border-kerala-deep/30',
      iconColor: 'text-kerala-deep',
    },
    {
      icon: MapPin,
      title: 'Venue Location',
      value: 'Krupanidhi Degree College',
      subtext: 'Carmelaram Road, Varthur Hobli, Bengaluru',
      color: 'from-amber-500/10 to-gold-light/20',
      borderColor: 'border-gold-royal/30',
      iconColor: 'text-gold-dark',
      hasMapAction: true,
    },
    {
      icon: Users,
      title: 'Expected Attendees',
      value: '1000+ Visitors',
      subtext: 'Students, Faculty, Alumni & Guests',
      color: 'from-emerald-500/10 to-kerala-mint/30',
      borderColor: 'border-kerala-deep/30',
      iconColor: 'text-kerala-deep',
    },
    {
      icon: Ticket,
      title: 'Entry Type',
      value: 'Free Pass Required',
      subtext: 'Digital Ticket / College Student ID',
      color: 'from-amber-500/10 to-gold-light/20',
      borderColor: 'border-gold-royal/30',
      iconColor: 'text-gold-dark',
    },
    {
      icon: Utensils,
      title: 'Grand Onasadya',
      value: '24-Item Feast',
      subtext: 'Authentic Banana Leaf Lunch Included',
      color: 'from-emerald-500/10 to-kerala-mint/30',
      borderColor: 'border-kerala-deep/30',
      iconColor: 'text-kerala-deep',
    },
  ];

  return (
    <section id="event-info" className="py-20 lg:py-24 bg-cream-soft relative overflow-hidden">
      
      {/* Background Subtle Kerala Motifs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-kerala-mint border border-kerala-deep/20 text-kerala-deep text-xs font-bold uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Essential Event Information</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Event Overview <span className="text-gold-gradient font-normal italic">&</span> Details
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Everything you need to know before joining Kruponam 2026 at Krupanidhi Campus.
          </p>
        </div>

        {/* Grid Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-6 border ${card.borderColor} shadow-card-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group`}
              >
                <div>
                  {/* Top Icon Badge */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                    <Icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>

                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 font-sans">
                    {card.title}
                  </p>
                  
                  <h3 className="font-serif text-2xl font-bold text-slate-800 mt-1 mb-2 group-hover:text-kerala-deep transition-colors">
                    {card.value}
                  </h3>

                  <p className="text-slate-600 text-sm">
                    {card.subtext}
                  </p>
                </div>

                {card.hasMapAction && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowMapModal(true)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-kerala-deep hover:text-gold-dark transition-colors uppercase tracking-wider"
                    >
                      <Navigation className="w-3.5 h-3.5 text-gold-royal" />
                      <span>Open Google Maps</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Google Maps Location Preview Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border-2 border-gold-royal/40 relative animate-fadeIn">
            <button
              onClick={() => setShowMapModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-light/40 flex items-center justify-center text-gold-dark font-bold text-xl">
                  📍
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-kerala-deep">
                    Krupanidhi Degree College Venue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Carmelaram Road, Chikkabellandur, Off Sarjapur Road, Bengaluru - 560035
                  </p>
                </div>
              </div>

              {/* Map Iframe */}
              <div className="rounded-2xl overflow-hidden border border-gold-royal/30 h-80 bg-slate-100">
                <iframe
                  title="Krupanidhi Degree College Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.8876800760447!2d77.70295807584742!3d12.915014915428613!2m3!1f0!0f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae132ef16b124d%3A0x6b44ddc8810ddf3b!2sKrupanidhi%20Group%20of%20Institutions!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-slate-500">
                  💡 Free parking available for registered students & guests.
                </p>
                <a
                  href="https://maps.google.com/?q=Krupanidhi+Degree+College+Bengaluru"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-kerala-deep text-white text-xs font-bold hover:bg-kerala-emerald transition-colors"
                >
                  <span>Open in Google Maps App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
