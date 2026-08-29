import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, UserCheck, Camera, CameraOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { markAsReportedAsync, saveRegistrationAsync, getRegistrations, type ScanResult } from '../services/registrationService';
import confetti from 'canvas-confetti';

interface QrScannerProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminQrScanner: React.FC<QrScannerProps> = ({ onClose, onRefreshData }) => {
  const [scanQuery, setScanQuery] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const registrations = getRegistrations();
  const approvedList = registrations.filter((r) => r.approvalStatus === 'Approved' || r.approvalStatus === 'VIP' || r.approvalStatus === 'VIP_Pending');

  // Web Audio chime synthesized sounds
  const playScanSound = (isSuccess: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        // High pleasant double-beep for check-in
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Low double-buzz for unpaid / error
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (_) {}
  };

  const handleProcessScan = async (code: string) => {
    if (!code.trim()) return;

    // Debounce duplicate camera scans within 2.5 seconds
    const now = Date.now();
    if (lastScannedCodeRef.current === code.trim() && now - lastScanTimeRef.current < 2500) {
      return;
    }
    lastScannedCodeRef.current = code.trim();
    lastScanTimeRef.current = now;

    setIsScanning(true);
    setScanQuery(code);

    const res = await markAsReportedAsync(code);
    setIsScanning(false);
    setScanResult(res);

    if (res.status === 'success') {
      playScanSound(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#D4AF37', '#FFFFFF'],
      });
    } else {
      playScanSound(false);
    }

