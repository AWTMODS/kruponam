import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: 'Is entry free for Krupanidhi Degree College students?',
      a: 'Yes! Entry is 100% free for all currently enrolled students, faculty members, and college staff. Please bring your physical College Student ID card or digital registration pass token.',
    },
    {
      q: 'What is the recommended dress code for Kruponam 2026?',
      a: 'We strongly encourage traditional Kerala ethnic attire! For women: Kasavu Sarees, Set-Mundu, or ethnic Kurtis. For men: Traditional Kerala Kasavu Mundu (Dhoti) or Kurta Pyjama.',
    },
    {
      q: 'How does the Onasadya lunch token system work?',
      a: 'When you register on this website, your digital pass serves as an official Onasadya food token. Simply present your pass QR code at the dining hall entrance between 1:00 PM and 2:30 PM.',
    },
    {
      q: 'Are non-Krupanidhi students or outside friends allowed to attend?',
      a: 'External guests and alumni are welcome to attend with a pre-registered VIP or Guest Pass. Make sure your guest completes the online registration form before arrival.',
    },
    {
      q: 'How do departments register for the Pookalam & Tug-of-War contests?',
      a: 'Department class representatives can register their team (up to 8 members) with the Cultural Secretary or via the Student Council lead before Sep 11th.',
    },
    {
      q: 'Is parking available on campus during the event?',
      a: 'Yes, designated free two-wheeler and four-wheeler campus parking will be available near the college main gate on a first-come, first-served basis.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Frequently Asked <span className="text-gold-gradient font-normal italic">Questions</span>
          </h2>
          <p className="text-slate-600 text-base">
            Everything you need to know about pass retrieval, dress code, and event guidelines.
          </p>
        </div>

        <div className="relative mb-8 max-w-lg mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions (e.g. dress code, food, parking)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full border border-gold-royal/30 bg-cream-soft text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all"
          />
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-gold-royal/25 rounded-2xl overflow-hidden bg-cream-warm shadow-sm transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-serif text-lg font-bold text-slate-800 flex items-center justify-between gap-4 hover:text-kerala-deep transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gold-dark shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-gold-royal/10 pt-3 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
