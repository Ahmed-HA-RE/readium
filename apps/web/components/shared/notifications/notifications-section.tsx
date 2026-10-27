import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getNotifications } from '@/lib/actions/notifications/getNotifications';
import NotificationsList from '@/components/shared/notifications/notifications-list';

type NotificationsSectionProps = {
  username: string;
  isAdmin: boolean;
};

// Shared by `/notifications` and the admin page. The key is a literal twin of `useNotifications`, so the

const NotificationsSection = async ({
  username,
  isAdmin,
}: NotificationsSectionProps) => {
  const queryClient = new QueryClient();

  await queryClient
    .infiniteQuery({
      queryKey: ['notifications'],
      queryFn: ({ pageParam }) => getNotifications(pageParam),
      initialPageParam: undefined as string | undefined,
    })

    .catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsList username={username} isAdmin={isAdmin} />
    </HydrationBoundary>
  );
};

export default NotificationsSection;
