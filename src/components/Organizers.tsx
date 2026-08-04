import React from 'react';
import { Users, Mail } from 'lucide-react';

export const Organizers: React.FC = () => {
  const team = [
    {
      name: 'Dr. S. K. Subramanian',
      position: 'Chief Event Patron & Principal',
      dept: 'Krupanidhi Degree College',
      avatar: '👨‍🏫',
      bio: 'Guiding Krupanidhi Degree College to academic & cultural excellence.',
      email: 'principal@krupanidhi.edu.in',
    },
    {
      name: 'Prof. Anitha Nair',
      position: 'Faculty Cultural Convener',
      dept: 'Department of Humanities',
      avatar: '👩‍🏫',
      bio: 'Lead coordinator for Onam cultural events, Thiruvathira, and stage productions.',
      email: 'anitha.nair@krupanidhi.edu.in',
    },
    {
      name: 'Adithya V. Menon',
      position: 'Student Council President',
      dept: 'BCA 3rd Year',
      avatar: '👨‍🎓',
      bio: 'Heading the student organizing committee for Kruponam 2026.',
      email: 'adithya.m@student.krupanidhi.edu.in',
    },
    {
      name: 'Meera Rajagopal',
      position: 'Cultural Secretary',
      dept: 'B.Com 3rd Year',
      avatar: '👩‍🎓',
      bio: 'Overseeing Pookalam competitions, music bands, and Onasadya logistics.',
      email: 'meera.r@student.krupanidhi.edu.in',
    },
  ];

  return (
    <section id="organizers" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            <span>Meet the Leadership</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Organizers <span className="text-gold-gradient font-normal italic">&</span> Committee
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Dedicated faculty conveners and student leaders bringing Kruponam 2026 to life.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, idx) => (
            <div
              key={idx}
              className="bg-cream-soft rounded-3xl p-6 border border-gold-royal/30 shadow-card-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 text-center flex flex-col justify-between group"
            >
              <div>
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-kerala-deep via-gold-royal to-floral-yellow p-1 shadow-gold-glow mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-4xl shadow-inner">
                    {member.avatar}
                  </div>
                </div>

                <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-kerala-deep transition-colors mb-1">
                  {member.name}
                </h3>
                
                <span className="inline-block px-3 py-1 rounded-full bg-gold-light/40 text-gold-dark text-xs font-bold font-sans mb-2">
                  {member.position}
                </span>

                <p className="text-xs font-semibold text-slate-400 mb-3">
                  {member.dept}
                </p>

                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {member.bio}
                </p>
              </div>

              <div className="pt-4 border-t border-gold-royal/20 flex justify-center gap-3">
                <a
                  href={`mailto:${member.email}`}
                  className="p-2 rounded-full bg-white text-slate-600 hover:text-kerala-deep hover:bg-gold-light/30 transition-colors shadow-sm"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-white text-slate-600 hover:text-kerala-deep hover:bg-gold-light/30 transition-colors shadow-sm text-xs font-bold"
                  title="Instagram Profile"
                >
                  IG
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-white text-slate-600 hover:text-kerala-deep hover:bg-gold-light/30 transition-colors shadow-sm text-xs font-bold"
                  title="LinkedIn Profile"
                >
                  IN
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
