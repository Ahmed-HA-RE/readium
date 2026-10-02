import { resend } from '../lib/resend';
import SetPassword, { type PasswordEmailMode } from '../emails/set-password';
import { APP_NAME } from '@repo/constants';

const SUBJECTS: Record<PasswordEmailMode, string> = {
  reset: 'Reset your password',
  setup: `Create your ${APP_NAME} password`,
};

const sendSetPasswordEmail = async (
  email: string,
  url: string,
  mode: PasswordEmailMode,
) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@${process.env.EMAIL_DOMAIN}>`,
    to: email,
    subject: SUBJECTS[mode],
    react: SetPassword({ url, mode }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendSetPasswordEmail;
