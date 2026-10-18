'use client';

import { Fragment, type ReactElement } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboardIcon, SettingsIcon } from 'lucide-react';
import { RiArticleFill } from 'react-icons/ri';
import { TbReportSearch } from 'react-icons/tb';
import { HiUsers } from 'react-icons/hi2';
import { Separator } from '@/components/ui/separator';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  ADMIN_BLOGS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_USERS_PATH,
} from '@/lib/utils';

export type MenuItem = {
  icon: ReactElement;
  label: string;
  href: string;
};

export const ADMIN_NAV_GROUPS: { label: string; items: MenuItem[] }[] = [
  {
    label: 'General',
    items: [
      {
        icon: <LayoutDashboardIcon />,
        label: 'Dashboard',
        href: ADMIN_OVERVIEW_PATH,
      },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { icon: <RiArticleFill />, label: 'Blogs', href: ADMIN_BLOGS_PATH },
      { icon: <HiUsers />, label: 'Users', href: ADMIN_USERS_PATH },
      { icon: <TbReportSearch />, label: 'Reports', href: ADMIN_REPORTS_PATH },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: <SettingsIcon />, label: 'Settings', href: ADMIN_SETTINGS_PATH },
    ],
  },
];


export const isActivePath = (pathname: string, href: string) =>
  href === ADMIN_OVERVIEW_PATH
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

const SidebarGroupedMenuItems = () => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return ADMIN_NAV_GROUPS.map((group, index) => (
    <Fragment key={group.label}>
      {index > 0 && (
        <div
          className='hidden group-data-[collapsible=icon]:block'
          aria-hidden='true'
        >
          <Separator className='my-2' />
        </div>
      )}
      <SidebarGroup>
        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={isActivePath(pathname, item.href)}
                  tooltip={item.label}
                  className='hover:bg-primary/10 data-active:bg-primary/10'
                  // On mobile the sidebar is a sheet, which client navigation doesn't close on its own.
                  render={
                    <Link
                      href={item.href}
                      onClick={() => setOpenMobile(false)}
                    />
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </Fragment>
  ));
};

export default SidebarGroupedMenuItems;
