import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, Download, QrCode, ArrowLeft, UserCheck, Mail, RefreshCw, CreditCard, Upload, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { findRegistration, findRegistrationAsync, submitPaymentForRegistration, saveRegistrationAsync, isUtrAlreadyUsedAsync, type Registration } from '../services/registrationService';
import { sendApprovalEmail, generateQrCode } from '../services/emailService';
import { getUpiSettings, recordPaymentToActiveSlot } from '../services/upiSettingsService';
import { fetchActiveUpiSlotFromFirebase } from '../services/firebaseService';
import { getSiteSettings } from '../services/siteSettingsService';
import { compressImageToDataUrl, readRawFileAsDataUrl } from '../utils/imageCompressor';

interface LookupProps {
  onClose?: () => void;
  initialQuery?: string;
}

export const PassStatusLookup: React.FC<LookupProps> = ({ onClose, initialQuery }) => {
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

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [searchResult, setSearchResult] = useState<Registration | null | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Stage 2 Payment fields inside lookup
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [isProcessingPaymentScreenshot, setIsProcessingPaymentScreenshot] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [utrDuplicateWarning, setUtrDuplicateWarning] = useState<string | null>(null);
  const [isCheckingUtr, setIsCheckingUtr] = useState(false);
  const [ticketTheme, setTicketTheme] = useState<'light' | 'dark'>('light');

  const paymentFileInputRef = useRef<HTMLInputElement>(null);
  const reuploadIdInputRef = useRef<HTMLInputElement>(null);

  // Resubmit / Re-upload state for rejected applications
  const [resubmitName, setResubmitName] = useState('');
  const [reuploadIdFile, setReuploadIdFile] = useState<File | null>(null);
  const [reuploadIdPreview, setReuploadIdPreview] = useState<string | null>(null);
  const [isProcessingReuploadId, setIsProcessingReuploadId] = useState(false);
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
      setIsProcessingReuploadId(true);
      setPaymentError(null);
      try {
        const compressed = await compressImageToDataUrl(file, {
          maxSizeBytes: 180 * 1024,
          initialMaxWidth: 1000,
          initialQuality: 0.76,
          timeoutMs: 5000,
        });
        if (compressed && compressed.length > 50) {
          setReuploadIdPreview(compressed);
        } else {
          const raw = await readRawFileAsDataUrl(file);
          if (raw) {
            setReuploadIdPreview(raw);
          } else {
            setPaymentError('Could not process this image format. Please select another JPG/PNG photo.');
          }
        }
      } catch {
        try {
          const raw = await readRawFileAsDataUrl(file);
          if (raw) {
            setReuploadIdPreview(raw);
          } else {
            setPaymentError('Error reading ID card photo. Please try again.');
          }
        } catch {
          setPaymentError('Error reading ID card photo. Please try again.');
        }
      } finally {
        setIsProcessingReuploadId(false);
        if (e.target) e.target.value = '';
      }
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
      if (liveSlot && (liveSlot.upiId || liveSlot.qrImageDataUrl)) {
        setUpiSettings({
          upiId: liveSlot.upiId || 'q062769226@ybl',
          merchantName: liveSlot.merchantName,
          qrImageDataUrl: liveSlot.qrImageDataUrl || null,
          amount: getSiteSettings().ticketAmount,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchResult) {
      if (searchResult.fullName) {
        setResubmitName(searchResult.fullName);
      }
      if (searchResult.approvalStatus === 'Approved' || searchResult.approvalStatus === 'VIP' || searchResult.approvalStatus === 'VIP_Pending') {
        generateQrCode(`KRUPONAM2026|TOKEN:${searchResult.id}|NAME:${searchResult.fullName}|DEPT:${searchResult.department}|UTR:${searchResult.paymentUtr || 'VIP'}`).then((url) => {
          setQrCodeUrl(url);
        });
      } else {
        setQrCodeUrl('');
      }
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

  // Real-time debounced server UTR duplication check
  useEffect(() => {
    const cleanUtr = paymentUtr.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      setUtrDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUtr(true);
      const res = await isUtrAlreadyUsedAsync(cleanUtr, searchResult?.id);
      setIsCheckingUtr(false);
      if (res.isUsed) {
        setUtrDuplicateWarning(res.message || '⚠️ This UPI UTR number is already registered on the server.');
      } else {
        setUtrDuplicateWarning(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [paymentUtr, searchResult]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-scroll page to top & focus search input field immediately on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInputRef.current.focus();
      }
    }, 150);
  }, []);

  // Real-time live status auto-polling: If student is waiting for ID card or payment approval, poll cloud every 4 seconds
  useEffect(() => {
    if (!searchResult) return;
    const isPendingStatus = 
      searchResult.approvalStatus === 'Pending_ID_Approval' || 
      searchResult.approvalStatus === 'Pending' || 
      searchResult.approvalStatus === 'Payment_Pending';

    if (!isPendingStatus) return;

    const lookupQuery = searchResult.id || searchResult.email || searchResult.phone || searchQuery;
    if (!lookupQuery) return;

    const pollInterval = setInterval(async () => {
      try {
        const live = await findRegistrationAsync(lookupQuery);
        if (live && live.approvalStatus !== searchResult.approvalStatus) {
          setSearchResult(live);
        }
      } catch (_) {}
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [searchResult, searchQuery]);

  const performSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setPaymentError(null);
    setHasSearched(true);
    setSearchQuery(q);

    // 1. Instant 0ms response from local memory / IndexedDB cache
    const instantMatch = findRegistration(q);
    if (instantMatch) {
      setSearchResult(instantMatch);
    } else {
      setSearchResult(undefined); // Show loader only if no local cache match
    }

    setIsSearching(true);

    try {
      // 2. Fast parallel cloud lookup for latest real-time approval status
      const latest = await findRegistrationAsync(q);
      if (latest) {
        setSearchResult(latest);
      } else if (!instantMatch) {
        setSearchResult(null);
      }
    } catch (err) {
      console.warn('Live lookup search notice:', err);
      if (!instantMatch) {
        const fallback = findRegistration(q);
        setSearchResult(fallback || null);
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery.trim());
      performSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handlePaymentScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshotFile(file);
      setIsProcessingPaymentScreenshot(true);
      setPaymentError(null);
      try {
        const compressed = await compressImageToDataUrl(file, {
          maxSizeBytes: 180 * 1024,
          initialMaxWidth: 1000,
          initialQuality: 0.76,
          timeoutMs: 5000,
        });
        if (compressed && compressed.length > 50) {
          setPaymentScreenshotPreview(compressed);
        } else {
          const raw = await readRawFileAsDataUrl(file);
          if (raw) {
            setPaymentScreenshotPreview(raw);
          } else {
            setPaymentError('Could not process this screenshot format. Please select another JPG/PNG image.');
          }
        }
      } catch {
        try {
          const raw = await readRawFileAsDataUrl(file);
          if (raw) {
            setPaymentScreenshotPreview(raw);
          } else {
            setPaymentError('Error reading payment screenshot. Please try again.');
          }
        } catch {
          setPaymentError('Error reading payment screenshot. Please try again.');
        }
      } finally {
        setIsProcessingPaymentScreenshot(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResult) return;
    setPaymentError(null);

    const cleanUtr = paymentUtr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setPaymentError('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    if (!paymentScreenshotPreview) {
      setPaymentError('Please upload your Payment Screenshot showing the UTR / Ref ID clearly.');
      return;
    }

    setIsSubmittingPayment(true);

    // 1. Strict Server & Cloud UTR uniqueness check before submission
    const utrCheck = await isUtrAlreadyUsedAsync(cleanUtr, searchResult.id);
    if (utrCheck.isUsed) {
      setIsSubmittingPayment(false);
      setPaymentError(utrCheck.message || `⚠️ The UTR / Transaction ID (${cleanUtr}) has already been used on the server. Duplicate payments are not allowed.`);
      return;
    }

    try {
      recordPaymentToActiveSlot();
    } catch (_) {}

    try {
      const updated = await submitPaymentForRegistration(searchResult.id, cleanUtr, paymentScreenshotPreview);
      setIsSubmittingPayment(false);

      if (updated) {
        setSearchResult(updated);
      } else {
        setPaymentError('Could not update payment details. Please check your internet connection and try again.');
      }
    } catch (err: any) {
      setIsSubmittingPayment(false);
      setPaymentError(err?.message || 'Failed to submit payment details. Please try again.');
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
          {isSearching ? (
            /* Searching Spinner State Card */
            <div className="p-8 bg-amber-50/80 border border-amber-200 rounded-2xl text-center space-y-3 shadow-sm animate-pulse">
              <RefreshCw className="w-8 h-8 mx-auto text-amber-600 animate-spin" />
              <h4 className="font-serif font-bold text-lg text-amber-950">Searching Live Database...</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Checking live registrations in Kruponam system for <span className="font-bold font-mono">"{searchQuery}"</span>.
              </p>
            </div>
          ) : searchResult === null || !searchResult ? (
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
          ) : (searchResult.approvalStatus === 'Approved' || searchResult.approvalStatus === 'VIP' || searchResult.approvalStatus === 'VIP_Pending') ? (
            /* APPROVED PASS STATE (INCLUDING VIP PASSES) */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-center font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  Pass Approved by Admin! ₹700 Payment & Student ID Verified.
                </span>
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
                      {searchResult.ticketType === 'VIP Pass' ? 'Student Pass' : (searchResult.ticketType || 'Student Pass')}
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
                        <p className="font-semibold text-emerald-400 font-mono">
                          ✓ ₹700 Paid ({(!searchResult.paymentUtr || searchResult.paymentUtr === 'VIP_COMPLIMENTARY' || searchResult.paymentUtr === 'VIP') ? 'Verified' : searchResult.paymentUtr})
                        </p>
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
                  <span>📍 PSR Convention Centre • Sep 14, 2026</span>
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
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 text-center font-bold text-sm space-y-2 shadow-sm">
                <p className="flex items-center justify-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>🎉 STUDENT ID CARD APPROVED BY ADMIN!</span>
                </p>
                <p className="text-xs text-emerald-800 font-normal">
                  Welcome <span className="font-bold">{searchResult.fullName}</span>! Please scan the QR code below to pay ₹{ticketAmount} pass fee, enter your 12-digit UTR, and upload your payment screenshot.
                </p>
                <div className="pt-1 text-[11px] text-emerald-900 bg-emerald-100/80 p-2 rounded-xl border border-emerald-300/60 font-medium">
                  🛡️ <strong>Guaranteed Ticket Dispatch:</strong> Your official scanner-ready QR pass & invoice will be delivered directly to <strong>{searchResult.email}</strong> and supported via WhatsApp. Passes are <strong>non-refundable</strong> & capped at <strong>700 passes total</strong> (first-come, first-served).
                </div>
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
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        maxLength={12}
                        placeholder="e.g. 320918239012 (12 digits)"
                        value={paymentUtr}
                        onKeyDown={(e) => {
                          if (
                            !/[0-9]/.test(e.key) &&
                            !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) &&
                            !e.ctrlKey &&
                            !e.metaKey
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasteData = e.clipboardData.getData('text');
                          const numericOnly = pasteData.replace(/\D/g, '').slice(0, 12);
                          setPaymentUtr(numericOnly);
                        }}
                        onChange={(e) => {
                          const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setPaymentUtr(numericOnly);
                        }}
                        className={`w-full px-4 py-3 rounded-xl border font-mono text-sm tracking-wider outline-none transition-all ${
                          utrDuplicateWarning 
                            ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40 text-rose-950' 
                            : 'border-slate-300 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 bg-white'
                        }`}
                      />
                    </div>

                    {isCheckingUtr ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>Verifying UTR uniqueness on server database...</span>
                      </div>
                    ) : utrDuplicateWarning ? (
                      <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{utrDuplicateWarning}</span>
                      </div>
                    ) : paymentUtr.length === 12 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>✓ 12-Digit UTR Valid & Available: {paymentUtr}</span>
                      </div>
                    ) : paymentUtr.length > 0 ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium flex items-center justify-between">
                        <span>🔢 Numbers only ({paymentUtr.length}/12 digits entered)</span>
                        <span className="font-bold text-amber-800">{12 - paymentUtr.length} more needed</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        ℹ️ Numbers only: Enter the 12-digit numeric UPI transaction UTR from GPay / PhonePe / Paytm.
                      </p>
                    )}
                  </div>
                </div>

                {/* Screenshot upload */}
                <div className="pt-4 border-t border-gold-royal/20 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-gold-royal" />
                      Upload Payment Screenshot (Showing UTR Number) *
                    </span>
                    {paymentScreenshotPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentScreenshotPreview(null);
                          setPaymentScreenshotFile(null);
                          if (paymentFileInputRef.current) paymentFileInputRef.current.value = '';
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        Remove / Re-upload
                      </button>
                    )}
                  </label>

                  <div 
                    onClick={() => {
                      if (!isProcessingPaymentScreenshot && !isSubmittingPayment) {
                        paymentFileInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-5 bg-white text-center transition-all cursor-pointer relative hover:border-gold-royal ${
                      paymentScreenshotPreview ? 'border-emerald-400 bg-emerald-50/30' : 'border-gold-royal/40 hover:bg-amber-50/50'
                    }`}
                  >
                    <input
                      ref={paymentFileInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
                      onChange={handlePaymentScreenshotUpload}
                      disabled={isProcessingPaymentScreenshot || isSubmittingPayment}
                      className="hidden"
                    />

                    {isProcessingPaymentScreenshot ? (
                      <div className="py-4 space-y-2 animate-pulse pointer-events-none">
                        <Loader2 className="w-8 h-8 mx-auto text-gold-royal animate-spin" />
                        <p className="text-xs font-bold text-slate-800">Optimizing Payment Receipt Photo...</p>
                        <p className="text-[11px] text-slate-500">Please wait a moment</p>
                      </div>
                    ) : paymentScreenshotPreview ? (
                      <div className="space-y-2">
                        <img
                          src={paymentScreenshotPreview}
                          alt="Payment Receipt Preview"
                          className="max-h-44 mx-auto rounded-xl shadow-md border border-emerald-500/40 object-contain bg-white"
                        />
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Payment Receipt Attached: {paymentScreenshotFile?.name || 'payment_receipt.png'}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            paymentFileInputRef.current?.click();
                          }}
                          className="text-xs text-gold-dark hover:text-kerala-deep font-bold underline inline-block"
                        >
                          Tap to select a different screenshot
                        </button>
                      </div>
                    ) : (
                      <div className="py-3 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-gold-dark mx-auto flex items-center justify-center shadow-inner">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Tap to Choose GPay / PhonePe / Paytm Screenshot
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Supports JPG, PNG, Screenshots from mobile gallery (₹{ticketAmount} amount & 12-digit UTR clearly visible)
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            paymentFileInputRef.current?.click();
                          }}
                          className="mt-2 px-4 py-2 rounded-xl bg-amber-100 text-gold-dark font-bold text-xs hover:bg-amber-200 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Gallery / Files</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPayment || isProcessingPaymentScreenshot || isCheckingUtr || Boolean(utrDuplicateWarning)}
                  className="w-full py-4 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl cursor-pointer"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gold-royal" />
                      <span>Submitting Payment & UTR to Admin...</span>
                    </>
                  ) : isProcessingPaymentScreenshot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-royal" />
                      <span>Processing Payment Screenshot...</span>
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
                ⏱️ Estimated Verification: 1-2 Hours • Auto-refreshing live status every few seconds...
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                  disabled={isSearching}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Checking Live Cloud Status...' : 'Check Live Approval Status Now'}</span>
                </button>
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
                ℹ️ Once Admin approves your Student ID Card, this screen will automatically refresh with the payment QR code (₹700) to upload your payment screenshot.
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                  disabled={isSearching}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Checking Live Cloud Status...' : 'Check Live Status Now'}</span>
                </button>
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

                  <div 
                    onClick={() => {
                      if (!isProcessingReuploadId && !isResubmitting) {
                        reuploadIdInputRef.current?.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 bg-white text-center transition-all cursor-pointer relative hover:border-gold-royal ${
                      reuploadIdPreview ? 'border-emerald-400 bg-emerald-50/30' : 'border-gold-royal/40 hover:bg-amber-50/50'
                    }`}
                  >
                    <input
                      ref={reuploadIdInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
                      onChange={handleReuploadIdCard}
                      disabled={isProcessingReuploadId || isResubmitting}
                      className="hidden"
                    />

                    {isProcessingReuploadId ? (
                      <div className="space-y-3 py-4 animate-pulse pointer-events-none">
                        <Loader2 className="w-8 h-8 mx-auto text-gold-royal animate-spin" />
                        <p className="text-sm font-bold text-slate-800">Optimizing ID Card Photo...</p>
                        <p className="text-xs text-slate-500">Please wait a moment</p>
                      </div>
                    ) : reuploadIdPreview ? (
                      <div className="space-y-3">
                        <img
                          src={reuploadIdPreview}
                          alt="New Student ID Preview"
                          className="max-h-48 mx-auto rounded-xl shadow-md border border-emerald-500/40 object-contain bg-white"
                        />
                        <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>New Student ID Uploaded: {reuploadIdFile?.name || 'student_id.jpg'}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reuploadIdInputRef.current?.click();
                          }}
                          className="text-xs text-gold-dark hover:text-kerala-deep font-bold underline inline-block"
                        >
                          Tap to select a different photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 py-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-gold-dark mx-auto flex items-center justify-center shadow-inner">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Click to upload or take New Student ID Photo
                        </p>
                        <p className="text-xs text-slate-500">
                          Clear phone photo or scanned copy of Student ID Card (JPG/PNG)
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reuploadIdInputRef.current?.click();
                          }}
                          className="mt-2 px-4 py-2 rounded-xl bg-amber-100 text-gold-dark font-bold text-xs hover:bg-amber-200 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Gallery / Camera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isResubmitting || isProcessingReuploadId}
                    className="w-full py-4 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl cursor-pointer"
                  >
                    {isResubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-gold-royal" />
                        <span>Resubmitting Application to Admin...</span>
                      </>
                    ) : isProcessingReuploadId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-gold-royal" />
                        <span>Processing ID Card Image...</span>
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
