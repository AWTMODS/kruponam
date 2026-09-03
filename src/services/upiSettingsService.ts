// ── Multi-UPI Slot Settings Service ─────────────────────────────────────────
// Allows admin to configure multiple UPI IDs.
// When a slot reaches its maxPayments limit, it auto-rotates to the next slot.
// Students always see the currently active slot's UPI ID & QR code.

import { getSiteSettings } from './siteSettingsService';
import { saveUpiSettingsToFirebase } from './firebaseService';

// Push current active slot to Firestore so all student devices sync instantly
const pushActiveSlotToFirebase = (settings: MultiUpiSettings) => {
  const active = settings.slots[settings.activeSlotIndex] || settings.slots[0];
  if (!active) return;
  saveUpiSettingsToFirebase({
    upiId: active.upiId || '',
    merchantName: active.merchantName || '',
    qrImageDataUrl: active.qrImageDataUrl || null,
    activeSlotIndex: settings.activeSlotIndex,
    updatedAt: new Date().toISOString(),
  }).catch(() => {});
};

const STORAGE_KEY = 'kruponam_multi_upi_settings_v2';

export interface UpiSlot {
  id: string;
  label: string;            // e.g. "UPI Slot 1"
  upiId: string;            // e.g. "kruponam2026@upi"
  merchantName: string;
  qrImageDataUrl: string | null;
  maxPayments: number;      // how many payments before auto-rotate
  paymentCount: number;     // how many payments recorded to this slot
}

export interface MultiUpiSettings {
  slots: UpiSlot[];
  activeSlotIndex: number;  // index of currently active slot
}

// ── Default / Initial State ───────────────────────────────────────────────────
const DEFAULT_SETTINGS: MultiUpiSettings = {
  slots: [
    {
      id: 'slot-1',
      label: 'Merchant UPI Slot 1',
      upiId: 'q062769226@ybl',
      merchantName: 'Kruponam 2026 – Krupanidhi Degree College',
      qrImageDataUrl: '/images/merchant_qr.png',
      maxPayments: 999999,
      paymentCount: 0,
    },
  ],
  activeSlotIndex: 0,
};

let memoryCache: MultiUpiSettings | null = null;

// ── Getters & Setters ─────────────────────────────────────────────────────────
export const getMultiUpiSettings = (): MultiUpiSettings => {
  if (memoryCache && memoryCache.slots && memoryCache.slots.length > 0) {
    return memoryCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MultiUpiSettings;
      if (parsed.slots && parsed.slots.length > 0) {
        // Auto-update legacy placeholder upiId to new official merchant UPI ID
        parsed.slots = parsed.slots.map((s) => ({
          ...s,
          upiId: s.upiId === 'kruponam2026@upi' ? 'q062769226@ybl' : (s.upiId || 'q062769226@ybl'),
        }));
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (_) {}
  const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  memoryCache = defaults;
  return defaults;
};

export const saveMultiUpiSettings = (settings: MultiUpiSettings): MultiUpiSettings => {
  memoryCache = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('LocalStorage quota limit notice for UPI settings (falling back to memory/session/Firebase):', e);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
  }
  pushActiveSlotToFirebase(settings);
  return settings;
};

// ── Active Slot ───────────────────────────────────────────────────────────────
export const getActiveUpiSlot = (): UpiSlot => {
  const settings = getMultiUpiSettings();
  const { slots, activeSlotIndex } = settings;
  if (slots.length === 0) return DEFAULT_SETTINGS.slots[0];
  // Clamp index to valid range
  const idx = Math.min(activeSlotIndex, slots.length - 1);
  return slots[idx];
};

// ── Compute which slot is active (first non-full slot) ────────────────────────
const computeActiveIndex = (slots: UpiSlot[]): number => {
  const firstNotFull = slots.findIndex((s) => s.paymentCount < s.maxPayments);
  return firstNotFull === -1 ? slots.length - 1 : firstNotFull;
};

// ── Record a payment to the active slot & auto-rotate if full ─────────────────
export const recordPaymentToActiveSlot = (): { slot: UpiSlot; rotated: boolean; newSlot?: UpiSlot } => {
  const settings = getMultiUpiSettings();
  const { slots } = settings;

  const activeIdx = computeActiveIndex(slots);
  const activeSlot = slots[activeIdx];

  activeSlot.paymentCount += 1;

  const isFull = activeSlot.paymentCount >= activeSlot.maxPayments;
  const newActiveIdx = computeActiveIndex(slots);
  const rotated = isFull && newActiveIdx !== activeIdx;

  settings.activeSlotIndex = newActiveIdx;
  saveMultiUpiSettings(settings);

  return {
    slot: activeSlot,
    rotated,
    newSlot: rotated ? slots[newActiveIdx] : undefined,
  };
};

// ── CRUD for slots ────────────────────────────────────────────────────────────
export const addUpiSlot = (partial: Partial<UpiSlot> = {}): MultiUpiSettings => {
  const settings = getMultiUpiSettings();
  const newSlot: UpiSlot = {
    id: `slot-${Date.now()}`,
    label: `UPI Slot ${settings.slots.length + 1}`,
    upiId: '',
    merchantName: 'Kruponam 2026 – Krupanidhi Degree College',
    qrImageDataUrl: null,
    maxPayments: 20,
    paymentCount: 0,
    ...partial,
  };
  settings.slots.push(newSlot);
  settings.activeSlotIndex = computeActiveIndex(settings.slots);
  return saveMultiUpiSettings(settings);
};

export const updateUpiSlot = (id: string, changes: Partial<UpiSlot>): MultiUpiSettings => {
  const settings = getMultiUpiSettings();
  const idx = settings.slots.findIndex((s) => s.id === id);
  if (idx !== -1) {
    settings.slots[idx] = { ...settings.slots[idx], ...changes };
    settings.activeSlotIndex = computeActiveIndex(settings.slots);
  }
  return saveMultiUpiSettings(settings);
};

export const removeUpiSlot = (id: string): MultiUpiSettings => {
  const settings = getMultiUpiSettings();
  settings.slots = settings.slots.filter((s) => s.id !== id);
  if (settings.slots.length === 0) {
    settings.slots = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.slots));
  }
  settings.activeSlotIndex = computeActiveIndex(settings.slots);
  return saveMultiUpiSettings(settings);
};

export const resetSlotCount = (id: string): MultiUpiSettings => {
  return updateUpiSlot(id, { paymentCount: 0 });
};

// ── Manually force-activate a specific slot (overrides auto-rotation) ─────────
export const setActiveSlotManually = (id: string): MultiUpiSettings => {
  const settings = getMultiUpiSettings();
  const idx = settings.slots.findIndex((s) => s.id === id);
  if (idx !== -1) {
    settings.activeSlotIndex = idx;
    saveMultiUpiSettings(settings);
  }
  return settings;
};

// ── Legacy compat shim (RegistrationForm still imports getUpiSettings) ────────
export const getUpiSettings = () => {
  const slot = getActiveUpiSlot();
  return {
    upiId: slot.upiId || 'q062769226@ybl',
    qrImageDataUrl: slot.qrImageDataUrl,
    merchantName: slot.merchantName,
    amount: getSiteSettings().ticketAmount,
  };
};

export type { MultiUpiSettings as UpiSettings };
export const saveUpiSettings = (_: unknown) => {};
