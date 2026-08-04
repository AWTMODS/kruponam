import React, { useState, useEffect } from 'react';
import { Lock, LogOut, CheckCircle2, Eye, Search, DollarSign, Users, Clock, ArrowLeft, X, QrCode, UserCheck, Mail, Settings, Upload, Save, RefreshCw, Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { getRegistrations, approveRegistration, rejectRegistration, markAsReported, type Registration } from '../services/registrationService';
import { sendApprovalEmail, type EmailResult } from '../services/emailService';
import { getMultiUpiSettings, saveMultiUpiSettings, addUpiSlot, updateUpiSlot, removeUpiSlot, resetSlotCount, type UpiSlot, type MultiUpiSettings } from '../services/upiSettingsService';
import { AdminQrScanner } from './AdminQrScanner';

interface AdminPortalProps {
  onClose?: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Reported'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState<Registration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [emailPreview, setEmailPreview] = useState<EmailResult | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'upi-settings'>('registrations');

  // Multi-UPI Settings state
  const [multiUpi, setMultiUpi] = useState<MultiUpiSettings>(getMultiUpiSettings());
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('kruponam_admin_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    loadData();
  }, []);

  const loadData = () => {
    setRegistrations(getRegistrations());
  };

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminEmail.trim().toLowerCase() === 'admin@krupanidhi.edu.in' &&
      adminPassword === 'kruponam2026'
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('kruponam_admin_auth', 'true');
      setLoginError('');
      loadData();
    } else {
      setLoginError('Invalid Admin credentials. (Use admin@krupanidhi.edu.in / kruponam2026)');
    }
  };

  const handleAutoFillLogin = () => {
    setAdminEmail('admin@krupanidhi.edu.in');
    setAdminPassword('kruponam2026');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kruponam_admin_auth');
  };

  const handleApprove = async (id: string) => {
    const approved = approveRegistration(id);
    loadData();
    if (inspectItem?.id === id) setInspectItem(null);

    if (approved) {
      setSendingEmail(id);
      addToast(`✅ ${approved.fullName}'s pass approved! Generating & sending email...`, 'info');

      const result = await sendApprovalEmail(approved);
      setSendingEmail(null);

      if (result.success) {
        addToast(`✉️ Invoice & QR Ticket emailed to ${approved.email}`, 'success');
      } else {
        addToast(`📧 Preview Mode: ${result.message}`, 'info');
      }

      // Always show preview modal
      setEmailPreview(result);
    }
  };

  const handleConfirmReject = (id: string) => {
    const reason = rejectionReasonInput.trim() || 'Uploaded Student ID or Payment UTR could not be verified.';
    rejectRegistration(id, reason);
    loadData();
    setShowRejectModal(null);
    setRejectionReasonInput('');
    if (inspectItem?.id === id) setInspectItem(null);
    addToast('❌ Application rejected and student notified.', 'error');
  };

  const handleMarkReportedDirect = (id: string) => {
    markAsReported(id);
    loadData();
    addToast('✅ Student marked as Reported at Gate!', 'success');
  };

  const refreshMultiUpi = () => setMultiUpi(getMultiUpiSettings());

  const handleAddSlot = () => {
    addUpiSlot();
    refreshMultiUpi();
    addToast('✅ New UPI slot added!', 'success');
  };

  const handleUpdateSlot = (id: string, changes: Partial<UpiSlot>) => {
    const updated = updateUpiSlot(id, changes);
    setMultiUpi(updated);
  };

  const handleRemoveSlot = (id: string) => {
    if (multiUpi.slots.length <= 1) {
      addToast('⚠️ At least one UPI slot must exist.', 'error');
      return;
    }
    removeUpiSlot(id);
    refreshMultiUpi();
    addToast('🗑️ UPI slot removed.', 'info');
  };

  const handleResetSlotCount = (id: string) => {
    resetSlotCount(id);
    refreshMultiUpi();
    addToast('🔄 Payment count reset to 0.', 'info');
  };

  const handleQrImageUpload = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handleUpdateSlot(slotId, { qrImageDataUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAllUpi = () => {
    setUpiSaving(true);
    setTimeout(() => {
      saveMultiUpiSettings(multiUpi);
      setUpiSaving(false);
      setUpiSaved(true);
      addToast('💳 All UPI slot settings saved successfully!', 'success');
      setTimeout(() => setUpiSaved(false), 3000);
    }, 500);
  };

  const totalApps = registrations.length;
  const pendingApps = registrations.filter((r) => r.approvalStatus === 'Pending').length;
  const approvedApps = registrations.filter((r) => r.approvalStatus === 'Approved').length;
  const rejectedApps = registrations.filter((r) => r.approvalStatus === 'Rejected').length;
  const reportedApps = registrations.filter((r) => r.isReported).length;
  const totalRevenue = approvedApps * 700;

  const filteredRegistrations = registrations.filter((item) => {
    let matchesFilter = true;
    if (statusFilter === 'Reported') {
      matchesFilter = !!item.isReported;
    } else if (statusFilter !== 'all') {
      matchesFilter = item.approvalStatus === statusFilter;
    }
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      item.fullName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.paymentUtr.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 font-sans">

      {/* ── Toast Notifications ─────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl text-sm font-semibold animate-fadeIn border backdrop-blur-md ${
              t.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 text-rose-200'
                : 'bg-blue-950/95 border-blue-500 text-blue-200'
            }`}
          >
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-white mt-0.5 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold-royal text-kerala-dark flex items-center justify-center font-bold text-xl shadow-gold-glow">
            👑
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">
              Kruponam 2026 Admin Approval Portal
            </h1>
            <p className="text-xs text-slate-400">
              Krupanidhi Degree College Executive Management Panel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => setShowScannerModal(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-gold-light" />
              <span>📷 Gate QR Scanner</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-rose-950 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Login Screen ─────────────────────────────────────────────── */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto my-12 bg-slate-800/80 rounded-3xl p-8 border border-gold-royal/30 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-gold-royal/20 border border-gold-royal mx-auto flex items-center justify-center text-gold-royal text-2xl">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">Admin Authentication</h2>
            <p className="text-xs text-slate-400">Restricted area for event conveners and administrators.</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs text-center font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Admin Email</label>
              <input type="email" required placeholder="admin@krupanidhi.edu.in" value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-gold-royal" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Password</label>
              <input type="password" required placeholder="••••••••••••" value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-gold-royal" />
            </div>
            <button type="submit"
              className="w-full py-3.5 rounded-full bg-gold-royal text-kerala-dark font-extrabold text-xs uppercase tracking-wider hover:bg-gold-light transition-all shadow-md">
              Login to Admin Dashboard
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-700">
            <button onClick={handleAutoFillLogin}
              className="text-xs text-gold-light underline font-mono hover:text-white">
              ⚡ Auto-Fill Test Admin Credentials
            </button>
          </div>
        </div>

      ) : (
        /* ── Dashboard ───────────────────────────────────────────────── */
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

          {/* Tab Bar */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'registrations' ? 'bg-gold-royal text-kerala-dark shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registrations</span>
            </button>
            <button
              onClick={() => { setActiveTab('upi-settings'); refreshMultiUpi(); }}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'upi-settings' ? 'bg-gold-royal text-kerala-dark shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>💳 Payment / UPI Settings</span>
            </button>
          </div>

          {activeTab === 'registrations' && (<>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 shadow-md">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                <span>Total Registered</span><Users className="w-4 h-4" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-white mt-2">{totalApps}</p>
              <span className="text-[10px] text-slate-400">All Submissions</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-5 border border-amber-500/40 shadow-md">
              <div className="flex justify-between items-center text-amber-400 text-xs font-bold uppercase">
                <span>Pending Review</span><Clock className="w-4 h-4" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-amber-400 mt-2">{pendingApps}</p>
              <span className="text-[10px] text-amber-300/80">Requires Admin Action</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-5 border border-emerald-500/40 shadow-md">
              <div className="flex justify-between items-center text-emerald-400 text-xs font-bold uppercase">
                <span>Approved Passes</span><CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-emerald-400 mt-2">{approvedApps}</p>
              <span className="text-[10px] text-emerald-300/80">Passes Issued</span>
            </div>

            <div className="bg-emerald-950/80 rounded-2xl p-5 border-2 border-emerald-500 shadow-md">
              <div className="flex justify-between items-center text-emerald-300 text-xs font-bold uppercase">
                <span>Reported at Gate</span><UserCheck className="w-4 h-4" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-emerald-300 mt-2">{reportedApps}</p>
              <span className="text-[10px] text-emerald-300/80">Checked-In</span>
            </div>

            <div className="bg-gradient-to-br from-gold-royal/20 to-amber-600/30 rounded-2xl p-5 border border-gold-royal shadow-lg">
              <div className="flex justify-between items-center text-gold-light text-xs font-bold uppercase">
                <span>Total Revenue</span><DollarSign className="w-4 h-4" />
              </div>
              <p className="font-serif text-3xl font-extrabold text-gold-light mt-2">₹{totalRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-gold-light/80">₹700 × Approved</span>
            </div>
          </div>


          {/* Table Section */}
          <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `All (${totalApps})` },
                  { id: 'Pending', label: `Pending (${pendingApps})` },
                  { id: 'Approved', label: `Approved (${approvedApps})` },
                  { id: 'Reported', label: `Reported at Gate (${reportedApps})` },
                  { id: 'Rejected', label: `Rejected (${rejectedApps})` },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      statusFilter === tab.id ? 'bg-gold-royal text-kerala-dark shadow-md' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search name, UTR, ID, dept..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-gold-royal" />
              </div>
            </div>

            {/* Registrations Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                    <th className="p-4">Reg ID</th>
                    <th className="p-4">Student Details</th>
                    <th className="p-4">Dept & Year</th>
                    <th className="p-4">ID Card</th>
                    <th className="p-4">₹700 Payment</th>
                    <th className="p-4">Approval</th>
                    <th className="p-4">Gate Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                        No registrations found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-gold-light">{item.id}</td>

                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{item.fullName}</p>
                          <p className="text-[11px] text-slate-400">{item.email} • {item.phone}</p>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                            {item.department} ({item.year})
                          </span>
                        </td>

                        <td className="p-4">
                          <button onClick={() => setInspectItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-700 text-gold-light border border-gold-royal/30 font-semibold transition-all">
                            <Eye className="w-3.5 h-3.5" /><span>View ID</span>
                          </button>
                        </td>

                        <td className="p-4 font-mono">
                          <span className="text-emerald-400 font-bold block">✓ ₹700 Verified</span>
                          <span className="text-[11px] text-slate-400">UTR: {item.paymentUtr}</span>
                        </td>

                        <td className="p-4">
                          {item.approvalStatus === 'Approved' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[11px]">✓ Approved</span>
                              <button
                                onClick={() => sendApprovalEmail(item).then(setEmailPreview)}
                                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mt-1 underline"
                                title="Resend or Preview Email"
                              >
                                <Mail className="w-3 h-3" /> Preview Email
                              </button>
                            </div>
                          )}
                          {item.approvalStatus === 'Pending' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[11px] animate-pulse">⏳ Pending</span>
                          )}
                          {item.approvalStatus === 'Rejected' && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[11px]">✕ Rejected</span>
                          )}
                        </td>

                        <td className="p-4">
                          {item.isReported ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /><span>Reported</span>
                              </span>
                              <span className="text-[10px] block text-slate-400 font-mono mt-0.5">{item.reportedAt}</span>
                            </div>
                          ) : item.approvalStatus === 'Approved' ? (
                            <button onClick={() => handleMarkReportedDirect(item.id)}
                              className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px] transition-all">
                              Mark Reported
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Not Approved Yet</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.approvalStatus !== 'Approved' && (
                              <button onClick={() => handleApprove(item.id)}
                                disabled={sendingEmail === item.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1">
                                {sendingEmail === item.id ? '⏳' : '✓'} Approve
                              </button>
                            )}
                            {item.approvalStatus !== 'Rejected' && (
                              <button onClick={() => setShowRejectModal(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 font-bold transition-colors">
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          </>)}

          {/* ── UPI / Payment Settings Panel ──────────────────────── */}
          {activeTab === 'upi-settings' && (
            <div className="bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-xl space-y-8 animate-fadeIn">

              <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                <div className="w-10 h-10 rounded-2xl bg-gold-royal/30 text-gold-royal flex items-center justify-center text-xl">
                  💳
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Multi-UPI Payment Slots</h2>
                  <p className="text-xs text-slate-400">
                    Add multiple UPI IDs. When a slot reaches its payment limit, students are automatically routed to the next slot.
                    Track payments per slot in real time.
                  </p>
                </div>
              </div>

              {/* Active Slot Banner */}
              {(() => {
                const active = multiUpi.slots[multiUpi.activeSlotIndex] || multiUpi.slots[0];
                if (!active) return null;
                const isFull = active.paymentCount >= active.maxPayments;
                return (
                  <div className={`rounded-2xl p-4 border flex items-center gap-3 ${isFull ? 'bg-rose-950/60 border-rose-500' : 'bg-emerald-950/60 border-emerald-500'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFull ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 text-xs">
                      <span className={`font-extrabold uppercase tracking-wider ${isFull ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {isFull ? '🔴 ALL SLOTS FULL — No active slot available' : `🟢 ACTIVE: ${active.label} — ${active.upiId || 'UPI not set'}`}
                      </span>
                      {!isFull && (
                        <span className="text-slate-400 ml-2">
                          ({active.paymentCount}/{active.maxPayments} payments used)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* UPI Slot Cards */}
              <div className="space-y-4">
                {multiUpi.slots.map((slot, idx) => {
                  const isActive = idx === multiUpi.activeSlotIndex;
                  const isFull = slot.paymentCount >= slot.maxPayments;
                  const pct = Math.min((slot.paymentCount / slot.maxPayments) * 100, 100);
                  const isExpanded = expandedSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-2xl border-2 overflow-hidden transition-all ${
                        isFull
                          ? 'border-rose-700 bg-rose-950/30'
                          : isActive
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {/* Slot Header — always visible */}
                      <div className="flex items-center gap-3 p-4">
                        {/* Status dot */}
                        <div className={`w-3 h-3 rounded-full shrink-0 ${isFull ? 'bg-rose-500' : isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{slot.label}</span>
                            {isActive && !isFull && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase">ACTIVE</span>
                            )}
                            {isFull && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase">FULL</span>
                            )}
                            <span className="text-[11px] font-mono text-slate-400 truncate">{slot.upiId || '—'}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : 'bg-slate-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-mono font-bold shrink-0 ${isFull ? 'text-rose-400' : isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {slot.paymentCount}/{slot.maxPayments}
                            </span>
                          </div>
                        </div>

                        {/* Slot Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleResetSlotCount(slot.id)}
                            title="Reset payment count to 0"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-900 text-slate-400 hover:text-amber-300 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                          >
                            {isExpanded ? 'Close ▲' : 'Edit ▼'}
                          </button>
                          <button
                            onClick={() => handleRemoveSlot(slot.id)}
                            title="Remove this UPI slot"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Edit Panel */}
                      {isExpanded && (
                        <div className="border-t border-slate-700 p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                          {/* Left — fields */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Slot Label</label>
                              <input
                                type="text"
                                value={slot.label}
                                onChange={(e) => handleUpdateSlot(slot.id, { label: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs outline-none focus:border-gold-royal"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">UPI ID</label>
                              <input
                                type="text"
                                value={slot.upiId}
                                onChange={(e) => handleUpdateSlot(slot.id, { upiId: e.target.value })}
                                placeholder="e.g. kruponam2026@upi"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white font-mono text-xs outline-none focus:border-gold-royal"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Merchant Name</label>
                              <input
                                type="text"
                                value={slot.merchantName}
                                onChange={(e) => handleUpdateSlot(slot.id, { merchantName: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs outline-none focus:border-gold-royal"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Max Payments Before Auto-Rotate
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={slot.maxPayments}
                                onChange={(e) => handleUpdateSlot(slot.id, { maxPayments: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs font-mono outline-none focus:border-gold-royal"
                              />
                              <p className="text-[10px] text-slate-500 mt-1">
                                After {slot.maxPayments} payments, students will be automatically routed to the next UPI slot.
                              </p>
                            </div>
                          </div>

                          {/* Right — QR + preview */}
                          <div className="space-y-4">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">QR Code Image</label>
                            <label
                              htmlFor={`qr-upload-${slot.id}`}
                              className="flex flex-col items-center justify-center gap-2 w-full px-4 py-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-gold-royal cursor-pointer transition-colors bg-slate-900 text-center group"
                            >
                              <Upload className="w-6 h-6 text-slate-500 group-hover:text-gold-royal transition-colors" />
                              <span className="text-[10px] text-slate-400 group-hover:text-white font-medium">
                                {slot.qrImageDataUrl ? '✓ QR uploaded — click to replace' : 'Upload QR Code image'}
                              </span>
                            </label>
                            <input
                              id={`qr-upload-${slot.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQrImageUpload(slot.id, e)}
                              className="hidden"
                            />

                            {/* QR Preview */}
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-28 h-28 bg-white p-2 rounded-xl border-2 border-gold-royal flex items-center justify-center overflow-hidden">
                                {slot.qrImageDataUrl ? (
                                  <img src={slot.qrImageDataUrl} alt="QR" className="w-full h-full object-contain rounded-lg" />
                                ) : (
                                  <QrCode className="w-full h-full text-slate-900" />
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-slate-400 text-center">{slot.upiId || '—'}</p>
                              {slot.qrImageDataUrl && (
                                <button
                                  onClick={() => handleUpdateSlot(slot.id, { qrImageDataUrl: null })}
                                  className="text-[10px] text-rose-400 hover:text-rose-200 underline"
                                >
                                  ✕ Remove QR image
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Slot + Save Row */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleAddSlot}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider transition-all border border-slate-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New UPI Slot</span>
                </button>

                <button
                  onClick={handleSaveAllUpi}
                  disabled={upiSaving}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-gold-royal hover:bg-gold-light text-kerala-dark font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-60"
                >
                  {upiSaving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                  ) : upiSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /><span>✅ All Saved!</span></>
                  ) : (
                    <><Save className="w-4 h-4" /><span>Save All UPI Settings</span></>
                  )}
                </button>
              </div>

              <div className="bg-blue-950/60 border border-blue-800 rounded-2xl p-4 text-xs text-blue-300 space-y-1">
                <p className="font-bold text-blue-200 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> How Auto-Rotation Works</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-300/90">
                  <li>Each slot has a configurable payment limit (default: 20)</li>
                  <li>When a student verifies ₹700 payment, the active slot's count increments</li>
                  <li>When a slot hits its limit (e.g. 20/20), students are routed to the next slot automatically</li>
                  <li>You can reset any slot's count using the ↺ reset button</li>
                </ul>
              </div>

            </div>
          )}

        </div>
      )}


      {/* ── Gate QR Scanner Modal ─────────────────────────────────── */}
      {showScannerModal && (
        <AdminQrScanner onClose={() => setShowScannerModal(false)} onRefreshData={loadData} />
      )}

      {/* ── Email Preview Modal ──────────────────────────────────── */}
      {emailPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full border-2 border-blue-500 shadow-2xl relative flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl">
                  ✉️
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Email Sent to Student</h3>
                  <p className={`text-xs mt-0.5 font-semibold ${emailPreview.success ? 'text-emerald-400' : 'text-blue-300'}`}>
                    {emailPreview.message}
                  </p>
                </div>
              </div>
              <button onClick={() => setEmailPreview(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Preview iframe */}
            <div className="flex-1 overflow-hidden rounded-b-3xl">
              <iframe
                srcDoc={emailPreview.previewHtml}
                title="Email Preview"
                className="w-full h-full min-h-[600px] rounded-b-3xl border-0 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Inspect Student Modal ─────────────────────────────────── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border-2 border-gold-royal shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button onClick={() => setInspectItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-royal/30 text-gold-royal flex items-center justify-center text-xl">🪪</div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Student ID Card & Application</h3>
                  <p className="text-xs text-slate-400">Ref: <span className="font-mono text-gold-light">{inspectItem.id}</span></p>
                </div>
              </div>

              <div className="bg-black p-4 rounded-2xl border border-slate-800 text-center">
                <p className="text-xs text-slate-400 font-bold uppercase mb-2">Uploaded Student ID Card</p>
                <img src={inspectItem.idCardUrl} alt="Student ID Card"
                  className="max-h-64 mx-auto object-contain rounded-xl border border-gold-royal/40 shadow-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                {[
                  ['Student Name', inspectItem.fullName],
                  ['Department & Year', `${inspectItem.department} (${inspectItem.year})`],
                  ['Email Address', inspectItem.email],
                  ['Phone Number', inspectItem.phone],
                  ['₹700 Payment UTR', inspectItem.paymentUtr],
                  ['Gate Status', inspectItem.isReported ? `✓ Reported on ${inspectItem.reportedAt}` : 'Not Reported Yet'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-slate-400 uppercase font-bold">{label}</p>
                    <p className="text-white font-bold text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                {inspectItem.approvalStatus === 'Approved' && !inspectItem.isReported && (
                  <button onClick={() => { handleMarkReportedDirect(inspectItem.id); setInspectItem(null); }}
                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Mark as Reported
                  </button>
                )}
                {inspectItem.approvalStatus !== 'Approved' && (
                  <button onClick={() => { handleApprove(inspectItem.id); }}
                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider">
                    ✅ Approve & Email Ticket
                  </button>
                )}
                {inspectItem.approvalStatus !== 'Rejected' && (
                  <button onClick={() => setShowRejectModal(inspectItem.id)}
                    className="px-5 py-2.5 rounded-full bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-xs uppercase tracking-wider border border-rose-700">
                    Reject Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ─────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-rose-500 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-rose-400 mb-2">Reject Application</h3>
            <p className="text-xs text-slate-300 mb-4">Enter reason for rejection (visible to student):</p>
            <textarea rows={3} value={rejectionReasonInput}
              placeholder="e.g. Student ID image unclear / Payment UTR failed verification."
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
              <button onClick={() => handleConfirmReject(showRejectModal)}
                className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
