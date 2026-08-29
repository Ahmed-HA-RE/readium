import { resend } from '../lib/resend';
import WarningNotification from '../emails/warning-notification';
import { APP_NAME } from '@repo/constants';

interface SendWarningNotificationOptions {
  email: string;
  authorName: string;
  blogTitle: string;
  banReason: string;
}

const sendWarningNotification = async ({
  email,
  authorName,
  blogTitle,
  banReason,
}: SendWarningNotificationOptions) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: `Content warning on your ${APP_NAME} account`,
    react: WarningNotification({ authorName, blogTitle, banReason }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendWarningNotification;
