import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

type OverviewTableCardProps = {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
};

const OverviewTableCard = ({
  title,
  viewAllHref,
  viewAllLabel,
  children,
}: OverviewTableCardProps) => (
  <section className='flex min-w-0 flex-col gap-4'>
    <h2 className='text-2xl font-semibold tracking-tight'>{title}</h2>
    <div className='flex flex-1 flex-col rounded-xl border'>
      {children}
      <div className='mt-auto flex justify-end border-t px-4 py-3'>
        <Link
          href={viewAllHref}
          className='text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition'
        >
          {viewAllLabel}
          <FaArrowRight className='size-3' />
        </Link>
      </div>
    </div>
  </section>
);

export default OverviewTableCard;
