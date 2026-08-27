import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, Mail, Phone, Building2, Calendar, CheckCircle2, Sparkles, RefreshCw, ShieldCheck, Layers, AlertCircle, Trash2, Camera, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  saveRegistrationAsync, 
  findStudentByExactEmailOrPhone,
  findStudentByExactEmailOrPhoneAsync,
  generateUniqueRegistrationId,
  type Registration 
} from '../services/registrationService';
import { getSiteSettings } from '../services/siteSettingsService';
import { compressImageToDataUrl } from '../utils/imageCompressor';

interface RegistrationProps {
  selectedPassFromParent?: string;
  onOpenLookup?: () => void;
}

export const RegistrationForm: React.FC<RegistrationProps> = ({ selectedPassFromParent, onOpenLookup }) => {
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

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: selectedPassFromParent || 'General Pass',
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [isProcessingIdCard, setIsProcessingIdCard] = useState(false);
  const [idCardError, setIdCardError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState<Registration | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const idCardSectionRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError(null);
  };

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdCardFile(file);
    setIsProcessingIdCard(true);
    setIdCardError(null);
    setValidationError(null);

    try {
      const compressed = await compressImageToDataUrl(file, {
        maxSizeBytes: 600 * 1024,
        initialMaxWidth: 1200,
        initialQuality: 0.8,
        timeoutMs: 8000,
      });

      if (compressed) {
        setIdCardPreview(compressed);
      } else {
        setIdCardError('Could not process this image format. Please try another photo or format (JPG/PNG).');
      }
    } catch (err) {
      console.warn('ID card upload processing notice:', err);
      setIdCardError('Failed to read image file. Please try taking a photo directly or picking a JPG/PNG.');
    } finally {
      setIsProcessingIdCard(false);
    }
  };

  const handleRemoveIdCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdCardFile(null);
    setIdCardPreview(null);
    setIdCardError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationError(null);

    // If ID card is still processing in background, notify the user
    if (isProcessingIdCard) {
      setValidationError('⏳ Please wait a moment for your ID Card photo to finish optimizing...');
      return;
    }

    // ID Card Upload Requirement
    if (!idCardPreview) {
      const err = '⚠️ Please upload a clear photo or scanned copy of your Student ID Card before submitting.';
      setValidationError(err);
      setIdCardError('Student ID Card photo is required for admin verification.');
      if (idCardSectionRef.current) {
        idCardSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPhone = formData.phone.trim();

    if (!cleanEmail || !cleanPhone || !formData.fullName.trim()) {
      setValidationError('Please fill in all required fields (Full Name, Email, Phone Number).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already exists by EXACT Email or EXACT Phone in local storage OR live cloud database
      const existingLocal = findStudentByExactEmailOrPhone(cleanEmail, cleanPhone);
      let existingCloud: Registration | undefined = undefined;
      if (!existingLocal) {
        try {
          existingCloud = await findStudentByExactEmailOrPhoneAsync(cleanEmail, cleanPhone);
        } catch (cloudErr) {
          console.warn('Cloud duplicate check notice (continuing with local check):', cloudErr);
        }
      }
      const existing = existingLocal || existingCloud;

      if (existing) {
        if (existing.approvalStatus === 'Rejected') {
          const updatedReg: Registration = {
            ...existing,
            ...formData,
            fullName: formData.fullName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            idCardUrl: idCardPreview || existing.idCardUrl,
            approvalStatus: 'Pending_ID_Approval',
            rejectionReason: undefined,
            submittedAt: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };
          const savedReg = await saveRegistrationAsync(updatedReg);
          setSubmittedRegistration(savedReg);
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#0D472B', '#EA580C', '#FFFFFF'],
          });
          return;
        } else {
          // If existing registration is found, block duplicate registration!
          setValidationError(`⚠️ The Email Address "${cleanEmail}" or Phone Number "${cleanPhone}" is already registered (Pass ID: ${existing.id}). Please use "Check Pass Status" to track your approval.`);
          return;
        }
      }

      const randomId = generateUniqueRegistrationId();
      const draftReg: Registration = {
        id: randomId,
        ...formData,
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        idCardUrl: idCardPreview,
        paymentScreenshotUrl: '',
        paymentAmount: ticketAmount,
        paymentStatus: 'Pending',
        paymentUtr: '',
        approvalStatus: 'Pending_ID_Approval',
        submittedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      // Save to database & cloud storage async
      const savedReg = await saveRegistrationAsync(draftReg);

      setSubmittedRegistration(savedReg);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#0D472B', '#EA580C', '#FFFFFF'],
      });
    } catch (err) {
      console.error('Registration submit error:', err);
      setValidationError('An unexpected error occurred while submitting. Your details are safe, please try clicking submit once more.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="registration" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-light/30 border border-gold-royal/30 text-gold-dark text-xs font-bold uppercase tracking-widest">
            <Ticket className="w-3.5 h-3.5" />
            <span>Pass Registration & ID Verification</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-kerala-deep">
            Student <span className="text-gold-gradient font-normal italic">&</span> Pass Verification Portal
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Enter your details and upload your Student ID Card photo. Once Admin approves your ID card, you will be able to pay ₹{ticketAmount} and download your official event pass.
          </p>
        </div>

        {submittedRegistration ? (
          <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-700 font-bold text-3xl shadow-inner animate-bounce-subtle">
                ⏳
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                Stage 1 Submitted • Pending Admin ID Verification
              </span>

              <h3 className="font-serif text-3xl font-extrabold text-amber-950">
                ID Card Submitted for Verification!
              </h3>

              <p className="text-slate-700 text-sm max-w-md mx-auto leading-relaxed">
                Thank you <span className="font-bold text-amber-950">{submittedRegistration.fullName}</span> ({submittedRegistration.department} — {submittedRegistration.section})! Your Student ID Card has been submitted safely for Admin Verification.
              </p>

              <div className="p-4 bg-white rounded-2xl border border-amber-200 inline-block text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tracking Reference ID</p>
                <p className="font-mono font-black text-2xl text-kerala-deep">{submittedRegistration.id}</p>
                <p className="text-[11px] text-slate-500 mt-1">Save this ID to check approval status & complete payment</p>
              </div>

              <div className="p-3 bg-amber-100/60 rounded-xl text-xs text-amber-900 text-left space-y-1 font-medium">
                <p className="font-bold">Next Steps:</p>
                <p>1. Admin will review your uploaded Student ID Card photo.</p>
                <p>2. Once approved, search your Email/Phone/ID in <strong>Check Pass Status</strong> to see the UPI QR Code and pay ₹{ticketAmount}.</p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {onOpenLookup && (
                  <button
                    onClick={onOpenLookup}
                    className="px-6 py-3 rounded-full bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald shadow-md transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-gold-royal" />
                    <span>Check Pass Status / Pay Fee</span>
                  </button>
                )}

                <button
                  onClick={() => setSubmittedRegistration(null)}
                  className="px-6 py-3 rounded-full bg-white text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-gold-light/30 border border-amber-300 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Register Another Student</span>
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-6 sm:p-10 border border-gold-royal/40 shadow-card-hover">
            {validationError && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs sm:text-sm font-bold flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Step 1: Student Details */}
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-kerala-deep flex items-center gap-2 pb-2 border-b border-gold-royal/20">
                  <span className="w-7 h-7 rounded-full bg-gold-light/40 text-gold-dark text-xs flex items-center justify-center font-bold font-sans">
                    1
                  </span>
                  <span>Student Information & Department</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gold-royal" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Rahul Nair"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gold-royal" />
                      Email Address (Unique) *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gold-royal" />
                      Phone Number (Unique) *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gold-royal" />
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm transition-all bg-white"
                    >
                      <option value="BCA">Computer Applications (BCA)</option>
                      <option value="B.Com">Commerce (B.Com)</option>
                      <option value="BBA">Business Administration (BBA)</option>
                      <option value="B.Sc">Science (B.Sc)</option>
                      <option value="BA">Humanities & Arts (BA)</option>
                      <option value="Pharmacy">Pharmacy (B.Pharm / D.Pharm)</option>
                      <option value="Nursing">Nursing (B.Sc Nursing / GNM)</option>
                      <option value="PG/MBA/MCA">Post Graduate (MBA / MCA)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gold-royal" />
                      Section *
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm font-bold text-kerala-deep transition-all bg-white"
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Section D">Section D</option>
                      <option value="Section E">Section E</option>
                      <option value="Section F">Section F</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gold-royal" />
                      Academic Year *
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm transition-all bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="PG / Alumni">PG / Alumni</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-gold-royal" />
                    Event Pass Tier *
                  </label>
                  <select
                    name="ticketType"
                    value={formData.ticketType || 'General Pass'}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gold-royal/50 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm font-bold text-kerala-deep transition-all bg-gold-light/20"
                  >
                    <option value="General Pass">General Pass (All Access & Onasadya Feast — ₹{ticketAmount})</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Student ID Card Upload */}
              <div ref={idCardSectionRef} className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-gold-royal/20">
                  <h3 className="font-serif text-xl font-bold text-kerala-deep flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-gold-light/40 text-gold-dark text-xs flex items-center justify-center font-bold font-sans">
                      2
                    </span>
                    <span>Upload Student ID Card Photo *</span>
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
                    Required for Approval
                  </span>
                </div>

                {idCardError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{idCardError}</span>
                  </div>
                )}

                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                    idCardPreview 
                      ? 'border-emerald-400 bg-emerald-50/40' 
                      : idCardError 
                      ? 'border-rose-400 bg-rose-50/30' 
                      : 'border-gold-royal/40 bg-cream-soft/60 hover:bg-cream-soft'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/*, .heic, .heif"
                    onChange={handleIdCardUpload}
                    disabled={isProcessingIdCard || isSubmitting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    title="Click or drag to upload Student ID Card photo"
                  />

                  {isProcessingIdCard ? (
                    <div className="space-y-3 py-6 animate-pulse">
                      <Loader2 className="w-10 h-10 mx-auto text-gold-royal animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Optimizing & Securing ID Card Photo...
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Compressing photo for fast verification, please wait a moment
                        </p>
                      </div>
                    </div>
                  ) : idCardPreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block mx-auto group">
                        <img
                          src={idCardPreview}
                          alt="Uploaded Student ID Preview"
                          className="max-h-52 max-w-full mx-auto rounded-xl shadow-lg border-2 border-emerald-500/40 object-contain bg-white"
                        />
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <p className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Student ID Ready: {idCardFile?.name || 'student_id.jpg'}</span>
                        </p>
                        
                        <button
                          type="button"
                          onClick={handleRemoveIdCard}
                          className="relative z-20 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Change Photo</span>
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Click anywhere on box to replace with a different photo</span>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <div className="w-16 h-16 rounded-full bg-gold-light/30 text-gold-dark mx-auto flex items-center justify-center text-2xl shadow-inner">
                        <Camera className="w-8 h-8 text-gold-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">
                          Click to Take Photo or Upload Student ID Card
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG, JPEG, or HEIC • Clear photo of College Student ID Card
                        </p>
                      </div>
                      <div className="pt-1">
                        <span className="inline-block px-3.5 py-1 rounded-full bg-gold-royal/10 text-kerala-deep text-[11px] font-bold border border-gold-royal/20">
                          Tap to select image from Camera or Gallery
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button & Bottom Error Notice */}
              <div className="pt-4 space-y-3">
                {validationError && (
                  <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  ref={submitButtonRef}
                  type="submit"
                  disabled={isSubmitting || isProcessingIdCard}
                  className="w-full py-4 px-6 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 shadow-xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-gold-royal" />
                      <span>Submitting Details & Student ID for Verification...</span>
                    </>
                  ) : isProcessingIdCard ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-gold-royal" />
                      <span>Processing ID Card Image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-gold-royal" />
                      <span>Submit Student Details & ID for Verification</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500 font-medium">
                🔒 Once Admin verifies your Student ID Card, the UPI QR Code (₹{ticketAmount}) will be unlocked for your registration.
              </p>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};
