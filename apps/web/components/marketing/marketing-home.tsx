import Link from 'next/link';
import { PiUsersThreeFill } from 'react-icons/pi';
import { FaArrowRight } from 'react-icons/fa6';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import HeroHomepageIcon1 from '@/components/icons/hero-homepage-icon-1';
import HeroHomePageIcon2 from '@/components/icons/hero-homepage-icon-2';
import BrandMarquee from './brand-marquee';

const MarketingHome = () => (
  <div
    data-marketing-page
    className='bg-app/10 flex min-h-[calc(100svh-3.75rem)] flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8'
  >
    <Badge
      variant='default'
      className='h-auto gap-2.5 rounded-full px-6 py-1.5 text-xs font-medium [&>svg]:size-5! bg-primary/20 text-foreground'
    >
      <PiUsersThreeFill className='text-app shrink-0' />
      Trusted by 10,000+ Writers
    </Badge>

    {/* `relative` anchors the two decorative icons to the heading block. */}
    <div className='relative mt-8 max-w-3xl'>
      <HeroHomepageIcon1
        aria-hidden
        className='text-foreground/70 absolute -top-2 -left-10 hidden rotate-[-18deg] text-4xl sm:block lg:-left-16 lg:text-5xl'
      />
      <HeroHomePageIcon2
        aria-hidden
        className='text-foreground/60 absolute -top-4 -right-8 hidden rotate-[14deg] text-4xl sm:block lg:-right-14 lg:text-5xl'
      />

      <h1 className='text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
        Write Smarter. <br />
        Publish Faster.
      </h1>
    </div>

    <p className='text-muted-foreground mt-6 max-w-[530px] text-center text-base md:text-lg lg:text-xl '>
      Publish your ideas in minutes and reach readers who actually want to read
      them.
    </p>

    <Link
      href='/sign-up'
      className={cn(buttonVariants({ size: 'xl' }), 'mt-10 rounded-full ')}
    >
      Start reading
      <FaArrowRight className='animate-bounce' />
    </Link>

    <div className='mt-24 w-full max-w-5xl'>
      <BrandMarquee />
    </div>
  </div>
);

export default MarketingHome;
