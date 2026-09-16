import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import { admin, lastLoginMethod, openAPI } from 'better-auth/plugins';
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
  },

  trustedOrigins: [process.env.APP_FRONTEND_URL as string],

  // Both columns already exist on the Prisma `User` model, so declaring them
  // here only tells better-auth to carry them on the session user.
  user: {
    additionalFields: {
      bio: { type: 'string', required: false },
      website: { type: 'string', required: false },
    },
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
    max: 5,
    window: 60, // 60 seconds
  },

  plugins: [openAPI(), admin(), lastLoginMethod()],
});
