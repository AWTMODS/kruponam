import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  limit,
  onSnapshot, 
  deleteDoc, 
  Firestore 
} from 'firebase/firestore';
import type { Registration } from './registrationService';
import { downscaleBase64 } from '../utils/imageCompressor';

const FIREBASE_CONFIG_KEY = 'kruponam_firebase_config_v1';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCG3Sf5ew8iNGSbFtjRRchOoWFj8DwWeew",
  authDomain: "zeach-74490.firebaseapp.com",
  projectId: "zeach-74490",
  storageBucket: "zeach-74490.firebasestorage.app",
  messagingSenderId: "150983027907",
  appId: "1:150983027907:web:ff0ab0fbbf5f7afcbd4676",
};

export const getFirebaseConfig = (): FirebaseConfig | null => {
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';

  const storedRaw = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {}
  }

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '150983027907',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:150983027907:web:ff0ab0fbbf5f7afcbd4676',
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config: FirebaseConfig): void => {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
  dbInstance = null;
};

export const clearFirebaseConfig = (): void => {
  localStorage.removeItem(FIREBASE_CONFIG_KEY);
  dbInstance = null;
};

let dbInstance: Firestore | null = null;

export const getFirebaseDb = (): Firestore | null => {
  if (dbInstance) return dbInstance;
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (e) {
    console.warn('Firebase initialization notice:', e);
    return null;
  }
};

export const isFirebaseConfigured = (): boolean => {
  return getFirebaseDb() !== null;
};

export const testFirebaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, message: 'Firebase configuration missing. Please add Firebase Web App Config.' };
  }

  try {
    await getDocs(collection(db, 'registrations'));
    return { success: true, message: '🔥 Firebase Firestore Database connected and operational!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Firebase connection error' };
  }
};

// ── Realtime Operations for Registrations ──────────────────────────────
export const saveRegistrationToFirebase = async (reg: Registration): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    // Compress base64 images if they exceed safe Firestore document size (Firestore doc limit = 1MB)
    let safeIdCard = reg.idCardUrl || '';
    let safePayment = reg.paymentScreenshotUrl || '';

    if (safeIdCard.startsWith('data:image') && safeIdCard.length > 250 * 1024) {
      safeIdCard = await downscaleBase64(safeIdCard, 180 * 1024);
    }
    if (safePayment.startsWith('data:image') && safePayment.length > 250 * 1024) {
      safePayment = await downscaleBase64(safePayment, 180 * 1024);
    }

    const cleanReg: Record<string, any> = {
      id: reg.id,
      fullName: reg.fullName || '',
      email: reg.email || '',
      phone: reg.phone || '',
      department: reg.department || '',
      section: reg.section || 'Section A',
      year: reg.year || '1st Year',
      gender: reg.gender || 'Other',
      ticketType: reg.ticketType || 'General Pass',
      idCardUrl: safeIdCard,
      paymentScreenshotUrl: safePayment,
      paymentAmount: reg.paymentAmount !== undefined ? Number(reg.paymentAmount) : (reg.ticketType === 'VIP Pass' || reg.approvalStatus === 'VIP' || reg.approvalStatus === 'VIP_Pending' ? 0 : 700),
      paymentStatus: reg.paymentStatus || (reg.approvalStatus === 'Approved' || reg.approvalStatus === 'VIP' || reg.approvalStatus === 'VIP_Pending' ? 'Verified' : 'Pending'),
      paymentUtr: reg.paymentUtr || '',
      approvalStatus: reg.approvalStatus || 'Pending_ID_Approval',
      approval_status: reg.approvalStatus || 'Pending_ID_Approval',
      status: reg.approvalStatus || 'Pending_ID_Approval',
      rejectionReason: reg.rejectionReason || '',
      submittedAt: reg.submittedAt || new Date().toLocaleDateString('en-US'),
      approvedAt: reg.approvedAt || '',
      updatedAt: reg.updatedAt || new Date().toISOString(),
      isReported: Boolean(reg.isReported),
      reportedAt: reg.reportedAt || '',
    };

    const docRef = doc(db, 'registrations', reg.id);
    await setDoc(docRef, cleanReg, { merge: true });
    return true;
  } catch (err) {
    console.error('Firebase save exception:', err);
    return false;
  }
};

