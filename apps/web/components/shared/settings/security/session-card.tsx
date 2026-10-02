'use client';

import { useTransition } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
import type { Session } from 'better-auth';
import type { IconType } from 'react-icons';
import {
  BraveBrowser,
  Chrome,
  Edge,
  Firefox,
  Safari,
  ZenBrowser,
} from '@thesvg/react';
import { IoBrowsersOutline } from 'react-icons/io5';
import { HiOutlineDevicePhoneMobile } from 'react-icons/hi2';
import { FaDesktop } from 'react-icons/fa';
import { authClient } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Checked in order against the parsed name, so "Edge" wins before "Chrome" for Chromium forks.
const BROWSER_ICONS: [string, React.ComponentType<{ className?: string }>][] =
  [
    ['Edge', Edge],
    ['Brave', BraveBrowser],
    ['Zen', ZenBrowser],
    ['Chrome', Chrome],
    ['Firefox', Firefox],
    ['Safari', Safari],
  ];

const getBrowserIcon = (name?: string) =>
  BROWSER_ICONS.find(([match]) => name?.includes(match))?.[1] ??
  IoBrowsersOutline;

type SessionCardProps = {
  session: Session;
  isCurrent: boolean;
};

const SessionCard = ({ session, isCurrent }: SessionCardProps) => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const { browser, os, device } = new UAParser(
    session.userAgent ?? undefined,
  ).getResult();
  const BrowserIcon = getBrowserIcon(browser.name);
  const isMobile = device.type === 'mobile' || device.type === 'tablet';
  const DeviceIcon: IconType = isMobile
    ? HiOutlineDevicePhoneMobile
    : FaDesktop;

  const revoke = () => {
    startTransition(async () => {
      await authClient.revokeSession(
        { token: session.token },
        {
          onSuccess: async () => {
            toast.success('Session revoked');
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      );
    });
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border p-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <BrowserIcon aria-hidden className='size-8 shrink-0' />
        <div className='flex min-w-0 flex-col gap-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-medium'>
              {browser.name ?? 'Unknown browser'}
              {os.name && ` on ${os.name}`}
            </span>
            {isCurrent && <Badge>This device</Badge>}
          </div>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
            <span className='flex items-center gap-1.5'>
              <DeviceIcon aria-hidden className='size-3.5' />
              {isMobile ? 'Mobile' : 'Desktop'}
            </span>
            <span>Signed on: {format(session.createdAt, 'PPP')}</span>
          </div>
        </div>
      </div>

      {!isCurrent && (
        <Button
          variant='destructive-outline'
          className='rounded-full px-4'
          disabled={isPending}
          onClick={revoke}
        >
          {isPending ? <Spinner /> : 'Revoke'}
        </Button>
      )}
    </div>
  );
};

export default SessionCard;
