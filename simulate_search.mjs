import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCG3Sf5ew8iNGSbFtjRRchOoWFj8DwWeew",
  authDomain: "zeach-74490.firebaseapp.com",
  projectId: "zeach-74490",
  storageBucket: "zeach-74490.firebasestorage.app",
  messagingSenderId: "150983027907",
  appId: "1:150983027907:web:ff0ab0fbbf5f7afcbd4676",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizeApprovalStatus = (rawStatus) => {
  if (!rawStatus) return 'Pending_ID_Approval';
  const clean = String(rawStatus).trim().toLowerCase().replace(/[\s-_]+/g, '_');
  if (clean.includes('vip')) return clean.includes('pending') ? 'VIP_Pending' : 'VIP';
  if (clean === 'approved' || clean === 'verified' || clean === 'pass_approved' || clean === 'completed') return 'Approved';
  if (clean === 'id_approved' || clean === 'idapproved' || clean === 'id_verified' || clean === 'pay_unlocked' || clean === 'unlocked') return 'ID_Approved';
  if (clean === 'payment_pending' || clean === 'pay_pending' || clean === 'payment_submitted' || clean === 'utr_submitted') return 'Payment_Pending';
  if (clean === 'rejected' || clean === 'declined') return 'Rejected';
  return 'Pending_ID_Approval';
};

const mapFirebaseDoc = (data, docId) => {
  const normStatus = normalizeApprovalStatus(data?.approvalStatus || data?.approval_status || data?.status);
  const isApproved = normStatus === 'Approved' || normStatus === 'VIP' || normStatus === 'VIP_Pending';
  return {
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
    paymentAmount: data?.paymentAmount !== undefined ? Number(data.paymentAmount) : (isApproved ? 0 : 700),
    paymentStatus: data?.paymentStatus || (isApproved ? 'Verified' : 'Pending'),
    paymentUtr: data?.paymentUtr || data?.utr || '',
    approvalStatus: normStatus,
    rejectionReason: data?.rejectionReason || '',
    submittedAt: data?.submittedAt || data?.createdAt || '',
    approvedAt: data?.approvedAt || '',
    updatedAt: data?.updatedAt || '',
    isReported: Boolean(data?.isReported || data?.checkedIn),
    reportedAt: data?.reportedAt || '',
  };
};

async function simulateFindRegistrationInFirebase(queryStr) {
  const q = queryStr.trim();
  const lowerQ = q.toLowerCase();
  const upperQ = q.toUpperCase();
  const digitsOnly = lowerQ.replace(/\D/g, '');

  if (digitsOnly.length >= 7 && !lowerQ.includes('@') && !upperQ.startsWith('KRP-')) {
    const last10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    const phoneVariations = Array.from(new Set([
      last10,
      `+91${last10}`,
      `+91 ${last10}`,
      `0${last10}`,
      digitsOnly,
      q,
    ])).filter(Boolean);

    console.log('Searching phone in Firestore:', phoneVariations);
    try {
      const phoneQuery = query(collection(db, 'registrations'), where('phone', 'in', phoneVariations.slice(0, 10)), limit(1));
      const phoneSnap = await getDocs(phoneQuery);
      console.log('Phone snap empty?', phoneSnap.empty);
      if (!phoneSnap.empty) {
        return mapFirebaseDoc(phoneSnap.docs[0].data(), phoneSnap.docs[0].id);
      }
    } catch (e) {
      console.warn('Phone SDK error:', e);
    }
  }
  return null;
}

async function run() {
  const res = await simulateFindRegistrationInFirebase('6238290259');
  console.log('Result:', res);
}
run();
