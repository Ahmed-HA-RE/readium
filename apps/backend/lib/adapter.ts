import { PrismaNeon } from '@prisma/adapter-neon';

export const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
