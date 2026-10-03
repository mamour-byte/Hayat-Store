import { TrackingEventName } from '../../../types/enums';
import type { TrackingEventInput } from '../../../types';
import { trackPixelEvent } from '../pixel';
import { trackingApi } from './client';
import { getSessionKey } from './storage';

/** The API rejects batches larger than 50 events. */
const MAX_BATCH_SIZE = 50;
/** Debounce so a burst of events travels as a single request. */
const FLUSH_DELAY_MS = 2000;
/** Hard cap: a stuck network must not grow the queue without bound. */
const MAX_QUEUE_SIZE = 500;
/** Bound on the dedup ledger of `eventId`s. */
const MAX_SEEN_IDS = 1000;

/**
 * Unique per page load: `eventId`s built from it survive React's double-invoked
 * effects in development while still distinguishing two genuine visits.
 */
const LOAD_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

let sequence = 0;
let queue: TrackingEventInput[] = [];
const sentEventIds = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
let teardownRegistered = false;

interface TrackingContext {
  sessionKey: string | null;
  userId?: string;
}

let context: TrackingContext = { sessionKey: null };

const nextEventId = (prefix: string): string => {
  sequence += 1;
  return `${prefix}-${LOAD_ID}-${sequence}`;
};

/** Remembers recently used ids so retries cannot duplicate a conversion. */
const rememberEventId = (eventId: string): void => {
  sentEventIds.add(eventId);
  if (sentEventIds.size > MAX_SEEN_IDS) {
    const oldest = sentEventIds.values().next().value;
    if (oldest) sentEventIds.delete(oldest);
  }
};

/** Called by `TrackingProvider` once the API has acknowledged the session. */
export const setTrackingSession = (sessionKey: string, userId?: string): void => {
  context = { sessionKey, ...(userId ? { userId } : {}) };
  registerTeardown();
  void flushEvents();
};

/** Called after login/logout so events carry the right `userId`. */
export const setTrackingUser = (userId?: string): void => {
  context = { ...context, ...(userId ? { userId } : {}) };
};

const scheduleFlush = (): void => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, FLUSH_DELAY_MS);
};

const registerTeardown = (): void => {
  if (teardownRegistered || typeof window === 'undefined') return;
  teardownRegistered = true;

  const drain = () => {
    if (queue.length === 0) return;
    const sessionKey = context.sessionKey ?? getSessionKey();
    trackingApi.beacon({ sessionKey, events: queue });
    queue = [];
  };

  // `pagehide` fires on tab close and bfcache entry; `visibilitychange` covers
  // mobile backgrounding. Either one gets a best-effort beacon out.
  window.addEventListener('pagehide', drain);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') drain();
  });
};

/** Sends the queued events in batches. Safe to call at any time. */
export const flushEvents = async (): Promise<void> => {
  if (isFlushing || queue.length === 0) return;

  const sessionKey = context.sessionKey ?? getSessionKey();
  context = { ...context, sessionKey };

  isFlushing = true;
  try {
    while (queue.length > 0) {
      const batch = queue.slice(0, MAX_BATCH_SIZE);
      queue = queue.slice(MAX_BATCH_SIZE);
      batch.forEach((event) => rememberEventId(event.eventId));

      await trackingApi.events({
        sessionKey,
        ...(context.userId ? { userId: context.userId } : {}),
        events: batch,
      });
    }
  } finally {
    isFlushing = false;
  }

  scheduleFlush();
};

/**
 * Queues one event. `eventId` must be stable across retries of the same logical
 * event: the API ignores duplicates, which is what protects the conversion
 * numbers from double counting.
 */
export const trackEvent = (event: TrackingEventInput): void => {
  if (!event.eventId || sentEventIds.has(event.eventId)) return;

  rememberEventId(event.eventId);

  // Fired here rather than at flush time: the pixel must not wait on the API,
  // and the dedup guard above guarantees a single browser call per event.
  trackPixelEvent(event);

  queue.push(event);
  if (queue.length > MAX_QUEUE_SIZE) {
    queue = queue.slice(queue.length - MAX_QUEUE_SIZE);
  }

  scheduleFlush();
};

/* -------------------------------------------------------------------------- */
/*                             Event helpers (UI)                              */
/* -------------------------------------------------------------------------- */

const pageFields = () => {
  if (typeof window === 'undefined') return {};
  return {
    pageUrl: window.location.href,
    pagePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || undefined,
  };
};

const baseEvent = (name: TrackingEventName, eventId: string) => ({
  eventId,
  name,
  eventTime: new Date().toISOString(),
  ...pageFields(),
});

/**
 * One view per product per session: a reload or a StrictMode double-effect
 * must not inflate the funnel.
 */
export const trackViewContent = (productId: string, value?: number): void => {
  if (!productId) return;
  trackEvent({
    ...baseEvent(TrackingEventName.VIEW_CONTENT, `vc-${getSessionKey()}-${productId}`),
    productId,
    ...(typeof value === 'number' ? { value } : {}),
  });
};

export const trackAddToCart = (input: {
  productId: string;
  variantId?: string;
  quantity?: number;
  value?: number;
}): void => {
  if (!input.productId) return;
  trackEvent({
    ...baseEvent(TrackingEventName.ADD_TO_CART, nextEventId('atc')),
    productId: input.productId,
    ...(input.variantId ? { variantId: input.variantId } : {}),
    ...(input.quantity ? { quantity: input.quantity } : {}),
    ...(typeof input.value === 'number' ? { value: input.value } : {}),
  });
};

export const trackInitiateCheckout = (value?: number): void => {
  trackEvent({
    ...baseEvent(TrackingEventName.INITIATE_CHECKOUT, `ic-${getSessionKey()}`),
    ...(typeof value === 'number' ? { value } : {}),
  });
};

export const trackAddPaymentInfo = (input: { orderId: string; value?: number }): void => {
  if (!input.orderId) return;
  trackEvent({
    ...baseEvent(TrackingEventName.ADD_PAYMENT_INFO, `api-${input.orderId}`),
    orderId: input.orderId,
    ...(typeof input.value === 'number' ? { value: input.value } : {}),
  });
};

/** `PURCHASE` is deliberately absent: the API records it as the source of truth. */