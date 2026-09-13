// ── Site Settings Service ─────────────────────────────────────────
// Controls website feature toggles (e.g., comingSoonMode, showing/hiding Programs & Schedule section).
// Admins can toggle these settings live from the Admin Portal.

const STORAGE_KEY = 'kruponam_site_settings_v3';
const PREV_STORAGE_KEY = 'kruponam_site_settings_v2';
const LEGACY_STORAGE_KEY = 'kruponam_site_settings_v1';

export interface SiteSettings {
  showProgramsSchedule: boolean;
  comingSoonMode: boolean;
  ticketAmount: number;
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showProgramsSchedule: false, // Default hidden
  comingSoonMode: false,        // Default booking site is open & live
  ticketAmount: 700,            // Default ticket pass price in ₹
};

export const getSiteSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        showProgramsSchedule: typeof parsed.showProgramsSchedule === 'boolean' ? parsed.showProgramsSchedule : DEFAULT_SITE_SETTINGS.showProgramsSchedule,
        comingSoonMode: typeof parsed.comingSoonMode === 'boolean' ? parsed.comingSoonMode : DEFAULT_SITE_SETTINGS.comingSoonMode,
        ticketAmount: typeof parsed.ticketAmount === 'number' && parsed.ticketAmount >= 0 ? parsed.ticketAmount : DEFAULT_SITE_SETTINGS.ticketAmount,
      };
    }

    // Check legacy / previous storage migration (preserve ticket amount / schedule if customized, default comingSoonMode to false so booking site is open)
    const prevRaw = localStorage.getItem(PREV_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (prevRaw) {
      const parsed = JSON.parse(prevRaw);
      const migrated: SiteSettings = {
        showProgramsSchedule: typeof parsed.showProgramsSchedule === 'boolean' ? parsed.showProgramsSchedule : DEFAULT_SITE_SETTINGS.showProgramsSchedule,
        comingSoonMode: false, // Default booking site as open
        ticketAmount: typeof parsed.ticketAmount === 'number' && parsed.ticketAmount >= 0 ? parsed.ticketAmount : DEFAULT_SITE_SETTINGS.ticketAmount,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (_) { }
  return { ...DEFAULT_SITE_SETTINGS };
};

export const saveSiteSettings = (settings: Partial<SiteSettings>): SiteSettings => {
  const current = getSiteSettings();
  const updated: SiteSettings = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notify listeners across components
    window.dispatchEvent(new CustomEvent('kruponam-site-settings-changed', { detail: updated }));
  } catch (_) { }
  return updated;
};
