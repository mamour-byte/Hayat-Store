import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { StatsQueryParams } from '../../../types';

const ADMIN_KEY = 'admin';

export const useAdminOrders = (status?: string) =>
  useQuery({
    queryKey: [ADMIN_KEY, 'orders', status ?? 'ALL'],
    queryFn: () => adminService.getOrders(status),
    staleTime: 30 * 1000,
  });

export const useAdminDashboardStats = (params?: StatsQueryParams) =>
  useQuery({
    queryKey: [ADMIN_KEY, 'dashboard-stats', params?.startDate, params?.endDate, params?.limit],
    queryFn: () => adminService.getDashboardStats(params),
    staleTime: 60 * 1000,
  });

export const useInvalidateAdminQueries = () => {
  const queryClient = useQueryClient();
  return {
    invalidateOrders: () =>
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'orders'] }),
    invalidateDashboard: () =>
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-stats'] }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  };
};
