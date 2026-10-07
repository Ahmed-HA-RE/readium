import { IoMdCheckmark } from 'react-icons/io';
import { AiOutlineMinusCircle } from 'react-icons/ai';
import { FaArrowRight } from 'react-icons/fa6';
import type { Subscription } from '@better-auth/stripe';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import {
  PLAN_FEATURES,
  PLANS,
  PRO_FIRST_YEAR_PRICE,
  PRO_PRICE,
  type BillingPeriod,
  type PlanId,
} from '@/lib/plans';
import ProPlanButton from './pro-plan-button';

type PlanPriceProps = {
  planId: PlanId;
  billingPeriod: BillingPeriod;
  showWelcomeOffer: boolean;
};

const PlanPrice = ({
  planId,
  billingPeriod,
  showWelcomeOffer,
}: PlanPriceProps) => {
  const isYearly = billingPeriod === 'yearly';
  const isDiscounted = isYearly && showWelcomeOffer;
  const yearlyPrice = isDiscounted ? PRO_FIRST_YEAR_PRICE : PRO_PRICE.yearly;

  if (planId === 'free') {
    return (
      <>
        <span className='text-2xl font-bold text-foreground sm:text-4xl'>
          $0
        </span>
        <span className='text-sm font-medium text-muted-foreground'>
          {isYearly ? 'Per Year' : 'Per Month'}
        </span>
      </>
    );
  }

  return (
    <>
      <span className='flex flex-col items-center text-2xl font-bold text-foreground sm:flex-row sm:items-baseline sm:gap-1.5 sm:text-4xl'>
        {isDiscounted && (
          <s className='text-base font-medium text-muted-foreground sm:text-xl'>
            ${PRO_PRICE.yearly}
          </s>
        )}
        <span
          className={cn(
            'whitespace-nowrap',
            isDiscounted && 'rounded-sm bg-app px-1 text-white',
          )}
        >
          $
          <NumberTicker value={isYearly ? yearlyPrice : PRO_PRICE.monthly} />
        </span>
      </span>
      <span className='text-sm font-medium text-muted-foreground '>
        {isDiscounted
          ? `for the first year, then $${PRO_PRICE.yearly}/year`
          : isYearly
            ? 'Per Year'
            : 'Per Month'}
      </span>
    </>
  );
};

type PricingTableProps = {
  billingPeriod: BillingPeriod;
  activeSubscription: Subscription | null;
  isAdmin: boolean;
  showWelcomeOffer: boolean;
};

const PricingTable = ({
  billingPeriod,
  activeSubscription,
  isAdmin,
  showWelcomeOffer,
}: PricingTableProps) => {
  return (
    <div className='w-full overflow-x-auto'>
      <div className='grid min-w-[20rem] grid-cols-[7rem_1fr] bg-background sm:min-w-[32rem] sm:grid-cols-[12rem_1fr] lg:min-w-[46.5rem] lg:grid-cols-[20rem_1fr]'>
        <div className='flex flex-col'>
          <div className='h-43 border-b border-border sm:h-39 lg:h-34' />

          {PLAN_FEATURES.map((feature) => (
            <div
              key={feature.label}
              className='flex h-17 items-center border-b border-border px-2 text-[0.8125rem] leading-tight font-medium sm:px-4 sm:text-sm sm:leading-normal lg:text-lg'
            >
              {feature.label}
            </div>
          ))}

          <div className='h-17' />
        </div>

        <div className='grid grid-cols-[repeat(2,minmax(6.5rem,1fr))] overflow-hidden rounded-md bg-linear-to-b from-transparent from-0% to-muted to-100% sm:grid-cols-[repeat(2,minmax(10rem,1fr))] lg:grid-cols-[repeat(2,minmax(13.25rem,1fr))]'>
          {PLANS.map((plan) => {
            const columnContent = (
              <div
                className={cn(
                  'flex h-full flex-col',
                  plan.isPopular && 'rounded-md bg-card',
                )}
              >
                <div
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 border-b border-border px-3 py-1.5 text-center sm:p-3',
                    // Sized per breakpoint to the yearly Pro price, the tallest cell; the Pro column loses 0.25rem to its border.
                    plan.isPopular
                      ? 'h-42 sm:h-38 lg:h-33'
                      : 'h-43 sm:h-39 lg:h-34',
                  )}
                >
                  <h3 className='text-xl font-semibold text-foreground sm:text-2xl'>
                    {plan.name}
                  </h3>
                  <PlanPrice
                    planId={plan.id}
                    billingPeriod={billingPeriod}
                    showWelcomeOffer={showWelcomeOffer}
                  />
                </div>

                {PLAN_FEATURES.map((feature) => (
                  <div
                    key={feature.label}
                    className='flex h-17 items-center justify-center border-b border-border px-4'
                  >
                    {feature.includedIn.includes(plan.id) ? (
                      <IoMdCheckmark
                        className='size-6 text-emerald-600'
                        role='img'
                        aria-label='Included'
                      />
                    ) : (
                      <AiOutlineMinusCircle
                        className='size-6 text-amber-600'
                        role='img'
                        aria-label='Not included'
                      />
                    )}
                  </div>
                ))}

                <div
                  className={cn(
                    'flex items-center justify-center',
                    plan.isPopular ? 'h-16' : 'h-17',
                  )}
                >
                  {plan.id === 'pro' ? (
                    <ProPlanButton
                      billingPeriod={billingPeriod}
                      activeSubscription={activeSubscription}
                      isAdmin={isAdmin}
                    />
                  ) : (
                    // Free has no flow yet: leaving Pro is cancelling, which belongs to the Membership tab.
                    <Button
                      variant='ghost'
                      disabled
                      className='gap-1 px-4 text-sm font-medium text-foreground'
                    >
                      Select
                      <FaArrowRight className='size-3.5' />
                    </Button>
                  )}
                </div>
              </div>
            );

            if (plan.isPopular) {
              return (
                <div
                  key={plan.id}
                  className='rounded-md bg-linear-to-b from-app-from/20 from-0% to-app-to/35 to-100% p-1'
                >
                  {columnContent}
                </div>
              );
            }

            return <div key={plan.id}>{columnContent}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingTable;
