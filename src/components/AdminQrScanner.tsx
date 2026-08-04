import React, { useState } from 'react';
import { QrCode, X, RefreshCw, UserCheck } from 'lucide-react';
import { markAsReported, getRegistrations, type ScanResult } from '../services/registrationService';
import confetti from 'canvas-confetti';

interface QrScannerProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminQrScanner: React.FC<QrScannerProps> = ({ onClose, onRefreshData }) => {
  const [scanQuery, setScanQuery] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const registrations = getRegistrations();
  const approvedList = registrations.filter((r) => r.approvalStatus === 'Approved');

  const handleProcessScan = (code: string) => {
    if (!code.trim()) return;
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      const res = markAsReported(code);
      setScanResult(res);

      if (res.status === 'success') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#D4AF37', '#FFFFFF'],
        });
      }

      if (onRefreshData) {
        onRefreshData();
      }
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleProcessScan(scanQuery);
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
              Scan student pass QR code to mark attendee as <span className="text-emerald-400 font-bold">Reported (Checked-In)</span>.
            </p>
          </div>
        </div>

        {/* Camera Viewfinder Simulation */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-gold-royal/40 p-8 text-center space-y-4 mb-6">
          
          {/* Animated Scanning Line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-royal to-transparent shadow-gold-glow animate-pulse" />

          <div className="w-32 h-32 mx-auto bg-slate-900 rounded-2xl p-4 border border-gold-royal/30 flex items-center justify-center text-gold-royal relative">
            <QrCode className="w-full h-full text-gold-royal animate-pulse" />
            <div className="absolute inset-0 border-2 border-gold-royal rounded-2xl animate-ping opacity-25" />
          </div>

          <p className="text-xs font-semibold text-slate-300">
            Position Student Pass QR Code inside frame or enter Registration Token ID below
          </p>

          {/* Quick Select Dropdown for Testing Approved Passes */}
          <div className="pt-2 max-w-md mx-auto">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gold-light mb-1">
              ⚡ Quick Select Approved Pass (For Gate Testing)
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
            
            {scanResult.status === 'success' && (
              <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-6 space-y-4 shadow-xl text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 mx-auto flex items-center justify-center text-3xl font-bold">
                  ✓
                </div>

                <div className="space-y-1">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                    ENTRY GRANTED — REPORTED AT GATE
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
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Payment Verification</span>
                    <span className="text-emerald-400 font-bold">✓ ₹700 Paid ({scanResult.registration?.paymentUtr})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Onasadya Token</span>
                    <span className="text-emerald-400 font-bold">✓ Validated</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 uppercase font-bold block text-[10px]">Reported Timestamp</span>
                    <span className="text-white font-mono font-bold">{scanResult.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-400 font-semibold">
                  🎉 Pass successfully updated to REPORTED in system database!
                </p>
              </div>
            )}

            {scanResult.status === 'already_reported' && (
              <div className="bg-amber-950/90 border-2 border-amber-500 rounded-2xl p-6 space-y-3 shadow-xl text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 mx-auto flex items-center justify-center text-2xl font-bold">
                  ⚠️
                </div>

                <span className="px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                  DUPLICATE SCAN ALERT
                </span>

                <h4 className="font-serif text-xl font-bold text-amber-200">
                  Pass Already Reported Earlier
                </h4>

                <p className="text-xs text-amber-300 max-w-md mx-auto">
                  {scanResult.message}
                </p>
              </div>
            )}

            {(scanResult.status === 'not_approved' || scanResult.status === 'not_found') && (
              <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-6 space-y-3 shadow-xl text-center">
                <div className="w-14 h-14 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center text-2xl font-bold">
                  ✕
                </div>

                <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider">
                  ACCESS DENIED
                </span>

                <h4 className="font-serif text-xl font-bold text-rose-200">
                  Invalid or Unapproved Pass
                </h4>

                <p className="text-xs text-rose-300 max-w-md mx-auto">
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
