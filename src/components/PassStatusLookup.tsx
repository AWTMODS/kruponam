import React, { useState } from 'react';
import { Search, CheckCircle2, Download, QrCode, ArrowLeft, UserCheck } from 'lucide-react';
import { findRegistration, type Registration } from '../services/registrationService';

interface LookupProps {
  onClose?: () => void;
}

export const PassStatusLookup: React.FC<LookupProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Registration | null | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const found = findRegistration(searchQuery);
    setSearchResult(found);
    setHasSearched(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gold-royal/40 shadow-card-hover max-w-3xl mx-auto my-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gold-royal/20 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-light/40 text-gold-dark flex items-center justify-center text-xl shadow-inner">
            🔍
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-kerala-deep">
              Check Pass Status & Download Badge
            </h3>
            <p className="text-xs text-slate-500">
              Enter your Email, Phone Number, or Registration ID (e.g. KRP-849201)
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="e.g. anand.nair@example.com or KRP-849201"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gold-royal/40 bg-cream-soft text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 transition-all"
          />
        </div>

        <button
          type="submit"
          className="px-8 py-3.5 rounded-full bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4 text-gold-royal" />
          <span>Track Pass Status</span>
        </button>
      </form>

      {/* Result Display */}
      {hasSearched && (
        <div className="animate-fadeIn">
          {searchResult === undefined || searchResult === null ? (
            /* Not Found State */
            <div className="p-8 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-600 font-bold text-xl">
                🔎
              </div>
              <h4 className="font-serif font-bold text-lg text-amber-900">No Registration Found</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                We couldn't find any registration matching "{searchQuery}". Please check your details or complete a new registration.
              </p>
            </div>
          ) : searchResult.approvalStatus === 'Approved' ? (
            /* APPROVED PASS STATE */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pass Approved by Admin! ₹700 Payment & Student ID Verified.</span>
              </div>

              {/* Gate Reported Banner */}
              {searchResult.isReported && (
                <div className="p-3.5 bg-emerald-700 text-white rounded-2xl text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md">
                  <UserCheck className="w-4 h-4 text-gold-royal" />
                  <span>REPORTED AT CAMPUS GATE ({searchResult.reportedAt}) • Onasadya Token Validated</span>
                </div>
              )}

              {/* Digital Pass Card */}
              <div className="kasavu-card rounded-3xl overflow-hidden shadow-2xl border-2 border-gold-royal bg-gradient-to-b from-white via-cream-warm to-white p-6 sm:p-8 relative">
                <div className="flex items-center justify-between pb-6 border-b border-gold-royal/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-kerala-deep text-gold-royal flex items-center justify-center text-xl font-bold shadow-md">
                      🌼
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-xl text-kerala-deep">Kruponam 2026</h3>
                      <p className="text-[10px] text-slate-500 font-sans uppercase tracking-widest font-bold">
                        Krupanidhi Degree College
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-gold-royal text-kerala-dark text-xs font-black uppercase tracking-wider shadow-sm">
                      {searchResult.ticketType}
                    </span>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      {searchResult.id}
                    </p>
                  </div>
                </div>

                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-8 space-y-3 text-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Attendee Name</p>
                      <p className="font-serif text-2xl font-bold text-kerala-deep">{searchResult.fullName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Department</p>
                        <p className="font-semibold">{searchResult.department}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Academic Year</p>
                        <p className="font-semibold">{searchResult.year}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Status</p>
                        <p className="font-semibold text-emerald-700">✓ ₹700 Paid ({searchResult.paymentUtr})</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Campus Gate Status</p>
                        <p className="font-semibold text-emerald-700">
                          {searchResult.isReported ? '✓ Reported & Checked In' : 'Ready for Entry'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gold-royal/30 shadow-inner">
                    <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center text-white">
                      <QrCode className="w-full h-full text-gold-light" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-2">Scan at Campus Gate</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-gold-royal/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>📍 Krupanidhi Campus • Aug 26, 2026</span>
                  <span>Approved: {searchResult.approvedAt || searchResult.submittedAt}</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-kerala-deep text-white text-xs font-bold uppercase tracking-wider hover:bg-kerala-emerald shadow-lg transition-all"
                >
                  <Download className="w-4 h-4 text-gold-royal" />
                  <span>Download / Print Official Pass</span>
                </button>
              </div>
            </div>
          ) : searchResult.approvalStatus === 'Pending' ? (
            <div className="p-8 bg-amber-50/90 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-700 font-bold text-2xl animate-pulse">
                ⏳
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                Pending Admin Approval
              </span>

              <h4 className="font-serif text-2xl font-bold text-amber-950">
                Application Under Verification
              </h4>

              <p className="text-slate-700 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Hello <span className="font-bold text-amber-900">{searchResult.fullName}</span>, your registration details, Student ID Card, and ₹700 Payment (UTR: <span className="font-mono font-bold">{searchResult.paymentUtr}</span>) have been received. The college admin committee is reviewing your details.
              </p>

              <div className="pt-2 text-xs text-amber-800 font-semibold">
                ⏱️ Estimated Approval Time: 2-4 Hours • Check back soon!
              </div>
            </div>
          ) : (
            <div className="p-8 bg-rose-50 border-2 border-rose-200 rounded-3xl text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto flex items-center justify-center text-rose-700 font-bold text-2xl">
                ❌
              </div>

              <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-extrabold uppercase tracking-wider">
                Application Rejected
              </span>

              <h4 className="font-serif text-2xl font-bold text-rose-950">
                Verification Issue Detected
              </h4>

              <div className="bg-white p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 font-medium max-w-md mx-auto">
                <span className="font-bold block mb-1">Reason provided by Admin:</span>
                "{searchResult.rejectionReason || 'Uploaded ID Card or Payment UTR could not be verified.'}"
              </div>

              <p className="text-slate-600 text-xs">
                Please re-submit your registration with a clear Student ID Card photo or valid ₹700 UTR number.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
