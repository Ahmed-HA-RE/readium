import Link from 'next/link';
import Image from 'next/image';
import { FaEdit } from 'react-icons/fa';
import { APP_LOGO } from '@repo/assets';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import SidebarTrigger from './sidebar-trigger';
import SearchCommand from './search-command';
import NotificationsBell from './notifications-bell';
import ThemeToggle from './theme-toggle';
import UserMenu from './user-menu';

const logoStyle = { width: 36, height: 'auto' };

const Header = async () => {
  const session = await getCurrentLoggedInUser();

  // Signed out, the header sits on top of the marketing hero and shares its
  // tint rather than cutting a white band across it.
  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b',
        session ? 'bg-background' : 'bg-app/10',
      )}
    >
      <div className='flex h-15 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-2 lg:gap-2'>
          {/* Anonymous visitors get no sidebar, so there is nothing to toggle. */}
          {session && <SidebarTrigger />}
          <Link href='/' className='shrink-0'>
            <Image
              src={APP_LOGO}
              alt='Readium'
              width={0}
              height={0}
              sizes='100vw'
              style={logoStyle}
            />
          </Link>
          {session && <SearchCommand className='md:ml-6' />}
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          {session ? (
            <>
              <Link
                href='/new-story'
                className={cn(
                  buttonVariants({ variant: 'ghost-plain', size: 'lg' }),
                  'text-muted-foreground  max-lg:hidden text-base font-normal px-0',
                )}
              >
                <FaEdit className='size-5' />
                Write
              </Link>
              <NotificationsBell className='max-lg:hidden' />

              <ThemeToggle className='max-lg:hidden' />
              <UserMenu
                name={session.user.name}
                image={session.user.image}
                isPro={session.user.isPro}
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
