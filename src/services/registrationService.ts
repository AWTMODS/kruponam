import { getAssetUrl } from '../utils/assetPath';
import { 
  fetchRegistrationsFromSupabase, 
  saveRegistrationToSupabase, 
  uploadImageToSupabase, 
  deleteRegistrationFromSupabase,
  isSupabaseConfigured,
  findRegistrationInSupabase,
  checkIfUtrExistsInSupabase
} from './supabaseService';
import {
  isFirebaseConfigured,
  fetchRegistrationsFromFirebase,
  saveRegistrationToFirebase,
  deleteRegistrationFromFirebase,
  findRegistrationInFirebase,
  checkIfUtrExistsInFirebase,
} from './firebaseService';

export type ApprovalStatus = 'Pending_ID_Approval' | 'ID_Approved' | 'Payment_Pending' | 'Approved' | 'Rejected' | 'Pending' | 'VIP_Pending' | 'VIP';

export const normalizeApprovalStatus = (rawStatus?: any): ApprovalStatus => {
  if (!rawStatus) return 'Pending_ID_Approval';
  const clean = String(rawStatus).trim().toLowerCase().replace(/[\s-_]+/g, '_');
  
  if (clean.includes('vip')) {
    return clean.includes('pending') ? 'VIP_Pending' : 'VIP';
  }
  if (clean === 'approved' || clean === 'verified' || clean === 'pass_approved' || clean === 'completed') {
    return 'Approved';
  }
  if (clean === 'id_approved' || clean === 'idapproved' || clean === 'id_verified' || clean === 'pay_unlocked' || clean === 'unlocked') {
    return 'ID_Approved';
  }
  if (clean === 'payment_pending' || clean === 'pay_pending' || clean === 'payment_submitted' || clean === 'utr_submitted') {
    return 'Payment_Pending';
  }
  if (clean === 'rejected' || clean === 'declined') {
    return 'Rejected';
  }
  return 'Pending_ID_Approval';
};

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  section: string;
  year: string;
  gender: string;
  ticketType: string;
  idCardUrl: string;
  paymentScreenshotUrl?: string;
  paymentAmount: number;
  paymentStatus: 'Verified' | 'Pending' | 'Failed';
  paymentUtr: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  submittedAt: string;
  approvedAt?: string;
  updatedAt?: string;
  isReported?: boolean;
  reportedAt?: string;
}

const STORAGE_KEY = 'kruponam_registrations_v3';
const DELETED_KEY = 'kruponam_deleted_ids_v1';
const DB_NAME = 'KruponamDB_v2';
const STORE_NAME = 'registrations_store';

export const getDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

export const markIdAsDeleted = (id: string) => {
  const set = getDeletedIds();
  set.add(id);
  localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
};

export const unmarkIdAsDeleted = (id: string) => {
  const set = getDeletedIds();
  if (set.has(id)) {
    set.delete(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  }
};

// Optional Webhook endpoint for external Cloud DB / Google Sheets (e.g. Firebase, Supabase, Google Apps Script)
export const EXTERNAL_WEBHOOK_URL = ''; 

// ── IndexedDB Engine for Unlimited Storage (Supports 1000+ Registrations & Photos) ──
const openIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const syncToIndexedDB = async (registration: Registration) => {
  try {
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(registration);
  } catch (e) {
    console.warn('IndexedDB sync error:', e);
  }
};

const deleteFromIndexedDB = async (id: string) => {
  try {
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
  } catch (e) {
    console.warn('IndexedDB delete error:', e);
  }
};

const loadAllFromIndexedDB = (): Promise<Registration[]> => {
  return new Promise(async (resolve) => {
    try {
      const db = await openIDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
};

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'KRP-953085',
    fullName: 'Student Registration (KRP-953085)',
    email: 'krp953085@kruponam.edu.in',
    phone: '9876543210',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: 'General Pass',
    idCardUrl: getAssetUrl('images/hero_poster.jpg'),
    paymentScreenshotUrl: '',
    paymentAmount: 700,
    paymentStatus: 'Pending',
    paymentUtr: '',
    approvalStatus: 'Pending_ID_Approval',
    submittedAt: 'Aug 28, 2026',
    isReported: false,
  },
  {
    id: 'KRP-558620',
    fullName: 'Prithvij n pramod',
    email: 'prithvijpramod01@gmail.com',
    phone: '9876543210',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: 'General Pass',
    idCardUrl: getAssetUrl('images/hero_poster.jpg'),
    paymentScreenshotUrl: '',
    paymentAmount: 700,
    paymentStatus: 'Pending',
    paymentUtr: '',
    approvalStatus: 'Pending_ID_Approval',
    submittedAt: 'Aug 28, 2026',
    isReported: false,
  },
  {
    id: 'KRP-947055',
    fullName: 'Sniya M',
    email: 'sniya9528@gmail.com',
    phone: '9562820757',
    department: 'BBA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Female',
    ticketType: 'General Pass',
    idCardUrl: getAssetUrl('images/thiruvathira.png'),
    paymentScreenshotUrl: '',
    paymentAmount: 700,
    paymentStatus: 'Pending',
    paymentUtr: '',
    approvalStatus: 'Pending_ID_Approval',
    submittedAt: 'Aug 15, 2026',
    isReported: false,
  },
  {
    id: 'KRP-865167',
    fullName: 'Sniya M',
    email: 'sniya9528@gmail.com',
    phone: '9562820757',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Female',
    ticketType: 'General Pass',
    idCardUrl: getAssetUrl('images/thiruvathira.png'),
    paymentScreenshotUrl: '',
    paymentAmount: 700,
    paymentStatus: 'Pending',
    paymentUtr: '',
    approvalStatus: 'Pending_ID_Approval',
    submittedAt: 'Aug 14, 2026',
    isReported: false,
  },
  {
    id: 'KRP-849201',
    fullName: 'Anand Nair',
    email: 'anand.nair@example.com',
    phone: '9876543210',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: 'VIP Pass',
    idCardUrl: getAssetUrl('images/pookalam.png'),
    paymentScreenshotUrl: getAssetUrl('images/onasadya.png'),
    paymentAmount: 700,
    paymentStatus: 'Verified',
    paymentUtr: '320918239012',
    approvalStatus: 'Approved',
    submittedAt: 'Jul 30, 2026',
    approvedAt: 'Jul 30, 2026',
    isReported: true,
    reportedAt: 'Aug 14, 2026, 08:30 AM',
  },
  {
    id: 'KRP-519283',
    fullName: 'Devika Pillai',
    email: 'devika.p@example.com',
    phone: '9812345678',
    department: 'B.Com',
    section: 'Section B',
    year: '3rd Year',
    gender: 'Female',
    ticketType: 'General Pass',
    idCardUrl: getAssetUrl('images/maveli.png'),
    paymentScreenshotUrl: getAssetUrl('images/onasadya.png'),
    paymentAmount: 700,
    paymentStatus: 'Pending',
    paymentUtr: '981204918234',
    approvalStatus: 'Payment_Pending',
    submittedAt: 'Aug 02, 2026',
    isReported: false,
  },
  {
    id: 'KRP-109283',
    fullName: 'Sneha Menon',
    email: 'sneha.m@example.com',
    phone: '9765432109',
    department: 'B.Sc',
    section: 'Section C',
    year: '2nd Year',
    gender: 'Female',
    ticketType: 'Group Pass',
    idCardUrl: getAssetUrl('images/thiruvathira.png'),
    paymentScreenshotUrl: getAssetUrl('images/onasadya.png'),
    paymentAmount: 700,
    paymentStatus: 'Verified',
    paymentUtr: '109283019283',
    approvalStatus: 'Rejected',
    rejectionReason: 'ID Card image blurry, please re-upload clear photo of Student ID.',
    submittedAt: 'Jul 28, 2026',
    isReported: false,
  },
];

export const getRegistrations = (): Registration[] => {
  const deletedIds = getDeletedIds();
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialFiltered = INITIAL_REGISTRATIONS.filter((r) => !deletedIds.has(r.id));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFiltered));
    } catch (e) {}
    initialFiltered.forEach(syncToIndexedDB);
    return initialFiltered;
  }
  try {
    let list: Registration[] = JSON.parse(data);
    list = list.filter((r) => !deletedIds.has(r.id));
    const existingIds = new Set(list.map((r) => r.id));
    let hasNewSeed = false;
    
    INITIAL_REGISTRATIONS.forEach((seed) => {
      if (!existingIds.has(seed.id) && !deletedIds.has(seed.id)) {
        list.unshift(seed);
        syncToIndexedDB(seed);
        hasNewSeed = true;
      }
    });

    if (hasNewSeed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    return list.map((item: any) => ({
      ...item,
      section: item.section || 'Section A',
    }));
  } catch (e) {
    return INITIAL_REGISTRATIONS.filter((r) => !deletedIds.has(r.id));
  }
};

