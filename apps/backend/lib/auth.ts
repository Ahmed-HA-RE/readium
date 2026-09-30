import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import { admin, lastLoginMethod, openAPI } from 'better-auth/plugins';
import sendEmailVerification from '../mails/send-email-verification';
import sendRequestPasswordReset from '../mails/send-request-password-reset';
import sendChangeEmailConfirmation from '../mails/send-change-email-confirmation';

const prisma = new PrismaClient({ adapter });

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
    sendResetPassword: async ({ user, url }) => {
      void sendRequestPasswordReset(user.email, url);
      return Promise.resolve();
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
