'use client';

import Link from 'next/link';
import { useTheme } from '@wrksz/themes/client';
import { FaEdit } from 'react-icons/fa';
import { GoBell, GoCreditCard, GoGear, GoMoon, GoSun } from 'react-icons/go';
import { MdAdminPanelSettings } from 'react-icons/md';
import { cn } from 'cn';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LogoutAction from '@/components/shared/logout-action';
import { DEFAULT_AVATAR } from '@/lib/constants';
import {
  ADMIN_NOTIFICATIONS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_SETTINGS_PATH,
  getMySettingsPath,
  getProfilePath,
  NEW_STORY_PATH,
  NOTIFICATIONS_PATH,
  PLANS_PATH,
} from '@/lib/routes';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_CLASS = 'size-4';

// Header actions with no room below `lg`, so they collapse into this menu. Admins get the dashboard instead of Write.
const getCollapsedLinks = (isAdmin: boolean) => [
  isAdmin
    ? {
        href: ADMIN_OVERVIEW_PATH,
        label: 'Dashboard',
        Icon: MdAdminPanelSettings,
      }
    : { href: NEW_STORY_PATH, label: 'Write', Icon: FaEdit },
  {
    href: isAdmin ? ADMIN_NOTIFICATIONS_PATH : NOTIFICATIONS_PATH,
    label: 'Notifications',
    Icon: GoBell,
  },
];

const getAccountLinks = (isAdmin: boolean) => [
  {
    href: isAdmin ? ADMIN_SETTINGS_PATH : getMySettingsPath(),
    label: 'Settings',
    Icon: GoGear,
  },
];

interface UserMenuProps {
  name: string;
  image: string | null;
  isPro: boolean;
  isAdmin: boolean;
}

const UserMenu = ({ name, image, isPro, isAdmin }: UserMenuProps) => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon-lg'>
            <Avatar>
              <AvatarImage src={image ?? DEFAULT_AVATAR} alt={name} />

              <AvatarFallback>
                <Skeleton className='size-full rounded-full' />
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align='end' className='w-64'>
        <div className='flex items-center gap-3 px-2 py-2 font-normal'>
          <Avatar size='lg'>
            <AvatarImage src={image ?? DEFAULT_AVATAR} alt={name} />
            <AvatarFallback>
              <Skeleton className='size-full rounded-full' />
            </AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col leading-tight'>
            <span className='truncate font-medium'>{name}</span>
            {/* Admins have no public profile. */}
            {!isAdmin && (
              <Link
                href={getProfilePath(name)}
                className='text-muted-foreground w-fit'
              >
                <small className='hover:text-foreground transition'>
                  View Profile
                </small>
              </Link>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Below `lg` the header's own actions have no room, so they live here. */}
        <DropdownMenuGroup className='lg:hidden space-y-1'>
          {getCollapsedLinks(isAdmin).map(({ href, label, Icon }) => (
            <DropdownMenuItem key={href} render={<Link href={href} />}>
              <Icon className={ICON_CLASS} />
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
          >
            <GoSun className={cn(ICON_CLASS, 'dark:hidden')} />
            <GoMoon className={cn('hidden dark:block', ICON_CLASS)} />
            Toggle theme
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className='lg:hidden' />

        {getAccountLinks(isAdmin).map(({ href, label, Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon className={ICON_CLASS} />
            {label}
          </DropdownMenuItem>
        ))}

        {!isPro && (
          <DropdownMenuItem render={<Link href={PLANS_PATH} />} className='mt-1'>
            {/* Admins get Pro through their role, so the link is only for checking the page. */}
            {isAdmin ? (
              <>
                <GoCreditCard className={ICON_CLASS} />
                View plans
              </>
            ) : (
              'Become a Readium member 🌟'
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <LogoutAction label='Sign out' />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