const STATUS_RANK: Record<string, number> = {
  'Rejected': 0,
  'Pending': 1,
  'Pending_ID_Approval': 1,
  'ID_Approved': 2,
  'Payment_Pending': 3,
  'Approved': 4,
  'VIP_Pending': 4,
  'VIP': 5,
};

export const deduplicateRegistrations = (list: Registration[]): Registration[] => {
  const deletedIds = getDeletedIds();
  const validList = list.filter((r) => r && r.id && !deletedIds.has(r.id));

  // Map to store primary record by email / phone
  const studentGroups: Map<string, Registration[]> = new Map();

  validList.forEach((r) => {
    const cleanEmail = r.email ? r.email.trim().toLowerCase() : '';
    const cleanPhone = r.phone ? normalizePhoneNumber(r.phone) : '';
    
    // Group key prioritizing email then normalized phone
    const key = cleanEmail ? `email_${cleanEmail}` : (cleanPhone ? `phone_${cleanPhone}` : `id_${r.id}`);

    if (!studentGroups.has(key)) {
      studentGroups.set(key, []);
    }
    studentGroups.get(key)!.push(r);
  });

  const mergedList: Registration[] = [];
  const idsToRemove: string[] = [];

  studentGroups.forEach((group) => {
    if (group.length === 1) {
      mergedList.push(group[0]);
    } else {
      // Sort group to select the primary record (prioritizes KRP-531657, best status, has UTR/ID, latest)
      group.sort((a, b) => {
        if (a.id.toUpperCase() === 'KRP-531657' || a.id.toUpperCase() === 'KRP-558620' || a.id.toUpperCase() === 'KRP-953085') return -1;
        if (b.id.toUpperCase() === 'KRP-531657' || b.id.toUpperCase() === 'KRP-558620' || b.id.toUpperCase() === 'KRP-953085') return 1;

        const rankA = STATUS_RANK[a.approvalStatus] || 0;
        const rankB = STATUS_RANK[b.approvalStatus] || 0;
        if (rankA !== rankB) return rankB - rankA;

        const hasUtrA = (a.paymentUtr && a.paymentUtr.trim()) ? 1 : 0;
        const hasUtrB = (b.paymentUtr && b.paymentUtr.trim()) ? 1 : 0;
        if (hasUtrA !== hasUtrB) return hasUtrB - hasUtrA;

        const hasIdCardA = (a.idCardUrl && a.idCardUrl.length > 50) ? 1 : 0;
        const hasIdCardB = (b.idCardUrl && b.idCardUrl.length > 50) ? 1 : 0;
        if (hasIdCardA !== hasIdCardB) return hasIdCardB - hasIdCardA;

        return (b.updatedAt || b.submittedAt || '').localeCompare(a.updatedAt || a.submittedAt || '');
      });

      const primary = { ...group[0] };
      const duplicates = group.slice(1);

      duplicates.forEach((dup) => {
        const dupRank = STATUS_RANK[dup.approvalStatus] || 0;
        const primaryRank = STATUS_RANK[primary.approvalStatus] || 0;
        if (dupRank > primaryRank) {
          primary.approvalStatus = dup.approvalStatus;
          primary.paymentStatus = dup.paymentStatus;
          if (dup.approvedAt) primary.approvedAt = dup.approvedAt;
        }

        if (!primary.idCardUrl && dup.idCardUrl) primary.idCardUrl = dup.idCardUrl;
        if (!primary.paymentScreenshotUrl && dup.paymentScreenshotUrl) primary.paymentScreenshotUrl = dup.paymentScreenshotUrl;
        if (!primary.paymentUtr && dup.paymentUtr) primary.paymentUtr = dup.paymentUtr;
        if (!primary.rejectionReason && dup.rejectionReason) primary.rejectionReason = dup.rejectionReason;
        if (dup.isReported) {
          primary.isReported = true;
          primary.reportedAt = dup.reportedAt || primary.reportedAt;
        }
        idsToRemove.push(dup.id);
      });

      mergedList.push(primary);
    }
  });

  // Purge duplicate IDs from local & cloud storage
  if (idsToRemove.length > 0) {
    idsToRemove.forEach((id) => {
      markIdAsDeleted(id);
      deleteFromIndexedDB(id);
      if (isFirebaseConfigured()) {
        deleteRegistrationFromFirebase(id).catch(() => {});
      }
      if (isSupabaseConfigured()) {
        deleteRegistrationFromSupabase(id).catch(() => {});
      }
    });
  }

  return mergedList;
};

