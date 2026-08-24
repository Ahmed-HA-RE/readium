import {
  Body,
  Container,
  Head,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { APP_NAME } from '@repo/constants';
import { APP_LOGO } from '@repo/assets';
import EmailFooter from './components/email-footer';

export interface ReportConfirmationProps {
  reporterName: string;
  referenceId: string;
  blogTitle: string;
  createdAt: Date;
}

const ReportConfirmation = ({
  reporterName,
  referenceId,
  blogTitle,
  createdAt,
}: ReportConfirmationProps): React.ReactNode => (
  <Tailwind
    config={{
      presets: [pixelBasedPreset],
    }}
  >
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap');

            * {
              font-family: 'Inter', sans-serif;
            }
          `}
        </style>
      </Head>

      <Body className="bg-bg-2 m-0 p-0">
        <Preview>
          Your report has been submitted successfully. Thank you for helping
          keep {APP_NAME} safe.
        </Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <Section className="mb-8">
                <Img
                  src={APP_LOGO}
                  alt="Logo"
                  width={50}
                  className="block mx-auto"
                />
              </Section>

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  Report received
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Hi {reporterName}, thank you for helping keep {APP_NAME} safe.
                  <br />
                  We&apos;ve received your report and our team will review it
                  shortly. Here&apos;s a summary of what you submitted:
                </Text>

                <ul className="m-0 mt-6 text-left text-gray-500 list-disc pl-6">
                  {[
                    {
                      label: 'Reference ID',
                      value: `#${referenceId.slice(-8)}`,
                    },
                    { label: 'Blog', value: blogTitle },
                    {
                      label: 'Reported on',
                      value: createdAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }),
                    },
                  ].map(({ label, value }) => (
                    <li key={label} className="mb-2">
                      <span className="font-medium text-gray-700">
                        {label}:
                      </span>{' '}
                      {value}
                    </li>
                  ))}
                </ul>
              </Section>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

ReportConfirmation.PreviewProps = {
  reporterName: 'Jane Doe',
  referenceId: '21c00cf0-cc62-4bdc-985f-854f9b0cdb5e',
  blogTitle: 'How to build a React app',
  createdAt: new Date(),
} satisfies ReportConfirmationProps;

export default ReportConfirmation;
