import { resend } from '../lib/resend';
import DeleteAccountConfirmation from '../emails/delete-account-confirmation';
import { APP_NAME } from '@repo/constants';

const sendDeleteAccountConfirmation = async (email: string, url: string) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: `Confirm deleting your ${APP_NAME} account`,
    react: DeleteAccountConfirmation({ url }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendDeleteAccountConfirmation;
