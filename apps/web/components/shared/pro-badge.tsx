'use client';

import { IoStarSharp } from 'react-icons/io5';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ProBadgeProps = {
  className?: string;
};

const ProBadge = ({ className }: ProBadgeProps) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <button
          type='button'
          aria-label='Pro member'
          className='inline-flex shrink-0 cursor-default'
        />
      }
    >
      <IoStarSharp
        aria-hidden
        className={cn('size-5 text-yellow-500', className)}
      />
    </TooltipTrigger>
    <TooltipContent>Pro member</TooltipContent>
  </Tooltip>
);

export default ProBadge;
