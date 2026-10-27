import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { IoSearch } from 'react-icons/io5';
import { APP_LOGO } from '@repo/assets';
import { APP_NAME } from '@repo/constants';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import NotificationsBell from '@/components/shared/notifications/notifications-bell';
import ThemeToggle from '@/components/shared/theme-toggle';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import AdminBreadcrumb from './admin-breadcrumb';
import AdminSearch from './admin-search';
import AdminUserMenu from './admin-user-menu';
import SidebarGroupedMenuItems from './sidebar-grouped-menu-items';

const logoStyle = { width: 32, height: 'auto' };

type AdminShellProps = {
  user: { name: string; email: string; image: string | null | undefined };
  children: React.ReactNode;
};

const AdminShell = ({ user, children }: AdminShellProps) => {
  return (
    <div className='bg-muted flex h-dvh w-full overflow-hidden'>
      <SidebarProvider className='bg-muted has-data-[variant=inset]:bg-muted'>
        <Sidebar
          collapsible='icon'
          variant='inset'
          className='bg-muted *:data-[slot="sidebar-inner"]:bg-muted group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]! data-[slot="sidebar-container"]:border-0!'
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size='lg'
                  className='gap-2.5 bg-transparent!'
                  render={<Link href={ADMIN_OVERVIEW_PATH} />}
                >
                  <Image
                    src={APP_LOGO}
                    alt=''
                    width={0}
                    height={0}
                    sizes='100vw'
                    priority
                    style={logoStyle}
                  />
                  <span className='text-lg font-semibold text-nowrap'>
                    {APP_NAME}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroupedMenuItems />
          </SidebarContent>
          <SidebarFooter className='group-data-[collapsible=icon]:-rotate-90'>
            <Button
              size='sm'
              className='hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-fit'
              render={<Link href='/' />}
              nativeButton={false}
            >
              Visit site
            </Button>
            <div className='group-data-[collapsible=icon]:hidden'>
              <Link
                href='/'
                className='group/home-card relative isolate flex h-36 flex-col justify-between overflow-hidden rounded-xl p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg'
              >
                <Image
                  src='/admin-sidebar-card.jpg'
                  alt=''
                  fill
                  sizes='280px'
                  aria-hidden='true'
                  className='-z-20 object-cover transition-transform duration-500 ease-out group-hover/home-card:scale-110'
                />
                <div className='absolute inset-0 -z-10 bg-black/50' />
                <div>
                  <p className='text-base font-semibold text-white'>
                    Visit {APP_NAME}
                  </p>
                  <p className='text-xs text-white/80'>
                    Back to the reading side
                  </p>
                </div>
                <span className='bg-primary text-primary-foreground ml-auto flex size-8 shrink-0 items-center justify-center rounded-full shadow transition-transform duration-300 group-hover/home-card:translate-x-1'>
                  <ArrowRightIcon className='size-4' />
                </span>
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className='bg-card flex flex-1 flex-col overflow-hidden md:mt-4 md:rounded-tl-xl md:border'>
          <header className='bg-card sticky top-0 z-50 rounded-t-xl border-b'>
            <div className='flex items-center gap-2 px-4 py-2 lg:py-3'>
              <div className='flex min-w-0 items-center gap-2'>
                <SidebarTrigger className='[&_svg]:size-5!' />
                <Separator
                  orientation='vertical'
                  className='h-5! data-vertical:self-center'
                />
                <AdminBreadcrumb className='max-lg:hidden' />
              </div>
              <div className='flex flex-1 justify-center'>
                <AdminSearch
                  className='w-full max-w-md'
                  trigger={
                    <>
                      <Button
                        variant='outline'
                        size='lg'
                        className='text-muted-foreground! hidden w-full max-w-md justify-start gap-2 px-2.5 font-normal sm:flex'
                      >
                        <IoSearch className='size-4' />
                        <span>Search for users...</span>
                      </Button>
                      <Button variant='ghost' size='icon' className='sm:hidden'>
                        <IoSearch />
                        <span className='sr-only'>Search for users</span>
                      </Button>
                    </>
                  }
                />
              </div>
              <div className='flex items-center gap-1.5'>
          
                <NotificationsBell
                  username={user.name}
                  isAdmin
                  className='max-lg:hidden'
                />
                <ThemeToggle />
                <AdminUserMenu
                  name={user.name}
                  email={user.email}
                  image={user.image}
                  trigger={
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full'
                      aria-label='Open profile menu'
                    >
                      <Avatar className='size-8'>
                        <AvatarImage
                          src={user.image ?? DEFAULT_AVATAR}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          <Skeleton className='size-full rounded-full' />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  }
                />
              </div>
            </div>
          </header>
          <div className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
            <main className='flex-1 px-4 pt-12 pb-4 sm:px-6 sm:pt-14 sm:pb-6'>
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminShell;
