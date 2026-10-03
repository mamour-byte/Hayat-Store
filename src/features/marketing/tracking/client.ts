import axios from 'axios';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';
import type {
  IdentifyPayload,
  StartTrackingSessionPayload,
  TrackingSessionResponse,
  TrackEventsPayload,
  TrackPageViewPayload,
  TrackSearchPayload,
} from '../../../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Tracking runs on its own axios instance, on purpose:
 *
 * - no auth interceptor, so an anonymous visitor never leaks their token to the
 *   tracking endpoints and no token refresh is triggered by them;
 * - no error interceptor, so a failed beacon can never surface a toast to a
 *   shopper. Tracking is strictly best-effort and must stay invisible.
 *
 * `keepalive` lets the browser finish the request during unload.
 */
const trackingClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

/** Absolute URL for `sendBeacon`, which ignores the axios `baseURL`. */
const absoluteUrl = (path: string): string => {
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const target = `${base}${path}`;
  if (/^https?:\/\//i.test(target)) return target;
  return typeof window === 'undefined' ? target : new URL(target, window.location.origin).href;
};

/** Fire-and-forget: a tracking failure must never surface to the shopper. */
const ignoreFailure = (error: unknown): void => {
  if (import.meta.env.DEV) {
    console.warn('[tracking] request failed', error);
  }
};

export const trackingApi = {
  async startSession(payload: StartTrackingSessionPayload): Promise<TrackingSessionResponse | null> {
    try {
      const { data } = await trackingClient.post<TrackingSessionResponse>(
        API_ENDPOINTS.TRACKING.SESSION_START,
        payload
      );
      return data ?? null;
    } catch (error) {
      ignoreFailure(error);
      return null;
    }
  },

  async pageView(payload: TrackPageViewPayload): Promise<void> {
    try {
      await trackingClient.post(API_ENDPOINTS.TRACKING.PAGEVIEW, payload);
    } catch (error) {
      ignoreFailure(error);
    }
  },

  async identify(payload: IdentifyPayload): Promise<void> {
    try {
      await trackingClient.post(API_ENDPOINTS.TRACKING.IDENTIFY, payload);
    } catch (error) {
      ignoreFailure(error);
    }
  },

  async search(payload: TrackSearchPayload): Promise<void> {
    try {
      await trackingClient.post(API_ENDPOINTS.TRACKING.SEARCH, payload);
    } catch (error) {
      ignoreFailure(error);
    }
  },

  async events(payload: TrackEventsPayload): Promise<void> {
    try {
      await trackingClient.post(API_ENDPOINTS.TRACKING.EVENTS, payload);
    } catch (error) {
      ignoreFailure(error);
    }
  },

  /** Last-chance delivery when the tab is being closed. */
  beacon(payload: TrackEventsPayload): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return false;
    }
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      return navigator.sendBeacon(absoluteUrl(API_ENDPOINTS.TRACKING.EVENTS), blob);
    } catch (error) {
      ignoreFailure(error);
      return false;
    }
  },
};