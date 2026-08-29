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
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      description:
        'All pass bookings and ₹700 payment fees are strictly non-refundable and non-transferable under any circumstances once booked. No cancellation or refund requests will be entertained.',
      color: 'bg-white border-rose-200 hover:border-rose-300',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200',
    },
    {
      icon: Flame,
      title: '700 Passes Limit • First-Come Basis',
      badge: 'Strict 700 Cap',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description:
        'Total event capacity is strictly capped at 700 passes. Once 700 tickets are claimed, no additional add-on passes will be issued. Passes are allocated strictly on a first-to-pay basis.',
      color: 'bg-white border-amber-200 hover:border-amber-300',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200',
    },
    {
      icon: MailCheck,
      title: 'Guaranteed Ticket Dispatch (Email / WhatsApp)',
      badge: 'Guaranteed Delivery',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description:
        'After your Student ID is approved, complete your ₹700 UPI payment. Your official scanner-ready QR pass & GST invoice are guaranteed to be delivered to your email and accessible via WhatsApp.',
      color: 'bg-white border-emerald-200 hover:border-emerald-300',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
    },
    {
      icon: ShieldCheck,
      title: 'Mandatory Student ID Verification',
      badge: 'Stage 1 Verification',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description:
        'Stage 1 requires submitting your Student ID Card. Once the Admin Committee approves your ID card, payment is unlocked. Only valid students with approved IDs are granted entry.',
      color: 'bg-white border-blue-200 hover:border-blue-300',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
    },
  ];

  return (
    <section id="guidelines" className="py-20 lg:py-28 bg-cream-soft relative overflow-hidden">
      {/* Background Decorative Gold Ambient Circles */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gold-royal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-kerala-mint/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Official Event Regulations</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Booking Terms <span className="text-gold-gradient font-normal italic">&</span> Pass Guidelines
          </h2>

          <p className="text-slate-600 text-base sm:text-lg">
            Please review the official admission and ticket rules for <strong className="text-kerala-deep font-bold">Kruponam 2026</strong> scheduled for <strong className="text-kerala-deep font-bold">Monday, 14 September 2026</strong> at PSR Convention Centre.
          </p>
        </div>

        {/* 4 Cards Grid with Warm Cream / White Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {guidelines.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-7 sm:p-8 rounded-3xl ${item.color} border-2 shadow-card-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 relative group`}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-3 group-hover:text-kerala-deep transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner (Royal Kerala Green Theme) */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-kerala-deep via-kerala-dark to-kerala-deep text-white border-2 border-gold-royal/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2 text-gold-light text-xs font-black uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-gold-royal" />
              <span>Official Event Date: Monday, 14 September 2026 • 8:00 AM Onwards</span>
            </div>
            <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
              Limited to 700 Passes Only • First-Come, First-Served!
            </h4>
            <p className="text-xs text-slate-200 max-w-2xl">
              Register your Student ID early. Once approved, complete your ₹700 pass fee immediately to secure your Onasadya feast token and official entry ticket.
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
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/30 transition-all hover:scale-105 cursor-pointer"
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
