import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  User, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Trash2, 
  Copy, 
  Download, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  saveRegistrationAsync, 
  findRegistrationAsync, 
  findRegistration, 
  generateUniqueRegistrationId,
  type Registration 
} from '../services/registrationService';
import { getSiteSettings } from '../services/siteSettingsService';
import { getUpiSettings, recordPaymentToActiveSlot } from '../services/upiSettingsService';
import { fetchActiveUpiSlotFromFirebase } from '../services/firebaseService';
import { generateQrCode } from '../services/emailService';
import { compressImageToDataUrl, readRawFileAsDataUrl } from '../utils/imageCompressor';

interface DriverRegistrationProps {
  onBackToHome?: () => void;
  onOpenLookup?: (query?: string, mode?: 'student' | 'driver') => void;
  onOpenAdmin?: () => void;
}

export const DriverRegistrationForm: React.FC<DriverRegistrationProps> = ({ 
  onBackToHome, 
  onOpenLookup, 
  onOpenAdmin 
}) => {
  const [ticketAmount, setTicketAmount] = useState<number>(() => getSiteSettings().ticketAmount || 700);

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

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [paymentUtr, setPaymentUtr] = useState('');

  // Upload previews
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string | null>(null);
  const [isProcessingLicense, setIsProcessingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [isProcessingScreenshot, setIsProcessingScreenshot] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPass, setSubmittedPass] = useState<Registration | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // UPI Settings & QR
  const [upiSettings, setUpiSettings] = useState(getUpiSettings());
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string>('');

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Load active UPI slot
  useEffect(() => {
    fetchActiveUpiSlotFromFirebase().then((liveSlot: any) => {
      if (liveSlot && (liveSlot.upiId || liveSlot.qrImageDataUrl)) {
        setUpiSettings({
          upiId: liveSlot.upiId || 'q062769226@ybl',
          merchantName: liveSlot.merchantName,
          qrImageDataUrl: liveSlot.qrImageDataUrl || null,
          amount: getSiteSettings().ticketAmount || 700,
        });
      }
    }).catch(() => {});
  }, []);

  // Generate UPI QR Code URL
  useEffect(() => {
    if (upiSettings.qrImageDataUrl) {
      setUpiQrCodeUrl(upiSettings.qrImageDataUrl);
    } else {
      generateQrCode(`upi://pay?pa=${upiSettings.upiId}&pn=Kruponam2026&am=${ticketAmount}&cu=INR`).then((url: string) => {
        setUpiQrCodeUrl(url);
      });
    }
  }, [upiSettings, ticketAmount]);

  // Restore existing driver session if any
  useEffect(() => {
    try {
      const savedId = sessionStorage.getItem('kruponam_active_driver_id');
      if (savedId) {
        const local = findRegistration(savedId);
        if (local && (local.ticketType === 'Driver Pass' || local.ticketType === 'Vehicle Driver Pass')) {
          setSubmittedPass(local);
        }
        findRegistrationAsync(savedId).then((cloud) => {
          if (cloud && (cloud.ticketType === 'Driver Pass' || cloud.ticketType === 'Vehicle Driver Pass')) {
            setSubmittedPass(cloud);
          }
        });
      }
    } catch (_) {}
  }, []);

  // Handle Licence Photo Upload
  const handleLicensePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLicenseError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setLicenseError('File size is too large. Please select an image under 15MB.');
      return;
    }

    setIsProcessingLicense(true);
    setLicenseError(null);

    try {
      const compressed = await compressImageToDataUrl(file, { initialMaxWidth: 900, initialQuality: 0.75 });
      setLicensePhotoPreview(compressed);
    } catch (err) {
      try {
        const raw = await readRawFileAsDataUrl(file);
        setLicensePhotoPreview(raw);
      } catch (fallbackErr) {
        setLicenseError('Could not process this image. Please try another photo.');
      }
    } finally {
      setIsProcessingLicense(false);
    }
  };

  // Handle Payment Screenshot Upload
  const handleScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingScreenshot(true);
    try {
      const compressed = await compressImageToDataUrl(file, { initialMaxWidth: 900, initialQuality: 0.75 });
      setPaymentScreenshotPreview(compressed);
    } catch {
      try {
        const raw = await readRawFileAsDataUrl(file);
        setPaymentScreenshotPreview(raw);
      } catch {
        // Ignore fallback
      }
    } finally {
      setIsProcessingScreenshot(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleDownloadPaymentQr = () => {
    if (!upiQrCodeUrl) return;
    const a = document.createElement('a');
    a.href = upiQrCodeUrl;
    a.download = `kruponam_driver_payment_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim()) {
      setValidationError('Please enter driver full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setValidationError('Please enter a valid driver email address (e.g. driver@gmail.com).');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!licenseNumber.trim()) {
      setValidationError('Please enter your Driving Licence Number.');
      return;
    }

    if (!vehicleNumber.trim()) {
      setValidationError('Please enter your Vehicle Registration Number (e.g. KL 07 AB 1234).');
      return;
    }

    if (!licensePhotoPreview) {
      setValidationError('Please upload a photo of your Driving Licence or Driver ID.');
      return;
    }

    const cleanUtr = paymentUtr.trim().replace(/\D/g, '');
    if (cleanUtr.length !== 12) {
      setValidationError('Please enter the valid 12-digit numeric UPI Transaction UTR Number.');
      return;
    }

    setIsSubmitting(true);

    try {
      try {
        recordPaymentToActiveSlot();
      } catch (_) {}

      const cleanVehicleType = vehicleType;
      const passId = generateUniqueRegistrationId();
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const driverRecord: Registration = {
        id: passId,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        department: `Driver - ${cleanVehicleType} (${licenseNumber.trim().toUpperCase()})`,
        section: vehicleNumber.trim().toUpperCase(),
        year: 'Transport & Logistics Staff',
        gender: 'Male',
        ticketType: 'Driver Pass',
        licenseNumber: licenseNumber.trim().toUpperCase(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        idCardUrl: licensePhotoPreview,
        paymentScreenshotUrl: paymentScreenshotPreview || '',
        paymentAmount: ticketAmount,
        paymentStatus: 'Pending',
        paymentUtr: cleanUtr,
        approvalStatus: 'Pending_ID_Approval',
        submittedAt: today,
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveRegistrationAsync(driverRecord);
      try {
        sessionStorage.setItem('kruponam_active_driver_id', saved.id);
      } catch (_) {}

      setSubmittedPass(saved);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0D472B', '#D4AF37', '#10B981', '#FFFFFF'],
      });
    } catch (err: any) {
      console.error('Driver registration error:', err);
      setValidationError('An unexpected error occurred while saving. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-warm text-slate-800 selection:bg-gold-royal selection:text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Festival Home</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenLookup && (
              <button
                type="button"
                onClick={() => onOpenLookup()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-royal/20 border border-gold-royal/40 text-gold-dark text-xs font-bold hover:bg-gold-royal/30 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Check Pass Status</span>
              </button>
            )}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold-royal" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-kerala-deep via-kerala-emerald to-kerala-dark rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border-2 border-gold-royal/30">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-royal/20 border border-gold-royal/40 text-gold-light text-xs font-extrabold uppercase tracking-widest">
              <Truck className="w-4 h-4 text-gold-royal" />
              <span>Official Transport & Driver Ticket Portal</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-gold-light">
              Vehicle Driver Pass Registration
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm max-w-xl leading-relaxed">
              Register bikes, cars, jeeps, and auto rickshaws for Kruponam 2026. Entry passes include designated vehicle parking clearance and food tokens.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-bold text-amber-200">
              <span className="px-3 py-1 rounded-full bg-black/30 border border-gold-royal/30">
                Fee: ₹{ticketAmount} per Driver Ticket
              </span>
              <span className="px-3 py-1 rounded-full bg-black/30 border border-gold-royal/30">
                ✓ Campus Gate Entry Clearance
              </span>
            </div>
          </div>
        </div>

        {/* Success Confirmation Card */}
        {submittedPass ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/50 shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-sm">
                Driver Registration Submitted
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Application Received for Admin Review!
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                Thank you <strong className="text-slate-900">{submittedPass.fullName}</strong>. Your Driver Pass application and payment UTR (<span className="font-mono font-bold text-kerala-deep">{submittedPass.paymentUtr}</span>) are queued for verification.
              </p>
            </div>

            <div className="bg-cream-soft rounded-2xl p-5 border border-gold-royal/30 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Driver Pass ID</span>
                <span className="font-mono text-lg font-black text-kerala-deep">{submittedPass.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Driver Name</span>
                  <span className="font-bold text-slate-900">{submittedPass.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mobile Number</span>
                  <span className="font-bold text-slate-900">{submittedPass.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Email Address</span>
                  <span className="font-bold text-slate-900 break-all">{submittedPass.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Licence Number</span>
                  <span className="font-mono font-bold text-slate-900">{submittedPass.licenseNumber || 'Verified on Licence'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehicle Number</span>
                  <span className="font-mono font-bold text-slate-900">{submittedPass.vehicleNumber || submittedPass.section}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Approval Status</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]">
                    {submittedPass.approvalStatus === 'Approved' ? '✓ Approved' : '⏳ Pending Verification'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Fee</span>
                  <span className="font-bold text-emerald-700">₹{submittedPass.paymentAmount || ticketAmount} (UTR Submitted)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onOpenLookup && (
                <button
                  type="button"
                  onClick={() => onOpenLookup(submittedPass.id, 'driver')}
                  className="flex-1 py-3.5 rounded-xl bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Pass Status & Download Pass</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSubmittedPass(null);
                  setFullName('');
                  setEmail('');
                  setPhone('');
                  setLicenseNumber('');
                  setVehicleNumber('');
                  setPaymentUtr('');
                  setVehicleType('Car');
                  setLicensePhotoPreview(null);
                  setPaymentScreenshotPreview(null);
                  try { sessionStorage.removeItem('kruponam_active_driver_id'); } catch (_) {}
                }}
                className="px-5 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Register Another Vehicle</span>
              </button>
            </div>
          </div>
        ) : (
          /* Driver Registration Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-xl space-y-6">

            {validationError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs font-bold flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* SECTION 1: DRIVER & VEHICLE DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-5 h-5 text-kerala-deep" />
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  Step 1: Driver & Vehicle Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Driver Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-medium"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold-royal" />
                    <span>Email Address <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. suresh.kumar@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-medium"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-medium font-mono"
                  />
                </div>

                {/* Driving Licence Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Driving Licence Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. KL-07-20150001234"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-bold uppercase font-mono"
                  />
                </div>

                {/* Vehicle Registration Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vehicle Number Plate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. KL 07 AB 1234"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-bold uppercase font-mono"
                  />
                </div>

                {/* Vehicle Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vehicle Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-medium bg-white"
                  >
                    <option value="Car">Car (🚗)</option>
                    <option value="Bike">Bike (🏍️)</option>
                    <option value="Jeep">Jeep (🚙)</option>
                    <option value="Auto Rickshaw">Auto Rickshaw (🛺)</option>
                  </select>
                </div>
              </div>

              {/* Driving Licence / Driver ID Upload */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Upload Driving Licence Photo or Driver ID <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-kerala-deep transition-all bg-slate-50/50">
                  {licensePhotoPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block max-w-xs mx-auto">
                        <img
                          src={licensePhotoPreview}
                          alt="Licence Preview"
                          className="max-h-48 rounded-xl object-contain border border-slate-200 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setLicensePhotoPreview(null)}
                          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 transition-all"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Licence photo uploaded successfully</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-3">
                      <div className="w-12 h-12 rounded-full bg-gold-royal/20 text-gold-dark flex items-center justify-center mx-auto">
                        {isProcessingLicense ? (
                          <Loader2 className="w-6 h-6 animate-spin text-kerala-deep" />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Take photo or upload Driving Licence image
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports JPG, PNG up to 15MB. Automatically compressed.
                      </p>
                      <button
                        type="button"
                        disabled={isProcessingLicense}
                        onClick={() => licenseInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-kerala-deep text-white text-xs font-bold uppercase tracking-wider hover:bg-kerala-emerald transition-all shadow-sm"
                      >
                        {isProcessingLicense ? 'Processing...' : 'Select File / Take Photo'}
                      </button>
                    </div>
                  )}

                  <input
                    ref={licenseInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleLicensePhotoSelect}
                    className="hidden"
                  />
                </div>
                {licenseError && (
                  <p className="text-xs text-rose-600 font-bold">{licenseError}</p>
                )}
              </div>
            </div>

            {/* SECTION 2: PAYMENT FLOW */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-kerala-deep" />
                  <h2 className="font-serif text-lg font-bold text-slate-900">
                    Step 2: Pay Ticket Fee (₹{ticketAmount}) & Enter UTR
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-gold-royal text-slate-950 text-xs font-black">
                  ₹{ticketAmount}
                </span>
              </div>

              {/* UPI QR & Payment instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-cream-soft p-5 rounded-2xl border border-gold-royal/30">
                {/* QR Code Container */}
                <div className="sm:col-span-5 text-center space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200 pb-4 sm:pb-0 sm:pr-4">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-gold-royal shadow-md flex items-center justify-center overflow-hidden">
                    {upiQrCodeUrl ? (
                      <img
                        src={upiQrCodeUrl}
                        alt="UPI Payment QR"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <QrCode className="w-16 h-16 text-slate-800 animate-pulse" />
                    )}
                  </div>

                  <p className="text-xs font-mono font-bold text-slate-800 break-all">
                    {upiSettings.upiId}
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPaymentQr}
                      className="px-2.5 py-1 rounded-lg bg-gold-royal text-slate-950 text-[11px] font-bold hover:bg-gold-light flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>QR</span>
                    </button>
                  </div>
                </div>

                {/* Instructions & App Icons */}
                <div className="sm:col-span-7 space-y-3 text-xs text-slate-700">
                  <p className="font-bold text-slate-900 text-sm">
                    How to Pay via any UPI App:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed font-medium">
                    <li>Scan the QR code using <strong>GPay, PhonePe, Paytm, or BHIM</strong>.</li>
                    <li>Pay the pass fee of <strong>₹{ticketAmount}</strong>.</li>
                    <li>Copy the <strong>12-digit UPI Reference / UTR Number</strong> from transaction receipt.</li>
                    <li>Paste the 12-digit UTR in the field below.</li>
                  </ol>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    🛡️ Official Kruponam merchant account. Instant verification and admin entry clearance.
                  </div>
                </div>
              </div>

              {/* 12-Digit UTR Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    12-Digit UPI Transaction UTR Number <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${paymentUtr.length === 12 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {paymentUtr.length}/12 Digits
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={paymentUtr}
                  onChange={(e) => setPaymentUtr(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 423589123456"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-kerala-deep focus:border-transparent font-bold font-mono tracking-wider"
                />
                <p className="text-[11px] text-slate-500">
                  Found in transaction details as "UPI Ref No", "UTR", or "Google Transaction ID".
                </p>
              </div>

              {/* Optional Payment Screenshot */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Upload Payment Screenshot <span className="text-slate-400 font-normal">(Optional but recommended)</span>
                </label>
                <div className="flex items-center gap-3">
                  {paymentScreenshotPreview ? (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Screenshot attached</span>
                      <button
                        type="button"
                        onClick={() => setPaymentScreenshotPreview(null)}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessingScreenshot}
                      onClick={() => screenshotInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5 border border-slate-300"
                    >
                      {isProcessingScreenshot ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>Attach Payment Screenshot</span>
                    </button>
                  )}
                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-kerala-deep via-kerala-emerald to-kerala-deep text-white font-black text-sm uppercase tracking-widest hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Driver Registration & Ticket...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-gold-royal" />
                    <span>Submit Driver Pass Registration (₹{ticketAmount})</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
