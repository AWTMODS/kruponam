import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  Firestore 
} from 'firebase/firestore';
import type { Registration } from './registrationService';

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
    const docRef = doc(db, 'registrations', reg.id);
    await setDoc(docRef, { ...reg }, { merge: true });
    return true;
  } catch (err) {
    console.error('Firebase save exception:', err);
    return false;
  }
};

export const fetchRegistrationsFromFirebase = async (): Promise<Registration[] | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const querySnapshot = await getDocs(collection(db, 'registrations'));
    const list: Registration[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Registration);
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
      snapshot.forEach((doc) => {
        list.push(doc.data() as Registration);
      });
      onUpdate(list);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Firebase snapshot listener error:', e);
    return null;
  }
};
