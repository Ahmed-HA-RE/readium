import Link from 'next/link';
import Image from 'next/image';
import { FaEdit } from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import { APP_LOGO } from '@repo/assets';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { ADMIN_OVERVIEW_PATH } from '@/lib/utils';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import SidebarTrigger from './sidebar-trigger';
import SearchCommand from './search-command';
import NotificationsBell from './notifications-bell';
import ThemeToggle from '@/components/shared/theme-toggle';
import UserMenu from './user-menu';

const logoStyle = { width: 36, height: 'auto' };

const Header = async () => {
  const session = await getCurrentLoggedInUser();
  const isAdmin = session?.user.role === 'admin';

  return (
    <header className='sticky top-0 z-50 border-b bg-background [:root:has([data-marketing-page])_&]:bg-app/10'>
      <div className='flex h-15 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-2 lg:gap-2'>
          {/* Anonymous visitors and admins get no sidebar, so there is nothing to toggle. */}
          {session && !isAdmin && <SidebarTrigger />}
          <Link href='/' className='shrink-0'>
            <Image
              src={APP_LOGO}
              alt='Readium'
              width={0}
              height={0}
              sizes='100vw'
              priority
              style={logoStyle}
            />
          </Link>
          {session && <SearchCommand className='md:ml-6' />}
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          {session ? (
            <>
              {/* Admins moderate rather than write, so their slot leads back to the dashboard. */}
              <Link
                href={isAdmin ? ADMIN_OVERVIEW_PATH : '/new-story'}
                className={cn(
                  buttonVariants({ variant: 'ghost-plain', size: 'lg' }),
                  'text-muted-foreground  max-lg:hidden text-base font-normal px-0',
                )}
              >
                {isAdmin ? (
                  <>
                    <MdAdminPanelSettings className='size-5' />
                    Dashboard
                  </>
                ) : (
                  <>
                    <FaEdit className='size-5' />
                    Write
                  </>
                )}
              </Link>
              <NotificationsBell className='max-lg:hidden' />

              <ThemeToggle className='max-lg:hidden' />
              <UserMenu
                name={session.user.name}
                image={session.user.image}
                isPro={session.user.isPro}
                isAdmin={isAdmin}
              />
            </>
          ) : (
            <>
              {/* No profile dropdown to fold into, so it stays visible at every width. */}
              <ThemeToggle />
              <Link
                href='/login'
                className={cn(
                  buttonVariants({ variant: 'ghost-plain', size: 'lg' }),
                )}
              >
                Sign in
              </Link>
              <Link
                href='/sign-up'
                className={cn(buttonVariants({ size: 'lg' }), 'rounded-full')}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
