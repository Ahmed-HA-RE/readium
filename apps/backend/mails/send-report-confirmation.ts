import ReportConfirmation, {
  ReportConfirmationProps,
} from '../emails/report-confirmation';
import { resend } from '../lib/resend';
import { APP_NAME } from '@repo/constants';

const sendReportConfirmation = async ({
  reporterName,
  reporterEmail,
  referenceId,
  blogTitle,
  createdAt,
}: ReportConfirmationProps & { reporterEmail: string }) => {
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <support@${process.env.EMAIL_DOMAIN}>`,
    to: reporterEmail,
    subject: 'Your report has been received',
    react: ReportConfirmation({
      reporterName,
      referenceId,
      blogTitle,
      createdAt,
    }),
  });

  if (error) {
    return console.error({ error });
  }
};

export default sendReportConfirmation;