    if (onRefreshData) {
      onRefreshData();
    }
  };

  const handleGateCollectAndApprove = async (reg: any) => {
    if (!reg) return;
    setIsScanning(true);
    const updated = {
      ...reg,
      paymentUtr: reg.paymentUtr || 'CASH_GATE_COLLECTED',
      approvalStatus: 'Approved' as const,
      paymentStatus: 'Verified' as const,
      isReported: true,
      reportedAt: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      approvedAt: reg.approvedAt || new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      updatedAt: new Date().toISOString(),
    };
    await saveRegistrationAsync(updated);
    setIsScanning(false);
    setScanResult({
      status: 'success',
      registration: updated,
      timestamp: updated.reportedAt,
      message: `ENTRY GRANTED: ₹700 Cash collected at gate. ${updated.fullName} (${updated.id}) MARKED AS CHECKED IN!`,
    });
    playScanSound(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22C55E', '#D4AF37', '#FFFFFF'],
    });
    if (onRefreshData) onRefreshData();
  };

  // Initialize and lifecycle manage HTML5 camera scanner
  useEffect(() => {
    let isMounted = true;
    const elementId = 'html5qr-code-full-region';

    const startCamera = async () => {
      try {
        setCameraError(null);
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (_) {}
        }

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: facingMode },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              handleProcessScan(decodedText);
            }
          },
          () => {
            // Ignore scan attempt errors (when frame doesn't contain QR)
          }
        );
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera camera start notice:', err);
          setCameraError(
            'Live Camera access unavailable or permission denied. Ensure camera permissions are allowed in browser settings, or enter Token ID manually below.'
          );
          setCameraActive(false);
        }
      }
    };

    if (cameraActive) {
      // Small timeout to guarantee DOM container exists
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      return () => {
        clearTimeout(timer);
        isMounted = false;
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
          } catch (_) {}
        }
      };
    } else {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (_) {}
      }
    }
  }, [cameraActive, facingMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessScan(scanQuery);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border-2 border-gold-royal shadow-2xl relative animate-fadeIn text-white max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gold-royal text-kerala-dark flex items-center justify-center font-bold text-2xl shadow-gold-glow">
            📸
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              Campus Gate QR Code Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Point mobile camera at student pass QR code to mark attendee as <span className="text-emerald-400 font-bold">Reported (Checked-In)</span>.
            </p>
          </div>
        </div>

        {/* Live Camera Viewfinder Box */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-gold-royal/40 p-4 text-center space-y-4 mb-6 min-h-[300px] flex flex-col justify-center items-center">
          
          {/* Animated Scanning Line */}
          {cameraActive && !cameraError && (
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-royal to-transparent shadow-gold-glow animate-pulse z-10 pointer-events-none" />
          )}

          {/* HTML5 QR Camera Container */}
          <div className={`w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-black relative border border-gold-royal/30 ${!cameraActive || cameraError ? 'hidden' : 'block'}`}>
            <div id="html5qr-code-full-region" className="w-full h-full min-h-[260px]" />
          </div>

          {/* Camera Disabled or Error Fallback UI */}
          {(!cameraActive || cameraError) && (
            <div className="py-6 space-y-3 px-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400">
                <CameraOff className="w-8 h-8" />
              </div>

              {cameraError ? (
                <div className="p-3 bg-amber-950/80 border border-amber-500/40 rounded-xl text-amber-200 text-xs font-medium flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  Camera feed is currently turned off. Click below to re-enable camera scanning.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setCameraActive(true);
                }}
                className="px-4 py-2 rounded-full bg-gold-royal text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-gold-light transition-all inline-flex items-center gap-1.5 shadow-md"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Turn On Camera Scanner</span>
              </button>
            </div>
          )}

          {/* Camera Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {cameraActive && !cameraError && (
              <>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gold-royal" />
                  <span>Switch Camera ({facingMode === 'environment' ? 'Back 📷' : 'Front 🤳'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCameraActive(false)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Turn Off Camera</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Select Dropdown for Testing Approved Passes */}
          <div className="pt-2 max-w-md mx-auto w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-light mb-1">
              ⚡ Quick Select Approved Pass (For Testing Without Camera)
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setScanQuery(e.target.value);
                  handleProcessScan(e.target.value);
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-gold-royal"
            >
              <option value="">-- Choose Approved Student Pass --</option>
              {approvedList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} ({item.id}) - {item.isReported ? 'Already Reported' : 'Not Reported Yet'}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Manual Scan Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            placeholder="Scan or type Token ID (e.g. KRP-849201)..."
            value={scanQuery}
            onChange={(e) => setScanQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-full bg-slate-950 border border-slate-700 text-sm font-mono text-white outline-none focus:border-gold-royal"
          />

          <button
            type="submit"
            disabled={isScanning}
            className="px-6 py-3 rounded-full bg-gold-royal text-kerala-dark font-extrabold text-xs uppercase tracking-wider hover:bg-gold-light transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>Process Gate Entry</span>
          </button>
        </form>

        {/* Real-time Gate Scan Result Banner */}
        {scanResult && (
          <div className="animate-fadeIn">
            
            {/* 1. SUCCESS: ENTRY GRANTED */}
            {scanResult.status === 'success' && (
              <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 shadow-xl text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 mx-auto flex items-center justify-center text-3xl font-bold">
                  ✓
                </div>

                <div className="space-y-1">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                    ENTRY GRANTED — CHECKED IN AT GATE
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-emerald-200 pt-2">
                    {scanResult.registration?.fullName}
                  </h4>
                  <p className="text-xs text-emerald-300 font-mono">
                    Token ID: {scanResult.registration?.id} • Department: {scanResult.registration?.department} ({scanResult.registration?.year})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3 rounded-xl border border-emerald-800/60 max-w-md mx-auto text-left">
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Pass Status</span>
                    <span className="text-emerald-400 font-bold">
                      {scanResult.registration?.approvalStatus === 'VIP' || scanResult.registration?.approvalStatus === 'VIP_Pending' || scanResult.registration?.ticketType === 'VIP Pass'
                        ? '👑 VIP Pass (Complimentary)'
                        : `✓ Verified & Approved`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Onasadya Food Token</span>
                    <span className="text-emerald-400 font-bold">✓ Validated</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Check-In Timestamp</span>
                    <span className="text-white font-mono font-bold">{scanResult.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-400 font-semibold">
                  🎉 Pass successfully updated to CHECKED-IN in system database!
                </p>
              </div>
            )}

            {/* 2. ALREADY REPORTED (DUPLICATE SCAN) */}
            {scanResult.status === 'already_reported' && (
              <div className="bg-amber-950/90 border-2 border-amber-500 rounded-2xl p-6 space-y-3 shadow-xl text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 mx-auto flex items-center justify-center text-2xl font-bold">
                  ⚠️
                </div>

                <span className="px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                  DUPLICATE SCAN ALERT
                </span>

                <h4 className="font-serif text-xl font-bold text-amber-200">
                  Pass Already Checked-In Earlier
                </h4>

                <p className="text-xs text-amber-300 max-w-md mx-auto">
                  {scanResult.message}
                </p>

                {scanResult.registration && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-amber-800/60 max-w-md mx-auto text-xs text-left">
                    <p className="font-bold text-white">{scanResult.registration.fullName} ({scanResult.registration.id})</p>
                    <p className="text-slate-400">{scanResult.registration.department} • {scanResult.registration.year}</p>
                    <p className="text-amber-400 font-mono mt-1">First Scanned At: {scanResult.timestamp || scanResult.registration.reportedAt || 'Earlier'}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. PAYMENT REQUIRED AT GATE */}
            {scanResult.status === 'payment_required' && scanResult.registration && (
              <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-rose-950/90 border-2 border-amber-500 rounded-2xl p-6 space-y-4 shadow-xl text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 mx-auto flex items-center justify-center text-2xl font-bold">
                  💳
                </div>

                <span className="px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                  UNPAID PASS — COLLECT ₹700 AT GATE
                </span>

                <h4 className="font-serif text-2xl font-bold text-amber-200">
                  {scanResult.registration.fullName}
                </h4>

                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Student ID is <strong>Approved</strong>, but the ₹{scanResult.registration.paymentAmount || 700} pass fee is not paid yet. Collect ₹700 cash or UPI at gate to grant admission.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/80 p-3 rounded-xl border border-amber-800/60 max-w-md mx-auto text-left">
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Token ID</span>
                    <span className="text-white font-mono font-bold">{scanResult.registration.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Department</span>
                    <span className="text-white font-bold">{scanResult.registration.department}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleGateCollectAndApprove(scanResult.registration)}
                    className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>💳 Collect ₹700 & Check In Attendee Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. PAYMENT PENDING VERIFICATION */}
            {scanResult.status === 'payment_pending_review' && scanResult.registration && (
              <div className="bg-gradient-to-br from-blue-950/90 via-slate-900 to-slate-950 border-2 border-blue-500 rounded-2xl p-6 space-y-4 shadow-xl text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-blue-500 text-white mx-auto flex items-center justify-center text-2xl font-bold">
                  ⏳
                </div>

                <span className="px-3.5 py-1 rounded-full bg-blue-500 text-white text-xs font-black uppercase tracking-wider">
                  PAYMENT SUBMITTED — PENDING CONFIRMATION
                </span>

                <h4 className="font-serif text-2xl font-bold text-blue-200">
                  {scanResult.registration.fullName}
                </h4>

                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Student submitted payment with UTR: <strong className="font-mono text-gold-light">{scanResult.registration.paymentUtr || 'N/A'}</strong>. Verify and grant admission.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleGateCollectAndApprove(scanResult.registration)}
                    className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>✅ Confirm Payment & Check In Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. ID APPROVAL PENDING */}
            {scanResult.status === 'id_pending' && scanResult.registration && (
              <div className="bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-2xl p-6 space-y-4 shadow-xl text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 mx-auto flex items-center justify-center text-2xl font-bold">
                  🪪
                </div>

                <span className="px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                  STUDENT ID CARD PENDING VERIFICATION
                </span>

                <h4 className="font-serif text-2xl font-bold text-amber-200">
                  {scanResult.registration.fullName}
                </h4>

                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Student ID card has not been approved yet. Inspect student's physical or digital ID card, collect ₹700 pass fee, and grant entry.
                </p>

                {scanResult.registration.idCardUrl && (
                  <div className="max-w-xs mx-auto">
                    <img
                      src={scanResult.registration.idCardUrl}
                      alt="Student ID Preview"
                      className="max-h-36 rounded-xl border border-gold-royal/40 mx-auto object-contain bg-white"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isScanning}
                    onClick={() => handleGateCollectAndApprove(scanResult.registration)}
                    className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center gap-2 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>🔍 Verify ID, Collect ₹700 & Check In</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. NOT APPROVED / REJECTED */}
            {scanResult.status === 'not_approved' && (
              <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-6 space-y-3 shadow-xl text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center text-2xl font-bold">
                  ✕
                </div>

                <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider">
                  ACCESS DENIED — PASS REJECTED
                </span>

                <h4 className="font-serif text-xl font-bold text-rose-200">
                  {scanResult.registration?.fullName || 'Application Rejected'}
                </h4>

                <p className="text-xs text-rose-300 max-w-md mx-auto">
                  {scanResult.message}
                </p>

                {scanResult.registration && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => handleGateCollectAndApprove(scanResult.registration)}
                      className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Override: Grant Entry & Check In</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 7. NOT FOUND */}
            {scanResult.status === 'not_found' && (
              <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 space-y-3 shadow-xl text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-2xl font-bold">
                  🔍
                </div>

                <span className="px-3.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider">
                  PASS NOT FOUND
                </span>

                <h4 className="font-serif text-xl font-bold text-white">
                  Unrecognized QR Code or Token
                </h4>

                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {scanResult.message}
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
