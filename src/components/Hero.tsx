import { useState } from 'react';
import { Ticket, Calendar, MapPin, Sparkles, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { getAssetUrl } from '../utils/assetPath';

export const Hero = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <section id="home" className="relative pt-28 pb-16 lg:pt-36 lg:pb-28 overflow-hidden bg-cream-gradient">
      
      {/* Background Kerala Design Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-br from-gold-light/20 via-kerala-mint/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-royal/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-light/60 via-amber-100 to-gold-light/60 border border-gold-royal/40 text-gold-dark shadow-sm animate-bounce-subtle">
              <Sparkles className="w-4 h-4 text-gold-dark animate-pulse" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans">
                Krupanidhi Degree College Presents
              </span>
              <span className="w-2 h-2 rounded-full bg-gold-royal animate-ping" />
            </div>

            {/* Main Main Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <span className="text-gold-royal text-2xl sm:text-3xl">🪷</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest text-gold-dark font-bold font-sans">
                  Celebrate Tradition. Celebrate Together.
                </span>
                <span className="text-gold-royal text-2xl sm:text-3xl">🪷</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-kerala-deep leading-[1.05]">
                Kruponam <span className="text-gold-gradient font-normal italic text-4xl sm:text-5xl md:text-6xl block sm:inline">2026</span>
              </h1>
              
              <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-slate-700 font-medium pt-1">
                An Annual Onam Cultural Extravaganza
              </p>
            </div>

            {/* Sub-description */}
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Step into the vibrant spirit of Kerala! Immerse yourself in grand Chenda Melam rhythms, traditional Thiruvathirakali dance, Pookalam floral carpet contests, games, and an authentic 24-item <span className="font-semibold text-kerala-deep underline decoration-gold-royal">Onasadya Feast</span>.
            </p>

            {/* Key Quick Info Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs sm:text-sm text-slate-700 font-semibold">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-gold-royal/30 shadow-sm">
                <Calendar className="w-4 h-4 text-gold-royal" />
                <span>26 August 2026</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-gold-royal/30 shadow-sm">
                <MapPin className="w-4 h-4 text-kerala-deep" />
                <span>Krupanidhi Campus, Bengaluru</span>
              </div>
            </div>

            {/* Primary & Secondary Call to Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#registration"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white uppercase tracking-wider bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep rounded-full shadow-gold-glow hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <span>Register Free Pass</span>
                <Ticket className="w-4 h-4 text-gold-royal group-hover:rotate-12 transition-transform" />
              </a>

              <a
                href="#programs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-bold text-slate-800 bg-white/90 hover:bg-cream-soft border border-gold-royal/50 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group"
              >
                <span>Explore Schedule</span>
                <ArrowRight className="w-4 h-4 text-gold-royal group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Audio Ambience Toggle Button */}
              <button
                onClick={toggleAudio}
                className="p-3.5 rounded-full bg-white/80 border border-gold-royal/40 text-kerala-deep hover:bg-gold-light/20 transition-all shadow-sm flex items-center gap-2 text-xs font-semibold"
                title="Toggle Onam Ambient Rhythm"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-4 h-4 text-gold-royal animate-pulse" />
                    <span className="hidden xl:inline text-gold-dark">Rhythm On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span className="hidden xl:inline text-slate-500">Music</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Live Stats Row */}
            <div className="pt-6 border-t border-gold-royal/20 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <p className="font-serif text-2xl sm:text-3xl font-extrabold text-kerala-deep">1000+</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Students & Guests</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif text-2xl sm:text-3xl font-extrabold text-gold-dark">15+</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Cultural Events</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif text-2xl sm:text-3xl font-extrabold text-kerala-deep">24-Item</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Grand Sadya</p>
              </div>
            </div>

          </div>

          {/* Right Column Visual Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Kerala Ornamental Gold Circular Frame Behind Image */}
            <div className="absolute inset-0 m-auto w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border-2 border-dashed border-gold-royal/40 animate-spin-slow pointer-events-none" />
            <div className="absolute inset-0 m-auto w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] rounded-full bg-gradient-to-tr from-gold-light/20 via-kerala-mint/40 to-transparent blur-xl pointer-events-none" />

            {/* Main Visual Illustration matching reference design */}
            <div className="relative z-10 rounded-3xl p-3 bg-white/90 shadow-2xl border-2 border-gold-royal/40 backdrop-blur-md transform hover:scale-[1.02] transition-transform duration-500 group">
              
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-cream-soft to-amber-50">
                <img
                  src={getAssetUrl('images/hero_illustration.png')}
                  alt="Kruponam Onam Festival King Mahabali & Vallam Kali"
                  className="w-full h-auto object-cover max-h-[520px] rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlay Badge Top Right */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold-royal/40 shadow-md flex items-center gap-1.5 text-xs font-bold text-kerala-deep">
                  <span className="text-amber-500 animate-pulse">👑</span>
                  <span>King Mahabali's Welcome</span>
                </div>

                {/* Overlay Floating Pill Bottom Left */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-lg p-3 rounded-2xl border border-gold-royal/30 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-light/40 flex items-center justify-center text-xl shadow-inner">
                      🌴
                    </div>
                    <div>
                      <p className="text-xs font-bold text-kerala-deep">Traditional Onam Vibe</p>
                      <p className="text-[11px] text-slate-500">Krupanidhi Degree College</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-kerala-mint text-kerala-deep text-[11px] font-bold">
                    Aug 26
                  </span>
                </div>

              </div>

            </div>

            {/* Decorative Floating Lotus Elements */}
            <div className="absolute -top-6 -left-6 z-20 hidden sm:block animate-float-slow">
              <div className="p-3 bg-white/90 rounded-2xl shadow-lg border border-gold-royal/30 text-2xl">
                🪔
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 z-20 hidden sm:block animate-float-slow" style={{ animationDelay: '2s' }}>
              <div className="p-3 bg-white/90 rounded-2xl shadow-lg border border-gold-royal/30 text-2xl">
                🏵️
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
