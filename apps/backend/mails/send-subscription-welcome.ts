import { resend } from '../lib/resend';
import SubscriptionWelcome from '../emails/subscription-welcome';
import { APP_NAME } from '@repo/constants';

const sendSubscriptionWelcome = async (email: string, name: string) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: `Welcome to ${APP_NAME} Pro`,
    react: SubscriptionWelcome({
      name,
      newStoryUrl: `${process.env.APP_FRONTEND_URL}/new-story`,
      homeUrl: `${process.env.APP_FRONTEND_URL}/`,
    }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendSubscriptionWelcome;