export const syncCloudRegistrations = async (): Promise<Registration[]> => {
  const deletedIds = getDeletedIds();
  const localList = getRegistrations();
  const idbList = await loadAllFromIndexedDB();
  
  // Combine local and IndexedDB records
  const localMap = new Map<string, Registration>();
  [...idbList, ...localList].forEach((r) => {
    if (r && r.id && !deletedIds.has(r.id)) {
      const existing = localMap.get(r.id);
      if (!existing) {
        localMap.set(r.id, r);
      } else {
        localMap.set(r.id, { ...existing, ...r });
      }
    }
  });

  const mergeCloudRecord = (r: Registration) => {
    if (!r || !r.id || deletedIds.has(r.id)) return;
    const existing = localMap.get(r.id);
    if (!existing) {
      localMap.set(r.id, r);
    } else {
      const existingRank = STATUS_RANK[existing.approvalStatus] || 0;
      const incomingRank = STATUS_RANK[r.approvalStatus] || 0;

      // Higher approval status rank always wins! Never allow stale cloud data to downgrade an approved status.
      const preferCloudStatus = incomingRank > existingRank || (incomingRank === existingRank && (r.updatedAt || '') >= (existing.updatedAt || ''));

      const mergedRecord: Registration = {
        ...existing,
        ...r,
        idCardUrl: (r.idCardUrl && r.idCardUrl.length > 50) ? r.idCardUrl : (existing.idCardUrl || r.idCardUrl),
        paymentScreenshotUrl: (r.paymentScreenshotUrl && r.paymentScreenshotUrl.length > 50) ? r.paymentScreenshotUrl : (existing.paymentScreenshotUrl || r.paymentScreenshotUrl),
        paymentUtr: r.paymentUtr || existing.paymentUtr,
        approvalStatus: preferCloudStatus ? r.approvalStatus : existing.approvalStatus,
        paymentStatus: preferCloudStatus ? r.paymentStatus : existing.paymentStatus,
        approvedAt: r.approvedAt || existing.approvedAt,
        rejectionReason: r.rejectionReason || existing.rejectionReason,
        isReported: r.isReported !== undefined ? r.isReported : existing.isReported,
        reportedAt: r.reportedAt || existing.reportedAt,
        updatedAt: new Date().toISOString()
      };

      localMap.set(r.id, mergedRecord);
    }
  };

  // 1. Fetch remote cloud records from Firebase & Supabase in parallel with fast 2.5s timeout
  const cloudTasks: Promise<any>[] = [];
  
  if (isFirebaseConfigured()) {
    cloudTasks.push(
      Promise.race([
        fetchRegistrationsFromFirebase(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
      ]).then((fbRecords) => {
        if (fbRecords && fbRecords.length > 0) {
          fbRecords.forEach(mergeCloudRecord);
          const fbIds = new Set(fbRecords.map((r) => r.id));
          localMap.forEach((localReg, id) => {
            if (!fbIds.has(id) && !deletedIds.has(id)) {
              saveRegistrationToFirebase(localReg).catch(() => {});
            }
          });
        }
      }).catch((e) => console.warn('Firebase sync notice:', e))
    );
  }

  if (isSupabaseConfigured()) {
    cloudTasks.push(
      Promise.race([
        fetchRegistrationsFromSupabase(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))
      ]).then((cloudRecords) => {
        if (cloudRecords && cloudRecords.length > 0) {
          cloudRecords.forEach(mergeCloudRecord);
          localMap.forEach((localReg, id) => {
            const inCloud = cloudRecords.some((cr) => cr.id === id);
            if (!inCloud && !deletedIds.has(id)) {
              saveRegistrationToSupabase(localReg).catch(() => {});
            }
          });
        }
      }).catch((e) => console.warn('Supabase sync notice:', e))
    );
  }

  if (cloudTasks.length > 0) {
    try {
      await Promise.allSettled(cloudTasks);
    } catch (_) {}
  }

  const rawMerged = Array.from(localMap.values()).filter((r) => !deletedIds.has(r.id));
  const finalMerged = deduplicateRegistrations(rawMerged);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalMerged));
  } catch (e) {
    console.warn('LocalStorage storage limit notice (using IndexedDB for storage):', e);
  }
  finalMerged.forEach(syncToIndexedDB);
  return finalMerged;
};

export const saveRegistrationAsync = async (registration: Registration): Promise<Registration> => {
  let finalReg = { 
    ...registration,
    updatedAt: registration.updatedAt || new Date().toISOString()
  };

  // 1. Immediately save locally in LocalStorage & IndexedDB to prevent any data loss
  saveRegistration(finalReg);

  // 2. Upload ID Card & Payment Screenshot to Supabase Storage if configured
  if (isSupabaseConfigured()) {
    try {
      if (finalReg.idCardUrl && finalReg.idCardUrl.startsWith('data:image')) {
        const uploadedIdUrl = await Promise.race([
          uploadImageToSupabase(finalReg.idCardUrl, `idcard_${finalReg.id}`),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
        ]);
        if (uploadedIdUrl) {
          finalReg.idCardUrl = uploadedIdUrl;
          saveRegistration(finalReg);
        }
      }
      if (finalReg.paymentScreenshotUrl && finalReg.paymentScreenshotUrl.startsWith('data:image')) {
        const uploadedPayUrl = await Promise.race([
          uploadImageToSupabase(finalReg.paymentScreenshotUrl, `pay_${finalReg.id}`),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
        ]);
        if (uploadedPayUrl) {
          finalReg.paymentScreenshotUrl = uploadedPayUrl;
          saveRegistration(finalReg);
        }
      }
    } catch (e) {
      console.warn('Supabase storage upload notice:', e);
    }
  }

  // 3. Await cloud synchronization to Supabase & Firebase in parallel
  const cloudWrites: Promise<any>[] = [];
  if (isSupabaseConfigured()) {
    cloudWrites.push(saveRegistrationToSupabase(finalReg));
  }
  if (isFirebaseConfigured()) {
    cloudWrites.push(saveRegistrationToFirebase(finalReg));
  }

  if (cloudWrites.length > 0) {
    try {
      await Promise.race([
        Promise.allSettled(cloudWrites),
        new Promise((resolve) => setTimeout(resolve, 5000))
      ]);
    } catch (e) {
      console.warn('Cloud write notice:', e);
    }
  }

  return finalReg;
};

export const saveRegistration = (registration: Registration): boolean => {
  try {
    unmarkIdAsDeleted(registration.id);
    if (!registration.updatedAt) {
      registration.updatedAt = new Date().toISOString();
    }
    const registrations = getRegistrations();
    // Prevent duplicate entries
    const filtered = registrations.filter((r) => r.id !== registration.id);
    const updated = [registration, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Also save into IndexedDB for high-capacity preservation (hundreds of MBs)
    syncToIndexedDB(registration);

    // Sync to Supabase in background if available
    if (isSupabaseConfigured()) {
      saveRegistrationToSupabase(registration);
    }

    // Optional POST to external Cloud DB / Google Sheets Webhook
    if (EXTERNAL_WEBHOOK_URL) {
      fetch(EXTERNAL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      }).catch((err) => console.warn('Cloud Webhook POST notice:', err));
    }

    return true;
  } catch (e) {
    console.error('LocalStorage quota error, relying on IndexedDB:', e);
    syncToIndexedDB(registration);
    return true;
  }
};

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // 12 digits starting with country code 91 -> 10-digit national number
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // 11 digits starting with leading 0 -> 10-digit national number
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  // At least 10 digits -> last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
};

