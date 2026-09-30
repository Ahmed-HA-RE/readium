import { resend } from '../lib/resend';
import ConfirmEmailChange from '../emails/confirm-email-change';
import { APP_NAME } from '@repo/constants';

const sendChangeEmailConfirmation = async (
  currentEmail: string,
  newEmail: string,
  url: string,
) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: currentEmail,
    subject: 'Approve your email change',
    react: ConfirmEmailChange({ url, newEmail }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendChangeEmailConfirmation;
