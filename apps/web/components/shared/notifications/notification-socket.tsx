'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@repo/types';
import { socket } from '@/lib/socket';
import { addNotificationToCache } from '@/lib/notifications';

// Rendered by a layout only when there is a session, so the gateway never sees an anonymous handshake.
const NotificationSocket = () => {
  const queryClient = useQueryClient();

  // `queryClient` is the browser singleton, so this still runs once per mount.
  useEffect(() => {
    const onNotification = (notification: Notification) =>
      addNotificationToCache(queryClient, notification);

    socket.on('notification', onNotification);
    socket.connect();

    return () => {
      socket.off('notification', onNotification);
      socket.disconnect();
    };
  }, [queryClient]);

  return null;
};

export default NotificationSocket;
