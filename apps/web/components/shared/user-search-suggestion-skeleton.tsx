import { cn } from 'cn';
import { Skeleton } from '@/components/ui/skeleton';

// One loading user row, shared by the home search and the admin header search.
const UserSearchSuggestionSkeleton = ({
  className,
}: {
  className?: string;
}) => (
  <div className={cn('flex items-center gap-3 px-2 py-1.5', className)}>
    <Skeleton className='size-8 shrink-0 rounded-full' />
    <Skeleton className='h-4 w-40' />
  </div>
);

export default UserSearchSuggestionSkeleton;