const mapFirebaseDoc = (data: any, docId: string): Registration => ({
  id: String(data?.id || docId),
  fullName: data?.fullName || data?.name || data?.studentName || '',
  email: data?.email || '',
  phone: data?.phone || data?.mobile || data?.phoneNumber || '',
  department: data?.department || data?.dept || '',
  section: data?.section || 'Section A',
  year: data?.year || '1st Year',
  gender: data?.gender || 'Other',
  ticketType: data?.ticketType || 'General Pass',
  idCardUrl: data?.idCardUrl || data?.idCard || '',
  paymentScreenshotUrl: data?.paymentScreenshotUrl || data?.paymentScreenshot || '',
  paymentAmount: data?.paymentAmount !== undefined ? Number(data.paymentAmount) : (data?.ticketType === 'VIP Pass' || data?.approvalStatus === 'VIP' || data?.approvalStatus === 'VIP_Pending' ? 0 : 700),
  paymentStatus: data?.paymentStatus || (data?.status === 'Approved' || data?.status === 'VIP' || data?.status === 'VIP_Pending' || data?.approval_status === 'Approved' || data?.approvalStatus === 'Approved' ? 'Verified' : 'Pending'),
  paymentUtr: data?.paymentUtr || data?.utr || '',
  approvalStatus: data?.approvalStatus || data?.approval_status || data?.status || 'Pending_ID_Approval',
  rejectionReason: data?.rejectionReason || '',
  submittedAt: data?.submittedAt || data?.createdAt || '',
  approvedAt: data?.approvedAt || '',
  updatedAt: data?.updatedAt || '',
  isReported: Boolean(data?.isReported || data?.checkedIn),
  reportedAt: data?.reportedAt || '',
});

/**
 * Superfast targeted single-record search directly in Firebase (takes ~50-200ms)
 */
export const findRegistrationInFirebase = async (queryStr: string): Promise<Registration | null> => {
  const db = getFirebaseDb();
  if (!db || !queryStr || !queryStr.trim()) return null;

  const q = queryStr.trim();
  const lowerQ = q.toLowerCase();
  const upperQ = q.toUpperCase();
  const digitsOnly = lowerQ.replace(/\D/g, '');

  try {
    // 1. Direct document key lookup by ID (e.g. KRP-123456) - 10-30ms!
    const docRef = doc(db, 'registrations', upperQ);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return mapFirebaseDoc(docSnap.data(), docSnap.id);
    }

    // Check if input is formatted like numeric ID (e.g. 953085 or krp 953085)
    const krpMatch = q.match(/krp\s*[-_]?\s*(\d+)/i) || (digitsOnly.length === 6 ? [null, digitsOnly] : null);
    if (krpMatch && krpMatch[1]) {
      const formattedKrp = `KRP-${krpMatch[1]}`;
      const krpSnap = await getDoc(doc(db, 'registrations', formattedKrp));
      if (krpSnap.exists()) {
        return mapFirebaseDoc(krpSnap.data(), krpSnap.id);
      }
    }

    // Also check as-is ID
    if (upperQ !== q) {
      const altSnap = await getDoc(doc(db, 'registrations', q));
      if (altSnap.exists()) {
        return mapFirebaseDoc(altSnap.data(), altSnap.id);
      }
    }

    // 2. Query by email
    if (lowerQ.includes('@')) {
      const emailQuery = query(collection(db, 'registrations'), where('email', '==', lowerQ), limit(1));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        const first = emailSnap.docs[0];
        return mapFirebaseDoc(first.data(), first.id);
      }

      // Also try as-is email
      if (lowerQ !== q) {
        const rawEmailQuery = query(collection(db, 'registrations'), where('email', '==', q), limit(1));
        const rawEmailSnap = await getDocs(rawEmailQuery);
        if (!rawEmailSnap.empty) {
          const first = rawEmailSnap.docs[0];
          return mapFirebaseDoc(first.data(), first.id);
        }
      }
    }

    // 3. Query by phone number
    if (digitsOnly.length >= 7) {
      const last10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
      const phoneQuery = query(collection(db, 'registrations'), where('phone', '==', last10), limit(1));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        const first = phoneSnap.docs[0];
        return mapFirebaseDoc(first.data(), first.id);
      }

      // Also try with original q
      const altPhoneQuery = query(collection(db, 'registrations'), where('phone', '==', q), limit(1));
      const altPhoneSnap = await getDocs(altPhoneQuery);
      if (!altPhoneSnap.empty) {
        const first = altPhoneSnap.docs[0];
        return mapFirebaseDoc(first.data(), first.id);
      }
    }

    return null;
  } catch (err) {
    console.warn('Firebase fast lookup notice:', err);
    return null;
  }
};

