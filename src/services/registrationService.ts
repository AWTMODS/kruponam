import { getAssetUrl } from '../utils/assetPath';
import { 
  fetchRegistrationsFromSupabase, 
  saveRegistrationToSupabase, 
  uploadImageToSupabase, 
  deleteRegistrationFromSupabase,
  isSupabaseConfigured 
} from './supabaseService';
import {
  isFirebaseConfigured,
  fetchRegistrationsFromFirebase,
  saveRegistrationToFirebase,
  deleteRegistrationFromFirebase,
} from './firebaseService';

export type ApprovalStatus = 'Pending_ID_Approval' | 'ID_Approved' | 'Payment_Pending' | 'Approved' | 'Rejected' | 'Pending' | 'VIP_Pending' | 'VIP';

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
        if (a.id.toUpperCase() === 'KRP-531657') return -1;
        if (b.id.toUpperCase() === 'KRP-531657') return 1;

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

  // 1. Try fetching remote cloud records from Firebase
  if (isFirebaseConfigured()) {
    try {
      const fbRecords = await fetchRegistrationsFromFirebase();
      if (fbRecords && fbRecords.length > 0) {
        fbRecords.forEach(mergeCloudRecord);

        // Push any local-only records to Firebase so they are not lost across devices
        const fbIds = new Set(fbRecords.map((r) => r.id));
        localMap.forEach((localReg, id) => {
          if (!fbIds.has(id) && !deletedIds.has(id)) {
            saveRegistrationToFirebase(localReg).catch((err) =>
              console.warn('Background sync to Firebase failed for local record:', id, err)
            );
          }
        });
      } else {
        // Firestore collection is empty — push all local records up
        localMap.forEach((localReg, id) => {
          if (!deletedIds.has(id)) {
            saveRegistrationToFirebase(localReg).catch((err) =>
              console.warn('Background sync to Firebase failed for local record:', id, err)
            );
          }
        });
      }
    } catch (e) {
      console.warn('Firebase sync notice:', e);
    }
  }

  // 2. Try fetching remote cloud records from Supabase
  if (isSupabaseConfigured()) {
    try {
      const cloudRecords = await fetchRegistrationsFromSupabase();
      if (cloudRecords && cloudRecords.length > 0) {
        cloudRecords.forEach(mergeCloudRecord);

        // Push any local-only records to Supabase so they are not lost across devices
        localMap.forEach((localReg, id) => {
          const inCloud = cloudRecords.some((cr) => cr.id === id);
          if (!inCloud && !deletedIds.has(id)) {
            saveRegistrationToSupabase(localReg).catch((err) =>
              console.warn('Background sync to Supabase failed for local record:', id, err)
            );
          }
        });
      }
    } catch (e) {
      console.warn('Supabase sync notice:', e);
    }
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
      saveRegistrationToSupabase(finalReg).catch((err) => console.warn('Supabase save notice:', err));
    } catch (e) {
      console.warn('Supabase cloud upload notice:', e);
    }
  }

  // 3. Save to Firebase Cloud Database if configured (Realtime Firestore)
  if (isFirebaseConfigured()) {
    try {
      Promise.race([
        saveRegistrationToFirebase(finalReg),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
      ]).catch((e) => console.warn('Firebase cloud upload notice:', e));
    } catch (e) {
      console.warn('Firebase cloud upload notice:', e);
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

  // Normalized 10-digit national number equality
  const n1 = normalizePhoneNumber(p1);
  const n2 = normalizePhoneNumber(p2);

  return !!(n1 && n2 && n1 === n2);
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
  if (local) return local;
  try {
    const cloudList = await Promise.race([
      syncCloudRegistrations(),
      new Promise<Registration[]>((resolve) => setTimeout(() => resolve([]), 2500))
    ]);
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanEmail && !cleanPhone) return undefined;
    return cloudList.find((r) => {
      if (cleanEmail && r.email && r.email.trim().toLowerCase() === cleanEmail) return true;
      if (cleanPhone && r.phone && isPhoneMatch(r.phone, cleanPhone)) return true;
      return false;
    });
  } catch {
    return undefined;
  }
};

export const isUtrAlreadyUsed = (utr: string, excludeId?: string): boolean => {
  if (!utr || utr.trim().length < 6) return false;
  const cleanUtr = utr.trim().toLowerCase();
  const list = getRegistrations();
  return list.some((r) => r.paymentUtr && r.paymentUtr.trim().toLowerCase() === cleanUtr && r.id !== excludeId);
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


export const approveIdCard = async (id: string): Promise<Registration | null> => {
  const allCurrent = await syncCloudRegistrations();
  const target = allCurrent.find((r) => r.id === id || r.id.trim().toLowerCase() === id.trim().toLowerCase());
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

    if (isFirebaseConfigured()) {
      await saveRegistrationToFirebase(updatedRecord);
    }
    if (isSupabaseConfigured()) {
      await saveRegistrationToSupabase(updatedRecord);
    }
    return updatedRecord;
  }
  return null;
};

