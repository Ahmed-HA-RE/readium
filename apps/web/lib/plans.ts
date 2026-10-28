import type { CurrentUser } from '@repo/types';

export type BillingPeriod = 'monthly' | 'yearly';

export type PlanId = 'free' | 'pro';

export const PRO_PRICE = { monthly: 10, yearly: 100 } as const;

// The first yearly plan is 20% off; renewals bill the full yearly price.
export const WELCOME_OFFER_DISCOUNT = 0.2;

export const PRO_FIRST_YEAR_PRICE =
  PRO_PRICE.yearly * (1 - WELCOME_OFFER_DISCOUNT);

// Matches the checkout hook, which applies the coupon only to a first subscription.
export const isWelcomeOfferEligible = ({
  role,
  hasSubscribedBefore,
}: Pick<CurrentUser, 'role' | 'hasSubscribedBefore'>) =>
  !hasSubscribedBefore && role !== 'admin';

export const YEARLY_SAVINGS = PRO_PRICE.monthly * 12 - PRO_FIRST_YEAR_PRICE;

export const PLANS: { id: PlanId; name: string; isPopular?: boolean }[] = [
  { id: 'free', name: 'Free' },
  { id: 'pro', name: 'Pro', isPopular: true },
];

export const PLAN_FEATURES: { label: string; includedIn: PlanId[] }[] = [
  { label: 'Read every free story', includedIn: ['free', 'pro'] },
  { label: 'Preview Pro-only stories', includedIn: ['free', 'pro'] },
  { label: 'Write and publish your own stories', includedIn: ['free', 'pro'] },
  { label: 'Full access to Pro stories', includedIn: ['pro'] },
  { label: 'Make your own stories Pro-only', includedIn: ['pro'] },
  { label: 'Pro badge on your profile and stories', includedIn: ['pro'] },
];
