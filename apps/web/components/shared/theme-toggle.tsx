'use client';

import { useTheme } from '@wrksz/themes/client';
import { GoMoon, GoSun } from 'react-icons/go';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

const ThemeToggle = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Button
      variant='ghost-plain'
      size='icon-lg'
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={cn('text-muted-foreground', className)}
    >
      <GoSun className='size-4.5 dark:hidden' />
      <GoMoon className='hidden size-4.5 dark:block' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
