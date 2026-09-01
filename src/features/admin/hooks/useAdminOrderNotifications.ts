import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { notificationsService } from '../api/notifications.service';
import type { AdminNotification } from '../../../types';
import { tokenStorage } from '../../../lib/storage/token.storage';

const MAX_NOTIFICATIONS = 20;
const REFRESH_INTERVAL = 10000;
type NotificationPayload = AdminNotification | { notification?: AdminNotification; data?: AdminNotification };
let audioContext: AudioContext | null = null;

const unlockNotificationSound = () => {
  if (!window.AudioContext) return;
  audioContext ??= new window.AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
};

const playNotificationSound = () => {
  try {
    unlockNotificationSound();
    if (!audioContext || audioContext.state === 'suspended') return;
    const context = audioContext;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
  } catch {
    // Audio can be unavailable when the browser blocks autoplay.
  }
};

export const useAdminOrderNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const handleAdminInteraction = () => unlockNotificationSound();
    window.addEventListener('admin-notification-interaction', handleAdminInteraction);

    const loadNotifications = async () => {
      try {
        const [items, count] = await Promise.all([
          notificationsService.getAll(),
          notificationsService.getUnreadCount(),
        ]);
        if (!isCancelled) {
          setNotifications(items.slice(0, MAX_NOTIFICATIONS));
          setUnreadCount(count);
        }
      } catch {
        // Keep the panel available if the initial request fails.
      }
    };

    void loadNotifications();
    const refreshTimer = window.setInterval(() => {
      void loadNotifications();
    }, REFRESH_INTERVAL);

    const token = tokenStorage.getAccessToken();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, '');
    const socketPath = import.meta.env.VITE_SOCKET_PATH || '/socket.io';
    const socket = io(socketUrl, {
      path: socketPath,
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    socket.on('connect_error', (error) => {
      console.error('[notifications] Socket.IO connection failed:', error.message);
    });

    const handleNotification = (payload: NotificationPayload) => {
      const candidate = 'notification' in payload && payload.notification
        ? payload.notification
        : 'id' in payload
          ? payload
          : payload.data;
      if (!candidate || !('id' in candidate)) return;
      const notification = candidate;
      if (isCancelled || (notification.type && notification.type !== 'ORDER_CREATED') || !notification.id) return;
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((current) => current + 1);
      playNotificationSound();
    };

    socket.onAny((_event, payload: NotificationPayload) => {
      if (payload && typeof payload === 'object') handleNotification(payload);
    });

    return () => {
      isCancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener('admin-notification-interaction', handleAdminInteraction);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch {
      setUnreadCount(0);
    }
  };

  return { notifications, unreadCount, markAllAsRead };
};