export const isPhoneMatch = (phone1: string, phone2: string): boolean => {
  if (!phone1 || !phone2) return false;
  const p1 = phone1.trim().toLowerCase();
  const p2 = phone2.trim().toLowerCase();

  // Direct exact string equality
  if (p1 === p2) return true;

  const d1 = p1.replace(/\D/g, '');
  const d2 = p2.replace(/\D/g, '');

  if (!d1 || !d2) return false;
  // Direct digit equality
  if (d1 === d2) return true;

  // Direct 10-digit national suffix matching (e.g. +91 97780 29340 vs 9778029340)
  if (d1.length >= 10 && d2.length >= 10) {
    const l1 = d1.slice(-10);
    const l2 = d2.slice(-10);
    if (l1 === l2) return true;
  }

  // Normalized 10-digit national number equality
  const n1 = normalizePhoneNumber(p1);
  const n2 = normalizePhoneNumber(p2);

  return !!(n1 && n2 && (n1 === n2 || n1.endsWith(n2) || n2.endsWith(n1)));
};

export const isSameStudent = (r1: Registration, r2: Registration): boolean => {
  if (!r1 || !r2) return false;
  const e1 = r1.email ? r1.email.trim().toLowerCase() : '';
  const e2 = r2.email ? r2.email.trim().toLowerCase() : '';
  if (e1 && e2 && e1 === e2) return true;
  if (r1.phone && r2.phone && isPhoneMatch(r1.phone, r2.phone)) return true;
  return false;
};

export const isEmailAlreadyUsed = (email: string, excludeId?: string): boolean => {
  if (!email || !email.trim()) return false;
  const clean = email.trim().toLowerCase();
  const list = getRegistrations();
  return list.some((r) => r.email && r.email.trim().toLowerCase() === clean && r.id !== excludeId);
};

export const isPhoneAlreadyUsed = (phone: string, excludeId?: string): boolean => {
  if (!phone || !phone.trim()) return false;
  const list = getRegistrations();
  return list.some((r) => r.phone && isPhoneMatch(r.phone, phone) && r.id !== excludeId);
};

export const findStudentByExactEmailOrPhone = (email: string, phone: string): Registration | undefined => {
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phone ? phone.trim() : '';
  if (!cleanEmail && !cleanPhone) return undefined;
  const list = getRegistrations();
  return list.find((r) => {
    if (cleanEmail && r.email && r.email.trim().toLowerCase() === cleanEmail) return true;
    if (cleanPhone && r.phone && isPhoneMatch(r.phone, cleanPhone)) return true;
    return false;
  });
};

export const findStudentByExactEmailOrPhoneAsync = async (email: string, phone: string): Promise<Registration | undefined> => {
  const local = findStudentByExactEmailOrPhone(email, phone);

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPhone = phone ? phone.trim() : '';
  if (!cleanEmail && !cleanPhone) return local;

  try {
    const cloudPromises: Promise<Registration | null>[] = [];
    if (isFirebaseConfigured()) {
      if (cleanEmail) cloudPromises.push(findRegistrationInFirebase(cleanEmail));
      if (cleanPhone) cloudPromises.push(findRegistrationInFirebase(cleanPhone));
    }
    if (isSupabaseConfigured()) {
      if (cleanEmail) cloudPromises.push(findRegistrationInSupabase(cleanEmail));
      if (cleanPhone) cloudPromises.push(findRegistrationInSupabase(cleanPhone));
    }

    if (cloudPromises.length > 0) {
      const results = await Promise.race([
        Promise.allSettled(cloudPromises),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2500)),
      ]);

      if (Array.isArray(results)) {
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            const r = res.value as Registration;
            const isMatch = (cleanEmail && r.email && r.email.trim().toLowerCase() === cleanEmail) || 
                            (cleanPhone && r.phone && isPhoneMatch(r.phone, cleanPhone));
            if (isMatch) {
              // If local exists, merge and prefer the higher/newer status
              if (local) {
                const localRank = STATUS_RANK[local.approvalStatus] || 0;
                const cloudRank = STATUS_RANK[r.approvalStatus] || 0;
                const preferCloud = cloudRank >= localRank;
                const merged: Registration = {
                  ...local,
                  ...r,
                  approvalStatus: preferCloud ? r.approvalStatus : local.approvalStatus,
                  paymentStatus: preferCloud ? r.paymentStatus : local.paymentStatus,
                  updatedAt: r.updatedAt || local.updatedAt || new Date().toISOString(),
                };
                saveRegistration(merged);
                return merged;
              }
              saveRegistration(r);
              return r;
            }
          }
        }
      }
    }
    return local;
  } catch {
    return local;
  }
};

export const isUtrAlreadyUsed = (utr: string, excludeId?: string): boolean => {
  if (!utr || utr.trim().length < 6) return false;
  const cleanUtr = utr.trim().toLowerCase();
  const list = getRegistrations();
  return list.some((r) => r.paymentUtr && r.paymentUtr.trim().toLowerCase() === cleanUtr && r.id !== excludeId);
};

/**
 * Super-secure async check verifying if UTR was already submitted across local and remote cloud databases.
 */
