import React, { useState } from 'react';
import { BookOpen, Sparkles, Crown, Heart, Landmark, ChevronRight } from 'lucide-react';

export const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'what' | 'history' | 'why' | 'college'>('what');

  const aboutTabs = [
    {
      id: 'what',
      label: 'What is Kruponam?',
      icon: Sparkles,
      title: 'The Grand Onam Extravaganza at Krupanidhi',
      description:
        'Kruponam is Krupanidhi Degree College’s signature annual Onam festival celebration. It brings together over 1000+ students, faculty members, alumni, and guests to honor Kerala’s rich cultural legacy. Featuring traditional music, folk dances, flower carpet designs, competitive sports, and a lavish Onasadya feast, Kruponam is a true festival of joy and harmony.',
      highlights: [
        'Over 1000+ Students & Guests Joining',
        '24+ Authentic Kerala Dishes in Onasadya',
        'Inter-Departmental Pookalam & Cultural Contests',
        'Traditional Chenda Melam & Pulikali Performances',
      ],
      image: '/images/pookalam.png',
    },
    {
      id: 'history',
      label: 'History & Legend',
      icon: Crown,
      title: 'The Golden Reign of King Mahabali',
      description:
        'Onam marks the homecoming of the mythical Asura King Mahabali (Maveli), whose reign in Kerala was considered a golden age of peace, prosperity, and total equality. Moved by his devotion and selfless promise, Lord Vishnu granted King Mahabali permission to visit his beloved people once every year during the harvest month of Chingam.',
      highlights: [
        'A Golden Age of Truth and Equality',
        'Homecoming of Maveli (King Mahabali)',
        'Celebrated in the Malayalam Harvest Month Chingam',
        'Symbol of Unity, Joy, and Generosity',
      ],
      image: '/images/hero_illustration.png',
    },
    {
      id: 'why',
      label: 'Why Celebrate Onam?',
      icon: Heart,
      title: 'A Festival of Prosperity & Unity',
      description:
        'Beyond religious boundaries, Onam is Kerala’s state harvest festival celebrated across communities worldwide. It represents gratitude for the earth’s bounty, togetherness among friends and family, and the joy of sharing meals on fresh banana leaves (Sadya). Kruponam embodies this spirit of inclusivity on our campus.',
      highlights: [
        'Transcends All Cultural Boundaries',
        'Gratitude for Nature’s Harvest',
        'Preserving Kerala’s Traditional Performing Arts',
        'Fostering Lifelong Campus Memories',
      ],
      image: '/images/thiruvathira.png',
    },
    {
      id: 'college',
      label: 'About Krupanidhi',
      icon: Landmark,
      title: 'Excellence in Education & Cultural Heritage',
      description:
        'Krupanidhi Degree College is a premier higher education institution in Bengaluru, known for academic excellence, holistic student development, and vibrant cultural diversity. Through annual events like Kruponam, Krupanidhi empowers students to stay rooted in tradition while aiming for global success.',
      highlights: [
        'Top-Ranked Institution in Bengaluru',
        'Diverse Multicultural Student Community',
        'State-of-the-Art Campus & Facilities',
        'Vibrant Student Clubs & Cultural Leadership',
      ],
      image: '/images/onasadya.png',
    },
  ];

  const currentData = aboutTabs.find((t) => t.id === activeTab) || aboutTabs[0];

  return (
    <section id="about" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      
      {/* Decorative Golden Pattern Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold-royal to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Discover Our Legacy</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            About Kruponam <span className="text-gold-gradient font-normal italic">&</span> Tradition
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Uniting cultural heritage, joyful festivities, and campus togetherness in one unforgettable celebration.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {aboutTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-kerala-deep text-white shadow-kerala-glow scale-105'
                    : 'bg-cream-soft text-slate-700 hover:bg-gold-light/40 border border-gold-royal/20'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold-royal' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-gold-royal/30 shadow-card-hover transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Description Column */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-kerala-deep">
                {currentData.title}
              </h3>
              
              <p className="text-slate-700 leading-relaxed text-base">
                {currentData.description}
              </p>

              {/* Bullet Points */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-gold-dark font-sans">
                  Key Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentData.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-cream-soft/80 border border-gold-royal/20">
                      <span className="w-5 h-5 rounded-full bg-gold-light/50 text-gold-dark font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <a
                  href="#programs"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-kerala-deep hover:text-gold-dark transition-colors group"
                >
                  <span>Explore Festival Events Schedule</span>
                  <ChevronRight className="w-4 h-4 text-gold-royal group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Visual Image Column */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-gold-royal/30 relative group">
                <img
                  src={currentData.image}
                  alt={currentData.title}
                  className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                  <span className="text-white font-serif font-bold text-lg drop-shadow-md">
                    {currentData.label} — Kruponam 2026
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
