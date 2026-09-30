import { resend } from '../lib/resend';
import VerifyEmail from '../emails/verify-email';
import { APP_NAME } from '@repo/constants';

const sendEmailVerification = async (
  email: string,
  url: string,
  isEmailChange = false,
) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: isEmailChange
      ? 'Confirm your new email address'
      : 'Verify your email address',
    react: VerifyEmail({ url, isEmailChange }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendEmailVerification;
