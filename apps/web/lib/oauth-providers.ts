import type { IconType } from 'react-icons';
import { FaGithub, FaTwitch } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { OAuthProvider } from '@repo/types';

// Shared by the sign-in buttons and the Security tab's linking cards.
export const OAUTH_PROVIDERS: Record<
  OAuthProvider,
  { label: string; Icon: IconType; iconClassName?: string }
> = {
  [OAuthProvider.GOOGLE]: { label: 'Google', Icon: FcGoogle },
  [OAuthProvider.GITHUB]: { label: 'GitHub', Icon: FaGithub },
  [OAuthProvider.TWITCH]: {
    label: 'Twitch',
    Icon: FaTwitch,
    iconClassName: 'text-[#9146FF]',
  },
};