export const isUtrAlreadyUsedAsync = async (
  utr: string,
  excludeId?: string
): Promise<{ isUsed: boolean; message?: string }> => {
  if (!utr || utr.trim().length < 6) {
    return { isUsed: false };
  }

  const cleanUtr = utr.trim();

  // 1. Instant local check
  const localList = getRegistrations();
  const localMatch = localList.find(
    (r) => r.paymentUtr && r.paymentUtr.trim().toLowerCase() === cleanUtr.toLowerCase() && r.id !== excludeId
  );
  if (localMatch) {
    return {
      isUsed: true,
      message: `⚠️ This UPI UTR / Ref ID (${cleanUtr}) has already been registered in the database for ${localMatch.fullName} (${localMatch.id}). Each pass payment requires a unique transaction UTR.`,
    };
  }

  // 2. Parallel Cloud Database Check (Firebase & Supabase)
  try {
    const cloudChecks: Promise<{ exists: boolean; registeredTo?: string; passId?: string } | null>[] = [];
    if (isFirebaseConfigured()) {
      cloudChecks.push(checkIfUtrExistsInFirebase(cleanUtr, excludeId));
    }
    if (isSupabaseConfigured()) {
      cloudChecks.push(checkIfUtrExistsInSupabase(cleanUtr, excludeId));
    }

    if (cloudChecks.length > 0) {
      const results = await Promise.race([
        Promise.allSettled(cloudChecks),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2500)),
      ]);

      if (Array.isArray(results)) {
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value && res.value.exists) {
            return {
              isUsed: true,
              message: `⚠️ This UPI UTR / Ref ID (${cleanUtr}) has already been submitted on the server (Pass ID: ${res.value.passId || 'Registered'}). Duplicate payment UTR numbers are strictly not permitted.`,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Async UTR validation notice:', err);
  }

  return { isUsed: false };
};

export const generateUniqueRegistrationId = (): string => {
  const registrations = getRegistrations();
  const existingIds = new Set(registrations.map((r) => r.id.toUpperCase()));
  let id = '';
  do {
    id = 'KRP-' + Math.floor(100000 + Math.random() * 900000);
  } while (existingIds.has(id));
  return id;
};


export const approveIdCard = async (id: string, fallbackRecord?: Registration): Promise<Registration | null> => {
  const cleanId = (id || '').trim();
  const allCurrent = getRegistrations();
  let target = allCurrent.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase()) || fallbackRecord;
  if (!target) {
    target = INITIAL_REGISTRATIONS.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  }

  // If still not found, do a targeted cloud lookup
  if (!target) {
    if (isFirebaseConfigured()) {
      target = (await findRegistrationInFirebase(cleanId)) || undefined;
    }
    if (!target && isSupabaseConfigured()) {
      target = (await findRegistrationInSupabase(cleanId)) || undefined;
    }
  }

  if (target) {
    const updatedRecord: Registration = {
      ...target,
      approvalStatus: 'ID_Approved',
      updatedAt: new Date().toISOString(),
    };

    const remaining = allCurrent.filter((r) => r.id !== target.id);
    const newList = [updatedRecord, ...remaining];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage quota notice:', e);
    }
    syncToIndexedDB(updatedRecord);

    await Promise.allSettled([
      isFirebaseConfigured() ? saveRegistrationToFirebase(updatedRecord) : Promise.resolve(false),
      isSupabaseConfigured() ? saveRegistrationToSupabase(updatedRecord) : Promise.resolve(false),
    ]);

    return updatedRecord;
  }
  return null;
};

export const submitPaymentForRegistration = async (
  id: string, 
  utr: string, 
  screenshotUrl: string
): Promise<Registration | null> => {
  const cleanId = (id || '').trim();
  if (!cleanId) return null;

  const cleanUtr = (utr || '').trim();
  if (!cleanUtr || cleanUtr.length < 6) {
    throw new Error('Please enter a valid 12-digit UPI transaction reference / UTR number.');
  }

  // Enforce server & cloud UTR uniqueness check before saving
  const utrCheck = await isUtrAlreadyUsedAsync(cleanUtr, cleanId);
  if (utrCheck.isUsed) {
    throw new Error(utrCheck.message || 'This UPI UTR number has already been submitted on the server. Please enter your valid transaction reference.');
  }

  let target = getRegistrations().find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  if (!target) {
    target = INITIAL_REGISTRATIONS.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  }

  // If not found locally, do a fast targeted lookup in Firebase/Supabase
  if (!target) {
    if (isFirebaseConfigured()) {
      target = (await findRegistrationInFirebase(cleanId)) || undefined;
    }
    if (!target && isSupabaseConfigured()) {
      target = (await findRegistrationInSupabase(cleanId)) || undefined;
    }
  }

  if (target) {
    let finalPayUrl = screenshotUrl;
    if (isSupabaseConfigured() && screenshotUrl.startsWith('data:image')) {
      try {
        const uploaded = await Promise.race([
          uploadImageToSupabase(screenshotUrl, `pay_${cleanId}`),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        if (uploaded) finalPayUrl = uploaded;
      } catch (e) {
        console.warn('Supabase upload notice:', e);
      }
    }

    const updatedRecord: Registration = {
      ...target,
      paymentUtr: cleanUtr,
      paymentScreenshotUrl: finalPayUrl,
      paymentStatus: 'Pending',
      approvalStatus: 'Payment_Pending',
      updatedAt: new Date().toISOString(),
    };
    
    // Save to local & cloud async
    await saveRegistrationAsync(updatedRecord);
    return updatedRecord;
  }
  return null;
};

export const issueVipPass = async (params: {
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  section?: string;
  year?: string;
  isVipPending?: boolean;
}): Promise<Registration> => {
  const allCurrent = getRegistrations();
  const cleanEmail = params.email.trim().toLowerCase();
  
  // Check if existing record exists with this email
  const existing = allCurrent.find((r) => r.email && r.email.trim().toLowerCase() === cleanEmail);
  
  const nowFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isPending = params.isVipPending !== false;
  const status: ApprovalStatus = isPending ? 'VIP_Pending' : 'VIP';

  let vipRecord: Registration;

  if (existing) {
    vipRecord = {
      ...existing,
      fullName: params.fullName.trim() || existing.fullName,
      phone: params.phone.trim() || existing.phone,
      department: params.department?.trim() || existing.department || 'BCA',
      section: params.section?.trim() || existing.section || 'Section A',
      year: params.year?.trim() || existing.year || '2nd Year',
      ticketType: existing.ticketType || 'Student Pass',
      paymentAmount: 0,
      paymentStatus: 'Verified',
      paymentUtr: existing.paymentUtr || 'UPI-VERIFIED-700',
      approvalStatus: status,
      approvedAt: existing.approvedAt || nowFormatted,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const id = generateUniqueRegistrationId();
    vipRecord = {
      id,
      fullName: params.fullName.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      department: (params.department || 'BCA').trim(),
      section: (params.section || 'Section A').trim(),
      year: (params.year || '2nd Year').trim(),
      gender: 'Other',
      ticketType: 'Student Pass',
      idCardUrl: getAssetUrl('images/hero_poster.jpg'),
      paymentAmount: 0,
      paymentStatus: 'Verified',
      paymentUtr: 'UPI-VERIFIED-700',
      approvalStatus: status,
      submittedAt: nowFormatted,
      approvedAt: nowFormatted,
      updatedAt: new Date().toISOString(),
    };
  }

  const remaining = allCurrent.filter((r) => r.id !== vipRecord.id);
  const newList = [vipRecord, ...remaining];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (e) {
    console.warn('LocalStorage quota notice:', e);
  }
  syncToIndexedDB(vipRecord);

  Promise.allSettled([
    isFirebaseConfigured() ? saveRegistrationToFirebase(vipRecord) : Promise.resolve(false),
    isSupabaseConfigured() ? saveRegistrationToSupabase(vipRecord) : Promise.resolve(false),
  ]).catch(() => {});

  return vipRecord;
};

export const convertToOfficialVip = async (id: string, fallbackRecord?: Registration): Promise<Registration | null> => {
  const cleanId = (id || '').trim();
  const allCurrent = getRegistrations();
  let target = allCurrent.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase()) || fallbackRecord;
  if (!target) {
    target = INITIAL_REGISTRATIONS.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  }

  if (!target) {
    if (isFirebaseConfigured()) {
      target = (await findRegistrationInFirebase(cleanId)) || undefined;
    }
    if (!target && isSupabaseConfigured()) {
      target = (await findRegistrationInSupabase(cleanId)) || undefined;
    }
  }

  if (target) {
    const updatedRecord: Registration = {
      ...target,
      approvalStatus: 'VIP',
      ticketType: target.ticketType || 'Student Pass',
      paymentAmount: 0,
      paymentStatus: 'Verified',
      updatedAt: new Date().toISOString(),
    };

    const remaining = allCurrent.filter((r) => r.id !== target.id);
    const newList = [updatedRecord, ...remaining];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage quota notice:', e);
    }
    syncToIndexedDB(updatedRecord);

    Promise.allSettled([
      isFirebaseConfigured() ? saveRegistrationToFirebase(updatedRecord) : Promise.resolve(false),
      isSupabaseConfigured() ? saveRegistrationToSupabase(updatedRecord) : Promise.resolve(false),
    ]).catch(() => {});

    return updatedRecord;
  }
  return null;
};

export const deleteRegistration = async (id: string): Promise<boolean> => {
  try {
    markIdAsDeleted(id);

    const registrations = getRegistrations();
    const filtered = registrations.filter((r) => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage quota notice:', e);
    }
    
    deleteFromIndexedDB(id);

    Promise.allSettled([
      isFirebaseConfigured() ? deleteRegistrationFromFirebase(id) : Promise.resolve(false),
      isSupabaseConfigured() ? deleteRegistrationFromSupabase(id) : Promise.resolve(false),
    ]).catch(() => {});

    return true;
  } catch (e) {
    console.error('Error deleting registration:', e);
    return false;
  }
};

export const approveRegistration = async (id: string, fallbackRecord?: Registration): Promise<Registration | null> => {
  const cleanId = (id || '').trim();
  const allCurrent = getRegistrations();
  let target = allCurrent.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase()) || fallbackRecord;
  if (!target) {
    target = INITIAL_REGISTRATIONS.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  }

  // If still not found, do a targeted cloud lookup
  if (!target) {
    if (isFirebaseConfigured()) {
      target = (await findRegistrationInFirebase(cleanId)) || undefined;
    }
    if (!target && isSupabaseConfigured()) {
      target = (await findRegistrationInSupabase(cleanId)) || undefined;
    }
  }

  if (target) {
    const updatedRecord: Registration = {
      ...target,
      approvalStatus: 'Approved',
      paymentStatus: 'Verified',
      approvedAt: target.approvedAt || new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      updatedAt: new Date().toISOString(),
    };

    const remaining = allCurrent.filter((r) => r.id !== target.id);
    const newList = [updatedRecord, ...remaining];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage quota notice:', e);
    }
    syncToIndexedDB(updatedRecord);

    await Promise.allSettled([
      isFirebaseConfigured() ? saveRegistrationToFirebase(updatedRecord) : Promise.resolve(false),
      isSupabaseConfigured() ? saveRegistrationToSupabase(updatedRecord) : Promise.resolve(false),
    ]);

    return updatedRecord;
  }
  return null;
};

