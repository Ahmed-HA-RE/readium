'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { IoHome, IoNewspaperOutline } from 'react-icons/io5';
import { MdLibraryBooks } from 'react-icons/md';
import { FaRegHeart, FaRegUser } from 'react-icons/fa';
import { APP_LOGO } from '@repo/assets';
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

// `exact` keeps `/` and `/me` from matching every route nested under them.
const navItems = [
  { href: '/', label: 'Home', Icon: IoHome, exact: true },
  { href: '/me/stories', label: 'Stories', Icon: IoNewspaperOutline },
  { href: '/me/lists/bookmarks', label: 'Library', Icon: MdLibraryBooks },
  { href: '/me/lists/likes', label: 'Likes', Icon: FaRegHeart },
  { href: '/me', label: 'Profile', Icon: FaRegUser, exact: true },
];

const isActiveRoute = (pathname: string, href: string, exact?: boolean) =>
  exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

const HomeSidebar = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar
      // Offset below the sticky `h-14` header, which the fixed container would
      // otherwise sit underneath.
      className='bg-background top-14 h-[calc(100svh-3.5rem)]'
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
              {navItems.map(({ href, label, Icon, exact }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={isActiveRoute(pathname, href, exact)}
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default HomeSidebar;
