import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/home/header';

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider defaultOpen={false}>
    <div className='flex min-h-svh w-full flex-col'>
      <Header />
      <main className='flex-1'>{children}</main>
    </div>
  </SidebarProvider>
);

export default MainLayout;
