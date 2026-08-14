import React, { useState, useEffect } from 'react';
import { Ticket, User, Mail, Phone, Building2, Calendar, CheckCircle2, Sparkles, RefreshCw, ShieldCheck, Image as ImageIcon, Layers, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  saveRegistrationAsync, 
  isEmailAlreadyUsed, 
  isPhoneAlreadyUsed, 
  findRegistration,
  type Registration 
} from '../services/registrationService';
import { getSiteSettings } from '../services/siteSettingsService';

interface RegistrationProps {
  selectedPassFromParent?: string;
  onOpenLookup?: () => void;
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState<Registration | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError(null);
  };

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFile(file);
      const compressed = await compressImageToDataUrl(file);
      setIdCardPreview(compressed);
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // ID Card Upload Requirement
    if (!idCardPreview) {
      setValidationError('Please upload a clear scanned copy or photo of your College Student ID Card.');
      return;
    }

    // Check if user already exists
    const existing = findRegistration(formData.email) || findRegistration(formData.phone);

    if (existing) {
      // If previous application was Rejected, allow student to update and resubmit!
      if (existing.approvalStatus === 'Rejected') {
        setIsSubmitting(true);
        const updatedReg: Registration = {
          ...existing,
          ...formData,
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
        setIsSubmitting(false);
        setSubmittedRegistration(savedReg);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#0D472B', '#EA580C', '#FFFFFF'],
        });
        return;
      }

      if (isEmailAlreadyUsed(formData.email, existing.id)) {
        setValidationError(`⚠️ The Email Address "${formData.email}" is already registered. If your application is pending review, use "Check Pass Status" to track your approval.`);
        return;
      }

      if (isPhoneAlreadyUsed(formData.phone, existing.id)) {
        setValidationError(`⚠️ The Phone Number "${formData.phone}" is already registered. If your application is pending review, use "Check Pass Status" to track your approval.`);
        return;
      }
    } else {
      if (isEmailAlreadyUsed(formData.email)) {
        setValidationError(`⚠️ The Email Address "${formData.email}" is already registered. If your application is pending review, use "Check Pass Status" to track your approval.`);
        return;
      }

      if (isPhoneAlreadyUsed(formData.phone)) {
        setValidationError(`⚠️ The Phone Number "${formData.phone}" is already registered. If your application is pending review, use "Check Pass Status" to track your approval.`);
        return;
      }
    }

    // 2. ID Card Upload Requirement
    if (!idCardPreview) {
      setValidationError('Please upload a clear scanned copy or photo of your College Student ID Card.');
      return;
    }

    setIsSubmitting(true);

    const randomId = 'KRP-' + Math.floor(100000 + Math.random() * 900000);
    const draftReg: Registration = {
      id: randomId,
      ...formData,
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

    setIsSubmitting(false);
    setSubmittedRegistration(savedReg);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#0D472B', '#EA580C', '#FFFFFF'],
    });
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
                    <option value="General Pass">General Pass (All Access & Onasadya Feast — ₹700)</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Student ID Card Upload */}
              <div className="space-y-4 pt-2">
                <h3 className="font-serif text-xl font-bold text-kerala-deep flex items-center gap-2 pb-2 border-b border-gold-royal/20">
                  <span className="w-7 h-7 rounded-full bg-gold-light/40 text-gold-dark text-xs flex items-center justify-center font-bold font-sans">
                    2
                  </span>
                  <span>Upload Student ID Card (Required for Admin Approval)</span>
                </h3>

                <div className="border-2 border-dashed border-gold-royal/40 rounded-2xl p-6 bg-cream-soft/60 text-center hover:bg-cream-soft transition-all relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdCardUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {idCardPreview ? (
                    <div className="space-y-3">
                      <img
                        src={idCardPreview}
                        alt="Uploaded Student ID Preview"
                        className="max-h-48 mx-auto rounded-xl shadow-md border border-gold-royal/30 object-contain"
                      />
                      <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Student ID Uploaded: {idCardFile?.name || 'student_id.jpg'}</span>
                      </p>
                      <span className="text-[11px] text-slate-400 underline">Click or drop image to replace</span>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <div className="w-14 h-14 rounded-full bg-gold-light/30 text-gold-dark mx-auto flex items-center justify-center text-2xl shadow-inner">
                        <ImageIcon className="w-7 h-7 text-gold-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Click to upload or drag & drop Student ID Card Photo
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PNG, JPG or JPEG • Scanned copy or clear phone photo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-kerala-deep via-kerala-light to-kerala-deep hover:shadow-gold-glow transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gold-royal" />
                      <span>Submitting Details & Student ID for Verification...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gold-royal" />
                      <span>Submit Student Details & ID for Verification</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                🔒 Once Admin verifies your Student ID Card, the UPI QR Code (₹700) will be unlocked for your registration.
              </p>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};
