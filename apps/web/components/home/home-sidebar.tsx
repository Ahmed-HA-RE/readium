'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import type { IconType } from 'react-icons';
import { IoHome, IoNewspaperOutline } from 'react-icons/io5';
import { MdLibraryBooks } from 'react-icons/md';
import { FaRegHeart, FaRegUser } from 'react-icons/fa';
import { APP_LOGO } from '@repo/assets';
import { getProfilePath } from '@/lib/routes';
import type { ListsTab } from '@/lib/search-params';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const logoStyle = { width: 36, height: 'auto' };

type NavItem = {
  path: string;
  tab?: ListsTab;
  label: string;
  Icon: IconType;
  // Keeps `/` and `/@name` from matching every route nested under them.
  exact?: boolean;
};

// Users only: the layout doesn't render the sidebar for admins.
const getNavItems = (username: string): NavItem[] => [
  { path: '/', label: 'Home', Icon: IoHome, exact: true },
  { path: '/me/stories', label: 'Stories', Icon: IoNewspaperOutline },
  { path: '/me/lists', label: 'Library', Icon: MdLibraryBooks },
  { path: '/me/lists', tab: 'likes', label: 'Likes', Icon: FaRegHeart },
  {
    path: getProfilePath(username),
    label: 'Profile',
    Icon: FaRegUser,
    exact: true,
  },
];

const getHref = ({ path, tab }: NavItem) => (tab ? `${path}?tab=${tab}` : path);

// A tabless item on a shared path is active unless a sibling claims the current tab.
const isActiveItem = (
  item: NavItem,
  items: NavItem[],
  pathname: string,
  tab: string | null,
) => {
  const isOnPath = item.exact
    ? pathname === item.path
    : pathname === item.path || pathname.startsWith(`${item.path}/`);

  if (!isOnPath) return false;
  if (item.tab) return item.tab === tab;

  return !items.some((other) => other.path === item.path && other.tab === tab);
};

type HomeSidebarProps = {
  username: string;
};

const HomeSidebar = ({ username }: HomeSidebarProps) => {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const { setOpenMobile } = useSidebar();
  const navItems = getNavItems(username);

  return (
    <Sidebar
      // Offset below the sticky `h-15` header, which the fixed container would
      // otherwise sit underneath.
      className='bg-background top-15 h-[calc(100svh-3.75rem)]'
      aria-label='Main'
    >
      {/* Below `md` the sidebar is a full-width sheet that covers the header,
          taking the logo with it — so it gets its own. */}
      <SidebarHeader className='bg-background px-5 pt-8 pb-5 md:hidden'>
        <Link
          href='/'
          onClick={() => setOpenMobile(false)}
          className='flex w-fit shrink-0 items-center gap-2'
        >
          {/* Decorative: the wordmark beside it already names the link. */}
          <Image
            src={APP_LOGO}
            alt=''
            width={0}
            height={0}
            sizes='100vw'
            style={logoStyle}
          />
          <span className='from-app-from to-app-to bg-linear-to-r bg-clip-text text-2xl font-bold tracking-widest text-transparent'>
            Readium
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className='bg-background'>
        {/* At `md` and up the logo header is hidden, so the nav needs its own
            top spacing to clear the header. */}
        <SidebarGroup className='px-1 py-2 md:pt-8'>
          <SidebarGroupContent>
            <SidebarMenu className='gap-1'>
              {navItems.map((item) => {
                const { label, Icon } = item;
                const href = getHref(item);

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={isActiveItem(item, navItems, pathname, tab)}
                      // The indicator is a pseudo-element rather than a border so
                      // its height stays fixed as the row height changes.
                      className='text-muted-foreground data-active:text-foreground data-active:before:bg-foreground relative h-11 gap-4 px-4 text-base before:absolute before:top-1/2 before:left-0 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-transparent data-active:bg-transparent [&_svg]:size-5'
                      render={
                        <Link href={href} onClick={() => setOpenMobile(false)}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default HomeSidebar;