export const fetchRegistrationsFromFirebase = async (): Promise<Registration[] | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const querySnapshot = await getDocs(collection(db, 'registrations'));
    const list: Registration[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = data?.id || docSnap.id;
      if (data && docId) {
        list.push({
          id: String(docId),
          fullName: data.fullName || data.name || data.studentName || '',
          email: data.email || '',
          phone: data.phone || data.mobile || data.phoneNumber || '',
          department: data.department || data.dept || '',
          section: data.section || 'Section A',
          year: data.year || '1st Year',
          gender: data.gender || 'Other',
          ticketType: data.ticketType || 'General Pass',
          idCardUrl: data.idCardUrl || data.idCard || '',
          paymentScreenshotUrl: data.paymentScreenshotUrl || data.paymentScreenshot || '',
          paymentAmount: data.paymentAmount !== undefined ? Number(data.paymentAmount) : (data.ticketType === 'VIP Pass' || data.approvalStatus === 'VIP' || data.approvalStatus === 'VIP_Pending' ? 0 : 700),
          paymentStatus: data.paymentStatus || (data.status === 'Approved' || data.status === 'VIP' || data.status === 'VIP_Pending' ? 'Verified' : 'Pending'),
          paymentUtr: data.paymentUtr || data.utr || '',
          approvalStatus: data.approvalStatus || data.status || 'Pending_ID_Approval',
          rejectionReason: data.rejectionReason || '',
          submittedAt: data.submittedAt || data.createdAt || '',
          approvedAt: data.approvedAt || '',
          updatedAt: data.updatedAt || '',
          isReported: Boolean(data.isReported || data.checkedIn),
          reportedAt: data.reportedAt || '',
        });
      }
    });
    return list;
  } catch (err) {
    console.error('Firebase fetch exception:', err);
    return null;
  }
};

export const deleteRegistrationFromFirebase = async (id: string): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, 'registrations', id));
    return true;
  } catch (err) {
    console.error('Firebase delete exception:', err);
    return false;
  }
};

export const listenToFirebaseRegistrations = (
  onUpdate: (registrations: Registration[]) => void
): (() => void) | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const unsubscribe = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      const list: Registration[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = data?.id || docSnap.id;
        if (data && docId) {
          list.push({
            id: String(docId),
            fullName: data.fullName || data.name || data.studentName || '',
            email: data.email || '',
            phone: data.phone || data.mobile || data.phoneNumber || '',
            department: data.department || data.dept || '',
            section: data.section || 'Section A',
            year: data.year || '1st Year',
            gender: data.gender || 'Other',
            ticketType: data.ticketType || 'General Pass',
            idCardUrl: data.idCardUrl || data.idCard || '',
            paymentScreenshotUrl: data.paymentScreenshotUrl || data.paymentScreenshot || '',
            paymentAmount: data.paymentAmount !== undefined ? Number(data.paymentAmount) : (data.ticketType === 'VIP Pass' || data.approvalStatus === 'VIP' || data.approvalStatus === 'VIP_Pending' ? 0 : 700),
            paymentStatus: data.paymentStatus || (data.status === 'Approved' || data.status === 'VIP' || data.status === 'VIP_Pending' ? 'Verified' : 'Pending'),
            paymentUtr: data.paymentUtr || data.utr || '',
            approvalStatus: data.approvalStatus || data.status || 'Pending_ID_Approval',
            rejectionReason: data.rejectionReason || '',
            submittedAt: data.submittedAt || data.createdAt || '',
            approvedAt: data.approvedAt || '',
            updatedAt: data.updatedAt || '',
            isReported: Boolean(data.isReported || data.checkedIn),
            reportedAt: data.reportedAt || '',
          });
        }
      });
      onUpdate(list);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firebase snapshot listener error:', e);
    return null;
  }
};

// ── UPI Settings Sync ─────────────────────────────────────────────────────────
// Saves the currently active UPI slot to Firestore so all student devices
// always show the latest QR/UPI ID without needing a redeployment.

export const saveUpiSettingsToFirebase = async (payload: {
  upiId: string;
  merchantName: string;
  activeSlotIndex: number;
  updatedAt: string;
}): Promise<boolean> => {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, 'settings', 'upi'), payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firebase UPI settings save notice:', err);
    return false;
  }
};

export const fetchActiveUpiSlotFromFirebase = async (): Promise<{
  upiId: string;
  merchantName: string;
} | null> => {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'settings', 'upi'));
    if (snap.exists()) {
      const d = snap.data();
      return {
        upiId: d.upiId || '',
        merchantName: d.merchantName || '',
      };
    }
    return null;
  } catch (err) {
    console.warn('Firebase UPI settings fetch notice:', err);
    return null;
  }
};
