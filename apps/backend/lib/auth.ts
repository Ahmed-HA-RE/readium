import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import {
  admin,
  lastLoginMethod,
  openAPI,
  twoFactor,
} from 'better-auth/plugins';
import { generateRandomString } from 'better-auth/crypto';
import { stripe } from '@better-auth/stripe';
import { APP_NAME } from '@repo/constants';
import sendEmailVerification from '../mails/send-email-verification';
import sendSetPasswordEmail from '../mails/send-set-password-email';
import sendChangeEmailConfirmation from '../mails/send-change-email-confirmation';
import sendDeleteAccountConfirmation from '../mails/send-delete-account-confirmation';
import sendTwoFactorCode from '../mails/send-two-factor-code';
import sendSubscriptionWelcome from '../mails/send-subscription-welcome';
import sendSubscriptionCancelled from '../mails/send-subscription-cancelled';
import { deleteS3Object } from './s3';
import {
  cancelStripeSubscription,
  deleteStripeCustomer,
  stripeClient,
} from './stripe';
import { ABANDONED_CHECKOUT_STATUSES, PRO_STATUSES } from './constants';
import { createAuthMiddleware } from 'better-auth/api';

const prisma = new PrismaClient({ adapter });

// S3 keys read in `deleteUser.beforeDelete`, deleted in `afterDelete` once the rows are gone.
const pendingS3Cleanup = new Map<string, string[]>();
// Same pattern for the Stripe customer, deleted in `afterDelete` with the user's subscription rows.
const pendingStripeCleanup = new Map<string, string>();

// Only email-change tokens carry `updateTo`, so it tells the two verification emails apart.
const isEmailChangeToken = (token: string): boolean => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as { updateTo?: unknown };

    return typeof payload.updateTo === 'string';
  } catch {
    return false;
  }
};

// Case-insensitive to match `UsersService.isUsernameTaken`, which drives the live check on the sign-up form.
const isNameTaken = async (name: string): Promise<boolean> =>
  !!(await prisma.user.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  }));

