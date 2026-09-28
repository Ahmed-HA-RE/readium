import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type RetryErrorProps = {
  message: string;
  onRetry: () => void;
  className?: string;
};

const RetryError = ({ message, onRetry, className }: RetryErrorProps) => (
  <div className={cn('flex flex-col items-center gap-3 py-16', className)}>
    <p className='text-muted-foreground'>{message}</p>
    <Button variant='outline' size='lg' onClick={onRetry}>
      Try again
    </Button>
  </div>
);

export default RetryError;
