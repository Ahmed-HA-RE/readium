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
import EmailButton from './components/email-button';
import EmailFooter from './components/email-footer';
import ExpireToken from './components/expire-token';

interface ConfirmEmailChangeProps {
  url: string;
  newEmail: string;
}

// Sent to the current address; approving it mails the verification link to `newEmail`.
const ConfirmEmailChange = ({
  url,
  newEmail,
}: ConfirmEmailChangeProps): React.ReactNode => (
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
        <Preview>Approve the change to your {APP_NAME} email address.</Preview>

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
                  Approve your email change
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Someone asked to change the email on your {APP_NAME} account
                  to <strong className="text-gray-900">{newEmail}</strong>.
                  <br />
                  If it was you, approve the change and we&apos;ll send a
                  confirmation link to the new address. If it wasn&apos;t, you
                  can ignore this email and nothing will change.
                </Text>
              </Section>

              <EmailButton content="Approve Change" url={url} />
              <ExpireToken content="This link expires in 1 hour." />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

ConfirmEmailChange.PreviewProps = {
  url: 'https://example.com/',
  newEmail: 'new-address@example.com',
} satisfies ConfirmEmailChangeProps;

export default ConfirmEmailChange;
