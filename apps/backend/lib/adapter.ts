import { PrismaNeon } from '@prisma/adapter-neon';
import 'dotenv/config';

export const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
