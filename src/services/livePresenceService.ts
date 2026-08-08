// ── Realtime Live Active Visitor Tracking Service ─────────────────────────
// Tracks live active visitors online on the website.
// Uses a 10-second heartbeat ping and real-time event broadcasting.

import { isSupabaseConfigured, getSupabaseClient } from './supabaseService';

const PRESENCE_STORAGE_KEY = 'kruponam_live_presence_v1';
const HEARTBEAT_INTERVAL_MS = 10000;
const SESSION_TTL_MS = 25000;

// Unique ID for this browser tab session
const getSessionId = (): string => {
  let id = sessionStorage.getItem('kruponam_visitor_session_id');
  if (!id) {
    id = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    sessionStorage.setItem('kruponam_visitor_session_id', id);
  }
  return id;
};

interface PresenceSession {
  id: string;
  lastPing: number;
  userAgent?: string;
  isMobile?: boolean;
}

// ── Heartbeat Ping ─────────────────────────────────────────────────────────────
let heartbeatTimer: number | null = null;
let supabaseChannel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
let currentActiveCount = 1;

export const startLivePresenceHeartbeat = (): void => {
  if (heartbeatTimer) return;

  const sessionId = getSessionId();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const ping = () => {
    try {
      const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
      let registry: Record<string, PresenceSession> = {};
      if (raw) {
        registry = JSON.parse(raw);
      }

      const now = Date.now();
      // Prune dead sessions older than 25 seconds
      Object.keys(registry).forEach((id) => {
        if (now - registry[id].lastPing > SESSION_TTL_MS) {
          delete registry[id];
        }
      });

      // Update current session ping
      registry[sessionId] = {
        id: sessionId,
        lastPing: now,
        isMobile,
      };

      localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(registry));

      const count = Object.keys(registry).length;
      if (count !== currentActiveCount) {
        currentActiveCount = count;
        window.dispatchEvent(new CustomEvent('kruponam-presence-updated', { detail: { activeCount: count } }));
      }
    } catch (_) {}
  };

  // Initial ping
  ping();
  heartbeatTimer = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

  // Clean up on unload/close
  window.addEventListener('beforeunload', () => {
    try {
      const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
      if (raw) {
        const registry: Record<string, PresenceSession> = JSON.parse(raw);
        delete registry[sessionId];
        localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(registry));
      }
    } catch (_) {}
  });

  // Supabase Realtime channel integration if configured
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        supabaseChannel = client.channel('kruponam_live_presence', {
          config: { presence: { key: sessionId } },
        });

        supabaseChannel
          .on('presence', { event: 'sync' }, () => {
            if (supabaseChannel) {
              const state = supabaseChannel.presenceState();
              const cloudCount = Object.keys(state).length;
              if (cloudCount > 0) {
                currentActiveCount = Math.max(cloudCount, currentActiveCount);
                window.dispatchEvent(
                  new CustomEvent('kruponam-presence-updated', { detail: { activeCount: currentActiveCount } })
                );
              }
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && supabaseChannel) {
              await supabaseChannel.track({
                online_at: new Date().toISOString(),
                isMobile,
              });
            }
          });
      }
    } catch (_) {}
  }
};

export const getLiveActiveCount = (): number => {
  try {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    if (raw) {
      const registry: Record<string, PresenceSession> = JSON.parse(raw);
      const now = Date.now();
      const active = Object.values(registry).filter((s) => now - s.lastPing <= SESSION_TTL_MS);
      return Math.max(1, active.length);
    }
  } catch (_) {}
  return Math.max(1, currentActiveCount);
};
