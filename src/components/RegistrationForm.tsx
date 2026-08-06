import React, { useState, useEffect } from 'react';
import { Ticket, User, Mail, Phone, Building2, Calendar, CheckCircle2, QrCode, Sparkles, RefreshCw, ShieldCheck, CreditCard, Image as ImageIcon, Layers, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveRegistrationAsync, type Registration } from '../services/registrationService';
import { sendApprovalEmail, generateQrCode } from '../services/emailService';
import { getUpiSettings, recordPaymentToActiveSlot } from '../services/upiSettingsService';

interface RegistrationProps {
  selectedPassFromParent?: string;
  onOpenLookup?: () => void;
}

export const RegistrationForm: React.FC<RegistrationProps> = ({ selectedPassFromParent, onOpenLookup }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: selectedPassFromParent || 'Student Pass',
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);

  const [paymentUtr, setPaymentUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState<Registration | null>(null);
  const [upiSettings, setUpiSettings] = useState(getUpiSettings());
  const [upiQrCodeUrl, setUpiQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const s = getUpiSettings();
    setUpiSettings(s);
    if (s.qrImageDataUrl) {
      setUpiQrCodeUrl(s.qrImageDataUrl);
    } else {
      generateQrCode(`upi://pay?pa=${s.upiId}&pn=Kruponam2026&am=700&cu=INR`).then((url) => {
        setUpiQrCodeUrl(url);
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCardPreview) {
      alert('Please upload a scanned image or photo of your College ID Card.');
      return;
    }

    if (!paymentUtr || paymentUtr.trim().length < 6) {
      alert('Please enter a valid 12-digit UPI UTR / Transaction Reference number.');
      return;
    }

    if (!paymentScreenshotPreview) {
      alert('Please upload your Payment Screenshot showing the UTR / Ref ID clearly.');
      return;
    }

    setIsSubmitting(true);

    try {
      recordPaymentToActiveSlot();
    } catch (_) {}

    const randomId = 'KRP-' + Math.floor(100000 + Math.random() * 900000);
    const draftReg: Registration = {
      id: randomId,
      ...formData,
      idCardUrl: idCardPreview,
      paymentScreenshotUrl: paymentScreenshotPreview,
      paymentAmount: 700,
      paymentStatus: 'Verified',
      paymentUtr: paymentUtr,
      approvalStatus: 'Pending',
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    // Save to database & cloud storage async
    const savedReg = await saveRegistrationAsync(draftReg);

    // Trigger ticket email generation
    try {
      await sendApprovalEmail(savedReg);
    } catch (err) {
      console.warn('Email trigger notice:', err);
    }

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
            Registration <span className="text-gold-gradient font-normal italic">&</span> Payment Portal
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Complete your details, select your department & section, upload your Student ID Card & Payment Screenshot, and pay ₹700 to request your pass.
          </p>
        </div>

        {submittedRegistration ? (
          <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-700 font-bold text-3xl shadow-inner animate-bounce-subtle">
                ⏳
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
                Submitted • Pending Admin Approval
              </span>

              <h3 className="font-serif text-3xl font-extrabold text-amber-950">
                Application Received!
              </h3>

              <p className="text-slate-700 text-sm max-w-md mx-auto leading-relaxed">
                Thank you <span className="font-bold text-amber-950">{submittedRegistration.fullName}</span> ({submittedRegistration.department} — {submittedRegistration.section})! Your ID Card & Payment Screenshot (UTR: <span className="font-mono font-bold">{submittedRegistration.paymentUtr}</span>) have been recorded safely.
              </p>

              <div className="p-4 bg-white rounded-2xl border border-amber-200 inline-block text-center shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tracking Reference ID</p>
                <p className="font-mono font-black text-2xl text-kerala-deep">{submittedRegistration.id}</p>
                <p className="text-[11px] text-slate-500 mt-1">Keep this ID to check your approval status</p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {onOpenLookup && (
                  <button
                    onClick={onOpenLookup}
                    className="px-6 py-3 rounded-full bg-kerala-deep text-white font-bold text-xs uppercase tracking-wider hover:bg-kerala-emerald shadow-md transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-gold-royal" />
                    <span>Check Pass Status Now</span>
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
                      Email Address *
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
                      Phone Number *
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
                    Pass Tier Selection *
                  </label>
                  <select
                    name="ticketType"
                    value={formData.ticketType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gold-royal/50 focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30 outline-none text-sm font-bold text-kerala-deep transition-all bg-gold-light/20"
                  >
                    <option value="Student Pass">Student Pass (General Access)</option>
                    <option value="VIP Cultural Pass">VIP Cultural Pass (Front Seating)</option>
                    <option value="Group Pass">Group Pass (5+ Squad)</option>
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

              {/* Step 3: Payment (₹700) + Payment Screenshot + UTR */}
              <div className="space-y-4 pt-2">
                <h3 className="font-serif text-xl font-bold text-kerala-deep flex items-center gap-2 pb-2 border-b border-gold-royal/20">
                  <span className="w-7 h-7 rounded-full bg-gold-light/40 text-gold-dark text-xs flex items-center justify-center font-bold font-sans">
                    3
                  </span>
                  <span>Pay Pass Fee (₹700) & Upload Payment Screenshot</span>
                </h3>

                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl p-6 border-2 border-gold-royal/40 shadow-sm space-y-6">
                  
                  {/* QR & UTR row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    <div className="sm:col-span-5 text-center space-y-2 border-r sm:border-r border-gold-royal/20 pr-0 sm:pr-4">
                      <span className="px-3 py-1 rounded-full bg-gold-royal text-kerala-dark text-[11px] font-black uppercase tracking-wider">
                        ₹700 Event Fee
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
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30"
                        />
                      </div>

                      {paymentUtr.trim().length >= 6 ? (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>✓ UTR Entered ({paymentUtr}) • Ready for Admin Review & Approval</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          ℹ️ Enter your 12-digit transaction UTR number from your payment app. Admin will verify your receipt and UTR upon submission.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Screenshot Upload (Crucial Requirement) */}
                  <div className="pt-4 border-t border-gold-royal/20 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-gold-royal" />
                      Upload Payment Screenshot (Showing UTR Number clearly) *
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
                          <span className="text-[11px] text-slate-400 underline">Click to replace payment screenshot</span>
                        </div>
                      ) : (
                        <div className="py-3 space-y-2">
                          <Upload className="w-7 h-7 mx-auto text-gold-dark" />
                          <p className="text-xs font-bold text-slate-800">
                            Upload GPay / PhonePe / Paytm Payment Screenshot
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Must clearly display the ₹700 paid amount and 12-digit UTR/UPI Ref ID.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

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
                      <span>Saving Data & Submitting to Admin Panel...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-gold-royal" />
                      <span>Submit Pass Request (₹700 Paid)</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                🔒 All student information, section details, and payment screenshots are safely encrypted and preserved.
              </p>
            </form>
          </div>
        )}

      </div>
    </section>
  );
};