export const submitPaymentForRegistration = async (
  id: string, 
  utr: string, 
  screenshotUrl: string
): Promise<Registration | null> => {
  const allCurrent = await syncCloudRegistrations();
  const target = allCurrent.find((r) => r.id === id || r.id.trim().toLowerCase() === id.trim().toLowerCase());
  if (target) {
    let finalPayUrl = screenshotUrl;
    if (isSupabaseConfigured() && screenshotUrl.startsWith('data:image')) {
      try {
        const uploaded = await uploadImageToSupabase(screenshotUrl, `pay_${id}`);
        if (uploaded) finalPayUrl = uploaded;
      } catch (e) {
        console.warn('Supabase upload notice:', e);
      }
    }

    const updatedRecord: Registration = {
      ...target,
      paymentUtr: utr,
      paymentScreenshotUrl: finalPayUrl,
      paymentStatus: 'Pending',
      approvalStatus: 'Payment_Pending',
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

    if (isFirebaseConfigured()) {
      await saveRegistrationToFirebase(updatedRecord);
    }
    if (isSupabaseConfigured()) {
      await saveRegistrationToSupabase(updatedRecord);
    }
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
  const allCurrent = await syncCloudRegistrations();
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

  if (isFirebaseConfigured()) {
    await saveRegistrationToFirebase(vipRecord);
  }
  if (isSupabaseConfigured()) {
    await saveRegistrationToSupabase(vipRecord);
  }

  return vipRecord;
};

export const convertToOfficialVip = async (id: string): Promise<Registration | null> => {
  const allCurrent = await syncCloudRegistrations();
  const target = allCurrent.find((r) => r.id === id || r.id.trim().toLowerCase() === id.trim().toLowerCase());
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

    if (isFirebaseConfigured()) {
      await saveRegistrationToFirebase(updatedRecord);
    }
    if (isSupabaseConfigured()) {
      await saveRegistrationToSupabase(updatedRecord);
    }
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

    if (isFirebaseConfigured()) {
      await deleteRegistrationFromFirebase(id);
    }

    if (isSupabaseConfigured()) {
      await deleteRegistrationFromSupabase(id);
    }
    return true;
  } catch (e) {
    console.error('Error deleting registration:', e);
    return false;
  }
};

export const approveRegistration = async (id: string): Promise<Registration | null> => {
  const allCurrent = await syncCloudRegistrations();
  const target = allCurrent.find((r) => r.id === id || r.id.trim().toLowerCase() === id.trim().toLowerCase());
  if (target) {
    const updatedRecord: Registration = {
      ...target,
      approvalStatus: 'Approved',
      paymentStatus: 'Verified',
      approvedAt: new Date().toLocaleDateString('en-US', {
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

    if (isFirebaseConfigured()) {
      await saveRegistrationToFirebase(updatedRecord);
    }
    if (isSupabaseConfigured()) {
      await saveRegistrationToSupabase(updatedRecord);
    }
    return updatedRecord;
  }
  return null;
};

export const rejectRegistration = async (id: string, reason: string): Promise<Registration | null> => {
  const allCurrent = await syncCloudRegistrations();
  const target = allCurrent.find((r) => r.id === id || r.id.trim().toLowerCase() === id.trim().toLowerCase());
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

    if (isFirebaseConfigured()) {
      await saveRegistrationToFirebase(updatedRecord);
    }
    if (isSupabaseConfigured()) {
      await saveRegistrationToSupabase(updatedRecord);
    }
    return updatedRecord;
  }
  return null;
};

export type ScanResultStatus = 'success' | 'already_reported' | 'not_approved' | 'not_found';

export interface ScanResult {
  status: ScanResultStatus;
  registration?: Registration;
  message: string;
  timestamp?: string;
}

export const markAsReportedAsync = async (query: string): Promise<ScanResult> => {
  try {
    await syncCloudRegistrations();
  } catch (_) {}
  return markAsReported(query);
};

export const markAsReported = (query: string): ScanResult => {
  const registrations = getRegistrations();
  let q = query.trim().toLowerCase();
  
  // Extract KRP token ID using Regex (e.g. handles "KRP -995318", "TOKEN : KRP-995318", etc.)
  const krpMatch = query.match(/krp\s*[-_]?\s*(\d+)/i);
  let targetId = '';
  if (krpMatch) {
    targetId = `KRP-${krpMatch[1]}`;
  }

  // Extract token if code contains "TOKEN:" keyword
  if (!targetId && q.includes('token')) {
    const parts = q.split('|');
    const tokenPart = parts.find((p) => p.includes('token'));
    if (tokenPart) {
      const splitColon = tokenPart.split(':');
      if (splitColon.length > 1) {
        q = splitColon[1].trim().toLowerCase();
      }
    }
  }

  const cleanQueryAlphaNum = q.replace(/[^a-z0-9]/g, '');

  const index = registrations.findIndex(
    (r) => {
      const cleanIdAlphaNum = r.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        (targetId && r.id.toLowerCase() === targetId.toLowerCase()) ||
        r.id.toLowerCase() === q ||
        r.email.toLowerCase() === q ||
        isPhoneMatch(r.phone, q) ||
        r.paymentUtr === q ||
        (cleanIdAlphaNum && cleanQueryAlphaNum.includes(cleanIdAlphaNum))
      );
    }
  );

  if (index === -1) {
    return {
      status: 'not_found',
      message: `Invalid Pass QR Code / Registration ID: "${query}"`,
    };
  }

  const student = registrations[index];

  // 1. If application was explicitly REJECTED by Admin, block entry
  if (student.approvalStatus === 'Rejected') {
    return {
      status: 'not_approved',
      registration: student,
      message: `ACCESS DENIED: Application for ${student.fullName} (${student.id}) was REJECTED by Admin. Reason: ${student.rejectionReason || 'Verification failed.'}`,
    };
  }

  const isVip = student.approvalStatus === 'VIP_Pending' || student.approvalStatus === 'VIP' || student.ticketType === 'VIP Pass';

  // 2. Check if student has submitted payment (UTR, Payment Screenshot, or Payment_Pending / Approved / VIP status)
  const hasSubmittedPayment = isVip || !!(
    (student.paymentUtr && student.paymentUtr.trim()) ||
    (student.paymentScreenshotUrl && student.paymentScreenshotUrl.trim()) ||
    student.approvalStatus === 'Approved' ||
    student.approvalStatus === 'Payment_Pending'
  );

  if (!hasSubmittedPayment) {
    return {
      status: 'not_approved',
      registration: student,
      message: `ACCESS DENIED: ${student.fullName} (${student.id}) HAS NOT PAID the pass fee (No UTR or Payment Screenshot submitted). Collect fee at gate!`,
    };
  }

  // If pass was already checked-in at gate earlier
  if (student.isReported) {
    return {
      status: 'already_reported',
      registration: student,
      timestamp: student.reportedAt,
      message: `DUPLICATE SCAN ALERT: ${isVip ? '👑 VIP ' : ''}${student.fullName} (${student.id}) ALREADY REPORTED at gate on ${student.reportedAt || 'earlier today'}.`,
    };
  }

  const nowString = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Automatically approve pass upon gate scan (if not already approved/VIP) & mark as Reported
  if (!isVip) {
    registrations[index].approvalStatus = 'Approved';
  }
  registrations[index].paymentStatus = 'Verified';
  if (!registrations[index].approvedAt) {
    registrations[index].approvedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  registrations[index].isReported = true;
  registrations[index].reportedAt = nowString;
  registrations[index].updatedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  syncToIndexedDB(registrations[index]);
  if (isFirebaseConfigured()) {
    saveRegistrationToFirebase(registrations[index]);
  }
  if (isSupabaseConfigured()) {
    saveRegistrationToSupabase(registrations[index]);
  }

  return {
    status: 'success',
    registration: registrations[index],
    timestamp: nowString,
    message: isVip
      ? `ENTRY GRANTED: 👑 VIP Guest ${student.fullName} (${student.id}) successfully VALIDATED & MARKED AS REPORTED at Campus Gate! VIP Entry & Onasadya Token Validated.`
      : `ENTRY GRANTED: ${student.fullName} (${student.id}) successfully APPROVED & MARKED AS REPORTED at Campus Gate! Onasadya Token Validated.`,
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

  // 6. Name Match (only for pure text names, e.g. "Albin", "Ashin Gopi", "Sniya")
  if (rName && cleanQ.length >= 3) {
    const nameWords = rName.split(/\s+/);
    if (rName === cleanQ || rName.startsWith(cleanQ) || nameWords.some(w => w === cleanQ)) {
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
  const q = query.trim().toLowerCase();
  
  const localList = getRegistrations();
  const localMatch = localList.find((r) => matchRecord(r, q));

  try {
    const cloudList = await syncCloudRegistrations();
    const cloudMatch = cloudList.find((r) => matchRecord(r, q));
    if (cloudMatch) return cloudMatch;
  } catch (e) {
    console.warn('Cloud search notice:', e);
  }

  if (localMatch) return localMatch;

  return INITIAL_REGISTRATIONS.find((r) => matchRecord(r, q));
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
