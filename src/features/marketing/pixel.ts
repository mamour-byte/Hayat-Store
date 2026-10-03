import { TrackingEventName } from '../../types/enums';
import type { TrackingEventInput } from '../../types';

/**
 * Meta Pixel bridge.
 *
 * The API forwards every event to the Conversions API with our `eventId` as
 * `event_id`. Firing the same event here with the identical id is what lets
 * Meta collapse the browser and server copies into a single conversion, so the
 * pixel is the fast path (immediate, survives an API outage) rather than a
 * second source of truth.
 *
 * Two events are deliberately NOT emitted from the browser:
 * - `SEARCH`, because the API mints its own `eventId` that we never see;
 * - `PURCHASE`, because the API records it as the source of truth.
 * Emitting either would double count the conversion.
 */
type FbqFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
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

/** `SEARCH` and `PURCHASE` are intentionally absent: the API owns them. */
export const isPixelAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.fbq === 'function';

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

/** Mirrors one queued event onto the pixel. Never throws. */
export const trackPixelEvent = (event: TrackingEventInput): void => {
  const metaName = META_EVENT_NAMES[event.name];
  if (!metaName || !isPixelAvailable()) return;

  try {
    window.fbq?.('track', metaName, buildParams(event), { eventID: event.eventId });
  } catch {
    // A third-party script must never break the storefront.
  }
};

/**
 * Pageviews are not sent to the Conversions API (`recordPageView` skips the
 * dispatch), so this is the only place they are reported.
 */
export const trackPixelPageView = (): void => {
  if (!isPixelAvailable()) return;

  try {
    window.fbq?.('track', 'PageView');
  } catch {
    // See `trackPixelEvent`.
  }
};