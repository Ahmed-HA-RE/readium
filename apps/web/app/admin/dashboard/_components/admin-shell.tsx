import type { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaBell } from 'react-icons/fa';
import {
  LayoutDashboardIcon,
  ChartPieIcon,
  FileTextIcon,
  FolderIcon,
  ListTodoIcon,
  CalendarIcon,
  UsersIcon,
  ShieldCheckIcon,
  SettingsIcon,
  BellIcon,
  CreditCardIcon,
  PlugIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { IoSearch } from 'react-icons/io5';
import { APP_LOGO } from '@repo/assets';
import { APP_NAME } from '@repo/constants';
import { cn } from 'cn';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import ThemeToggle from '@/components/shared/theme-toggle';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { ADMIN_NOTIFICATIONS_PATH, ADMIN_OVERVIEW_PATH } from '@/lib/utils';
import AdminSearch from './admin-search';
import AdminUserMenu from './admin-user-menu';

const logoStyle = { width: 32, height: 'auto' };

type MenuSubItem = {
  label: string;
  href: string;
};

type MenuItem = {
  icon: ReactElement;
  label: string;
  isActive?: boolean;
} & (
  | {
      href: string;
      items?: never;
    }
  | { href?: never; items: MenuSubItem[] }
);

// The aside keeps the block's placeholder domains until a later phase replaces them.
const generalItems: MenuItem[] = [
  {
    icon: <LayoutDashboardIcon />,
    label: 'Dashboard',
    href: '#',
    isActive: true,
  },
  {
    icon: <ChartPieIcon />,
    label: 'Analytics',
    href: '#',
  },
  {
    icon: <FileTextIcon />,
    label: 'Reports',
    href: '#',
  },
];

const workspaceItems: MenuItem[] = [
  {
    icon: <FolderIcon />,
    label: 'Projects',
    items: [
      { label: 'All Projects', href: '#' },
      { label: 'New Project', href: '#' },
    ],
  },
  {
    icon: <ListTodoIcon />,
    label: 'Tasks',
    href: '#',
  },
  {
    icon: <CalendarIcon />,
    label: 'Calendar',
    href: '#',
  },
];

const teamItems: MenuItem[] = [
  {
    icon: <UsersIcon />,
    label: 'Members',
    href: '#',
  },
  {
    icon: <ShieldCheckIcon />,
    label: 'Roles & Permissions',
    href: '#',
  },
];

const settingsItems: MenuItem[] = [
  {
    icon: <SettingsIcon />,
    label: 'General',
    href: '#',
  },
  {
    icon: <BellIcon />,
    label: 'Notifications',
    href: '#',
  },
  {
    icon: <CreditCardIcon />,
    label: 'Billing',
    href: '#',
  },
  {
    icon: <PlugIcon />,
    label: 'Integrations',
    href: '#',
  },
];

const SidebarGroupedMenuItems = ({
  data,
  groupLabel,
}: {
  data: MenuItem[];
  groupLabel?: string;
}) => {
  return (
    <SidebarGroup>
      {groupLabel && <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {data.map((item) =>
            item.items ? (
              <Collapsible className='group/collapsible' key={item.label}>
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.label}
                        className='hover:bg-primary/10 data-active:bg-background/10'
                      />
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <ChevronRightIcon className='ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90' />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton
                            className='hover:bg-primary/10'
                            render={<a href={subItem.href} />}
                          >
                            {subItem.label}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={item.isActive}
                  tooltip={item.label}
                  className='hover:bg-primary/10 data-active:bg-primary/10'
                  render={<a href={item.href} />}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

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
            <SidebarGroupedMenuItems data={generalItems} groupLabel='General' />
            <div
              className='hidden group-data-[collapsible=icon]:block'
              aria-hidden='true'
            >
              <Separator className='my-2' />
            </div>
            <SidebarGroupedMenuItems
              data={workspaceItems}
              groupLabel='Workspace'
            />
            <div
              className='hidden group-data-[collapsible=icon]:block'
              aria-hidden='true'
            >
              <Separator className='my-2' />
            </div>
            <SidebarGroupedMenuItems data={teamItems} groupLabel='Team' />
            <div
              className='hidden group-data-[collapsible=icon]:block'
              aria-hidden='true'
            >
              <Separator className='my-2' />
            </div>
            <SidebarGroupedMenuItems
              data={settingsItems}
              groupLabel='Settings'
            />
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
                <Breadcrumb className='max-lg:hidden'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
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
                <Link
                  href={ADMIN_NOTIFICATIONS_PATH}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                  )}
                >
                  <FaBell />
                  <span className='sr-only'>Notifications</span>
                </Link>
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