export const rejectRegistration = async (id: string, reason: string, fallbackRecord?: Registration): Promise<Registration | null> => {
  const cleanId = (id || '').trim();
  const allCurrent = getRegistrations();
  let target = allCurrent.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase()) || fallbackRecord;
  if (!target) {
    target = INITIAL_REGISTRATIONS.find((r) => r.id === cleanId || r.id.trim().toLowerCase() === cleanId.toLowerCase());
  }

  if (!target) {
    if (isFirebaseConfigured()) {
      target = (await findRegistrationInFirebase(cleanId)) || undefined;
    }
    if (!target && isSupabaseConfigured()) {
      target = (await findRegistrationInSupabase(cleanId)) || undefined;
    }
  }

  if (target) {
    const updatedRecord: Registration = {
      ...target,
      approvalStatus: 'Rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    const remaining = allCurrent.filter((r) => r.id !== target.id);
    const newList = [updatedRecord, ...remaining];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage quota notice:', e);
    }
    syncToIndexedDB(updatedRecord);

    await Promise.allSettled([
      isFirebaseConfigured() ? saveRegistrationToFirebase(updatedRecord) : Promise.resolve(false),
      isSupabaseConfigured() ? saveRegistrationToSupabase(updatedRecord) : Promise.resolve(false),
    ]);

    return updatedRecord;
  }
  return null;
};

export type ScanResultStatus = 
  | 'success' 
  | 'already_reported' 
  | 'payment_required' 
  | 'payment_pending_review' 
  | 'id_pending' 
  | 'not_approved' 
  | 'not_found';

export interface ScanResult {
  status: ScanResultStatus;
  registration?: Registration;
  message: string;
  timestamp?: string;
}

