import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';
import type {
  MarketingFunnel,
  MarketingOverview,
  MarketingPlatformsResponse,
  MarketingQueryParams,
  MarketingTimelinePoint,
  MarketingTimelineResponse,
} from '../../../types';

/** Drops undefined values so axios omits them instead of sending "undefined". */
const toQueryParams = (params: MarketingQueryParams = {}): Record<string, string> => {
  const query: Record<string, string> = {};
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  if (params.platform) query.platform = params.platform;
  if (params.groupBy) query.groupBy = params.groupBy;
  if (params.limit) query.limit = String(params.limit);
  return query;
};

/**
 * `/marketing/timeline` answers with a bare array today, while the spec documents
 * `{ range, data }`. Accept both rather than rendering an empty chart.
 */
const normaliseTimeline = (response: MarketingTimelineResponse): MarketingTimelinePoint[] =>
  Array.isArray(response) ? response : (response?.data ?? []);

export const marketingService = {
  getOverview: async (params?: MarketingQueryParams): Promise<MarketingOverview> => {
    const { data } = await apiClient.get<MarketingOverview>(
      API_ENDPOINTS.MARKETING.OVERVIEW,
      { params: toQueryParams(params) }
    );
    return data;
  },

  getPlatforms: async (params?: MarketingQueryParams): Promise<MarketingPlatformsResponse> => {
    const { data } = await apiClient.get<MarketingPlatformsResponse>(
      API_ENDPOINTS.MARKETING.PLATFORMS,
      { params: toQueryParams(params) }
    );
    return data;
  },

  getFunnel: async (params?: MarketingQueryParams): Promise<MarketingFunnel> => {
    const { data } = await apiClient.get<MarketingFunnel>(API_ENDPOINTS.MARKETING.FUNNEL, {
      params: toQueryParams(params),
    });
    return data;
  },

  getTimeline: async (
    params?: MarketingQueryParams
  ): Promise<MarketingTimelinePoint[]> => {
    const { data } = await apiClient.get<MarketingTimelineResponse>(
      API_ENDPOINTS.MARKETING.TIMELINE,
      { params: toQueryParams(params) }
    );
    return normaliseTimeline(data);
  },
};