import { cn } from '@/lib/utils';

type SecuritySectionProps = {
  title: string;
  description: string;
  // Sits on the title row, e.g. "Unlink all"; wraps under the text on narrow screens.
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

const SecuritySection = ({
  title,
  description,
  action,
  className,
  children,
}: SecuritySectionProps) => (
  <section className={cn('flex flex-col gap-5', className)}>
    <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-3'>
      <div className='flex min-w-0 flex-1 basis-64 flex-col gap-1'>
        <h2 className='text-lg font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export default SecuritySection;
