import { Prisma } from '../../generated/prisma/client';

// Shared by every query that returns a notification, so the socket payload and the HTTP responses match.
// `satisfies`, never an annotation, which collapses inference.
export const notificationInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  blog: {
    select: {
      title: true,
      slug: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;
