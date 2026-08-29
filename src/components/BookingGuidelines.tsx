import React from 'react';
import { ShieldAlert, AlertOctagon, MailCheck, Flame, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface BookingGuidelinesProps {
  onOpenLookup?: () => void;
}

export const BookingGuidelines: React.FC<BookingGuidelinesProps> = ({ onOpenLookup }) => {
  const guidelines = [
    {
      icon: AlertOctagon,
      title: 'Strict No-Refund Policy',
      badge: 'Non-Refundable',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      description:
        'All pass bookings and ₹700 payment fees are strictly non-refundable and non-transferable under any circumstances once booked. No cancellation requests will be entertained.',
      color: 'from-rose-950/60 to-slate-900 border-rose-500/30',
      iconColor: 'text-rose-400',
    },
    {
      icon: Flame,
      title: '700 Passes Limit • First-Come Basis',
      badge: 'Strict 700 Cap',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description:
        'Event capacity is strictly capped at 700 passes. Once 700 tickets are claimed, no add-on passes will be issued. Passes are allocated strictly to those who pay first.',
      color: 'from-amber-950/60 to-slate-900 border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      icon: MailCheck,
      title: 'Guaranteed Ticket Dispatch (Email / WhatsApp)',
      badge: 'Guaranteed Delivery',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description:
        'After your Student ID is verified, complete your ₹700 UPI payment. Your official scanner-ready QR pass & GST invoice are guaranteed to be emailed to you and tracked live on WhatsApp.',
      color: 'from-emerald-950/60 to-slate-900 border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      icon: ShieldCheck,
      title: 'Mandatory Student ID Verification',
      badge: 'Stage 1 Verification',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      description:
        'Stage 1 requires submitting your Student ID Card. Once the Admin Committee approves your ID, payment is unlocked. Only valid college students are granted gate entry.',
      color: 'from-blue-950/60 to-slate-900 border-blue-500/30',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <section id="guidelines" className="py-20 bg-slate-950 text-white relative overflow-hidden border-y border-gold-royal/20">
      {/* Background Kerala Gold Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-royal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-kerala-emerald/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-royal/10 border border-gold-royal/40 text-gold-light text-xs font-black uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-gold-royal" />
            <span>Official Event Regulations</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Booking Terms <span className="text-gold-gradient font-normal italic">&</span> Pass Guidelines
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Please review the official admission and ticket rules for <strong className="text-gold-light">Kruponam 2026</strong> scheduled for <strong className="text-white">Monday, 14 September 2026</strong> at PSR Convention Centre.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {guidelines.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-7 sm:p-8 rounded-3xl bg-gradient-to-br ${item.color} border shadow-xl hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden`}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-gold-light transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-gold-royal/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2 text-gold-light text-xs font-black uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-gold-royal" />
              <span>Event Date: Monday, 14 September 2026 • 8:00 AM Onwards</span>
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
              Limited to 700 Passes Only • First-Come, First-Served!
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl">
              Don't wait! Register your Student ID early. Once approved, complete the ₹700 pass fee immediately to secure your Onasadya feast token and official entry ticket.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="#registration"
              className="px-7 py-3.5 rounded-full bg-gold-royal text-slate-950 hover:bg-gold-light font-black text-xs uppercase tracking-wider shadow-gold-glow transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Register Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {onOpenLookup && (
              <button
                onClick={onOpenLookup}
                className="px-6 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-600 transition-all hover:scale-105 cursor-pointer"
              >
                Track Pass Status
              </button>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
