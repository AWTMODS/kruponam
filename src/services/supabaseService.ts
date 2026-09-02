import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Registration } from './registrationService';

const SUPABASE_URL_KEY = 'kruponam_supabase_url';
const SUPABASE_ANON_KEY = 'kruponam_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://ummggndyxmwenknhhbsr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtbWdnbnR5eG13ZW5rbmhoYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTQwMjksImV4cCI6MjEwMTU5MDAyOX0.e0fkp2uUK6na-sjtIjUY56cIZMB26ipsKL-qtOSaq9U';

export const getSupabaseCredentials = (): { url: string; key: string } => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || '';
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY) || '';

  return {
    url: storedUrl || envUrl || DEFAULT_SUPABASE_URL,
    key: storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
};

export const saveSupabaseCredentials = (url: string, key: string): void => {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, key.trim());
  supabaseInstance = null; // reset client
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseClient() !== null;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase URL or Anon Key is missing.' };
  }

  try {
    const { error } = await client.from('registrations').select('id').limit(1);
    if (error) {
      if (error.message.includes('Invalid API key') || error.code === 'PGRST301' || error.message.includes('JWT')) {
        return { success: false, message: 'Invalid Supabase API Key. Please update VITE_SUPABASE_ANON_KEY in project settings or Admin Dashboard.' };
      }
      if (error.message.includes('relation "public.registrations" does not exist') || error.code === '42P01') {
        return { success: false, message: 'Table "registrations" does not exist in Supabase SQL database yet.' };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Supabase Cloud Database connected and operational!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection error' };
  }
};

// ── Image Storage Helper (Free Supabase Storage) ────────────────────────
export const uploadImageToSupabase = async (
  file: File | string,
  fileNamePrefix: string = 'img'
): Promise<string | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let fileToUpload: File | Blob;
    let extension = 'png';

    if (typeof file === 'string') {
      if (!file.startsWith('data:image')) return file; // Already a URL
      const response = await fetch(file);
      fileToUpload = await response.blob();
      if (file.includes('data:image/jpeg') || file.includes('data:image/jpg')) {
        extension = 'jpg';
      }
    } else {
      fileToUpload = file;
      extension = file.name.split('.').pop() || 'png';
    }

    const uniquePath = `uploads/${fileNamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    
    // Upload to 'kruponam-uploads' bucket
    const { data, error } = await client.storage
      .from('kruponam-uploads')
      .upload(uniquePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = client.storage
      .from('kruponam-uploads')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Image upload failed:', err);
    return null;
  }
};

// ── Database Operations (Free Supabase Postgres Table `registrations`) ──
export const fetchRegistrationsFromSupabase = async (): Promise<Registration[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let { data, error } = await client
      .from('registrations')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Supabase ordered query notice:', error.message);
      // Fallback query without ordering constraint to ensure data is retrieved
      const fallback = await client.from('registrations').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      fullName: row.full_name || row.fullName,
      email: row.email,
      phone: row.phone,
      department: row.department,
      section: row.section || 'Section A',
      year: row.year,
      gender: row.gender,
      ticketType: row.ticket_type || row.ticketType,
      idCardUrl: row.id_card_url || row.idCardUrl,
      paymentScreenshotUrl: row.payment_screenshot_url || row.paymentScreenshotUrl,
      paymentAmount: Number(row.payment_amount || row.paymentAmount || 700),
      paymentStatus: row.payment_status || row.paymentStatus || 'Pending',
      paymentUtr: row.payment_utr || row.paymentUtr || '',
      approvalStatus: row.approval_status || row.approvalStatus || 'Pending_ID_Approval',
      rejectionReason: row.rejection_reason || row.rejectionReason || '',
      submittedAt: row.submitted_at || row.submittedAt,
      approvedAt: row.approved_at || row.approvedAt,
      updatedAt: row.updated_at || row.updatedAt,
      isReported: Boolean(row.is_reported || row.isReported),
      reportedAt: row.reported_at || row.reportedAt,
    }));
  } catch (err) {
    console.error('Supabase query exception:', err);
    return null;
  }
};

/**
 * Superfast targeted single-record search in Supabase (takes ~50-200ms)
 */
export const findRegistrationInSupabase = async (queryStr: string): Promise<Registration | null> => {
  const client = getSupabaseClient();
  if (!client || !queryStr || !queryStr.trim()) return null;

  const q = queryStr.trim();
  const lowerQ = q.toLowerCase();

  try {
    // Search by ID, Email, Phone, or Name
    const digitsOnly = lowerQ.replace(/\D/g, '');
    let filterString = `id.ilike.%${q}%,email.ilike.%${lowerQ}%,full_name.ilike.%${q}%`;
    if (digitsOnly.length >= 6) {
      filterString += `,phone.ilike.%${digitsOnly}%`;
    }

    const { data, error } = await client
      .from('registrations')
      .select('*')
      .or(filterString)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      id: row.id,
      fullName: row.full_name || row.fullName,
      email: row.email,
      phone: row.phone,
      department: row.department,
      section: row.section || 'Section A',
      year: row.year,
      gender: row.gender,
      ticketType: row.ticket_type || row.ticketType,
      idCardUrl: row.id_card_url || row.idCardUrl,
      paymentScreenshotUrl: row.payment_screenshot_url || row.paymentScreenshotUrl,
      paymentAmount: Number(row.payment_amount || row.paymentAmount || 700),
      paymentStatus: row.payment_status || row.paymentStatus || 'Pending',
      paymentUtr: row.payment_utr || row.paymentUtr || '',
      approvalStatus: row.approval_status || row.approvalStatus || 'Pending_ID_Approval',
      rejectionReason: row.rejection_reason || row.rejectionReason || '',
      submittedAt: row.submitted_at || row.submittedAt,
      approvedAt: row.approved_at || row.approvedAt,
      updatedAt: row.updated_at || row.updatedAt,
      isReported: Boolean(row.is_reported || row.isReported),
      reportedAt: row.reported_at || row.reportedAt,
    };
  } catch (err) {
    console.warn('Supabase fast lookup notice:', err);
    return null;
  }
};

const compressBase64ForPostgres = (base64Str: string, maxWidth = 500, quality = 0.4): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

export const saveRegistrationToSupabase = async (reg: Registration): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rowData = {
      id: reg.id,
      full_name: reg.fullName,
      email: reg.email,
      phone: reg.phone,
      department: reg.department,
      section: reg.section || 'Section A',
      year: reg.year,
      gender: reg.gender || 'Other',
      ticket_type: reg.ticketType || 'General Pass',
      id_card_url: reg.idCardUrl || '',
      payment_screenshot_url: reg.paymentScreenshotUrl || '',
      payment_amount: reg.paymentAmount || 700,
      payment_status: reg.paymentStatus || 'Pending',
      payment_utr: reg.paymentUtr || '',
      approval_status: reg.approvalStatus || 'Pending_ID_Approval',
      rejection_reason: reg.rejectionReason || '',
      submitted_at: reg.submittedAt || new Date().toLocaleDateString('en-US'),
      approved_at: reg.approvedAt || null,
      updated_at: reg.updatedAt || new Date().toISOString(),
      is_reported: reg.isReported || false,
      reported_at: reg.reportedAt || null,
    };

    const { error } = await client.from('registrations').upsert(rowData, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase save error:', error.message);
      // Fallback: If payload size failed due to large base64 strings, compress base64 images down to ~30-40KB so photo is preserved in Supabase Postgres row
      if (
        (reg.idCardUrl && reg.idCardUrl.startsWith('data:image')) || 
        (reg.paymentScreenshotUrl && reg.paymentScreenshotUrl.startsWith('data:image'))
      ) {
        const compressedId = (reg.idCardUrl && reg.idCardUrl.startsWith('data:image'))
          ? await compressBase64ForPostgres(reg.idCardUrl)
          : reg.idCardUrl;
        const compressedPay = (reg.paymentScreenshotUrl && reg.paymentScreenshotUrl.startsWith('data:image'))
          ? await compressBase64ForPostgres(reg.paymentScreenshotUrl)
          : reg.paymentScreenshotUrl;

        const fallbackData = {
          ...rowData,
          id_card_url: compressedId,
          payment_screenshot_url: compressedPay,
        };
        const { error: fallbackErr } = await client.from('registrations').upsert(fallbackData, { onConflict: 'id' });
        if (!fallbackErr) return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase save exception:', err);
    return false;
  }
};

export const deleteRegistrationFromSupabase = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('registrations').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return false;
  }
};

// SQL Setup script generator for user to copy-paste into Supabase SQL Editor
export const SUPABASE_SQL_SETUP_SCRIPT = `-- 🌸 KRUPONAM 2026 — Free Supabase Database & Image Storage Setup
-- Copy and run this script inside your Supabase Dashboard -> SQL Editor!

-- 1. Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    section TEXT DEFAULT 'Section A',
    year TEXT NOT NULL,
    gender TEXT,
    ticket_type TEXT NOT NULL,
    id_card_url TEXT,
    payment_screenshot_url TEXT,
    payment_amount NUMERIC DEFAULT 700,
    payment_status TEXT DEFAULT 'Verified',
    payment_utr TEXT NOT NULL,
    approval_status TEXT DEFAULT 'Pending',
    rejection_reason TEXT,
    submitted_at TEXT NOT NULL,
    approved_at TEXT,
    is_reported BOOLEAN DEFAULT FALSE,
    reported_at TEXT
);

-- 2. Disable Row Level Security (RLS) or enable public read/write for event registration
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;

-- 3. Create Storage Bucket for ID Cards & Payment Screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kruponam-uploads', 'kruponam-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable public upload & access policy for Storage Bucket
CREATE POLICY "Public Uploads Access" ON storage.objects
    FOR ALL USING (bucket_id = 'kruponam-uploads') WITH CHECK (bucket_id = 'kruponam-uploads');
`;
