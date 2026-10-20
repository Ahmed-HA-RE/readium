'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ADMIN_NOTIFICATIONS_PATH, ADMIN_OVERVIEW_PATH } from '@/lib/routes';
import { ADMIN_NAV_GROUPS, isActivePath } from './sidebar-grouped-menu-items';

// Every sidebar route but the overview, plus the bell's route, which has no sidebar item.
const SECTIONS = [
  ...ADMIN_NAV_GROUPS.flatMap(({ items }) => items).filter(
    ({ href }) => href !== ADMIN_OVERVIEW_PATH,
  ),
  { label: 'Notifications', href: ADMIN_NOTIFICATIONS_PATH },
];

const AdminBreadcrumb = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const section = SECTIONS.find(({ href }) => isActivePath(pathname, href));

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {section ? (
            <BreadcrumbLink render={<Link href={ADMIN_OVERVIEW_PATH} />}>
              Dashboard
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {section && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{section.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AdminBreadcrumb;
