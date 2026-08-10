import { resend } from '../lib/resend';
import ForgotPassword from '../emails/forgot-password';
import { APP_NAME } from '@repo/constants';

const sendRequestPasswordReset = async (email: string, url: string) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: 'Reset your password',
    react: ForgotPassword({ url }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendRequestPasswordReset;
