import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import { admin, lastLoginMethod, openAPI } from 'better-auth/plugins';
import sendEmailVerification from '../mails/send-email-verification';
import sendSetPasswordEmail from '../mails/send-set-password-email';
import sendChangeEmailConfirmation from '../mails/send-change-email-confirmation';
import sendDeleteAccountConfirmation from '../mails/send-delete-account-confirmation';
import { deleteS3Object } from './s3';

const prisma = new PrismaClient({ adapter });

// S3 keys read in `deleteUser.beforeDelete`, deleted in `afterDelete` once the rows are gone.
const pendingS3Cleanup = new Map<string, string[]>();

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
            select: { image: true },
          }),
          prisma.blog.findMany({
            where: { authorId: user.id, coverImage: { not: null } },
            select: { coverImage: true },
          }),
        ]);

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
        pendingS3Cleanup.delete(user.id);
        await Promise.all(keys.map((key) => deleteS3Object(key)));
      },
    },
  },

  account: {
    accountLinking: {},
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
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

          // Case-insensitive to match `UsersService.isUsernameTaken`, which
          // drives the live check on the sign-up form — a sensitive check here
          // would accept a name the form already called taken.
          const existingName = await prisma.user.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
            select: { id: true },
          });
          if (existingName) {
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
    // Read-only and already behind a fresh session, so the Security tab can refetch it freely.
    customRules: { '/list-sessions': false },
  },

  plugins: [openAPI(), admin(), lastLoginMethod()],
});
