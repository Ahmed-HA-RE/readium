import Stripe from 'stripe';
import type { StripeOptions } from '@better-auth/stripe';

// The ESM-only plugin types `stripe`'s ESM build, this CJS file gets the CJS one; same client at runtime.
export const stripeClient = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
) as unknown as StripeOptions['stripeClient'];

// Ends the subscription now; Stripe doesn't refund or credit the unused time on cancel.
// Runs after a ban already succeeded, so failures are logged, never thrown.
export const cancelStripeSubscription = async (
  subscriptionId: string,
): Promise<void> => {
  try {
    await stripeClient.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error(
      `Failed to cancel the Stripe subscription ${subscriptionId}`,
      error,
    );
  }
};

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
