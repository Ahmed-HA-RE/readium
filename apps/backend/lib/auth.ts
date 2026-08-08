import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../src/generated/prisma/client';
import { adapter } from './adapter';
import { openAPI } from 'better-auth/plugins';

const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
  },

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

  plugins: [openAPI()],
});
