import {
  Body,
  Container,
  Head,
  Html,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { APP_NAME } from '@repo/constants';
import AppLogo from './components/app-logo';
import EmailFooter from './components/email-footer';
import ExpireToken from './components/expire-token';

interface TwoFactorCodeProps {
  otp: string;
}

// Sent from the "Email code" tab of `/2fa` when the user can't reach their authenticator app.
const TwoFactorCode = ({ otp }: TwoFactorCodeProps): React.ReactNode => (
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
          Your {APP_NAME} sign-in code is {otp}
        </Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  Your sign-in code
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Enter this code to finish signing in to Readium. If you
                  didn&apos;t try to sign in, we recommend changing your
                  password to keep your account secure.
                </Text>
              </Section>

              <Section className="mx-auto max-w-[320px] rounded-[12px] border border-solid border-gray-200 bg-white px-6 py-5">
                <Text className="m-0 text-4xl font-semibold tracking-[0.3em] text-gray-900">
                  {otp}
                </Text>
              </Section>
              <ExpireToken content="This code expires in 1 hour." />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

TwoFactorCode.PreviewProps = {
  otp: '482913',
} satisfies TwoFactorCodeProps;

export default TwoFactorCode;
