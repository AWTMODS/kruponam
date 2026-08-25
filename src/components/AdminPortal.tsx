import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, LogOut, CheckCircle2, Eye, EyeOff, Search, DollarSign, Users, Clock, 
  ArrowLeft, X, QrCode, UserCheck, Mail, Settings, Upload, Save, RefreshCw, 
  Plus, Trash2, RotateCcw, AlertCircle, Download, Sparkles, ShieldCheck, 
  Check, Filter, TrendingUp, Activity, HardDrive, FileJson, Layers, Database, Copy, Pencil, Flame
} from 'lucide-react';
import { 
  syncCloudRegistrations, deduplicateRegistrations, approveRegistration, approveIdCard, deleteRegistration, rejectRegistration, markAsReported, 
  exportBackupDataJson, importBackupDataJson, saveRegistrationAsync, isPhoneMatch, type Registration, type ApprovalStatus 
} from '../services/registrationService';
import { sendApprovalEmail, type EmailResult } from '../services/emailService';
import { getEmailConfig, saveEmailCredentials, saveResendApiKey, saveBrevoApiKey, isEmailEnabled } from '../config/emailConfig';
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConfigured, testSupabaseConnection, SUPABASE_SQL_SETUP_SCRIPT } from '../services/supabaseService';
import { getFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, isFirebaseConfigured, testFirebaseConnection } from '../services/firebaseService';
import { getMultiUpiSettings, saveMultiUpiSettings, addUpiSlot, updateUpiSlot, removeUpiSlot, resetSlotCount, type UpiSlot, type MultiUpiSettings } from '../services/upiSettingsService';
import { getSiteSettings, saveSiteSettings } from '../services/siteSettingsService';
import { getLiveActiveCount } from '../services/livePresenceService';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending_ID_Approval' | 'ID_Approved' | 'Payment_Pending' | 'Approved' | 'Rejected' | 'Reported'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState<Registration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Registration | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [emailPreview, setEmailPreview] = useState<EmailResult | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'upi-settings' | 'database' | 'site-settings'>('registrations');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Registered Emails Directory Modal State
  const [showEmailDirectoryModal, setShowEmailDirectoryModal] = useState(false);
  const [emailSearchQuery, setEmailSearchQuery] = useState('');

  // Edit / Update Registration Modal State
  const [editItem, setEditItem] = useState<Registration | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editStatus, setEditStatus] = useState<ApprovalStatus>('Pending_ID_Approval');
  const [editUtr, setEditUtr] = useState('');
  const [editRejectionReason, setEditRejectionReason] = useState('');

  // Site Feature Settings State
  const [showProgramsSchedule, setShowProgramsSchedule] = useState<boolean>(() => getSiteSettings().showProgramsSchedule);
  const [comingSoonMode, setComingSoonMode] = useState<boolean>(() => getSiteSettings().comingSoonMode);
  const [ticketAmountInput, setTicketAmountInput] = useState<number>(() => getSiteSettings().ticketAmount);

  const handleToggleProgramsSchedule = (val: boolean) => {
    setShowProgramsSchedule(val);
    saveSiteSettings({ showProgramsSchedule: val });
    addToast(val ? '✅ Programs & Schedule section is now VISIBLE on website' : '👁️ Programs & Schedule section is now HIDDEN from website', 'info');
  };

  const handleToggleComingSoonMode = (val: boolean) => {
    setComingSoonMode(val);
    saveSiteSettings({ comingSoonMode: val });
    addToast(val ? '🚀 Public site is now in COMING SOON Mode' : '🌐 FULL MAIN WEBSITE is now LIVE to everyone!', val ? 'info' : 'success');
  };

  const handleSaveTicketAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(ticketAmountInput);
    if (!isNaN(val) && val >= 0) {
      saveSiteSettings({ ticketAmount: val });
      addToast(`✅ Event Pass Fee updated to ₹${val}`, 'success');
    } else {
      addToast('⚠️ Please enter a valid ticket amount.', 'error');
    }
  };

  // Supabase Database state
  const [supabaseUrl, setSupabaseUrl] = useState(getSupabaseCredentials().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(getSupabaseCredentials().key);
  const [copiedSql, setCopiedSql] = useState(false);

  // Firebase Database state
  const [firebaseApiKey, setFirebaseApiKey] = useState(getFirebaseConfig()?.apiKey || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(getFirebaseConfig()?.projectId || '');

  // EmailJS credentials state
  const [emailServiceId, setEmailServiceId] = useState(getEmailConfig().emailjsServiceId === 'YOUR_EMAILJS_SERVICE_ID' ? '' : getEmailConfig().emailjsServiceId);
  const [emailTemplateId, setEmailTemplateId] = useState(getEmailConfig().emailjsTemplateId === 'YOUR_EMAILJS_TEMPLATE_ID' ? '' : getEmailConfig().emailjsTemplateId);
  const [emailPublicKey, setEmailPublicKey] = useState(getEmailConfig().emailjsPublicKey === 'YOUR_EMAILJS_PUBLIC_KEY' ? '' : getEmailConfig().emailjsPublicKey);

  // High-Volume Email API state (3k-9k free emails/mo)
  const [resendApiKey, setResendApiKey] = useState(getEmailConfig().resendApiKey);
  const [brevoApiKey, setBrevoApiKey] = useState(getEmailConfig().brevoApiKey);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-UPI Settings state
  const [multiUpi, setMultiUpi] = useState<MultiUpiSettings>(getMultiUpiSettings());
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  // Live Active Visitors State
  const [activeVisitors, setActiveVisitors] = useState<number>(() => getLiveActiveCount());

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('kruponam_admin_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    loadData();

    // Live active presence listener
    const handlePresenceUpdate = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail && typeof customEv.detail.activeCount === 'number') {
        setActiveVisitors(customEv.detail.activeCount);
      }
    };
    window.addEventListener('kruponam-presence-updated', handlePresenceUpdate);
    const presenceTimer = setInterval(() => {
      setActiveVisitors(getLiveActiveCount());
    }, 3000);

    // Live clock interval
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    // Auto-polling interval for multi-device cloud database sync (10 seconds)
    const syncInterval = setInterval(() => {
      syncCloudRegistrations().then((regs) => {
        setRegistrations(regs);
      });
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(syncInterval);
      clearInterval(presenceTimer);
      window.removeEventListener('kruponam-presence-updated', handlePresenceUpdate);
    };
  }, []);

  const loadData = async () => {
    setIsRefreshing(true);
    const regs = await syncCloudRegistrations();
    setRegistrations(regs);
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((res) => {
        if (!res.success) {
          setSupabaseConnNotice(res.message);
        } else {
          setSupabaseConnNotice(null);
        }
      });
    }
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleCleanDuplicates = async () => {
    setIsRefreshing(true);
    const countBefore = registrations.length;
    const synced = await syncCloudRegistrations();
    const cleaned = deduplicateRegistrations(synced);
    setRegistrations(cleaned);
    setIsRefreshing(false);
    const removedCount = countBefore - cleaned.length;
    if (removedCount > 0) {
      addToast(`🧹 Removed ${removedCount} duplicate entries! Ashin ticket set to KRP-531657.`, 'success');
    } else {
      addToast(`✨ All registrations are clean! Ashin ticket set to KRP-531657.`, 'info');
    }
  };

  // Manual Add / Restore Registration State
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualIdInput, setManualIdInput] = useState('KRP-865167');
  const [manualNameInput, setManualNameInput] = useState('');
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [manualPhoneInput, setManualPhoneInput] = useState('');
  const [manualDeptInput, setManualDeptInput] = useState('BCA');
  const [manualSectionInput, setManualSectionInput] = useState('Section A');
  const [manualYearInput, setManualYearInput] = useState('2nd Year');
  const [manualStatusInput, setManualStatusInput] = useState<ApprovalStatus>('Pending_ID_Approval');
  const [supabaseConnNotice, setSupabaseConnNotice] = useState<string | null>(null);

  const handleOpenEditModal = (reg: Registration) => {
    setEditItem(reg);
    setEditName(reg.fullName);
    setEditEmail(reg.email);
    setEditPhone(reg.phone);
    setEditDept(reg.department);
    setEditSection(reg.section || 'Section A');
    setEditYear(reg.year);
    setEditStatus(reg.approvalStatus);
    setEditUtr(reg.paymentUtr || '');
    setEditRejectionReason(reg.rejectionReason || '');
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    const now = new Date().toISOString();
    const updatedReg: Registration = {
      ...editItem,
      fullName: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      department: editDept,
      section: editSection,
      year: editYear,
      approvalStatus: editStatus,
      paymentUtr: editUtr.trim(),
      rejectionReason: editRejectionReason.trim(),
      updatedAt: now,
    };

    // Update state immediately for instant smooth feedback
    setRegistrations((prev) => prev.map((r) => (r.id === updatedReg.id ? updatedReg : r)));
    if (inspectItem?.id === editItem.id) setInspectItem(updatedReg);
    setEditItem(null);

    await saveRegistrationAsync(updatedReg);
    await loadData();
    addToast(`✅ Updated details for ${updatedReg.fullName} (${updatedReg.id})`, 'success');
  };

  const handleCopyAllEmails = () => {
    const emails = Array.from(new Set(registrations.map((r) => r.email.trim()))).filter(Boolean);
    if (emails.length === 0) {
      addToast('⚠️ No registered emails found.', 'error');
      return;
    }
    const text = emails.join(', ');
    navigator.clipboard.writeText(text);
    addToast(`📋 Copied ${emails.length} registered email addresses to clipboard!`, 'success');
  };

  const handleCreateManualReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIdInput.trim() || !manualNameInput.trim()) {
      addToast('⚠️ Registration ID and Student Name are required.', 'error');
      return;
    }
    const cleanId = manualIdInput.trim().toUpperCase();
    const newReg: Registration = {
      id: cleanId,
      fullName: manualNameInput.trim(),
      email: manualEmailInput.trim() || `${cleanId.toLowerCase()}@kruponam.edu.in`,
      phone: manualPhoneInput.trim() || '9876543210',
      department: manualDeptInput,
      section: manualSectionInput,
      year: manualYearInput,
      gender: 'Other',
      ticketType: 'General Pass',
      idCardUrl: '',
      paymentScreenshotUrl: '',
      paymentAmount: 700,
      paymentStatus: manualStatusInput === 'Approved' ? 'Verified' : 'Pending',
      paymentUtr: '',
      approvalStatus: manualStatusInput,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    await saveRegistrationAsync(newReg);
    await loadData();
    setShowAddModal(false);
    addToast(`✅ Registration ${cleanId} added & saved successfully!`, 'success');
  };

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@kruponam';
    const expectedPass = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem('kruponam_admin_pass') || 'kruponam@2026';

    if (
      adminEmail.trim().toLowerCase() === expectedEmail.toLowerCase() &&
      adminPassword === expectedPass
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('kruponam_admin_auth', 'true');
      setLoginError('');
      loadData();
      addToast('🔓 Welcome back! Authenticated as Lead Admin.', 'success');
    } else {
      setLoginError('Invalid Admin credentials. Please check your admin login email and password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kruponam_admin_auth');
    addToast('🔒 Admin session terminated.', 'info');
  };

  const handleApprove = async (id: string) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'Approved', paymentStatus: 'Verified', updatedAt: new Date().toISOString() } : r))
    );
    const approved = await approveRegistration(id);
    await loadData();
    if (inspectItem?.id === id) setInspectItem(null);

    if (approved) {
      setSendingEmail(id);
      addToast(`✅ ${approved.fullName}'s pass approved! Generating QR ticket email...`, 'info');

      const result = await sendApprovalEmail(approved);
      setSendingEmail(null);

      if (result.success) {
        addToast(`✉️ Invoice & QR Pass emailed to ${approved.email}`, 'success');
      } else {
        addToast(`📧 Preview Mode: ${result.message}`, 'info');
      }

      setEmailPreview(result);
    }
  };

  const handleApproveIdCard = async (id: string) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'ID_Approved', updatedAt: new Date().toISOString() } : r))
    );
    const res = await approveIdCard(id);
    await loadData();
    if (inspectItem?.id === id) setInspectItem(null);
    if (res) {
      addToast(`✅ ${res.fullName}'s Student ID Card Approved! Payment QR code unlocked for student.`, 'success');
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    await deleteRegistration(id);
    await loadData();
    setShowDeleteModal(null);
    if (inspectItem?.id === id) setInspectItem(null);
    addToast('🗑️ Registration request permanently deleted.', 'info');
  };

  const handleConfirmReject = async (id: string) => {
    const reason = rejectionReasonInput.trim() || 'Uploaded Student ID or Payment UTR could not be verified.';
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approvalStatus: 'Rejected', rejectionReason: reason, updatedAt: new Date().toISOString() } : r))
    );
    await rejectRegistration(id, reason);
    await loadData();
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
    addToast('✅ New UPI payment slot added!', 'success');
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
    addToast('🔄 Payment count reset to 0 for this slot.', 'info');
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

  // CSV Export
  const exportToCsv = () => {
    if (registrations.length === 0) {
      addToast('⚠️ No registration records to export.', 'error');
      return;
    }
    const headers = ["ID", "Full Name", "Email", "Phone", "Department", "Section", "Year", "UTR", "Approval Status", "Gate Checked-In", "Check-In Time"];
    const rows = registrations.map(r => [
      r.id,
      `"${r.fullName.replace(/"/g, '""')}"`,
      r.email,
      r.phone,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${(r.section || 'Section A').replace(/"/g, '""')}"`,
      r.year,
      r.paymentUtr,
      r.approvalStatus,
      r.isReported ? 'Yes' : 'No',
      r.reportedAt || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KRUPONAM_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('📥 Exported registration records as CSV', 'success');
  };

  // JSON Safety Backup Export
  const handleExportJsonBackup = () => {
    const jsonStr = exportBackupDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kruponam_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('💾 Full database backup downloaded safely as JSON!', 'success');
  };

  // JSON Backup Import
  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = importBackupDataJson(content);
      if (res.success) {
        loadData();
        addToast(`✅ ${res.message}`, 'success');
      } else {
        addToast(`❌ ${res.message}`, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalApps = registrations.length;
  const pendingIdApps = registrations.filter((r) => r.approvalStatus === 'Pending_ID_Approval' || r.approvalStatus === 'Pending').length;
  const idApprovedApps = registrations.filter((r) => r.approvalStatus === 'ID_Approved').length;
  const paymentPendingApps = registrations.filter((r) => r.approvalStatus === 'Payment_Pending').length;
  const approvedApps = registrations.filter((r) => r.approvalStatus === 'Approved').length;
  const rejectedApps = registrations.filter((r) => r.approvalStatus === 'Rejected').length;
  const reportedApps = registrations.filter((r) => r.isReported).length;
  const totalRevenue = approvedApps * 700;
  const approvalRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;
  const gateRate = approvedApps > 0 ? Math.round((reportedApps / approvedApps) * 100) : 0;

  const filteredRegistrations = registrations.filter((item) => {
    let matchesFilter = true;
    if (statusFilter === 'Reported') {
      matchesFilter = !!item.isReported;
    } else if (statusFilter === 'Pending_ID_Approval') {
      matchesFilter = item.approvalStatus === 'Pending_ID_Approval' || item.approvalStatus === 'Pending';
    } else if (statusFilter !== 'all') {
      matchesFilter = item.approvalStatus === statusFilter;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    const matchesQuery =
      item.fullName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      isPhoneMatch(item.phone, q) ||
      (item.paymentUtr && item.paymentUtr.toLowerCase().includes(q)) ||
      item.department.toLowerCase().includes(q) ||
      (item.section && item.section.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden">
      
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImportJsonBackup}
        className="hidden"
      />

      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── Toast Notifications ─────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl transition-all animate-fadeIn ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50'
                : 'bg-slate-900/90 border-amber-500/40 text-amber-200 shadow-slate-950/50'
            }`}
          >
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-800/80 mb-8 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-royal via-amber-400 to-gold-dark text-slate-950 flex items-center justify-center font-extrabold text-2xl shadow-gold-glow transition-transform group-hover:scale-105">
              👑
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" title="System Online" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
                KRUPONAM 2026
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Krupanidhi Degree College • Executive Event Command Center
            </p>
          </div>
        </div>

        {/* Action Controls, Data Safety Backup, Live Active Counter & Clock */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          
          {/* Live Active Visitor Counter Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-lg shadow-emerald-950/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{activeVisitors} {activeVisitors === 1 ? 'User' : 'Users'} Active Online</span>
          </div>

          {currentTime && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-gold-royal" />
              <span>{currentTime}</span>
            </div>
          )}

          {isAuthenticated && (
            <>
              <button
                onClick={() => setShowEmailDirectoryModal(true)}
                title="View All Registered Student Email Addresses"
                className="px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-blue-500/40 text-blue-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Email Directory ({registrations.length})</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                title="Manually Add or Restore Missing Student Registration ID (e.g. KRP-865167)"
                className="px-3.5 py-2 rounded-full bg-gradient-to-r from-gold-royal to-amber-500 hover:from-gold-light hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-gold-glow flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Restore ID</span>
              </button>

              <button
                onClick={() => setShowScannerModal(true)}
                className="px-3.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <QrCode className="w-3.5 h-3.5 text-gold-light" />
                <span>Gate Scanner</span>
              </button>

              <button
                onClick={handleExportJsonBackup}
                title="Download JSON Database Backup for Safety"
                className="px-3 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-gold-royal/40 text-gold-light font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileJson className="w-3.5 h-3.5 text-gold-royal" />
                <span className="hidden sm:inline">Backup JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                title="Restore Database from JSON File"
                className="px-3 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Restore</span>
              </button>

              <button
                onClick={exportToCsv}
                title="Export Registrations as CSV"
                className="px-3 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={handleCleanDuplicates}
                title="Deduplicate & Remove Duplicate Tickets (Keep KRP-531657 for Ashin)"
                className="px-3 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Clean Duplicates</span>
              </button>

              <button
                onClick={loadData}
                title="Refresh All Registrations"
                className={`p-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-all border border-slate-800 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Website</span>
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-full bg-rose-950/80 text-rose-300 hover:bg-rose-900/90 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-800/80 shadow-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Supabase Connection Alert Banner */}
      {supabaseConnNotice && (
        <div className="max-w-7xl mx-auto mb-6 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 text-amber-200 text-xs flex items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Cloud Sync Notice</p>
              <p className="text-[11px] text-amber-200/80">{supabaseConnNotice}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Screen ─────────────────────────────────────────────── */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto my-12 animate-fadeIn">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-gold-royal/30 shadow-2xl relative overflow-hidden space-y-6">
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-royal to-transparent" />

            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-royal/20 to-amber-500/10 border-2 border-gold-royal/50 mx-auto flex items-center justify-center text-gold-royal shadow-gold-glow">
                <Lock className="w-8 h-8 text-gold-royal" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
                  Admin Authentication
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Enter authorized administrator credentials to manage event operations.
                </p>
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-800/80 text-rose-300 text-xs text-center font-bold animate-shake flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="admin@kruponam"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all font-medium placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/20 transition-all font-medium placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-royal via-amber-400 to-gold-royal text-slate-950 font-black text-xs uppercase tracking-widest hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Login to Admin Dashboard</span>
              </button>
            </form>
          </div>
        </div>

      ) : (
        /* ── Main Dashboard ───────────────────────────────────────────── */
        <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">

          {/* Dashboard Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'registrations'
                    ? 'bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 shadow-gold-glow font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Student Registrations</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 text-slate-200">
                  {totalApps}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('upi-settings'); refreshMultiUpi(); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'upi-settings'
                    ? 'bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 shadow-gold-glow font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Payment & UPI Gateway Slots</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'database'
                    ? 'bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 shadow-gold-glow font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Cloud DB & Storage</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                  isSupabaseConfigured() ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  {isSupabaseConfigured() ? '✓ Connected' : 'Local Backup'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('site-settings')}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === 'site-settings'
                    ? 'bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 shadow-gold-glow font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Website Controls</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                  showProgramsSchedule ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950 text-slate-400 border border-slate-700'
                }`}>
                  {showProgramsSchedule ? 'Programs: Visible' : 'Programs: Hidden'}
                </span>
              </button>
            </div>

            <div className="px-3 py-1.5 text-xs text-slate-400 font-mono font-medium flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Data Preserved & Synced</span>
            </div>
          </div>

          {supabaseConnNotice && (
            <div className="p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-500/60 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Cloud Database Warning: {supabaseConnNotice}</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    Multi-device cloud sync requires valid Supabase credentials. Go to <strong>Cloud DB & Storage</strong> tab to update credentials, or click <strong>+ Add / Restore ID</strong> to enter student IDs manually.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('database')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider hover:bg-amber-400 shrink-0 transition-all shadow-md"
              >
                Fix Credentials
              </button>
            </div>
          )}

          {activeTab === 'registrations' && (<>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              
              {/* Real-time Live Visitors Online Card */}
              <div className="bg-slate-900/80 rounded-3xl p-5 border border-emerald-500/40 shadow-xl hover:border-emerald-500/70 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Active Now
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-950 text-emerald-300 group-hover:bg-emerald-900 transition-colors">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-white mt-3 flex items-baseline gap-2">
                  <span>{activeVisitors}</span>
                  <span className="text-xs font-sans font-bold text-emerald-400">{activeVisitors === 1 ? 'User' : 'Users'}</span>
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Realtime site traffic</span>
                  <span className="text-emerald-400 font-mono text-[10px]">● Live</span>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-3xl p-5 border border-slate-800 shadow-xl hover:border-slate-700 transition-all group">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <span>Total Applied</span>
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-slate-700 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-white mt-3">{totalApps}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span>All pass requests</span>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-3xl p-5 border border-amber-500/30 shadow-xl hover:border-amber-500/60 transition-all group">
                <div className="flex justify-between items-center text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <span>Pending Action</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-amber-400 mt-3">{pendingIdApps}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Requires approval</span>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-3xl p-5 border border-emerald-500/30 shadow-xl hover:border-emerald-500/60 transition-all group">
                <div className="flex justify-between items-center text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span>Approved Passes</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-emerald-400 mt-3">{approvedApps}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300/80 font-medium">
                  <span>{approvalRate}% approval rate</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 rounded-3xl p-5 border border-emerald-500/60 shadow-xl hover:border-emerald-400 transition-all group">
                <div className="flex justify-between items-center text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <span>Gate Checked-In</span>
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500/30 transition-colors">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-emerald-200 mt-3">{reportedApps}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300/80 font-medium">
                  <span>{gateRate}% of approved</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-gold-royal/10 rounded-3xl p-5 border border-gold-royal/40 shadow-xl hover:border-gold-royal transition-all group">
                <div className="flex justify-between items-center text-gold-light text-xs font-bold uppercase tracking-wider">
                  <span>Total Revenue</span>
                  <div className="p-2 rounded-xl bg-gold-royal/20 text-gold-royal group-hover:bg-gold-royal/30 transition-colors">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-serif text-3xl font-extrabold text-gold-light mt-3">
                  ₹{totalRevenue.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gold-light/80 font-medium">
                  <span>₹700 per pass</span>
                </div>
              </div>

            </div>

            {/* Performance Overview Banner */}
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Approval Metrics</span>
              </div>
              
              <div className="flex-1 w-full space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-emerald-400">{approvedApps} Approved ({approvalRate}%)</span>
                  <span className="text-amber-400">{pendingIdApps} Pending</span>
                  <span className="text-rose-400">{rejectedApps} Rejected</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(approvedApps / (totalApps || 1)) * 100}%` }} title="Approved" />
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${(pendingIdApps / (totalApps || 1)) * 100}%` }} title="Pending" />
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${(rejectedApps / (totalApps || 1)) * 100}%` }} title="Rejected" />
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
              
              {/* Filter Controls & Search */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All Submissions', count: totalApps },
                    { id: 'Pending_ID_Approval', label: 'Pending ID Review', count: pendingIdApps, color: 'amber' },
                    { id: 'ID_Approved', label: 'ID Approved (Pay Pending)', count: idApprovedApps, color: 'blue' },
                    { id: 'Payment_Pending', label: 'Payment Submitted', count: paymentPendingApps, color: 'emerald' },
                    { id: 'Approved', label: 'Approved Passes', count: approvedApps, color: 'emerald' },
                    { id: 'Reported', label: 'Checked-In at Gate', count: reportedApps, color: 'cyan' },
                    { id: 'Rejected', label: 'Rejected', count: rejectedApps, color: 'rose' },
                  ].map((tab) => {
                    const isSelected = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          isSelected ? 'bg-slate-950/40 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search student, section, UTR, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-9 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-gold-royal focus:ring-1 focus:ring-gold-royal transition-all placeholder-slate-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 text-[11px]">
                      <th className="p-4">Reg ID</th>
                      <th className="p-4">Student Info</th>
                      <th className="p-4">Dept & Section</th>
                      <th className="p-4">Files / Verification</th>
                      <th className="p-4">Payment UTR</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Gate Check-In</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Filter className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-sm font-bold text-slate-400">No matching registrations found</p>
                            <p className="text-xs text-slate-500">Try adjusting your search query or filter selection.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                          
                          {/* Reg ID */}
                          <td className="p-4 font-mono font-bold text-gold-light">
                            {item.id}
                          </td>

                          {/* Student Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs uppercase shrink-0 shadow-inner">
                                {item.fullName.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm group-hover:text-gold-light transition-colors">
                                  {item.fullName}
                                </p>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{item.email}</span>
                                  <span>•</span>
                                  <span>{item.phone}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Department & Section */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-[11px] inline-flex items-center gap-1">
                                <Layers className="w-3 h-3 text-gold-royal" />
                                {item.department} — {item.section || 'Section A'}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {item.year}
                              </span>
                            </div>
                          </td>

                          {/* Student ID & Payment Screenshot Preview */}
                          <td className="p-4">
                            <button
                              onClick={() => setInspectItem(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-gold-light border border-gold-royal/30 font-semibold transition-all hover:border-gold-royal"
                            >
                              <Eye className="w-3.5 h-3.5 text-gold-royal" />
                              <span>Inspect ID & Payment</span>
                            </button>
                          </td>

                          {/* ₹700 Payment UTR */}
                          <td className="p-4 font-mono">
                            {item.paymentUtr ? (
                              <>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> ₹700 Paid
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  UTR: {item.paymentUtr}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-sans italic">
                                Awaiting Student Payment
                              </span>
                            )}
                          </td>

                          {/* Approval Status */}
                          <td className="p-4">
                            {item.approvalStatus === 'Approved' && (
                              <div>
                                <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
                                </span>
                                <button
                                  onClick={() => sendApprovalEmail(item).then(setEmailPreview)}
                                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mt-1 underline"
                                  title="Preview Sent Ticket Email"
                                >
                                  <Mail className="w-3 h-3" /> Preview Email
                                </button>
                              </div>
                            )}
                            {item.approvalStatus === 'Payment_Pending' && (
                              <span className="px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800 font-bold text-[11px] inline-flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" /> Payment Submitted
                              </span>
                            )}
                            {item.approvalStatus === 'ID_Approved' && (
                              <span className="px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 border border-blue-800 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-400" /> ID Approved (Pay Unlocked)
                              </span>
                            )}
                            {(item.approvalStatus === 'Pending_ID_Approval' || item.approvalStatus === 'Pending') && (
                              <span className="px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800 font-bold text-[11px] inline-flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" /> Pending ID Review
                              </span>
                            )}
                            {item.approvalStatus === 'Rejected' && (
                              <span className="px-3 py-1 rounded-full bg-rose-950/90 text-rose-300 border border-rose-800 font-bold text-[11px] inline-flex items-center gap-1">
                                <X className="w-3 h-3 text-rose-400" /> Rejected
                              </span>
                            )}
                          </td>

                          {/* Gate Check-In Status */}
                          <td className="p-4">
                            {item.isReported ? (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                                  <UserCheck className="w-3 h-3" /> Reported
                                </span>
                                <span className="text-[10px] block text-slate-400 font-mono mt-1">
                                  {item.reportedAt}
                                </span>
                              </div>
                            ) : item.approvalStatus === 'Approved' ? (
                              <button
                                onClick={() => handleMarkReportedDirect(item.id)}
                                className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px] transition-all"
                              >
                                Mark Check-In
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-medium">Awaiting Approval</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Stage 1: Approve ID Card Button */}
                              {(item.approvalStatus === 'Pending_ID_Approval' || item.approvalStatus === 'Pending') && (
                                <button
                                  onClick={() => handleApproveIdCard(item.id)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1"
                                  title="Approve Student ID Card to unlock payment"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve ID</span>
                                </button>
                              )}

                              {/* Stage 2 or Final Approval: Approve Pass Button */}
                              {(item.approvalStatus === 'ID_Approved' || item.approvalStatus === 'Payment_Pending') && (
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  disabled={sendingEmail === item.id}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 flex items-center gap-1"
                                  title="Approve final pass and email QR ticket"
                                >
                                  {sendingEmail === item.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve Pass</span>
                                </button>
                              )}

                              {/* Reject Button */}
                              {item.approvalStatus !== 'Rejected' && (
                                <button
                                  onClick={() => setShowRejectModal(item.id)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 font-bold text-xs transition-all"
                                  title="Reject request"
                                >
                                  Reject
                                </button>
                              )}

                              {/* Edit / Update Student Record Button */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 transition-all"
                                title="Edit / Update Student Registration Details"
                              >
                                <Pencil className="w-4 h-4 text-amber-400" />
                              </button>

                              {/* Delete Request Button with Trash Icon */}
                              <button
                                onClick={() => setShowDeleteModal(item)}
                                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                                title="Delete Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

          {/* ── UPI / Payment Settings Tab ────────────────────────── */}
          {activeTab === 'upi-settings' && (
            <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8 animate-fadeIn">

              <div className="flex items-center gap-3.5 pb-6 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-gold-royal/20 border border-gold-royal/40 text-gold-royal flex items-center justify-center text-2xl shadow-gold-glow">
                  💳
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-white">Multi-UPI Payment Gateway Slots</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage active UPI handles and auto-rotation payment thresholds. When a slot reaches its limit, student registration payments auto-route to the next available slot.
                  </p>
                </div>
              </div>

              {/* Active Slot Status Banner */}
              {(() => {
                const active = multiUpi.slots[multiUpi.activeSlotIndex] || multiUpi.slots[0];
                if (!active) return null;
                const isFull = active.paymentCount >= active.maxPayments;
                return (
                  <div className={`rounded-2xl p-4 border-2 flex items-center gap-3.5 ${
                    isFull ? 'bg-rose-950/60 border-rose-500/80 text-rose-200' : 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  }`}>
                    <div className={`w-3 h-3 rounded-full shrink-0 ${isFull ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <div className="flex-1 text-xs">
                      <span className="font-extrabold uppercase tracking-wider">
                        {isFull ? '🔴 ALL SLOTS FULL — Immediate Admin Action Needed' : `🟢 ACTIVE PAYMENT SLOT: ${active.label} (${active.upiId || 'UPI not set'})`}
                      </span>
                      {!isFull && (
                        <span className="text-slate-300 ml-2 font-mono">
                          [{active.paymentCount}/{active.maxPayments} payments recorded]
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
                          ? 'border-rose-700/80 bg-rose-950/30'
                          : isActive
                          ? 'border-emerald-500/80 bg-emerald-950/20'
                          : 'border-slate-800 bg-slate-950/60'
                      }`}
                    >
                      {/* Slot Summary Header */}
                      <div className="flex items-center gap-4 p-5">
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isFull ? 'bg-rose-500' : isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{slot.label}</span>
                            {isActive && !isFull && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                                ACTIVE SLOT
                              </span>
                            )}
                            {isFull && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                                CAPACITY FULL
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400 truncate">
                              {slot.upiId || '—'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : isActive ? 'bg-emerald-500' : 'bg-slate-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-mono font-bold shrink-0 ${isFull ? 'text-rose-400' : isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {slot.paymentCount} / {slot.maxPayments} ({Math.round(pct)}%)
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleResetSlotCount(slot.id)}
                            title="Reset payment count to 0"
                            className="p-2 rounded-xl bg-slate-900 hover:bg-amber-900/60 text-slate-400 hover:text-amber-300 transition-colors border border-slate-800"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-800"
                          >
                            {isExpanded ? 'Close ▲' : 'Edit Slot ▼'}
                          </button>

                          <button
                            onClick={() => handleRemoveSlot(slot.id)}
                            title="Remove slot"
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors border border-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Edit Panel */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/80 animate-fadeIn">
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Slot Label Name
                              </label>
                              <input
                                type="text"
                                value={slot.label}
                                onChange={(e) => handleUpdateSlot(slot.id, { label: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                VPA UPI Handle ID
                              </label>
                              <input
                                type="text"
                                value={slot.upiId}
                                onChange={(e) => handleUpdateSlot(slot.id, { upiId: e.target.value })}
                                placeholder="kruponam2026@upi"
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none focus:border-gold-royal"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Merchant / Payee Name
                              </label>
                              <input
                                type="text"
                                value={slot.merchantName}
                                onChange={(e) => handleUpdateSlot(slot.id, { merchantName: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Max Capacity Limit (Auto-Rotates Next)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={1000}
                                value={slot.maxPayments}
                                onChange={(e) => handleUpdateSlot(slot.id, { maxPayments: parseInt(e.target.value) || 1 })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none focus:border-gold-royal"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              QR Code Image Asset
                            </label>
                            
                            <label
                              htmlFor={`qr-upload-${slot.id}`}
                              className="flex flex-col items-center justify-center gap-2 w-full p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-gold-royal cursor-pointer transition-colors bg-slate-900 text-center group"
                            >
                              <Upload className="w-6 h-6 text-slate-500 group-hover:text-gold-royal transition-colors" />
                              <span className="text-xs text-slate-300 group-hover:text-white font-medium">
                                {slot.qrImageDataUrl ? '✓ QR Image Uploaded — Click to Replace' : 'Upload QR Code Image'}
                              </span>
                            </label>
                            <input
                              id={`qr-upload-${slot.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQrImageUpload(slot.id, e)}
                              className="hidden"
                            />

                            <div className="flex flex-col items-center gap-2 pt-2">
                              <div className="w-32 h-32 bg-white p-2 rounded-2xl border-2 border-gold-royal flex items-center justify-center overflow-hidden shadow-lg">
                                {slot.qrImageDataUrl ? (
                                  <img src={slot.qrImageDataUrl} alt="QR" className="w-full h-full object-contain rounded-lg" />
                                ) : (
                                  <QrCode className="w-full h-full text-slate-900" />
                                )}
                              </div>
                              <span className="text-xs font-mono text-slate-400">{slot.upiId || 'No UPI ID'}</span>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Slot Management Actions */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleAddSlot}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider transition-all border border-slate-700 shadow-md"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add New UPI Slot</span>
                </button>

                <button
                  onClick={handleSaveAllUpi}
                  disabled={upiSaving}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-royal to-amber-500 hover:from-gold-light hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-gold-glow disabled:opacity-50"
                >
                  {upiSaving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /><span>Saving Changes...</span></>
                  ) : upiSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /><span>Saved!</span></>
                  ) : (
                    <><Save className="w-4 h-4" /><span>Save All Slot Configurations</span></>
                  )}
                </button>
              </div>

            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Status Header */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-md">
                      <Database className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                        <span>Free Cloud Database & Storage (Supabase)</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isSupabaseConfigured() ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {isSupabaseConfigured() ? '✓ Cloud Live' : 'Local Backup Mode'}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Store student details in PostgreSQL DB and uploaded Student ID / Payment images in Free Cloud Storage.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      const regs = await syncCloudRegistrations();
                      setRegistrations(regs);
                      setIsRefreshing(false);
                      addToast('🔄 Synced live data from Cloud Database!', 'success');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                    <span>Sync Live Cloud DB</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Database Type</p>
                    <p className="text-white font-mono font-bold text-sm mt-1">Free Cloud PostgreSQL</p>
                    <p className="text-[11px] text-emerald-400 mt-1">500 MB Free Capacity (Thousands of registrations)</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">File & Image Storage</p>
                    <p className="text-white font-mono font-bold text-sm mt-1">Supabase Public Bucket</p>
                    <p className="text-[11px] text-emerald-400 mt-1">1 GB Free Image Storage (ID Cards & Receipts)</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Pass Dispatch</p>
                    <p className="text-white font-mono font-bold text-sm mt-1">EmailJS / Direct QR Pass</p>
                    <p className="text-[11px] text-blue-400 mt-1">Auto-sends HTML Invoice & Gate Pass QR</p>
                  </div>
                </div>
              </div>

              {/* Supabase Setup Credentials Form */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5">
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gold-royal" />
                  <span>Configure Free Supabase Cloud Database Credentials</span>
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign up for free at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-400 font-bold underline">supabase.com</a>. Create a free project, go to <strong>Project Settings → API</strong>, and paste your Project URL and Anon Key below:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. https://xyzcompany.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Supabase Anon / Public Key
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
                      addToast('✅ Supabase cloud credentials saved successfully!', 'success');
                      loadData();
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Cloud Connection Settings</span>
                  </button>
                </div>
              </div>

              {/* Firebase Firestore Setup Credentials Form */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>Firebase Firestore (Realtime Multi-Device Sync)</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isFirebaseConfigured() ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isFirebaseConfigured() ? '✓ Firebase Realtime Live' : 'Not Connected'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Firebase Firestore provides instant real-time synchronization across all mobile phones & laptops. Create a project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 font-bold underline">console.firebase.google.com</a>, add a Web App, and paste your API Key & Project ID below:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Firebase API Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AIzaSy..."
                      value={firebaseApiKey}
                      onChange={(e) => setFirebaseApiKey(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Firebase Project ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. kruponam-2026"
                      value={firebaseProjectId}
                      onChange={(e) => setFirebaseProjectId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  {isFirebaseConfigured() && (
                    <button
                      onClick={() => {
                        clearFirebaseConfig();
                        setFirebaseApiKey('');
                        setFirebaseProjectId('');
                        addToast('🗑️ Firebase configuration cleared.', 'info');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-950/80 text-rose-300 text-xs font-bold border border-rose-800"
                    >
                      Clear Firebase
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!firebaseApiKey || !firebaseProjectId) {
                        addToast('⚠️ Firebase API Key & Project ID are required.', 'error');
                        return;
                      }
                      saveFirebaseConfig({
                        apiKey: firebaseApiKey.trim(),
                        authDomain: `${firebaseProjectId.trim()}.firebaseapp.com`,
                        projectId: firebaseProjectId.trim(),
                        storageBucket: `${firebaseProjectId.trim()}.appspot.com`,
                        messagingSenderId: '',
                        appId: '',
                      });
                      testFirebaseConnection().then((res) => {
                        if (res.success) {
                          addToast('🔥 Firebase Firestore connected & real-time sync active!', 'success');
                          loadData();
                        } else {
                          addToast(`⚠️ ${res.message}`, 'error');
                        }
                      });
                    }}
                    className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Firebase Connection</span>
                  </button>
                </div>
              </div>

              {/* High-Volume Pass Email Dispatch Box (3,000+ to 9,000+ Free Emails) */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold-royal" />
                      <span>High-Volume Email Pass Dispatch (1,000+ to 9,000+ Free Emails)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose a free email provider to automatically send HTML QR passes directly to student inboxes:
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isEmailEnabled() ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {getEmailConfig().provider === 'resend'
                      ? '✓ Resend Active (3,000 Free/Mo)'
                      : getEmailConfig().provider === 'brevo'
                      ? '✓ Brevo Active (9,000 Free/Mo)'
                      : getEmailConfig().provider === 'emailjs'
                      ? '✓ EmailJS Active (200 Free/Mo)'
                      : 'Preview Mode'}
                  </span>
                </div>

                {/* Option A: Resend API (3,000 Free Emails / Month) */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Option A: Resend API (3,000 Free Emails / Month) — Recommended for 1,000+ Emails
                    </span>
                    <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 font-bold underline">
                      Get Free Resend API Key →
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      placeholder="Paste Resend API Key (e.g. re_12345678...)"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                    <button
                      onClick={() => {
                        saveResendApiKey(resendApiKey);
                        addToast('✅ Resend API key saved! (3,000 free emails/month enabled)', 'success');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-md"
                    >
                      Save Resend Key
                    </button>
                  </div>
                </div>

                {/* Option B: Brevo API (9,000 Free Emails / Month) */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Option B: Brevo API (9,000 Free Emails / Month)
                    </span>
                    <a href="https://www.brevo.com" target="_blank" rel="noreferrer" className="text-[11px] text-amber-400 font-bold underline">
                      Get Free Brevo Key →
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      placeholder="Paste Brevo API Key (e.g. xkeysib-...)"
                      value={brevoApiKey}
                      onChange={(e) => setBrevoApiKey(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                    <button
                      onClick={() => {
                        saveBrevoApiKey(brevoApiKey);
                        addToast('✅ Brevo API key saved! (9,000 free emails/month enabled)', 'success');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-md"
                    >
                      Save Brevo Key
                    </button>
                  </div>
                </div>
              </div>

              {/* Automated Real Email Service Box (EmailJS) */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gold-royal" />
                    <span>Option C: EmailJS Credentials (200 Free Emails / Month)</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isEmailEnabled() ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {isEmailEnabled() ? '✓ Real Email Live (200/mo)' : 'Preview Mode'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  To automatically deliver the QR pass & payment invoice directly into the student's email inbox on approval, create a free account at <a href="https://www.emailjs.com/" target="_blank" rel="noreferrer" className="text-amber-400 font-bold underline">emailjs.com</a> and enter your keys below:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      EmailJS Service ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. service_abc123"
                      value={emailServiceId}
                      onChange={(e) => setEmailServiceId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      EmailJS Template ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. template_xyz789"
                      value={emailTemplateId}
                      onChange={(e) => setEmailTemplateId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      EmailJS Public Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AbCdEfGh12345678"
                      value={emailPublicKey}
                      onChange={(e) => setEmailPublicKey(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-gold-royal"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      saveEmailCredentials(emailServiceId, emailTemplateId, emailPublicKey);
                      addToast('✅ EmailJS credentials saved! Real pass emails are now enabled.', 'success');
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Pass Email API Keys</span>
                  </button>
                </div>
              </div>

              {/* 1-Click SQL Setup Script Box */}
              <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <span>1-Click Supabase SQL Setup Query</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Run this query in your Supabase Dashboard → <strong>SQL Editor</strong> to create the Database Table & Image Storage bucket:
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
                      setCopiedSql(true);
                      addToast('📋 SQL script copied to clipboard!', 'info');
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gold-light text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-60">
                  <pre className="text-[11px] font-mono text-emerald-300 leading-relaxed">
                    {SUPABASE_SQL_SETUP_SCRIPT}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'site-settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-gold-royal/30 shadow-2xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Public Website Visibility Controls</span>
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-white">
                      Website Feature & Section Controls
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Toggle visibility of sections on the live public website. Changes apply immediately across all client devices.
                    </p>
                  </div>
                </div>

                {/* Control Card 1: Public Website Status Mode (Coming Soon vs Full Website Live) */}
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-gold-royal/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-gold-royal/70 transition-all shadow-md">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-lg text-white">Public Website Status Mode</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        comingSoonMode 
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {comingSoonMode ? '🚀 Coming Soon Mode Active' : '🌐 Main Website Live'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      When <strong>Coming Soon Mode</strong> is active, public visitors see the minimalist Kruponam 2026 poster page. Click the button to launch the full main website live to everyone!
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleComingSoonMode(!comingSoonMode)}
                    className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 shadow-lg shrink-0 ${
                      comingSoonMode
                        ? 'bg-gradient-to-r from-gold-royal to-amber-500 hover:from-amber-400 hover:to-gold-royal text-slate-950 shadow-gold-glow hover:scale-[1.02]'
                        : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/40 hover:scale-[1.02]'
                    }`}
                  >
                    {comingSoonMode ? (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Enable Main Website Live</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-amber-200" />
                        <span>Switch Back to Coming Soon Mode</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Control Card for Programs & Schedule */}
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-slate-700 transition-all">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-lg text-white">Programs & Schedule Section</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        showProgramsSchedule 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {showProgramsSchedule ? 'Currently Visible' : 'Currently Hidden'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Controls whether the &quot;Programs & Schedule&quot; timeline section and its navigation links appear on the public Kruponam 2026 homepage.
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleProgramsSchedule(!showProgramsSchedule)}
                    className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2.5 shadow-lg shrink-0 ${
                      showProgramsSchedule
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50 hover:scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:scale-[1.02]'
                    }`}
                  >
                    {showProgramsSchedule ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Section Enabled (Visible)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Section Disabled (Hidden)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Control Card 3: Ticket Pass Fee Control */}
                <div className="bg-slate-950/80 rounded-2xl p-6 border border-gold-royal/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-gold-royal/70 transition-all shadow-md">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-lg text-white">Event Ticket Pass Amount (₹)</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-royal/20 text-gold-light border border-gold-royal/40">
                        Current Fee: ₹{ticketAmountInput}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Set the standard entry pass amount in INR (₹) for Kruponam 2026. This value updates pass badges, registration forms, payment QR instructions, and email receipts immediately across the site.
                    </p>
                  </div>

                  <form onSubmit={handleSaveTicketAmount} className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-royal font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={ticketAmountInput}
                        onChange={(e) => setTicketAmountInput(Number(e.target.value))}
                        className="w-32 pl-8 pr-3 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-mono text-sm outline-none focus:border-gold-royal focus:ring-2 focus:ring-gold-royal/30"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-royal to-amber-500 hover:from-amber-400 hover:to-gold-royal text-slate-950 font-black text-xs uppercase tracking-wider shadow-gold-glow transition-all flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Fee</span>
                    </button>
                  </form>
                </div>

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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full border border-blue-500/50 shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500 text-blue-400 flex items-center justify-center text-xl">
                  ✉️
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Pass Email Dispatch Preview</h3>
                  <p className={`text-xs font-semibold mt-0.5 ${emailPreview.success ? 'text-emerald-400' : 'text-blue-300'}`}>
                    {emailPreview.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailPreview(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                srcDoc={emailPreview.previewHtml}
                title="Email Ticket Preview"
                className="w-full h-full min-h-[550px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Inspect Student Modal (With ID Card & Payment Screenshot) ── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border-2 border-gold-royal/50 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto space-y-6">
            
            <button
              onClick={() => setInspectItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gold-royal/20 border border-gold-royal/40 text-gold-royal flex items-center justify-center text-2xl shadow-gold-glow">
                🪪
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-white">Student ID & Payment Verification File</h3>
                <p className="text-xs text-slate-400">
                  Ref ID: <span className="font-mono text-gold-light font-bold">{inspectItem.id}</span>
                </p>
              </div>
            </div>

            {/* Side-by-side ID Card and Payment Screenshot Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Student ID Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    🪪 Student ID Card Photo
                  </p>
                  <label className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/40 cursor-pointer font-bold transition-all flex items-center gap-1 shadow-sm">
                    <span>📷 Upload / Replace</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const newUrl = reader.result as string;
                            const updated = { ...inspectItem, idCardUrl: newUrl };
                            saveRegistrationAsync(updated).then(() => {
                              loadData();
                              setInspectItem(updated);
                              addToast(`✅ Student ID Card Photo updated for ${inspectItem.fullName}`, 'success');
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="h-60 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden p-2">
                  {inspectItem.idCardUrl ? (
                    <img
                      src={inspectItem.idCardUrl}
                      alt="Student ID Card"
                      className="max-h-full max-w-full object-contain rounded-lg border border-gold-royal/30 shadow-md"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <p className="text-slate-500 text-xs font-mono">No Student ID Photo Uploaded Yet</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer hover:bg-amber-500/30 transition-all shadow-sm">
                        <span>📷 Click to Upload ID Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newUrl = reader.result as string;
                                const updated = { ...inspectItem, idCardUrl: newUrl };
                                saveRegistrationAsync(updated).then(() => {
                                  loadData();
                                  setInspectItem(updated);
                                  addToast(`✅ Student ID Card Photo updated for ${inspectItem.fullName}`, 'success');
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Screenshot showing UTR */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    💳 Payment Screenshot (Showing UTR)
                  </p>
                  <label className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/40 cursor-pointer font-bold transition-all flex items-center gap-1 shadow-sm">
                    <span>💳 Upload / Replace</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const newUrl = reader.result as string;
                            const updated = { ...inspectItem, paymentScreenshotUrl: newUrl };
                            saveRegistrationAsync(updated).then(() => {
                              loadData();
                              setInspectItem(updated);
                              addToast(`✅ Payment Screenshot updated for ${inspectItem.fullName}`, 'success');
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="h-60 flex items-center justify-center bg-slate-900/50 rounded-xl overflow-hidden p-2">
                  {inspectItem.paymentScreenshotUrl ? (
                    <img
                      src={inspectItem.paymentScreenshotUrl}
                      alt="Payment Receipt Screenshot"
                      className="max-h-full max-w-full object-contain rounded-lg border border-emerald-500/40 shadow-md"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono">
                      No Payment Screenshot Uploaded
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">
                  Verified UTR: {inspectItem.paymentUtr}
                </p>
              </div>

            </div>

            {/* Application Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
              {[
                ['Student Full Name', inspectItem.fullName],
                ['Department', inspectItem.department],
                ['Section', inspectItem.section || 'Section A'],
                ['Academic Year', inspectItem.year],
                ['Email Address', inspectItem.email],
                ['Contact Phone', inspectItem.phone],
                ['₹700 Payment UTR', inspectItem.paymentUtr],
                ['Pass Tier', inspectItem.ticketType],
                ['Gate Gate Check-In', inspectItem.isReported ? `✓ Reported (${inspectItem.reportedAt || 'Yes'})` : 'Not Reported Yet'],
              ].map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{label}</p>
                  <p className="text-white font-bold text-sm font-sans">{value}</p>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                onClick={() => { handleOpenEditModal(inspectItem); }}
                className="px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/40 flex items-center gap-1.5 shadow-md"
              >
                <Pencil className="w-4 h-4 text-amber-400" /> Edit Details
              </button>
              {inspectItem.approvalStatus === 'Approved' && !inspectItem.isReported && (
                <button
                  onClick={() => { handleMarkReportedDirect(inspectItem.id); setInspectItem(null); }}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <UserCheck className="w-4 h-4" /> Mark Checked-In at Gate
                </button>
              )}

              {(inspectItem.approvalStatus === 'Pending_ID_Approval' || inspectItem.approvalStatus === 'Pending') && (
                <button
                  onClick={() => { handleApproveIdCard(inspectItem.id); }}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Approve Student ID
                </button>
              )}

              {(inspectItem.approvalStatus === 'ID_Approved' || inspectItem.approvalStatus === 'Payment_Pending') && (
                <button
                  onClick={() => { handleApprove(inspectItem.id); }}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Approve Pass & Dispatch Ticket
                </button>
              )}

              {inspectItem.approvalStatus !== 'Rejected' && (
                <button
                  onClick={() => setShowRejectModal(inspectItem.id)}
                  className="px-5 py-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs uppercase tracking-wider border border-rose-800"
                >
                  Reject Application
                </button>
              )}

              <button
                onClick={() => { setShowDeleteModal(inspectItem); }}
                className="px-4 py-2.5 rounded-2xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs uppercase tracking-wider border border-rose-800 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Request
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ───────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-rose-500/80 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-serif text-xl font-bold text-rose-400">Reject Application</h3>
              <button
                onClick={() => setShowRejectModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select a quick reason or type custom feedback (sent to student for re-uploading):
            </p>

            {/* Quick Preset Reason Chips */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Quick Rejection Reasons:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '📛 Name Mismatch with ID', reason: 'Student Name does not match the name printed on uploaded Student ID Card.' },
                  { label: '📷 Unclear / Blurry ID', reason: 'Uploaded Student ID Card photo is blurry, unreadable, or missing.' },
                  { label: '💳 Invalid Payment UTR', reason: 'Payment UTR / Txn Reference ID could not be verified or does not match receipt.' },
                  { label: '🏢 Incorrect Dept / Year', reason: 'Department or Academic Year selected does not match Student ID Card records.' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setRejectionReasonInput(chip.reason)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/50 text-xs font-medium transition-all text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Rejection Note / Feedback:
              </label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                placeholder="e.g. Student Name does not match ID proof, please re-upload clear ID."
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-slate-600 font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleConfirmReject(showRejectModal)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-colors shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Request Confirmation Modal ────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-rose-500/80 shadow-2xl space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-500/50 text-rose-400 flex items-center justify-center text-xl font-bold shadow-lg">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-white">Delete Registration Request?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This action is permanent and will remove the record from Local Storage, IndexedDB, and Cloud Database.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Target Record:</p>
              <p className="text-white font-bold text-sm">{showDeleteModal.fullName} ({showDeleteModal.id})</p>
              <p className="text-slate-400">{showDeleteModal.department} — {showDeleteModal.section || 'Section A'}</p>
              <p className="text-slate-400">{showDeleteModal.email} • {showDeleteModal.phone}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleConfirmDelete(showDeleteModal.id)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Add / Restore Registration Modal ───────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gold-royal/50 shadow-2xl space-y-6 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gold-royal/20 border border-gold-royal/50 text-gold-royal flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Add / Restore Registration ID</h3>
                  <p className="text-xs text-slate-400">Manually insert a missing student pass (e.g. KRP-865167)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualReg} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Reference Pass ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KRP-865167"
                    value={manualIdInput}
                    onChange={(e) => setManualIdInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-gold-royal font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Student Name"
                    value={manualNameInput}
                    onChange={(e) => setManualNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={manualEmailInput}
                    onChange={(e) => setManualEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={manualPhoneInput}
                    onChange={(e) => setManualPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={manualDeptInput}
                    onChange={(e) => setManualDeptInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
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

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={manualSectionInput}
                    onChange={(e) => setManualSectionInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal font-bold"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                    <option value="Section E">Section E</option>
                    <option value="Section F">Section F</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={manualYearInput}
                    onChange={(e) => setManualYearInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG / Alumni">PG / Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={manualStatusInput}
                    onChange={(e) => setManualStatusInput(e.target.value as ApprovalStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-gold-royal font-bold text-amber-400"
                  >
                    <option value="Pending_ID_Approval">Pending ID Approval</option>
                    <option value="ID_Approved">ID Approved (Pay Pending)</option>
                    <option value="Payment_Pending">Payment Submitted</option>
                    <option value="Approved">Approved & Active</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-royal to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save & Restore Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Registered Email Directory Modal ───────────────────────────── */}
      {showEmailDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-blue-500/50 shadow-2xl space-y-6 animate-fadeIn max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    <span>Registered Student Emails</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800">
                      {registrations.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">View, search, edit, or copy all registered email addresses</p>
                </div>
              </div>

              <button
                onClick={() => setShowEmailDirectoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Bulk Copy Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter emails, names, dept..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCopyAllEmails}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Emails to Clipboard</span>
              </button>
            </div>

            {/* Scrollable Email Directory List */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-2 divide-y divide-slate-800/60">
              {registrations
                .filter((r) => {
                  const q = emailSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.email.toLowerCase().includes(q) ||
                    r.fullName.toLowerCase().includes(q) ||
                    r.id.toLowerCase().includes(q) ||
                    r.department.toLowerCase().includes(q)
                  );
                })
                .map((r) => (
                  <div key={r.id} className="p-3 hover:bg-slate-900/60 transition-colors rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{r.fullName}</span>
                        <span className="font-mono text-[10px] text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{r.id}</span>
                        <span className="text-[10px] text-slate-400">({r.department} — {r.section || 'Section A'})</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                        <span>{r.email}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(r.email);
                            addToast(`📋 Copied ${r.email}`, 'info');
                          }}
                          className="text-slate-500 hover:text-white text-[10px] underline"
                          title="Copy Email"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setShowEmailDirectoryModal(false);
                          handleOpenEditModal(r);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 border border-slate-800 font-bold text-xs transition-all flex items-center gap-1"
                        title="Edit Student Record"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowEmailDirectoryModal(false);
                          setShowDeleteModal(r);
                        }}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all"
                        title="Delete Student Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* ── Edit / Update Student Registration Modal ───────────────────── */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-amber-500/50 shadow-2xl space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Edit Student Details</h3>
                  <p className="text-xs text-slate-400">Update information for Ref ID: <span className="font-mono text-gold-light font-bold">{editItem.id}</span></p>
                </div>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
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

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Section
                  </label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                    <option value="Section D">Section D</option>
                    <option value="Section E">Section E</option>
                    <option value="Section F">Section F</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="PG / Alumni">PG / Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 font-bold text-amber-400"
                  >
                    <option value="Pending_ID_Approval">Pending ID Approval</option>
                    <option value="ID_Approved">ID Approved (Pay Pending)</option>
                    <option value="Payment_Pending">Payment Submitted</option>
                    <option value="Approved">Approved & Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Payment UTR Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 981204918234"
                    value={editUtr}
                    onChange={(e) => setEditUtr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {editStatus === 'Rejected' && (
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-rose-300 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={2}
                    value={editRejectionReason}
                    onChange={(e) => setEditRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-rose-800 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-gold-royal text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
