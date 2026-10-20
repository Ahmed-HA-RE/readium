import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { APP_NAME } from '@repo/constants';
import { Badge } from '@/components/ui/badge';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { getLoginPath, getMySettingsPath, PLANS_PATH } from '@/lib/routes';
import PlansPricing from './_components/plans-pricing';

export const metadata: Metadata = {
  title: 'Plans',
  description: `Compare the Free and Pro plans on ${APP_NAME}. Go Pro to read every Pro-only story in full and publish your own.`,
};

const PlansPage = async () => {
  const session = await getCurrentLoggedInUser();
  if (!session) redirect(getLoginPath(PLANS_PATH));

  const { isPro, hasSubscribedBefore, role } = session.user;
  // Admins get Pro through their role and keep the page; members manage their plan in settings.
  const isAdmin = role === 'admin';
  if (isPro && !isAdmin) redirect(getMySettingsPath('membership'));
  // Matches the checkout hook, which applies the coupon only to a first subscription.
  const showWelcomeOffer = !hasSubscribedBefore && !isAdmin;

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 pt-8 pb-16 sm:px-6'>
      <div className='flex flex-col items-center text-center'>
        {showWelcomeOffer && (
          <Badge variant='app' shape='rectangle' size='lg' className='mb-8'>
            Welcome offer
          </Badge>
        )}
        <h1 className='max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
          Join a community of readers, writers, and thinkers.
        </h1>
        <p className='mt-2 text-lg text-foreground/90 sm:text-xl'>
          Unlock every single story
        </p>
      </div>

      <PlansPricing
        isAdmin={isAdmin}
        showWelcomeOffer={showWelcomeOffer}
      />
    </div>
  );
};

export default PlansPage;
