'use client';

import { AnimatePresence, motion } from 'motion/react';
import { IoStarSharp } from 'react-icons/io5';
import { LuGlobe } from 'react-icons/lu';
import { cn } from '@/lib/utils';

type ProSwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-describedby'?: string;
  className?: string;
};

const ProSwitch = ({
  id,
  checked,
  onCheckedChange,
  disabled,
  'aria-describedby': ariaDescribedBy,
  className,
}: ProSwitchProps) => (
  <div className={cn('flex items-center gap-3', className)}>
    <span
      aria-hidden
      className={cn(
        'text-sm font-medium tracking-tight transition-colors duration-300',
        checked ? 'text-muted-foreground/40' : 'text-foreground',
      )}
    >
      Public
    </span>

    <button
      id={id}
      type='button'
      role='switch'
      aria-checked={checked}
      aria-label='Pro only'
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-1 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-yellow-500' : 'bg-muted-foreground/40',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ marginLeft: checked ? 'auto' : 0 }}
        className='relative z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-sm'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {checked ? (
            <motion.span
              key='pro'
              initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: 45 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <IoStarSharp className='size-3.5 text-yellow-500' />
            </motion.span>
          ) : (
            <motion.span
              key='public'
              initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: -45 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <LuGlobe className='size-3.5 text-muted-foreground' />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>

    <span
      aria-hidden
      className={cn(
        'text-sm font-medium tracking-tight transition-colors duration-300',
        checked ? 'text-foreground' : 'text-muted-foreground/40',
      )}
    >
      Pro only
    </span>
  </div>
);

export default ProSwitch;
