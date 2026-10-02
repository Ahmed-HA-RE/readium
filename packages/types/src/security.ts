// The social providers configured in `apps/backend/lib/auth.ts`, in display order.
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  TWITCH = 'twitch',
}
export interface LinkedAccount {
  id: string;
  providerId: string;
  createdAt: Date;
}
