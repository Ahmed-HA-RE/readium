import Stripe from 'stripe';
import type { StripeOptions } from '@better-auth/stripe';

// The ESM-only plugin types `stripe`'s ESM build, this CJS file gets the CJS one; same client at runtime.
export const stripeClient = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
) as unknown as StripeOptions['stripeClient'];

// Runs after the account is gone, so failures are logged, never thrown. Stripe cancels the customer's subscriptions with it.
export const deleteStripeCustomer = async (
  customerId: string,
): Promise<void> => {
  try {
    await stripeClient.customers.del(customerId);
  } catch (error) {
    console.error(`Failed to delete the Stripe customer ${customerId}`, error);
  }
};