// OAuth users can't pick their name, so a taken or invalid one gets a numeric suffix instead of failing.
const findFreeOAuthName = async (name: string, email: string) => {
  const base = (name.trim() || email.split('@')[0]).slice(0, 50);
  if (base.length >= 3 && !(await isNameTaken(base))) return base;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base.slice(0, 45).trimEnd()} ${generateRandomString(4, '0-9')}`;
    if (!(await isNameTaken(candidate))) return candidate;
  }

  // The `code` makes the OAuth callback redirect to the frontend instead of rethrowing.
  throw new APIError('BAD_REQUEST', {
    code: 'NAME_UNAVAILABLE',
    message: 'Could not find a free name for this account',
  });
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 1800, // 30 minutes
    revokeSessionsOnPasswordReset: true, // Revoke all sessions when a user resets their password
    // Decided here, not by the client: a user without a password account gets the "create" email.
    sendResetPassword: async ({ user, url }) => {
      const credential = await prisma.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
        select: { id: true },
      });
      void sendSetPasswordEmail(
        user.email,
        url,
        credential ? 'reset' : 'setup',
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      void sendEmailVerification(user.email, url, isEmailChangeToken(token));
      return Promise.resolve();
    },
    expiresIn: 3600, // 1 hour
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'],
    },

    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
    },
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      prompt: 'select_account',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: 'select_account',
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
    },
  },

  trustedOrigins: [process.env.APP_FRONTEND_URL as string],

  // Both columns already exist on the Prisma `User` model, so declaring them
  // here only tells better-auth to carry them on the session user.
  user: {
    additionalFields: {
      bio: { type: 'string', required: false },
      website: { type: 'string', required: false },
    },
    // The current address approves first, then the new one gets the verification link.
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        void sendChangeEmailConfirmation(user.email, newEmail, url);
        return Promise.resolve();
      },
    },
    // Nothing is deleted until the emailed link is opened; the rows cascade from `User`.
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 3600, // 1 hr
      sendDeleteAccountVerification: async ({ user, url }) => {
        void sendDeleteAccountConfirmation(user.email, url);
        return Promise.resolve();
      },
      // The cascade removes the blog rows, so their keys are read here while they still exist.
      beforeDelete: async (user) => {
        const [row, blogs] = await Promise.all([
          prisma.user.findUnique({
            where: { id: user.id },
            select: { image: true, stripeCustomerId: true },
          }),
          prisma.blog.findMany({
            where: { authorId: user.id, coverImage: { not: null } },
            select: { coverImage: true },
          }),
        ]);

        if (row?.stripeCustomerId)
          pendingStripeCleanup.set(user.id, row.stripeCustomerId);

        // OAuth sign-ups store the provider's avatar URL in `image`, which is not an S3 key.
        const keys = [row?.image, ...blogs.map(({ coverImage }) => coverImage)];
        pendingS3Cleanup.set(
          user.id,
          keys.filter(
            (key): key is string => !!key && !/^https?:\/\//.test(key),
          ),
        );
      },
      // Only once the rows are gone, so a failed delete never strips a live account's images.
      afterDelete: async (user) => {
        const keys = pendingS3Cleanup.get(user.id) ?? [];
        const customerId = pendingStripeCleanup.get(user.id);
        pendingS3Cleanup.delete(user.id);
        pendingStripeCleanup.delete(user.id);

        // `referenceId` has no foreign key to `User`, so these rows don't cascade.
        await Promise.all([
          ...keys.map((key) => deleteS3Object(key)),
          prisma.subscription.deleteMany({ where: { referenceId: user.id } }),
          customerId && deleteStripeCustomer(customerId),
        ]);
      },
    },
  },

  account: {
    accountLinking: {},
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path.startsWith('/callback/')) {
            const name = await findFreeOAuthName(user.name, user.email);
            return { data: { ...user, name } };
          }

          const name = user.name.trim();
          if (name.length < 3)
            throw new APIError('BAD_REQUEST', {
              message: 'Name must be at least 3 characters long',
            });
          if (name.length > 50) {
            throw new APIError('BAD_REQUEST', {
              message: 'Name must be at most 50 characters long',
            });
          }

          if (await isNameTaken(name)) {
            throw new APIError('BAD_REQUEST', {
              message: 'Name is already taken',
            });
          }

          return { data: { ...user } };
        },
      },
    },
  },

  rateLimit: {
    enabled: true,
    max: 10,
    window: 60, // 60 seconds
    customRules: {
      // Read-only and already behind a fresh session, so the Security tab can refetch it freely.
      '/list-sessions': false,
      // Signed by Stripe, and one checkout or ban sends several events at once; a dropped one desyncs the subscription.
      '/stripe/webhook': false,
    },
  },

  hooks: {
    // Better Auth only stops an admin from banning themselves, not other admins.
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path !== '/admin/ban-user' &&
        ctx.path !== '/admin/revoke-user-sessions'
      ) {
        return;
      }

      const { userId } = ctx.body as { userId: string };
      const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (target?.role === 'admin') {
        throw new APIError('FORBIDDEN', {
          code: 'CANNOT_MODERATE_ADMIN',
          message: "Admins can't be banned or signed out by another admin",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Only the OAuth callback; email sign-in is a fetch and redirects in the login form's `onSuccess`.
      if (
        ctx.path.startsWith('/callback/') &&
        ctx.context.newSession?.user?.role === 'admin'
      ) {
        ctx.redirect(`${process.env.APP_FRONTEND_URL}/admin/dashboard`);
      }

      // After hooks run on failures too, so only a ban that went through ends the subscription.
      if (
        ctx.path === '/admin/ban-user' &&
        !(ctx.context.returned instanceof APIError)
      ) {
        const { userId } = ctx.body as { userId: string };
        const subscription = await prisma.subscription.findFirst({
          where: { referenceId: userId, status: { in: PRO_STATUSES } },
          select: { stripeSubscriptionId: true },
        });

        if (subscription?.stripeSubscriptionId) {
          await cancelStripeSubscription(subscription.stripeSubscriptionId);
        }
      }
    }),
  },

  plugins: [
    openAPI(),
    admin(),
    lastLoginMethod(),
    twoFactor({
      issuer: APP_NAME,
      otpOptions: {
        period: 60, // 1 hour
        sendOTP: async ({ user, otp }) => {
          void sendTwoFactorCode(user.email, otp);
          return Promise.resolve();
        },
      },
      backupCodeOptions: {
        customBackupCodesGenerate: () =>
          Array.from({ length: 6 }, () =>
            generateRandomString(6, 'a-z', '0-9'),
          ),
      },
    }),
    stripe({
      stripeClient,
      // `stripe listen` signs local events with its own secret, separate from the dashboard endpoint's.
      stripeWebhookSecret: (process.env.NODE_ENV === 'development'
        ? process.env.STRIPE_WEBHOOK_SECRET_DEV
        : process.env.STRIPE_WEBHOOK_SECRET) as string,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: process.env.PRO_PLAN_NAME as string,
            priceId: process.env.PRO_PLAN_PRICE_ID as string,
            annualDiscountPriceId: process.env
              .PRO_ANNUAL_DISCOUNT_PRICE_ID as string,
          },
        ],
        // The welcome offer: 20% off the first year, only for users who never had a subscription.
        getCheckoutSessionParams: async ({ user }, _req, ctx) => {
          const { annual } = (ctx.body ?? {}) as { annual?: boolean };
          const isAnnual = annual === true;

          // The plugin has already created this checkout's own `incomplete` row, so it's excluded.
          const hasSubscribedBefore = await prisma.subscription.findFirst({
            where: {
              referenceId: user.id,
              status: { notIn: ABANDONED_CHECKOUT_STATUSES },
            },
            select: { id: true },
          });

          const applyCoupon = isAnnual && !hasSubscribedBefore;

          // Tax applies to every plan, not only the welcome offer.
          return {
            params: {
              automatic_tax: { enabled: true },
              ...(applyCoupon && {
                discounts: [{ coupon: process.env.STRIPE_COUPON_ID_20 }],
              }),
            },
          };
        },
        onSubscriptionComplete: async ({ subscription }) => {
          const user = await prisma.user.findUnique({
            where: { id: subscription.referenceId },
            select: { email: true, name: true },
          });
          if (user) await sendSubscriptionWelcome(user.email, user.name);
        },
        // Fires when the cancel is scheduled; the member keeps Pro until `cancelAt` or the period end.
        onSubscriptionCancel: async ({ subscription }) => {
          const user = await prisma.user.findUnique({
            where: { id: subscription.referenceId },
            select: { email: true, name: true },
          });
          if (user)
            await sendSubscriptionCancelled(
              user.email,
              user.name,
              subscription.cancelAt ?? subscription.periodEnd,
            );
        },
      },
    }),
  ],
});
