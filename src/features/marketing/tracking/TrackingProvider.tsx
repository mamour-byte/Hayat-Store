import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers/auth-context';
import { trackPixelPageView } from '../pixel';
import { trackingApi } from './client';
import {
  getTrackingCapture,
  getLandingContext,
  getMetaCookies,
} from './capture';
import { flushEvents, setTrackingSession, setTrackingUser } from './events';
import {
  getAnonymousId,
  getSessionKey,
  isSessionExpired,
  isSessionStarted,
  markSessionStarted,
  resetSessionKey,
} from './storage';

/**
 * Boots the marketing session for the storefront and keeps it alive:
 *
 * - starts a visit (with UTM / click-id / Meta cookie capture) on mount, or
 *   whenever the 30-minute window has lapsed;
 * - sends a pageview on every SPA route change;
 * - identifies the shopper on login and register so Meta advanced matching can
 *   attribute conversions to an email / phone hash.
 *
 * Mounted inside `MainLayout` only, so admin traffic never pollutes the funnel.
 */
export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionRef = useRef<string | null>(null);

  // --- Session lifecycle ---------------------------------------------------
  useEffect(() => {
    const anonymousId = getAnonymousId();
    let cancelled = false;

    const startSession = async () => {
      const sessionKey = getSessionKey();
      const capture = getTrackingCapture();
      const { landingPage, pagePath, referrer } = getLandingContext();

      await trackingApi.startSession({
        anonymousId,
        sessionKey,
        landingPage,
        pagePath,
        ...(referrer ? { referrer } : {}),
        ...capture,
        consentGranted: true,
      });

      if (cancelled) return;

      markSessionStarted();
      sessionRef.current = sessionKey;
      setTrackingSession(sessionKey, user?.id);
      void flushEvents();
    };

    // Two distinct cases, and they must not be conflated:
    // - the API has not been told about this visit yet (first load, or the
    //   previous `start` call failed): announce it, otherwise the session would
    //   never exist server-side;
    // - the window lapsed: open a genuinely new visit instead of resurrecting
    //   the old one.
    const needsNewSession = !isSessionStarted() || isSessionExpired();

    if (needsNewSession) {
      if (isSessionExpired()) resetSessionKey();
      void startSession();
    } else {
      // Reload inside the live window: re-attach, the API already has the visit.
      const sessionKey = getSessionKey();
      sessionRef.current = sessionKey;
      setTrackingSession(sessionKey, user?.id);
    }

    return () => {
      cancelled = true;
    };
    // Boot once per mount: the session window is refreshed by `getSessionKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Pageview on every route change -------------------------------------
  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}`;

    // Deliberately outside the `sessionRef` guard below: on the first load of
    // a visit the session handshake has not resolved yet, and Meta would never
    // see the landing pageview.
    trackPixelPageView();

    const sessionKey = sessionRef.current;
    if (!sessionKey) return;

    void trackingApi.pageView({
      sessionKey,
      pagePath,
      pageUrl: window.location.href,
      referrer: document.referrer || undefined,
    });
  }, [location.pathname, location.search]);

  // --- Identify the shopper once authenticated ----------------------------
  useEffect(() => {
    if (!user) {
      setTrackingUser(undefined);
      return;
    }

    setTrackingUser(user.id);

    const sessionKey = sessionRef.current ?? getSessionKey();
    void trackingApi.identify({
      anonymousId: getAnonymousId(),
      sessionKey,
      userId: user.id,
      ...(user.email ? { email: user.email } : {}),
      ...(user.phone ? { phone: user.phone } : {}),
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
      ...getMetaCookies(),
    });
  }, [user]);

  return <>{children}</>;
};