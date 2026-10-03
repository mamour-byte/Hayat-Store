import type { TrackingCapture } from '../../../types';

const CLICK_ID_KEYS = [
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'ttclid',
  'msclkid',
] as const;

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
] as const;

/** Maps the snake_case URL parameter to the camelCase payload field. */
const UTM_FIELDS: Record<(typeof UTM_KEYS)[number], keyof TrackingCapture> = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_content: 'utmContent',
  utm_term: 'utmTerm',
  utm_id: 'utmId',
};

/**
 * First-touch params are persisted for the whole visit. SPA navigations drop the
 * query string, so a session restarted after the 30-minute timeout would
 * otherwise lose its original UTM / click attribution.
 */
const CAPTURE_KEY = 'hs_tracking_capture';
const MAX_CAPTURE_LENGTH = 512;

const emptyCapture = (): TrackingCapture => ({});

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const truncate = (value: string): string => value.slice(0, MAX_CAPTURE_LENGTH);

/** Reads a first-party cookie (Meta writes `_fbp` / `_fbc`). */
export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return undefined;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

/** Meta click identifiers used for Conversions API advanced matching. */
export const getMetaCookies = (): Pick<TrackingCapture, 'fbc' | 'fbp'> => {
  const fbc = getCookie('_fbc');
  const fbp = getCookie('_fbp');
  return {
    ...(isNonEmptyString(fbc) ? { fbc: truncate(fbc) } : {}),
    ...(isNonEmptyString(fbp) ? { fbp: truncate(fbp) } : {}),
  };
};

const captureFromSearchParams = (params: URLSearchParams): TrackingCapture => {
  const capture: TrackingCapture = {};

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (isNonEmptyString(value)) {
      capture[UTM_FIELDS[key]] = truncate(value);
    }
  });

  CLICK_ID_KEYS.forEach((key) => {
    const value = params.get(key);
    if (isNonEmptyString(value)) {
      capture[key] = truncate(value);
    }
  });

  return capture;
};

/**
 * Persists the campaign identifiers seen on the URL. First touch wins: an
 * organic visit that later picks up an `?utm_campaign=` from an internal banner
 * link keeps its original attribution.
 */
const persistCapture = (capture: TrackingCapture): void => {
  if (typeof window === 'undefined') return;
  if (Object.values(capture).every((value) => !isNonEmptyString(value))) return;

  try {
    const stored = window.sessionStorage.getItem(CAPTURE_KEY);
    const previous = stored ? (JSON.parse(stored) as TrackingCapture) : {};
    window.sessionStorage.setItem(CAPTURE_KEY, JSON.stringify({ ...previous, ...capture }));
  } catch {
    // Storage unavailable: the URL values still apply for this page only.
  }
};

const readPersistedCapture = (): TrackingCapture => {
  if (typeof window === 'undefined') return emptyCapture();
  try {
    const stored = window.sessionStorage.getItem(CAPTURE_KEY);
    return stored ? (JSON.parse(stored) as TrackingCapture) : emptyCapture();
  } catch {
    return emptyCapture();
  }
};

/**
 * Attribution for the current visit: whatever is on the URL right now, overlaid
 * on the first-touch values captured earlier in the visit, plus the Meta cookies.
 *
 * URL values are persisted on the way out. SPA navigations drop the query
 * string, so without this a session restarted after the 30-minute timeout would
 * come back unattributed.
 */
export const getTrackingCapture = (): TrackingCapture => {
  const search =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  const fromUrl = captureFromSearchParams(search);
  persistCapture(fromUrl);

  return {
    ...readPersistedCapture(),
    ...fromUrl,
    ...getMetaCookies(),
  };
};

/** First page of the visit: full URL is the landing page, `referrer` its origin. */
export const getLandingContext = (): {
  landingPage: string;
  pagePath: string;
  referrer?: string;
} => {
  if (typeof window === 'undefined') {
    return { landingPage: '', pagePath: '/' };
  }

  const referrer = document.referrer;
  return {
    landingPage: window.location.href,
    pagePath: `${window.location.pathname}${window.location.search}`,
    ...(isNonEmptyString(referrer) ? { referrer } : {}),
  };
};