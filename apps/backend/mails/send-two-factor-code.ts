import { resend } from '../lib/resend';
import TwoFactorCode from '../emails/two-factor-code';
import { APP_NAME } from '@repo/constants';

const sendTwoFactorCode = async (email: string, otp: string) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: `Your ${APP_NAME} sign-in code`,
    react: TwoFactorCode({ otp }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendTwoFactorCode;
