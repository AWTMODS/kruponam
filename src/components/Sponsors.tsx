import React, { useState } from 'react';
import { Award, Sparkles, X, Send } from 'lucide-react';

export const Sponsors: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const sponsorTiers = [
    {
      tierName: 'Gold Partners',
      tierBadge: '👑 Title Sponsor',
      color: 'from-amber-500/20 via-gold-light/40 to-amber-500/20',
      borderColor: 'border-gold-royal',
      badgeColor: 'bg-gold-royal text-kerala-dark',
      logos: [
        { name: 'Kerala Tourism', logo: '🌴', desc: 'God’s Own Country Tourism' },
        { name: 'Kalyan Silks', logo: '✨', desc: 'Traditional Ethnic Wear Partner' },
        { name: 'Federal Bank', logo: '🏦', desc: 'Banking & Financial Partner' },
      ],
    },
    {
      tierName: 'Silver Partners',
      tierBadge: '⭐ Cultural Associate',
      color: 'from-slate-200/40 via-white to-slate-200/40',
      borderColor: 'border-slate-300',
      badgeColor: 'bg-slate-700 text-white',
      logos: [
        { name: 'Malabar Gold & Diamonds', logo: '💎', desc: 'Jewelry & Souvenir Sponsor' },
        { name: 'Milma Dairy', logo: '🥛', desc: 'Official Beverage Partner' },
        { name: 'Nandini Dairy', logo: '🧈', desc: 'Sadya Ghee & Milk Partner' },
        { name: 'Red FM 93.5', logo: '📻', desc: 'Official Radio & Media Partner' },
      ],
    },
    {
      tierName: 'Bronze Partners',
      tierBadge: '🥉 Event Supporters',
      color: 'from-amber-100/30 via-white to-amber-100/30',
      borderColor: 'border-amber-700/30',
      badgeColor: 'bg-amber-800 text-white',
      logos: [
        { name: 'Grand Kerala Caterers', logo: '🍛', desc: 'Onasadya Culinary Team' },
        { name: 'Decathlon Sports', logo: '⚽', desc: 'Vadam Vali Sports Gear' },
        { name: 'Flora Flowers', logo: '🌺', desc: 'Pookalam Floral Partner' },
      ],
    },
  ];

  return (
    <section id="sponsors" className="py-20 lg:py-28 bg-cream-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Award className="w-3.5 h-3.5" />
            <span>Valued Brand Partners</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Event Sponsors <span className="text-gold-gradient font-normal italic">&</span> Partners
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Grateful to our distinguished partners supporting traditional arts, student talent, and culture.
          </p>
        </div>

        <div className="space-y-12">
          {sponsorTiers.map((tier, idx) => (
            <div key={idx} className="space-y-6">
              
              <div className="flex items-center gap-3 justify-center">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${tier.badgeColor}`}>
                  {tier.tierBadge}
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-800">
                  {tier.tierName}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tier.logos.map((brand, bIdx) => (
                  <div
                    key={bIdx}
                    className={`bg-gradient-to-br ${tier.color} rounded-3xl p-6 border-2 ${tier.borderColor} shadow-card-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 group cursor-pointer`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm border border-gold-royal/20 group-hover:scale-110 transition-transform">
                      {brand.logo}
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-lg text-slate-900 group-hover:text-kerala-deep transition-colors">
                        {brand.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {brand.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-white rounded-3xl p-8 border border-gold-royal/30 shadow-lg max-w-2xl mx-auto space-y-3">
          <h3 className="font-serif text-2xl font-bold text-kerala-deep">
            Interested in Sponsoring Kruponam 2026?
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm">
            Partner with Krupanidhi Degree College to showcase your brand to over 1000+ students and visitors.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-kerala-deep text-white text-xs font-bold uppercase tracking-wider hover:bg-kerala-emerald shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold-royal" />
              <span>Become a Sponsor</span>
            </button>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-gold-royal relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-light/40 flex items-center justify-center text-gold-dark font-bold text-xl">
                  🤝
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-kerala-deep">
                    Sponsorship Inquiry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect with Kruponam 2026 Organizing Committee
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert('Sponsorship inquiry received! Our team will contact you within 24 hours.'); setShowModal(false); }} className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  placeholder="Company / Brand Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal"
                />
                <input
                  type="email"
                  required
                  placeholder="Contact Email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal"
                />
                <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal bg-white">
                  <option value="Gold Tier">Gold Partner (Title Sponsor)</option>
                  <option value="Silver Tier">Silver Partner</option>
                  <option value="Bronze Tier">Bronze Supporter</option>
                  <option value="Stall Partner">Food / Stall Partner</option>
                </select>
                <textarea
                  rows={3}
                  placeholder="Brief message or requirement..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-gold-royal" />
                  <span>Send Inquiry</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