export const markAsReportedAsync = async (query: string): Promise<ScanResult> => {
  if (!query || !query.trim()) {
    return { status: 'not_found', message: 'No scan data provided.' };
  }

  let q = query.trim().toLowerCase();
  
  // 1. Extract KRP token ID using Regex (e.g. handles "KRP -995318", "TOKEN : KRP-995318", "KRUPONAM2026|TOKEN:KRP-995318|...")
  const krpMatch = query.match(/krp\s*[-_]?\s*(\d+)/i);
  let targetId = '';
  if (krpMatch) {
    targetId = `KRP-${krpMatch[1]}`;
  }

  if (!targetId && q.includes('token')) {
    const parts = q.split('|');
    const tokenPart = parts.find((p) => p.includes('token'));
    if (tokenPart) {
      const splitColon = tokenPart.split(':');
      if (splitColon.length > 1) {
        const extracted = splitColon[1].trim();
        if (extracted) {
          targetId = extracted.toUpperCase().startsWith('KRP-') ? extracted.toUpperCase() : `KRP-${extracted.replace(/\D/g, '')}`;
          q = extracted.toLowerCase();
        }
      }
    }
  }

  const cleanQueryAlphaNum = q.replace(/[^a-z0-9]/g, '');

  // 2. Search local registrations first
  const localList = getRegistrations();
  let student = localList.find((r) => {
    const cleanIdAlphaNum = r.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      (targetId && r.id.toLowerCase() === targetId.toLowerCase()) ||
      r.id.toLowerCase() === q ||
      (r.email && r.email.toLowerCase() === q) ||
      (r.phone && isPhoneMatch(r.phone, q)) ||
      (r.paymentUtr && r.paymentUtr.toLowerCase() === q) ||
      (cleanIdAlphaNum && cleanQueryAlphaNum.length >= 4 && (cleanQueryAlphaNum.includes(cleanIdAlphaNum) || cleanIdAlphaNum.includes(cleanQueryAlphaNum)))
    );
  });

  // 3. ALWAYS cross-reference with Cloud Firebase / Supabase to get the authoritative live status!
  try {
    const cloudMatch = await findRegistrationAsync(targetId || q || query);
    if (cloudMatch) {
      if (!student) {
        student = cloudMatch;
      } else {
        const localRank = STATUS_RANK[student.approvalStatus] || 0;
        const cloudRank = STATUS_RANK[cloudMatch.approvalStatus] || 0;
        if (cloudRank >= localRank) {
          student = {
            ...student,
            ...cloudMatch,
            approvalStatus: cloudMatch.approvalStatus,
            paymentStatus: cloudMatch.paymentStatus,
            isReported: cloudMatch.isReported !== undefined ? cloudMatch.isReported : student.isReported,
            reportedAt: cloudMatch.reportedAt || student.reportedAt,
          };
          saveRegistration(student);
        }
      }
    }
  } catch (err) {
    console.warn('Cloud lookup notice during gate scan:', err);
  }

  if (!student) {
    return {
      status: 'not_found',
      message: `Invalid Pass QR Code / Registration ID: "${query}". No matching pass found in campus database.`,
    };
  }

  // 4. Case: Rejected by Admin
  if (student.approvalStatus === 'Rejected') {
    return {
      status: 'not_approved',
      registration: student,
      message: `ACCESS DENIED: Application for ${student.fullName} (${student.id}) was REJECTED by Admin. Reason: ${student.rejectionReason || 'Verification failed.'}`,
    };
  }

  const isVip = student.approvalStatus === 'VIP_Pending' || student.approvalStatus === 'VIP' || student.ticketType === 'VIP Pass';

  // 5. Case: Approved Pass or VIP Pass
  if (student.approvalStatus === 'Approved' || isVip) {
    // If already checked in earlier
    if (student.isReported) {
      return {
        status: 'already_reported',
        registration: student,
        timestamp: student.reportedAt,
        message: `DUPLICATE SCAN ALERT: ${isVip ? '👑 VIP ' : ''}${student.fullName} (${student.id}) ALREADY CHECKED IN at Campus Gate on ${student.reportedAt || 'earlier today'}.`,
      };
    }

    // First time check-in: Mark as Reported & save to Cloud
    const nowString = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedStudent: Registration = {
      ...student,
      isReported: true,
      reportedAt: nowString,
      paymentStatus: 'Verified',
      updatedAt: new Date().toISOString(),
    };

    if (!updatedStudent.approvedAt) {
      updatedStudent.approvedAt = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    await saveRegistrationAsync(updatedStudent);

    return {
      status: 'success',
      registration: updatedStudent,
      timestamp: nowString,
      message: isVip
        ? `ENTRY GRANTED: 👑 VIP Guest ${student.fullName} (${student.id}) successfully VALIDATED & CHECKED IN at Campus Gate! VIP Entry & Onasadya Token Validated.`
        : `ENTRY GRANTED: ${student.fullName} (${student.id}) successfully CHECKED IN at Campus Gate! Onasadya Token Validated.`,
    };
  }

  // 6. Case: ID Approved, but Payment Pending / Not Paid
  if (student.approvalStatus === 'ID_Approved') {
    return {
      status: 'payment_required',
      registration: student,
      message: `PAYMENT REQUIRED AT GATE: Student ID for ${student.fullName} (${student.id}) is APPROVED, but the ₹${student.paymentAmount || 700} pass fee is UNPAID. Collect payment to grant entry.`,
    };
  }

  // 7. Case: Payment Pending Admin Verification
  if (student.approvalStatus === 'Payment_Pending') {
    return {
      status: 'payment_pending_review',
      registration: student,
      message: `PAYMENT PENDING REVIEW: ${student.fullName} (${student.id}) submitted payment (UTR: ${student.paymentUtr || 'Submitted'}). Confirm payment to grant entry.`,
    };
  }

  // 8. Case: Student ID Pending Verification
  if (student.approvalStatus === 'Pending_ID_Approval') {
    return {
      status: 'id_pending',
      registration: student,
      message: `ID APPROVAL PENDING: Student ID card for ${student.fullName} (${student.id}) has not been verified yet. Inspect ID card and collect ₹700 pass fee to grant entry.`,
    };
  }

  return {
    status: 'not_approved',
    registration: student,
    message: `ACCESS RESTRICTED: Pass for ${student.fullName} (${student.id}) is in status "${student.approvalStatus}".`,
  };
};

export const markAsReported = (query: string): ScanResult => {
  const registrations = getRegistrations();
  let q = query.trim().toLowerCase();
  
  const krpMatch = query.match(/krp\s*[-_]?\s*(\d+)/i);
  let targetId = '';
  if (krpMatch) {
    targetId = `KRP-${krpMatch[1]}`;
  }

  if (!targetId && q.includes('token')) {
    const parts = q.split('|');
    const tokenPart = parts.find((p) => p.includes('token'));
    if (tokenPart) {
      const splitColon = tokenPart.split(':');
      if (splitColon.length > 1) {
        const extracted = splitColon[1].trim();
        if (extracted) {
          targetId = extracted.toUpperCase().startsWith('KRP-') ? extracted.toUpperCase() : `KRP-${extracted.replace(/\D/g, '')}`;
          q = extracted.toLowerCase();
        }
      }
    }
  }

  const cleanQueryAlphaNum = q.replace(/[^a-z0-9]/g, '');

  const student = registrations.find((r) => {
    const cleanIdAlphaNum = r.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      (targetId && r.id.toLowerCase() === targetId.toLowerCase()) ||
      r.id.toLowerCase() === q ||
      (r.email && r.email.toLowerCase() === q) ||
      (r.phone && isPhoneMatch(r.phone, q)) ||
      (r.paymentUtr && r.paymentUtr.toLowerCase() === q) ||
      (cleanIdAlphaNum && cleanQueryAlphaNum.length >= 4 && (cleanQueryAlphaNum.includes(cleanIdAlphaNum) || cleanIdAlphaNum.includes(cleanQueryAlphaNum)))
    );
  });

  if (!student) {
    return {
      status: 'not_found',
      message: `Invalid Pass QR Code / Registration ID: "${query}"`,
    };
  }

  if (student.approvalStatus === 'Rejected') {
    return {
      status: 'not_approved',
      registration: student,
      message: `ACCESS DENIED: Application for ${student.fullName} (${student.id}) was REJECTED by Admin.`,
    };
  }

  const isVip = student.approvalStatus === 'VIP_Pending' || student.approvalStatus === 'VIP' || student.ticketType === 'VIP Pass';

  if (student.approvalStatus === 'Approved' || isVip) {
    if (student.isReported) {
      return {
        status: 'already_reported',
        registration: student,
        timestamp: student.reportedAt,
        message: `DUPLICATE SCAN ALERT: ${student.fullName} (${student.id}) ALREADY CHECKED IN on ${student.reportedAt || 'earlier today'}.`,
      };
    }

    const nowString = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    student.isReported = true;
    student.reportedAt = nowString;
    student.paymentStatus = 'Verified';
    saveRegistration(student);
    if (isFirebaseConfigured()) saveRegistrationToFirebase(student);

    return {
      status: 'success',
      registration: student,
      timestamp: nowString,
      message: `ENTRY GRANTED: ${student.fullName} (${student.id}) CHECKED IN at Campus Gate!`,
    };
  }

  if (student.approvalStatus === 'ID_Approved') {
    return {
      status: 'payment_required',
      registration: student,
      message: `PAYMENT REQUIRED AT GATE: Student ID for ${student.fullName} (${student.id}) is APPROVED, but pass fee (₹700) is pending.`,
    };
  }

  if (student.approvalStatus === 'Payment_Pending') {
    return {
      status: 'payment_pending_review',
      registration: student,
      message: `PAYMENT PENDING REVIEW: ${student.fullName} (${student.id}) submitted UTR (${student.paymentUtr || 'Submitted'}).`,
    };
  }

  return {
    status: 'id_pending',
    registration: student,
    message: `ID PENDING: Student ID card for ${student.fullName} (${student.id}) has not been approved yet.`,
  };
};

