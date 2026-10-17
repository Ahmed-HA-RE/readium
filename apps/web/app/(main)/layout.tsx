import { cookies } from 'next/headers';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/home/header';
import HomeSidebar from '@/components/home/home-sidebar';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const [session, cookieStore] = await Promise.all([
    getCurrentLoggedInUser(),
    cookies(),
  ]);

  // `SidebarProvider` writes this cookie on every toggle, so reading it here
  // keeps the sidebar's open state across reloads. Absent means open.
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      // Narrower than the 16rem default, to match the reference design.
      style={{ '--sidebar-width': '15rem' } as React.CSSProperties}
      // The mobile sheet ignores `--sidebar-width` from `style`, so its width
      // takes a dedicated prop. See shadcn-ui/ui#5509.
      mobileSidebarWidth='20rem'
    >
      <div className='flex min-h-svh w-full flex-col'>
        <Header />

        {/* The header spans the full width, so the sidebar and the content
            share a row below it rather than sitting beside the header. */}
        <div className='flex flex-1'>
          {/* Admins have no stories, library or profile here; their nav is the header's Dashboard link. */}
          {session && session.user.role !== 'admin' && (
            <HomeSidebar username={session.user.name} />
          )}
          <main className='min-w-0 flex-1'>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
