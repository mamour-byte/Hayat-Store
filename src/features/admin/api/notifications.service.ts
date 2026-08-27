import type { AdminNotification } from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

type NotificationListResponse = AdminNotification[] | {
  data: AdminNotification[] | { data?: AdminNotification[] };
};
type UnreadCountResponse = {
  count?: number;
  unreadCount?: number;
  data?: number | { count?: number; unreadCount?: number; data?: number };
};

export const notificationsService = {
  getAll: async (): Promise<AdminNotification[]> => {
    const { data } = await apiClient.get<NotificationListResponse>(API_ENDPOINTS.NOTIFICATIONS.LIST);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return data.data?.data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<UnreadCountResponse>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    if (typeof data.data === 'number') return data.data;
    return data.unreadCount ?? data.count ?? data.data?.unreadCount ?? data.data?.count ?? data.data?.data ?? 0;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};