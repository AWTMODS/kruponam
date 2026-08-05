import { getAssetUrl } from '../utils/assetPath';

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
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  submittedAt: string;
  approvedAt?: string;
  isReported?: boolean;
  reportedAt?: string;
}

const STORAGE_KEY = 'kruponam_registrations_v2';
const DB_NAME = 'KruponamDB_v1';
const STORE_NAME = 'registrations_store';

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
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const syncToIndexedDB = async (item: Registration): Promise<void> => {
  try {
    const db = await openIDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
  } catch (e) {
    console.warn('IndexedDB sync notice:', e);
  }
};

export const loadAllFromIndexedDB = async (): Promise<Registration[]> => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return [];
  }
};

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'KRP-849201',
    fullName: 'Anand Nair',
    email: 'anand.nair@example.com',
    phone: '9876543210',
    department: 'BCA',
    section: 'Section A',
    year: '2nd Year',
    gender: 'Male',
    ticketType: 'Student Pass',
    idCardUrl: getAssetUrl('images/hero_illustration.png'),
    paymentScreenshotUrl: getAssetUrl('images/pookalam.png'),
    paymentAmount: 700,
    paymentStatus: 'Verified',
    paymentUtr: '320918239012',
    approvalStatus: 'Approved',
    submittedAt: 'Jul 29, 2026',
    approvedAt: 'Jul 30, 2026',
    isReported: true,
    reportedAt: 'Jul 30, 2026, 08:30 AM',
  },
  {
    id: 'KRP-712394',
    fullName: 'Priya Rajendran',
    email: 'priya.r@example.com',
    phone: '9845123789',
    department: 'B.Com',
    section: 'Section B',
    year: '3rd Year',
    gender: 'Female',
    ticketType: 'VIP Cultural Pass',
    idCardUrl: getAssetUrl('images/pookalam.png'),
    paymentScreenshotUrl: getAssetUrl('images/hero_illustration.png'),
    paymentAmount: 700,
    paymentStatus: 'Verified',
    paymentUtr: '482019384912',
    approvalStatus: 'Approved',
    submittedAt: 'Jul 30, 2026',
    approvedAt: 'Jul 30, 2026',
    isReported: false,
  },
  {
    id: 'KRP-602938',
    fullName: 'Rohan Sharma',
    email: 'rohan.s@example.com',
    phone: '9123456780',
    department: 'BBA',
    section: 'Section A',
    year: '1st Year',
    gender: 'Male',
    ticketType: 'Student Pass',
    idCardUrl: getAssetUrl('images/onasadya.png'),
    paymentScreenshotUrl: getAssetUrl('images/pookalam.png'),
    paymentAmount: 700,
    paymentStatus: 'Verified',
    paymentUtr: '981204918234',
    approvalStatus: 'Pending',
    submittedAt: 'Jul 30, 2026',
    isReported: false,
  },
  {
    id: 'KRP-519283',
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
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
    // Asynchronously seed IndexedDB
    INITIAL_REGISTRATIONS.forEach(syncToIndexedDB);
    return INITIAL_REGISTRATIONS;
  }
  try {
    const list = JSON.parse(data);
    return list.map((item: any) => ({
      ...item,
      section: item.section || 'Section A',
    }));
  } catch (e) {
    return INITIAL_REGISTRATIONS;
  }
};

export const saveRegistration = (registration: Registration): boolean => {
  try {
    const registrations = getRegistrations();
    const updated = [registration, ...registrations];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Also save into IndexedDB for high-capacity preservation (hundreds of MBs)
    syncToIndexedDB(registration);

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

export const approveRegistration = (id: string): Registration | null => {
  const registrations = getRegistrations();
  const index = registrations.findIndex((r) => r.id === id);
  if (index !== -1) {
    registrations[index].approvalStatus = 'Approved';
    registrations[index].approvedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
    syncToIndexedDB(registrations[index]);
    return registrations[index];
  }
  return null;
};

export const rejectRegistration = (id: string, reason: string): Registration | null => {
  const registrations = getRegistrations();
  const index = registrations.findIndex((r) => r.id === id);
  if (index !== -1) {
    registrations[index].approvalStatus = 'Rejected';
    registrations[index].rejectionReason = reason;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
    syncToIndexedDB(registrations[index]);
    return registrations[index];
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

export const markAsReported = (query: string): ScanResult => {
  const registrations = getRegistrations();
  const q = query.trim().toLowerCase();
  
  const index = registrations.findIndex(
    (r) =>
      r.id.toLowerCase() === q ||
      r.email.toLowerCase() === q ||
      r.phone === q ||
      r.paymentUtr === q
  );

  if (index === -1) {
    return {
      status: 'not_found',
      message: `Invalid Pass QR Code / Registration ID: "${query}"`,
    };
  }

  const student = registrations[index];

  if (student.approvalStatus !== 'Approved') {
    return {
      status: 'not_approved',
      registration: student,
      message: `ACCESS DENIED: Application for ${student.fullName} (${student.id}) is ${student.approvalStatus.toUpperCase()} by Admin. Cannot report unapproved pass!`,
    };
  }

  if (student.isReported) {
    return {
      status: 'already_reported',
      registration: student,
      timestamp: student.reportedAt,
      message: `DUPLICATE SCAN ALERT: ${student.fullName} (${student.id}) ALREADY REPORTED at gate on ${student.reportedAt || 'earlier today'}.`,
    };
  }

  const nowString = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  registrations[index].isReported = true;
  registrations[index].reportedAt = nowString;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  syncToIndexedDB(registrations[index]);

  return {
    status: 'success',
    registration: registrations[index],
    timestamp: nowString,
    message: `ENTRY GRANTED: ${student.fullName} (${student.id}) successfully MARKED AS REPORTED at Campus Gate! Onasadya Token Validated.`,
  };
};

export const findRegistration = (query: string): Registration | undefined => {
  const registrations = getRegistrations();
  const q = query.trim().toLowerCase();
  return registrations.find(
    (r) =>
      r.id.toLowerCase() === q ||
      r.email.toLowerCase() === q ||
      r.phone === q ||
      r.paymentUtr === q
  );
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
