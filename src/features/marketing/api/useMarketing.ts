import { useQuery } from '@tanstack/react-query';
import { marketingService } from './marketing.service';
import type { MarketingQueryParams } from '../../../types';

const MARKETING_KEY = 'marketing';

/** KPI aggregates move slowly: 5 min of staleness is plenty. */
const STALE_TIME_MS = 5 * 60 * 1000;

const queryKey = (params?: MarketingQueryParams) => [
  MARKETING_KEY,
  params?.startDate,
  params?.endDate,
  params?.platform,
  params?.groupBy,
];

export const useMarketingOverview = (params?: MarketingQueryParams) =>
  useQuery({
    queryKey: [...queryKey(params), 'overview'],
    queryFn: () => marketingService.getOverview(params),
    staleTime: STALE_TIME_MS,
  });

export const useMarketingPlatforms = (params?: MarketingQueryParams) =>
  useQuery({
    queryKey: [...queryKey(params), 'platforms'],
    queryFn: () => marketingService.getPlatforms(params),
    staleTime: STALE_TIME_MS,
  });

export const useMarketingFunnel = (params?: MarketingQueryParams) =>
  useQuery({
    queryKey: [...queryKey(params), 'funnel'],
    queryFn: () => marketingService.getFunnel(params),
    staleTime: STALE_TIME_MS,
  });

export const useMarketingTimeline = (params?: MarketingQueryParams) =>
  useQuery({
    queryKey: [...queryKey(params), 'timeline'],
    queryFn: () => marketingService.getTimeline(params),
    staleTime: STALE_TIME_MS,
  });