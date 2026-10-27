import { TrackingEventName } from '../../types/enums';
import type { TrackingEventInput } from '../../types';

/**
 * Browser pixel bridge for Meta and TikTok.
 *
 * Events sent by both browser and server share an event id for deduplication.
 * Pixels remain the fast path (immediate, survives an API outage).
 *
 * `PURCHASE` and `SEARCH` are deliberately not emitted in the browser: the
 * API owns those events.
 */
type FbqFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  loaded?: boolean;
  version?: string;
};

type TtqFn = ((...args: unknown[]) => void) & {
  track?: (...args: unknown[]) => void;
  identify?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    ttq?: TtqFn;
  }
}

const CURRENCY = 'XOF';

const META_EVENT_NAMES: Partial<Record<TrackingEventName, string>> = {
  [TrackingEventName.VIEW_CONTENT]: 'ViewContent',
  [TrackingEventName.ADD_TO_CART]: 'AddToCart',
  [TrackingEventName.ADD_TO_WISHLIST]: 'AddToWishlist',
  [TrackingEventName.INITIATE_CHECKOUT]: 'InitiateCheckout',
  [TrackingEventName.ADD_PAYMENT_INFO]: 'AddPaymentInfo',
  [TrackingEventName.LEAD]: 'Lead',
  [TrackingEventName.SUBSCRIBE]: 'Subscribe',
};

const TIKTOK_EVENT_NAMES: Partial<Record<TrackingEventName, string>> = {
  [TrackingEventName.VIEW_CONTENT]: 'ViewContent',
  [TrackingEventName.ADD_TO_CART]: 'AddToCart',
  [TrackingEventName.ADD_TO_WISHLIST]: 'AddToWishlist',
  [TrackingEventName.INITIATE_CHECKOUT]: 'InitiateCheckout',
  [TrackingEventName.ADD_PAYMENT_INFO]: 'AddPaymentInfo',
  [TrackingEventName.LEAD]: 'SubmitForm',
  [TrackingEventName.SUBSCRIBE]: 'Subscribe',
};

/** `PURCHASE` is intentionally absent: the API owns it. */
export const isPixelAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.fbq === 'function';

const isTikTokPixelAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.ttq?.track === 'function';

const buildParams = (event: TrackingEventInput): Record<string, unknown> => {
  const params: Record<string, unknown> = {};

  if (typeof event.value === 'number') {
    params.value = event.value;
    params.currency = CURRENCY;
  }

  const contentIds = [event.productId, event.variantId].filter(
    (id): id is string => Boolean(id),
  );
  if (contentIds.length > 0) {
    params.content_ids = contentIds;
    params.content_type = 'product';
  }

  if (event.orderId) {
    params.order_id = event.orderId;
  }

  if (typeof event.quantity === 'number') {
    params.num_items = event.quantity;
  }

  return params;
};

/** Mirrors one queued event onto both available pixels. Never throws. */
export const trackPixelEvent = (event: TrackingEventInput): void => {
  const metaName = META_EVENT_NAMES[event.name];
  const tiktokName = TIKTOK_EVENT_NAMES[event.name];

  try {
    if (metaName && isPixelAvailable()) {
      window.fbq?.('track', metaName, buildParams(event), { eventID: event.eventId });
    }
  } catch {
    // A third-party script must never break the storefront.
  }

  try {
    if (tiktokName && isTikTokPixelAvailable()) {
      window.ttq?.track?.(tiktokName, buildParams(event), {
        event_id: event.eventId,
      });
    }
  } catch {
    // A third-party script must never break the storefront.
  }
};

/**
 * Pageviews are not sent to the Conversions API (`recordPageView` skips the
 * dispatch), so this is the only place they are reported.
 */
export const trackPixelPageView = (): void => {
  try {
    if (isPixelAvailable()) window.fbq?.('track', 'PageView');
  } catch {
    // See `trackPixelEvent`.
  }

  try {
    if (isTikTokPixelAvailable()) window.ttq?.track?.('PageView');
  } catch {
    // See `trackPixelEvent`.
  }
};

export const identifyTikTokPixel = (identity: {
  email?: string;
  phone?: string;
  externalId: string;
}): void => {
  if (!isTikTokPixelAvailable() || !window.ttq?.identify) return;

  const customer: Record<string, string> = {
    external_id: identity.externalId,
  };
  if (identity.email) customer.email = identity.email;
  if (identity.phone) customer.phone_number = identity.phone;

  try {
    window.ttq.identify(customer);
  } catch {
    // See `trackPixelEvent`.
  }
};