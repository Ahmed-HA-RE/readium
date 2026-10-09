import { resend } from '../lib/resend';
import SubscriptionCancelled from '../emails/subscription-cancelled';
import { APP_NAME } from '@repo/constants';

const sendSubscriptionCancelled = async (
  email: string,
  name: string,
  accessEndsAt?: Date,
) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: `Your ${APP_NAME} Pro membership has been cancelled`,
    react: SubscriptionCancelled({
      name,
      homeUrl: `${process.env.APP_FRONTEND_URL}/`,
      accessEndsAt,
    }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendSubscriptionCancelled;
