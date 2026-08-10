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

interface ForgotPasswordProps {
  url: string;
}

const ForgotPassword = ({ url }: ForgotPasswordProps): React.ReactNode => (
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
        <Preview>Reset your {APP_NAME} password securely.</Preview>

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
                  Reset your password
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  We received a request to reset your {APP_NAME} password.
                  <br />
                  Click the button below to choose a new password. If you
                  didn&apos;t make this request, you can safely ignore this
                  email.
                </Text>
              </Section>

              <EmailButton content="Reset Password" url={url} />
              <ExpireToken content="This link expires in 30 minutes." />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

ForgotPassword.PreviewProps = {
  url: 'https://example.com/',
} satisfies ForgotPasswordProps;

export default ForgotPassword;
