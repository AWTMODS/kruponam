import React, { useState } from 'react';
import { Calendar, Sun, Sunset, Moon, Sparkles, Utensils, Music, Trophy, Compass, Clock, Check, Bell } from 'lucide-react';

interface ProgramItem {
  id: string;
  time: string;
  session: 'morning' | 'afternoon' | 'evening';
  title: string;
  category: string;
  description: string;
  location: string;
  icon: any;
  featured?: boolean;
}

export const ProgramsTimeline: React.FC = () => {
  const [activeSession, setActiveSession] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [addedCalendarId, setAddedCalendarId] = useState<string | null>(null);

  const programs: ProgramItem[] = [
    // Morning Programs
    {
      id: 'p1',
      time: '08:00 AM - 09:00 AM',
      session: 'morning',
      title: 'Grand Traditional Welcome & Maveli Arrival',
      category: 'Ceremony',
      description: 'Grand royal welcome for King Mahabali accompanied by Chenda Melam drummers, traditional Kasavu attire procession, and flower petals greeting.',
      location: 'Main College Entrance Quadrangle',
      icon: Sparkles,
      featured: true,
    },
    {
      id: 'p2',
      time: '09:00 AM - 10:30 AM',
      session: 'morning',
      title: 'Inter-Departmental Pookalam Contest',
      category: 'Competition',
      description: 'Intricate floral carpet competition where student departments compete to create breathtaking circular Pookalam designs using fresh marigolds and roses.',
      location: 'Auditorium Foyer & Central Lawn',
      icon: Compass,
    },
    {
      id: 'p3',
      time: '10:30 AM - 11:30 AM',
      session: 'morning',
      title: 'Kruponam 2026 Formal Inauguration',
      category: 'Official',
      description: 'Traditional Nilavilakku lamp lighting ceremony by College Management, Principal, Chief Guests, and Student Council leaders.',
      location: 'Main Auditorium Stage',
      icon: Calendar,
    },
    {
      id: 'p4',
      time: '11:30 AM - 01:00 PM',
      session: 'morning',
      title: 'Traditional Onam Games (Vadam Vali & Uri Adithal)',
      category: 'Sports & Fun',
      description: 'Thrilling Tug-of-War (Vadam Vali) championship between departments, pot-breaking (Uri Adithal), and Sundari Kku Pottukuthal fun games.',
      location: 'College Sports Ground',
      icon: Trophy,
    },

    // Afternoon Programs
    {
      id: 'p5',
      time: '01:00 PM - 02:30 PM',
      session: 'afternoon',
      title: 'Grand Onasadya Feast',
      category: 'Feast',
      description: 'Authentic 24-item Kerala harvest meal served on fresh banana leaves. Features Avial, Thoran, Payasam, Parippu, Pappadam, and golden rice.',
      location: 'Grand Food Pavilion & Dining Hall',
      icon: Utensils,
      featured: true,
    },
    {
      id: 'p6',
      time: '02:30 PM - 03:45 PM',
      session: 'afternoon',
      title: 'Thiruvathirakali & Classical Dance Showcase',
      category: 'Cultural Performing Arts',
      description: 'Graceful Thiruvathira dance by students wearing Kerala Kasavu sarees around Nilavilakku, followed by Mohiniyattam and classical solos.',
      location: 'Main Open-Air Stage',
      icon: Music,
    },
    {
      id: 'p7',
      time: '03:45 PM - 05:00 PM',
      session: 'afternoon',
      title: 'Onam Music Band & Drama Extravaganza',
      category: 'Music & Drama',
      description: 'Live performance by Krupanidhi Music Club featuring traditional Onam songs (Onapattu), fusion Malayalam tracks, and humorous Onam skit drama.',
      location: 'Main Auditorium',
      icon: Music,
    },

    // Evening Programs
    {
      id: 'p8',
      time: '05:00 PM - 06:00 PM',
      session: 'evening',
      title: 'Prize Distribution & Champion Department Award',
      category: 'Awards',
      description: 'Award ceremony felicitating winners of Pookalam, Tug-of-War, and Cultural contests. Awarding the prestigious Kruponam 2026 Rolling Trophy.',
      location: 'Main Stage',
      icon: Trophy,
      featured: true,
    },
    {
      id: 'p9',
      time: '06:00 PM - 08:00 PM',
      session: 'evening',
      title: 'Chenda Melam Fusion & DJ Sunset Celebration',
      category: 'Grand Finale',
      description: 'High-energy Chenda Melam drum beat fusion with modern DJ tracks. Celebrate togetherness with lights, dance, and festive energy!',
      location: 'Open-Air Amphitheatre',
      icon: Sparkles,
      featured: true,
    },
  ];

  const filteredPrograms = activeSession === 'all'
    ? programs
    : programs.filter((p) => p.session === activeSession);

  const handleAddCalendar = (id: string) => {
    setAddedCalendarId(id);
    setTimeout(() => setAddedCalendarId(null), 3000);
  };

  return (
    <section id="programs" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            <span>Festival Event Schedule</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Programs <span className="text-gold-gradient font-normal italic">&</span> Schedule
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            From morning Pookalam contest to afternoon Onasadya feast & evening Chenda Melam fusion.
          </p>
        </div>

        {/* Session Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-full bg-cream-soft border border-gold-royal/30 shadow-inner">
            {[
              { id: 'all', label: 'All Sessions', icon: Sparkles },
              { id: 'morning', label: 'Morning (8 AM - 1 PM)', icon: Sun },
              { id: 'afternoon', label: 'Afternoon (1 PM - 5 PM)', icon: Sunset },
              { id: 'evening', label: 'Evening (5 PM - 8 PM)', icon: Moon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSession === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSession(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-kerala-deep text-white shadow-md scale-105'
                      : 'text-slate-600 hover:text-kerala-deep'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gold-royal' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Cards Container */}
        <div className="relative max-w-4xl mx-auto space-y-6">
          
          {/* Vertical Connecting Gold Line */}
          <div className="absolute left-6 sm:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-gold-royal via-kerala-deep to-gold-royal hidden sm:block -translate-x-1/2 opacity-40" />

          {filteredPrograms.map((item, idx) => {
            const Icon = item.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.id}
                className={`relative flex flex-col sm:flex-row items-center gap-6 group transition-all duration-300 ${
                  isEven ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Timeline Center Node Badge */}
                <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border-2 border-gold-royal shadow-md items-center justify-center text-kerala-deep group-hover:scale-125 group-hover:bg-gold-royal group-hover:text-white transition-all z-10">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content Card */}
                <div className="w-full sm:w-[calc(50%-2.5rem)]">
                  <div
                    className={`bg-white rounded-3xl p-6 border ${
                      item.featured
                        ? 'border-gold-royal shadow-gold-glow bg-gradient-to-br from-white via-cream-soft to-white'
                        : 'border-slate-200/80 shadow-card-soft'
                    } hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1`}
                  >
                    {/* Top Row Time & Category Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-light/40 text-gold-dark text-xs font-bold font-sans">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>

                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-kerala-deep transition-colors mb-2">
                      {item.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Location & Reminder Row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium truncate max-w-[180px]">
                        📍 {item.location}
                      </span>

                      <button
                        onClick={() => handleAddCalendar(item.id)}
                        className="inline-flex items-center gap-1 text-kerala-deep hover:text-gold-dark font-bold transition-colors"
                      >
                        {addedCalendarId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Saved!</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5 text-gold-royal" />
                            <span>Remind Me</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
