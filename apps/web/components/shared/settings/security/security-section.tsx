import { cn } from '@/lib/utils';

type SecuritySectionProps = {
  title: string;
  description: string;

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
    <div className='flex flex-wrap items-start justify-between gap-x-12 gap-y-5'>
      <div className='flex max-w-xl min-w-0 flex-1 basis-64 flex-col gap-1'>
        <h2 className='text-lg font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {action && <div className='ml-auto'>{action}</div>}
    </div>
    {children}
  </section>
);

export default SecuritySection;
