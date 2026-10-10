// Abandoned or failed first checkouts, which never made the user a subscriber.
export const ABANDONED_CHECKOUT_STATUSES = ['incomplete', 'incomplete_expired'];

// Matches the Stripe plugin's own "active or trialing" check behind `subscription.list`.
export const PRO_STATUSES = ['active', 'trialing'];
