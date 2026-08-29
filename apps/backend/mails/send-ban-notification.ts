import { resend } from '../lib/resend';
import BanNotification from '../emails/ban-notification';
import { APP_NAME } from '@repo/constants';

interface SendBanNotificationOptions {
  email: string;
  authorName: string;
  blogTitle: string;
  banReason: string;
  banType: 'temporary' | 'permanent';
}

const sendBanNotification = async ({
  email,
  authorName,
  blogTitle,
  banReason,
  banType,
}: SendBanNotificationOptions) => {
  const subject =
    banType === 'temporary'
      ? `Your ${APP_NAME} account has been suspended`
      : `Your ${APP_NAME} account has been permanently banned`;

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject,
    react: BanNotification({
      authorName,
      blogTitle,
      banReason,
      banType,
    }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendBanNotification;
