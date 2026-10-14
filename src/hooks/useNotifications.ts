import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import type { ListParams } from '@/types';

// How often to poll for new notifications (ms)
export const NOTIFICATION_POLL_INTERVAL = 30 * 1000;

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: ListParams) => [...notificationKeys.all, 'list', params ?? {}] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export const useUnreadNotificationCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.unreadCount,
    enabled,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    refetchOnWindowFocus: true,
    retry: false,
  });
};

export const useNotifications = (params?: ListParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    enabled,
    refetchInterval: NOTIFICATION_POLL_INTERVAL,
    retry: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};
