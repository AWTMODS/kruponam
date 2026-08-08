// ── Site Settings Service ─────────────────────────────────────────
// Controls website feature toggles (e.g., comingSoonMode, showing/hiding Programs & Schedule section).
// Admins can toggle these settings live from the Admin Portal.

const STORAGE_KEY = 'kruponam_site_settings_v1';

export interface SiteSettings {
  showProgramsSchedule: boolean;
  comingSoonMode: boolean;
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  showProgramsSchedule: false, // Default hidden
  comingSoonMode: true,        // Default Coming Soon Mode active
};

export const getSiteSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        showProgramsSchedule: typeof parsed.showProgramsSchedule === 'boolean' ? parsed.showProgramsSchedule : false,
        comingSoonMode: typeof parsed.comingSoonMode === 'boolean' ? parsed.comingSoonMode : true,
      };
    }
  } catch (_) {}
  return { ...DEFAULT_SITE_SETTINGS };
};

export const saveSiteSettings = (settings: Partial<SiteSettings>): SiteSettings => {
  const current = getSiteSettings();
  const updated: SiteSettings = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notify listeners across components
    window.dispatchEvent(new CustomEvent('kruponam-site-settings-changed', { detail: updated }));
  } catch (_) {}
  return updated;
};
