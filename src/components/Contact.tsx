import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  const aadithWhatsappUrl = "https://wa.me/919072428800?text=Hi%20Aadith,%20I%20have%20a%20query%20regarding%20Kruponam%202026";

  return (
    <section id="contact" className="py-20 lg:py-28 bg-cream-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reach Out To Organizers</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Contact Organizers <span className="text-gold-gradient font-normal italic">&</span> Location
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Have questions about Kruponam 2026? Connect directly with organizer Aadith on WhatsApp or visit our campus.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Contact Info & WhatsApp Card */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Primary Contact Card featuring Aadith WhatsApp */}
            <div className="bg-gradient-to-br from-emerald-900 via-kerala-deep to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>WhatsApp Contact</span>
                </div>
                <span className="text-2xl">💬</span>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-white">Aadith</h3>
                <p className="text-xs text-emerald-200 mt-0.5">Event Organizer & Coordinator</p>
                <p className="text-lg font-mono font-bold text-gold-amber mt-2">+91 90724 28800</p>
              </div>

              <a
                href={aadithWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/50 hover:scale-[1.02] transition-all duration-300 group"
              >
                <MessageSquare className="w-5 h-5 fill-slate-950 text-emerald-500" />
                <span>Chat with Aadith on WhatsApp</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>

            </div>

            {/* Campus Location Card */}
            <div className="bg-white rounded-3xl p-6 border border-gold-royal/30 shadow-card-soft space-y-5">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold-light/30 text-gold-dark flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Campus Location</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Krupanidhi Degree College, Chikkabellandur, Carmelaram Road, Off Sarjapur Road, Bengaluru, Karnataka 560035
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-kerala-mint text-kerala-deep flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Phone Contact</h3>
                  <a
                    href="tel:+919072428800"
                    className="text-xs text-gold-dark font-mono font-bold hover:underline block mt-1"
                  >
                    +91 90724 28800 (Aadith)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gold-light/30 text-gold-dark flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">Email Address</h3>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    kruponam@krupanidhi.edu.in
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Direct Message Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gold-royal/40 shadow-card-hover">
            
            <h3 className="font-serif text-2xl font-bold text-kerala-deep mb-2">
              Send a Direct Message
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Our student council and conveners will reply within a few hours.
            </p>

            {submitted ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-xl font-bold text-emerald-900">Message Delivered!</h4>
                <p className="text-xs text-emerald-700">
                  Thank you for reaching out. We look forward to welcoming you at Kruponam 2026!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Subject (e.g., Pass Help / General Inquiry)"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all"
                />

                <textarea
                  rows={4}
                  required
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all"
                />

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-gradient-to-r from-kerala-deep to-kerala-emerald text-white text-xs font-bold uppercase tracking-wider hover:shadow-gold-glow transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-gold-royal" />
                  <span>Send Message</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

