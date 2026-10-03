import type { MarketingGroupBy, TrafficPlatform, TrackingEventName } from './enums';

/* -------------------------------------------------------------------------- */
/*                              Tracking (public)                              */
/* -------------------------------------------------------------------------- */

export type ClickIdKey =
  | 'fbclid'
  | 'gclid'
  | 'gbraid'
  | 'wbraid'
  | 'ttclid'
  | 'msclkid';

export type UtmKey =
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'
  | 'utm_content'
  | 'utm_term'
  | 'utm_id';

/** UTM / click identifiers read from the landing URL, plus Meta cookies. */
export interface TrackingCapture {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  utmId?: string;
  fbclid?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  ttclid?: string;
  msclkid?: string;
  fbc?: string;
  fbp?: string;
}

export interface StartTrackingSessionPayload extends TrackingCapture {
  anonymousId: string;
  sessionKey: string;
  landingPage: string;
  pagePath?: string;
  referrer?: string;
  consentGranted: boolean;
}

export interface TrackingSessionResponse {
  id: string;
  visitorId: string;
  sessionKey: string;
  landingPage: string;
  platform: TrafficPlatform;
  campaignKey?: string | null;
  startedAt: string;
  lastSeenAt: string;
  visitor: {
    id: string;
    anonymousId: string;
    userId?: string | null;
  };
}

export interface IdentifyPayload extends Pick<TrackingCapture, 'fbc' | 'fbp'> {
  anonymousId: string;
  sessionKey?: string;
  userId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

export interface TrackPageViewPayload {
  sessionKey: string;
  pagePath?: string;
  pageUrl?: string;
  referrer?: string;
}

export interface TrackSearchPayload {
  sessionKey: string;
  query: string;
  resultCount: number;
}

/** One entry of the `POST /tracking/events` batch. */
export interface TrackingEventInput {
  eventId: string;
  name: TrackingEventName;
  eventTime?: string;
  pagePath?: string;
  pageUrl?: string;
  referrer?: string;
  productId?: string;
  variantId?: string;
  orderId?: string;
  searchQuery?: string;
  quantity?: number;
  value?: number;
}

export interface TrackEventsPayload {
  sessionKey: string;
  anonymousId?: string;
  userId?: string;
  events: TrackingEventInput[];
}

/* -------------------------------------------------------------------------- */
/*                            Marketing KPIs (admin)                           */
/* -------------------------------------------------------------------------- */

export interface MarketingRange {
  startDate: string;
  endDate: string;
}

export interface MarketingQueryParams {
  startDate?: string;
  endDate?: string;
  platform?: TrafficPlatform;
  groupBy?: MarketingGroupBy;
  limit?: number;
}

export interface MarketingOverview {
  range: MarketingRange;
  revenue: number;
  orders: number;
  aov: number;
  spend: number;
  roas: number;
  cancelRate: number;
  sessions: number;
  metaCapiSent: number;
}

export interface MarketingPlatformStat {
  platform: TrafficPlatform;
  revenue: number;
  orders: number;
  spend: number;
  roas: number;
}

export interface MarketingPlatformsResponse {
  range: MarketingRange;
  data: MarketingPlatformStat[];
}

export interface MarketingFunnel {
  range: MarketingRange;
  sessions: number;
  pageViews: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  crPageViewToPurchase: number;
  crAtcToPurchase: number;
}

export interface MarketingTimelinePoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * The API currently answers with a bare array. Older builds wrapped it in
 * `{ range, data }`, so both shapes are accepted and normalised.
 */
export type MarketingTimelineResponse =
  | MarketingTimelinePoint[]
  | { range?: MarketingRange; data: MarketingTimelinePoint[] };