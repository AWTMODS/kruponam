import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, Download, QrCode, ArrowLeft, UserCheck, Mail, RefreshCw, CreditCard, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { findRegistration, findRegistrationAsync, submitPaymentForRegistration, saveRegistrationAsync, isUtrAlreadyUsed, syncCloudRegistrations, type Registration } from '../services/registrationService';
import { sendApprovalEmail, generateQrCode } from '../services/emailService';
import { getUpiSettings, recordPaymentToActiveSlot } from '../services/upiSettingsService';
import { fetchActiveUpiSlotFromFirebase } from '../services/firebaseService';
import { getSiteSettings } from '../services/siteSettingsService';

interface LookupProps {
  onClose?: () => void;
}

const compressImageToDataUrl = (
  file: File, 
  maxSizeBytes = 500 * 1024, 
  initialMaxWidth = 1000, 
  initialQuality = 0.75
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        let maxWidth = initialMaxWidth;
        let quality = initialQuality;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Guarantee output size <= 500 KB
        let attempts = 0;
        while (dataUrl.length * 0.75 > maxSizeBytes && attempts < 8) {
          attempts++;
          quality -= 0.1;
          if (quality < 0.3) {
            maxWidth = Math.round(maxWidth * 0.75);
            width = Math.round(width * 0.75);
            height = Math.round(height * 0.75);
            canvas.width = Math.max(width, 100);
            canvas.height = Math.max(height, 100);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            quality = 0.6;
          }
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const PassStatusLookup: React.FC<LookupProps> = ({ onClose }) => {
  const [ticketAmount, setTicketAmount] = useState<number>(() => getSiteSettings().ticketAmount);

  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && typeof customEv.detail.ticketAmount === 'number') {
        setTicketAmount(customEv.detail.ticketAmount);
      }
    };
    window.addEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('kruponam-site-settings-changed', handleSettingsChanged);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Registration | null | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Stage 2 Payment fields inside lookup
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [ticketTheme, setTicketTheme] = useState<'light' | 'dark'>('light');

  // Resubmit / Re-upload state for rejected applications
  const [resubmitName, setResubmitName] = useState('');
  const [reuploadIdFile, setReuploadIdFile] = useState<File | null>(null);
  const [reuploadIdPreview, setReuploadIdPreview] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [resubmitSuccessNotice, setResubmitSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (searchResult) {
      setResubmitName(searchResult.fullName);
    }
  }, [searchResult]);

  const handleReuploadIdCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReuploadIdFile(file);
      const compressed = await compressImageToDataUrl(file);
      setReuploadIdPreview(compressed);
    }
  };

  const handleResubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResult) return;

    if (!reuploadIdPreview && !searchResult.idCardUrl) {
      setPaymentError('Please upload a clear photo of your Student ID Card.');
      return;
    }

    setIsResubmitting(true);
    setPaymentError(null);

    const updated: Registration = {
      ...searchResult,
      fullName: resubmitName.trim() || searchResult.fullName,
      idCardUrl: reuploadIdPreview || searchResult.idCardUrl,
      approvalStatus: 'Pending_ID_Approval',
      rejectionReason: undefined,
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const saved = await saveRegistrationAsync(updated);
    setIsResubmitting(false);
    setSearchResult(saved);
    setResubmitSuccessNotice('🎉 Your application & Student ID Card have been resubmitted successfully! Admin will re-verify your ID Card shortly.');
  };

  const [upiSettings, setUpiSettings] = useState(getUpiSettings());
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string>('');

  // Fetch live active UPI slot from Firebase so students always get the latest QR
  useEffect(() => {
    fetchActiveUpiSlotFromFirebase().then((liveSlot) => {
      if (liveSlot && liveSlot.upiId) {
        setUpiSettings({
          upiId: liveSlot.upiId,
          merchantName: liveSlot.merchantName,
          qrImageDataUrl: null, // QR generated client-side from upiId
          amount: getSiteSettings().ticketAmount,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchResult && searchResult.approvalStatus === 'Approved') {
      generateQrCode(`KRUPONAM2026|TOKEN:${searchResult.id}|NAME:${searchResult.fullName}|DEPT:${searchResult.department}|UTR:${searchResult.paymentUtr}`).then((url) => {
        setQrCodeUrl(url);
      });
    } else {
      setQrCodeUrl('');
    }
  }, [searchResult]);

  useEffect(() => {
    if (upiSettings.qrImageDataUrl) {
      setUpiQrCodeUrl(upiSettings.qrImageDataUrl);
    } else {
      generateQrCode(`upi://pay?pa=${upiSettings.upiId}&pn=Kruponam2026&am=${ticketAmount}&cu=INR`).then((url) => {
        setUpiQrCodeUrl(url);
      });
    }
  }, [upiSettings, ticketAmount]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-scroll page to top & focus search input field immediately on mount
  useEffect(() => {
    syncCloudRegistrations().catch(() => {});
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInputRef.current.focus();
      }
    }, 150);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setPaymentError(null);
    setHasSearched(true);

    // 1. Show instant cached match immediately if available
    const instantMatch = findRegistration(searchQuery);
    if (instantMatch) {
      setSearchResult(instantMatch);
    } else {
      setSearchResult(undefined);
    }

    // 2. Fetch fresh live status from cloud DB (Firebase & Supabase)
    try {
      const latest = await findRegistrationAsync(searchQuery);
      setSearchResult(latest || instantMatch || null);
    } catch (err) {
      console.warn('Live lookup search notice:', err);
      if (!instantMatch) setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaymentScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshotFile(file);
      const compressed = await compressImageToDataUrl(file);
      setPaymentScreenshotPreview(compressed);
      setPaymentError(null);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResult) return;
    setPaymentError(null);

    if (!paymentUtr || paymentUtr.trim().length < 6) {
      setPaymentError('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    if (isUtrAlreadyUsed(paymentUtr, searchResult.id)) {
      setPaymentError(`⚠️ The UTR / Transaction ID (${paymentUtr.trim()}) has already been used for another registration.`);
      return;
    }

    if (!paymentScreenshotPreview) {
      setPaymentError('Please upload your Payment Screenshot showing the UTR / Ref ID clearly.');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      recordPaymentToActiveSlot();
    } catch (_) {}

    const updated = await submitPaymentForRegistration(searchResult.id, paymentUtr, paymentScreenshotPreview);
    setIsSubmittingPayment(false);

    if (updated) {
      setSearchResult(updated);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPaymentQr = async () => {
    if (!upiQrCodeUrl) return;
    try {
      const response = await fetch(upiQrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Kruponam2026_Payment_QR.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (_) {
      window.open(upiQrCodeUrl, '_blank');
    }
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
              Check Pass Status & Complete Payment
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
            ref={searchInputRef}
            type="text"
            required
            placeholder="e.g. 9072428800, anand.nair@example.com, or KRP-849201"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gold-royal/40 bg-cream-soft text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="px-8 py-3.5 rounded-full bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSearching ? (
            <RefreshCw className="w-4 h-4 text-gold-royal animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gold-royal" />
          )}
          <span>{isSearching ? 'Searching...' : 'Track Pass Status'}</span>
        </button>
      </form>

      {/* Result Display */}
      {hasSearched && (
        <div className="animate-fadeIn">
          {isSearching && !searchResult ? (
            /* Searching Spinner State Card */
            <div className="p-8 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-3 shadow-sm">
              <RefreshCw className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <h4 className="font-serif font-bold text-lg text-amber-950">Searching Cloud Database...</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Checking live pass registrations in Kruponam event system for "{searchQuery}".
              </p>
            </div>
          ) : searchResult === null ? (
            /* Not Found State (Only shown after search completes) */
            <div className="p-8 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-600 font-bold text-xl">
                🔎
              </div>
              <h4 className="font-serif font-bold text-lg text-amber-900">No Registration Found</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                We couldn't find any registration matching "{searchQuery}". Please check your details or complete a new registration.
              </p>
            </div>
          ) : searchResult?.approvalStatus === 'Approved' ? (
            /* APPROVED PASS STATE */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pass Approved by Admin! ₹{searchResult.paymentAmount || ticketAmount} Payment & Student ID Verified.</span>
              </div>

              {/* Gate Reported Banner */}
              {searchResult.isReported && (
                <div className="p-3.5 bg-emerald-700 text-white rounded-2xl text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md">
                  <UserCheck className="w-4 h-4 text-gold-royal" />
                  <span>REPORTED AT CAMPUS GATE ({searchResult.reportedAt}) • Onasadya Token Validated</span>
                </div>
              )}

              {/* Pass Theme Toggle Bar */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Event Entry Badge</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-gold-royal/30">
                  <button
                    type="button"
                    onClick={() => setTicketTheme('light')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                      ticketTheme === 'light'
                        ? 'bg-gold-royal text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ☀️ Light Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketTheme('dark')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                      ticketTheme === 'dark'
                        ? 'bg-slate-900 text-gold-amber border border-gold-royal/40 shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌙 Dark Mode
                  </button>
                </div>
              </div>

              {/* Digital Pass Card (Light & Dark Mode Optimized) */}
              <div
                className={`rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-300 p-6 sm:p-8 relative ${
                  ticketTheme === 'dark'
                    ? 'bg-slate-950 text-slate-100 border-gold-royal/80 shadow-gold-glow'
                    : 'kasavu-card border-gold-royal bg-gradient-to-b from-white via-cream-warm to-white text-slate-800'
                }`}
              >
                {/* Decorative Top Accent Stripe */}
                <div className={`absolute top-0 inset-x-0 h-1.5 ${
                  ticketTheme === 'dark'
                    ? 'bg-gradient-to-r from-gold-royal via-amber-400 to-gold-royal'
                    : 'bg-gradient-to-r from-kerala-deep via-gold-royal to-kerala-deep'
                }`} />

                <div className={`flex items-center justify-between pb-6 border-b ${
                  ticketTheme === 'dark' ? 'border-slate-800' : 'border-gold-royal/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-kerala-deep text-gold-royal flex items-center justify-center text-xl font-bold shadow-md">
                      🌼
                    </div>
                    <div>
                      <h3 className={`font-serif font-bold text-xl ${
                        ticketTheme === 'dark' ? 'text-white' : 'text-kerala-deep'
                      }`}>Kruponam 2026</h3>
                      <p className={`text-[10px] font-sans uppercase tracking-widest font-bold ${
                        ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Krupanidhi Degree College
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full bg-gold-royal text-kerala-dark text-xs font-black uppercase tracking-wider shadow-sm">
                      {searchResult.ticketType}
                    </span>
                    <p className={`text-[11px] font-mono mt-1 ${
                      ticketTheme === 'dark' ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {searchResult.id}
                    </p>
                  </div>
                </div>

                <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-8 space-y-3">
                    <div>
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${
                        ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                      }`}>Attendee Name</p>
                      <p className={`font-serif text-2xl font-bold ${
                        ticketTheme === 'dark' ? 'text-amber-300' : 'text-kerala-deep'
                      }`}>{searchResult.fullName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${
                          ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>Department & Section</p>
                        <p className={`font-semibold ${ticketTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {searchResult.department} — {searchResult.section || 'Section A'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${
                          ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>Academic Year</p>
                        <p className={`font-semibold ${ticketTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                          {searchResult.year}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${
                          ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>Payment Status</p>
                        <p className="font-semibold text-emerald-400 font-mono">✓ ₹{searchResult.paymentAmount || ticketAmount} Paid ({searchResult.paymentUtr})</p>
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${
                          ticketTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                        }`}>Campus Gate Status</p>
                        <p className="font-semibold text-emerald-400">
                          {searchResult.isReported ? '✓ Reported & Checked In' : 'Ready for Entry'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`sm:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl border shadow-inner ${
                    ticketTheme === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-gold-royal/30'
                  }`}>
                    {/* Always white QR container for 100% scanner compatibility */}
                    <div className="w-32 h-32 bg-white rounded-xl p-1.5 border-2 border-gold-royal shadow-md flex items-center justify-center overflow-hidden">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt={`QR Pass ${searchResult.id}`}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <QrCode className="w-16 h-16 text-kerala-deep animate-pulse" />
                      )}
                    </div>
                    <span className={`text-[10px] font-mono font-bold mt-2 ${
                      ticketTheme === 'dark' ? 'text-gold-royal' : 'text-kerala-deep'
                    }`}>TOKEN: {searchResult.id}</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5">SCAN AT CAMPUS GATE</span>
                  </div>
                </div>

                <div className={`pt-4 border-t border-dashed flex flex-wrap items-center justify-between gap-3 text-xs ${
                  ticketTheme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gold-royal/40 text-slate-500'
                }`}>
                  <span>📍 PSR Convention Centre • Sep 4, 2026</span>
                  <span>Approved: {searchResult.approvedAt || searchResult.submittedAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-kerala-deep text-white text-xs font-bold uppercase tracking-wider hover:bg-kerala-emerald shadow-lg transition-all"
                >
                  <Download className="w-4 h-4 text-gold-royal" />
                  <span>Download / Print Official Pass</span>
                </button>

                <button
                  onClick={async () => {
                    if (!searchResult) return;
                    setIsSendingEmail(true);
                    setEmailNotice(null);
                    const res = await sendApprovalEmail(searchResult);
                    setIsSendingEmail(false);
                    setEmailNotice(res.message);
                  }}
                  disabled={isSendingEmail}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gold-royal text-kerala-dark text-xs font-bold uppercase tracking-wider hover:bg-gold-light shadow-lg transition-all disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Ticket Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Email Ticket Pass To Me</span>
                    </>
                  )}
                </button>
              </div>

              {emailNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-medium text-amber-900 animate-fadeIn">
                  {emailNotice}
                </div>
              )}
            </div>
          ) : searchResult?.approvalStatus === 'ID_Approved' ? (
            /* STAGE 2 UNLOCKED: ID APPROVED -> PAY ₹700 & UPLOAD SCREENSHOT */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 text-center font-bold text-sm space-y-1 shadow-sm">
                <p className="flex items-center justify-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>🎉 STUDENT ID CARD APPROVED BY ADMIN!</span>
                </p>
                <p className="text-xs text-emerald-800 font-normal">
                  Welcome <span className="font-bold">{searchResult.fullName}</span>! Please scan the QR code below to pay ₹{ticketAmount} pass fee, enter your 12-digit UTR, and upload your payment screenshot.
                </p>
              </div>

              {paymentError && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/70 rounded-3xl p-6 sm:p-8 border-2 border-gold-royal/40 shadow-md space-y-6">
                
                {/* QR Code & UTR input */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-5 text-center space-y-2 border-b sm:border-b-0 sm:border-r border-gold-royal/20 pb-4 sm:pb-0 sm:pr-4">
                    <span className="px-3 py-1 rounded-full bg-gold-royal text-kerala-dark text-[11px] font-black uppercase tracking-wider">
                      ₹{ticketAmount} Pass Fee
                    </span>
                    <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-gold-royal shadow-md flex items-center justify-center overflow-hidden">
                      {upiQrCodeUrl ? (
                        <img
                          src={upiQrCodeUrl}
                          alt="UPI QR Code"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      ) : (
                        <QrCode className="w-full h-full text-slate-900 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-700">{upiSettings.upiId}</p>

                    <button
                      type="button"
                      onClick={handleDownloadPaymentQr}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-royal text-slate-950 hover:bg-gold-light text-[11px] font-extrabold transition-all shadow-sm border border-gold-royal/50 hover:scale-105 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Payment QR</span>
                    </button>

                    <p className="text-[10px] text-slate-400">Scan using Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>

                  <div className="sm:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-gold-royal" />
                        Enter 12-Digit UPI UTR / Txn Reference ID *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="e.g. 320918239012"
                        value={paymentUtr}
                        onChange={(e) => setPaymentUtr(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 bg-white"
                      />
                    </div>

                    {paymentUtr.trim().length >= 6 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ UTR Entered: {paymentUtr}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        ℹ️ Enter the 12-digit UPI transaction UTR from GPay / PhonePe / Paytm.
                      </p>
                    )}
                  </div>
                </div>

                {/* Screenshot upload */}
                <div className="pt-4 border-t border-gold-royal/20 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-gold-royal" />
                    Upload Payment Screenshot (Showing UTR Number) *
                  </label>

                  <div className="border-2 border-dashed border-gold-royal/40 rounded-2xl p-5 bg-white text-center hover:bg-amber-50/50 transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentScreenshotUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {paymentScreenshotPreview ? (
                      <div className="space-y-2">
                        <img
                          src={paymentScreenshotPreview}
                          alt="Payment Receipt Preview"
                          className="max-h-44 mx-auto rounded-xl shadow-md border border-gold-royal/40 object-contain"
                        />
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Payment Receipt Uploaded: {paymentScreenshotFile?.name || 'payment_receipt.png'}</span>
                        </p>
                        <span className="text-[11px] text-slate-400 underline">Click to replace screenshot</span>
                      </div>
                    ) : (
                      <div className="py-3 space-y-2">
                        <Upload className="w-7 h-7 mx-auto text-gold-dark" />
                        <p className="text-xs font-bold text-slate-800">
                          Upload GPay / PhonePe / Paytm Payment Screenshot
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Must clearly display ₹{ticketAmount} paid amount and 12-digit UTR number.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full py-4 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gold-royal" />
                      <span>Submitting Payment & UTR to Admin...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gold-royal" />
                      <span>Submit Payment Screenshot & UTR (₹{ticketAmount} Paid)</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : searchResult?.approvalStatus === 'Payment_Pending' ? (
            /* PAYMENT PENDING REVIEW */
            <div className="p-8 bg-amber-50/90 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-700 font-bold text-2xl animate-pulse">
                💳
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                Payment Submitted • Pending Final Pass Approval
              </span>

              <h4 className="font-serif text-2xl font-bold text-amber-950">
                Payment Under Admin Verification
              </h4>

              <p className="text-slate-700 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Hello <span className="font-bold text-amber-900">{searchResult?.fullName}</span>, your ₹{searchResult?.paymentAmount || ticketAmount} payment screenshot & UTR (<span className="font-mono font-bold">{searchResult?.paymentUtr}</span>) have been received. Admin is verifying the payment receipt to issue your official QR pass.
              </p>

              <div className="pt-2 text-xs text-amber-800 font-semibold">
                ⏱️ Estimated Verification: 1-2 Hours • Check back soon!
              </div>
            </div>
          ) : searchResult?.approvalStatus === 'Pending_ID_Approval' || searchResult?.approvalStatus === 'Pending' ? (
            /* STAGE 1 PENDING ID REVIEW */
            <div className="p-8 bg-amber-50/90 border-2 border-amber-300 rounded-3xl text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-700 font-bold text-2xl animate-pulse">
                ⏳
              </div>

              <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                Stage 1 Pending • Student ID Review
              </span>

              <h4 className="font-serif text-2xl font-bold text-amber-950">
                Student ID Card Under Verification
              </h4>

              <p className="text-slate-700 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Hello <span className="font-bold text-amber-900">{searchResult?.fullName}</span>, your student details and Student ID Card photo have been received. The admin committee is verifying your Student ID Card.
              </p>

              <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-2xl text-xs text-amber-950 font-medium">
                ℹ️ Once Admin approves your Student ID Card, check back here to see the UPI QR Code (₹700) and upload your payment screenshot.
              </div>
            </div>
          ) : (
            /* REJECTED STATE WITH INLINE RE-UPLOAD FORM */
            <div className="space-y-6">
              <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-3xl text-center space-y-4 shadow-md">
                <div className="w-16 h-16 rounded-full bg-rose-100 mx-auto flex items-center justify-center text-rose-700 font-bold text-2xl">
                  ❌
                </div>

                <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-extrabold uppercase tracking-wider">
                  Application Rejected • Re-Upload Required
                </span>

                <h4 className="font-serif text-2xl font-bold text-rose-950">
                  Verification Issue Detected
                </h4>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 text-xs text-rose-900 font-medium max-w-md mx-auto text-left space-y-1">
                  <span className="font-bold block text-rose-950">Reason provided by Admin:</span>
                  <p className="text-slate-800 italic">"{searchResult?.rejectionReason || 'Uploaded ID Card or Payment UTR could not be verified.'}"</p>
                </div>

                <p className="text-slate-600 text-xs font-medium">
                  Don't worry! You can upload a new clear Student ID Card photo below to resubmit your application for re-review.
                </p>
              </div>

              {resubmitSuccessNotice ? (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn shadow-md">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-emerald-950 text-sm">{resubmitSuccessNotice}</p>
                  <p className="text-xs text-emerald-800">Admin will review your newly uploaded Student ID Card shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleResubmitApplication} className="bg-amber-50/60 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-md space-y-6">
                  <h4 className="font-serif text-xl font-bold text-kerala-deep flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gold-royal" />
                    <span>Re-Upload Student ID Card Photo</span>
                  </h4>

                  {paymentError && (
                    <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Student Full Name (Matches Student ID Proof) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sniya M"
                      value={resubmitName}
                      onChange={(e) => setResubmitName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 bg-white"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ensure your full name matches the printed name on your College Student ID Card proof.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gold-royal/40 rounded-2xl p-6 bg-white text-center hover:bg-amber-50/50 transition-all relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReuploadIdCard}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {reuploadIdPreview ? (
                      <div className="space-y-3">
                        <img
                          src={reuploadIdPreview}
                          alt="New Student ID Preview"
                          className="max-h-48 mx-auto rounded-xl shadow-md border border-gold-royal/30 object-contain"
                        />
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>New Student ID Uploaded: {reuploadIdFile?.name || 'student_id.jpg'}</span>
                        </p>
                        <span className="text-[11px] text-slate-400 underline">Click to choose a different photo</span>
                      </div>
                    ) : (
                      <div className="space-y-2 py-3">
                        <Upload className="w-8 h-8 mx-auto text-gold-dark" />
                        <p className="text-sm font-bold text-slate-800">
                          Click to upload or drag & drop New Student ID Photo
                        </p>
                        <p className="text-xs text-slate-500">
                          Clear phone photo or scanned copy of Student ID Card
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResubmitting || !reuploadIdPreview}
                    className="w-full py-4 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                  >
                    {isResubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-gold-royal" />
                        <span>Resubmitting Application to Admin...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-gold-royal" />
                        <span>Resubmit Application for Admin Re-Review</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
