import { trackingApi } from './client';
import { getSessionKey } from './storage';

/**
 * Searches already reported during this visit. The API keys its `SEARCH` event
 * on a timestamp, so without this a shopper revisiting `?search=chaussures`
 * would inflate the search count and the conversion rates derived from it.
 */
const reportedSearches = new Set<string>();

/**
 * Reports a site search with its result count.
 *
 * `resultCount` is what turns "someone searched" into a merchandising signal,
 * so it is passed by the caller once the product query resolves rather than at
 * submit time.
 */
export const trackingSearch = (query: string, resultCount: number): void => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return;

  const dedupKey = `${getSessionKey()}:${normalized}`;
  if (reportedSearches.has(dedupKey)) return;
  reportedSearches.add(dedupKey);

  void trackingApi.search({
    sessionKey: getSessionKey(),
    query: normalized.slice(0, 120),
    resultCount: Math.max(0, Math.min(Math.trunc(resultCount) || 0, 10000)),
  });
};