const matchRecord = (r: Registration, q: string): boolean => {
  if (!r || !q) return false;
  const cleanQ = q.trim().toLowerCase();
  const qAlphaNum = cleanQ.replace(/[^a-z0-9]/g, '');

  const rId = r.id ? r.id.trim().toLowerCase() : '';
  const rIdAlphaNum = rId.replace(/[^a-z0-9]/g, '');
  const rEmail = r.email ? r.email.trim().toLowerCase() : '';
  const rName = r.fullName ? r.fullName.trim().toLowerCase() : '';
  const rUtr = r.paymentUtr ? r.paymentUtr.trim().toLowerCase() : '';

  // 1. If query is an email (contains '@'), ONLY do exact email matching
  if (cleanQ.includes('@')) {
    return rEmail === cleanQ;
  }

  // 2. ID Match (e.g. KRP-531657, krp531657, 531657)
  if (rId && (rId === cleanQ || (qAlphaNum.length >= 4 && rIdAlphaNum.includes(qAlphaNum)))) return true;

  // 3. Email Match without domain (e.g. username before @)
  if (rEmail && rEmail.split('@')[0] === cleanQ) return true;

  // 4. Phone Match
  if (r.phone && isPhoneMatch(r.phone, cleanQ)) return true;

  // 5. Payment UTR Match (minimum 6 characters)
  if (rUtr && (rUtr === cleanQ || (qAlphaNum.length >= 6 && rUtr.replace(/[^a-z0-9]/g, '').includes(qAlphaNum)))) return true;

  // 6. Name Match (only for pure text names, e.g. "Albin", "Ashin Gopi", "Sniya", "Prithvij")
  if (rName && cleanQ.length >= 3) {
    const nameWords = rName.split(/\s+/);
    if (rName === cleanQ || rName.startsWith(cleanQ) || rName.includes(cleanQ) || nameWords.some(w => w === cleanQ)) {
      return true;
    }
  }

  return false;
};

export const findRegistration = (query: string): Registration | undefined => {
  if (!query || !query.trim()) return undefined;
  const registrations = getRegistrations();
  return registrations.find((r) => matchRecord(r, query));
};

export const findRegistrationAsync = async (query: string): Promise<Registration | undefined> => {
  if (!query || !query.trim()) return undefined;
  const q = query.trim();
  const lowerQ = q.toLowerCase();
  
  const localList = getRegistrations();
  const localMatch = localList.find((r) => matchRecord(r, lowerQ));

  // Perform superfast targeted lookup from Firebase & Supabase in parallel
  try {
    const cloudPromises: Promise<Registration | null>[] = [];
    if (isFirebaseConfigured()) {
      cloudPromises.push(findRegistrationInFirebase(q));
    }
    if (isSupabaseConfigured()) {
      cloudPromises.push(findRegistrationInSupabase(q));
    }

    if (cloudPromises.length > 0) {
      const results = await Promise.race([
        Promise.allSettled(cloudPromises),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 3000)),
      ]);

      if (Array.isArray(results)) {
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            const cloudReg = res.value as Registration;
            
            // Merge with local match if exists
            let mergedReg: Registration = cloudReg;
            if (localMatch) {
              const localRank = STATUS_RANK[localMatch.approvalStatus] || 0;
              const cloudRank = STATUS_RANK[cloudReg.approvalStatus] || 0;
              const preferCloud = cloudRank >= localRank;

              mergedReg = {
                ...localMatch,
                ...cloudReg,
                approvalStatus: preferCloud ? cloudReg.approvalStatus : localMatch.approvalStatus,
                paymentStatus: preferCloud ? cloudReg.paymentStatus : localMatch.paymentStatus,
                idCardUrl: cloudReg.idCardUrl || localMatch.idCardUrl,
                paymentScreenshotUrl: cloudReg.paymentScreenshotUrl || localMatch.paymentScreenshotUrl,
                paymentUtr: cloudReg.paymentUtr || localMatch.paymentUtr,
                rejectionReason: cloudReg.rejectionReason !== undefined ? cloudReg.rejectionReason : localMatch.rejectionReason,
                updatedAt: cloudReg.updatedAt || localMatch.updatedAt || new Date().toISOString(),
              };
            }

            // Update local memory / storage so future lookups are instant
            saveRegistration(mergedReg);
            return mergedReg;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Fast cloud search notice:', e);
  }

  if (localMatch) return localMatch;

  return INITIAL_REGISTRATIONS.find((r) => matchRecord(r, lowerQ));
};

// ── Backup & Safety Helper Exports ──────────────────────────────────
export const exportBackupDataJson = (): string => {
  const registrations = getRegistrations();
  return JSON.stringify({
    version: '2.0',
    exportDate: new Date().toISOString(),
    totalRecords: registrations.length,
    registrations,
  }, null, 2);
};

export const importBackupDataJson = (jsonContent: string): { success: boolean; count: number; message: string } => {
  try {
    const parsed = JSON.parse(jsonContent);
    const records: Registration[] = Array.isArray(parsed) ? parsed : parsed.registrations;
    if (!Array.isArray(records)) {
      return { success: false, count: 0, message: 'Invalid JSON structure: Expected array of registrations.' };
    }
    
    const current = getRegistrations();
    const existingIds = new Set(current.map(r => r.id));
    let addedCount = 0;
    
    const merged = [...current];
    records.forEach(r => {
      if (r.id && !existingIds.has(r.id)) {
        merged.push({
          ...r,
          section: r.section || 'Section A',
        });
        syncToIndexedDB(r);
        addedCount++;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: addedCount, message: `Successfully restored ${addedCount} new registration records!` };
  } catch (e) {
    return { success: false, count: 0, message: 'Failed to parse JSON backup file.' };
  }
};
