'use client';

import { FaBars } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

// Client-only: it toggles the sidebar's open state, which lives in context.
const SidebarTrigger = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant='ghost-plain'
      size='icon-lg'
      onClick={toggleSidebar}
      className='text-muted-foreground'
    >
      <FaBars className='size-4.5' />
      <span className='sr-only'>Toggle sidebar</span>
    </Button>
  );
};

export default SidebarTrigger;
