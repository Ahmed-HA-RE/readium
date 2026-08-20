import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import { admin, openAPI } from 'better-auth/plugins';
import sendEmailVerification from '../mails/send-email-verification';
import sendRequestPasswordReset from '../mails/send-request-password-reset';

const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 1800, // 30 minutes
    revokeSessionsOnPasswordReset: true, // Revoke all sessions when a user resets their password
    sendResetPassword: async ({ user, url }) => {
      void sendRequestPasswordReset(user.email, url);
      return Promise.resolve();
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmailVerification(user.email, url);
      return Promise.resolve();
    },
    expiresIn: 1000 * 60 * 60, // 1 hour
  },

  trustedOrigins: [process.env.APP_FRONTEND_URL as string],

  databaseHooks: {
    user: {
      create: {
        // eslint-disable-next-line @typescript-eslint/require-await
        before: async (user) => {
          const name = user.name.trim();
          if (name.length < 3)
            throw new APIError('BAD_REQUEST', {
              message: 'Name must be at least 3 characters long',
            });
          if (name.length > 20) {
            throw new APIError('BAD_REQUEST', {
              message: 'Name must be at most 20 characters long',
            });
          }
          return { data: { ...user } };
        },
      },
    },
  },

  plugins: [openAPI(), admin()],
});
