import { useState, useEffect } from 'react';
import { PortalEvent, Device } from '../types';

const EVENTS_CACHE_KEY = 'portal_offline_events_cache';
const DEVICES_CACHE_KEY = 'portal_offline_devices_cache';
const CACHE_TIMESTAMP_KEY = 'portal_offline_cache_timestamp';

/**
 * Save events list into browser localStorage offline cache
 */
export function saveEventsToCache(events: PortalEvent[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('[OfflineCache] Failed to save events to local cache:', err);
  }
}

/**
 * Load cached events list from browser localStorage
 */
export function loadEventsFromCache(): { events: PortalEvent[] | null; timestamp: number | null } {
  try {
    if (typeof window === 'undefined') return { events: null, timestamp: null };
    const rawEvents = localStorage.getItem(EVENTS_CACHE_KEY);
    const rawTs = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!rawEvents) return { events: null, timestamp: null };

    const events: PortalEvent[] = JSON.parse(rawEvents);
    const timestamp = rawTs ? parseInt(rawTs, 10) : null;
    return { events, timestamp };
  } catch (err) {
    console.warn('[OfflineCache] Failed to read events from local cache:', err);
    return { events: null, timestamp: null };
  }
}

/**
 * Save devices list into browser localStorage offline cache
 */
export function saveDevicesToCache(devices: Device[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DEVICES_CACHE_KEY, JSON.stringify(devices));
  } catch (err) {
    console.warn('[OfflineCache] Failed to save devices to local cache:', err);
  }
}

/**
 * Load cached devices list from browser localStorage
 */
export function loadDevicesFromCache(): { devices: Device[] | null } {
  try {
    if (typeof window === 'undefined') return { devices: null };
    const rawDevices = localStorage.getItem(DEVICES_CACHE_KEY);
    if (!rawDevices) return { devices: null };
    return { devices: JSON.parse(rawDevices) };
  } catch (err) {
    console.warn('[OfflineCache] Failed to read devices from local cache:', err);
    return { devices: null };
  }
}

/**
 * Clear all offline cache entries
 */
export function clearOfflineCache(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(EVENTS_CACHE_KEY);
    localStorage.removeItem(DEVICES_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (err) {
    console.warn('[OfflineCache] Failed to clear offline cache:', err);
  }
}

/**
 * React hook to listen for browser network connectivity (online/offline)
 */
export function useOnlineStatus(): { isOnline: boolean; lastCacheTime: number | null } {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [lastCacheTime, setLastCacheTime] = useState<number | null>(() => {
    const { timestamp } = loadEventsFromCache();
    return timestamp;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      window.dispatchEvent(new CustomEvent('network-status-changed', { detail: { isOnline: true } }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      window.dispatchEvent(new CustomEvent('network-status-changed', { detail: { isOnline: false } }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also update lastCacheTime whenever cache updates
    const handleCacheUpdated = () => {
      const { timestamp } = loadEventsFromCache();
      setLastCacheTime(timestamp);
    };
    window.addEventListener('portal-cache-updated', handleCacheUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('portal-cache-updated', handleCacheUpdated);
    };
  }, []);

  return { isOnline, lastCacheTime };
}
