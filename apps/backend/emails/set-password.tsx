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
import EmailButton from './components/email-button';
import EmailFooter from './components/email-footer';
import ExpireToken from './components/expire-token';

export type PasswordEmailMode = 'reset' | 'setup';

interface SetPasswordProps {
  url: string;
  // `setup` when the user has no password yet, i.e. signed up with a social account.
  mode: PasswordEmailMode;
}

const COPY = {
  reset: {
    preview: `Reset your ${APP_NAME} password securely.`,
    heading: 'Reset your password',
    body: `We received a request to reset your ${APP_NAME} password. Click the button below to choose a new password.`,
    button: 'Reset Password',
  },
  setup: {
    preview: `Create a password for your ${APP_NAME} account.`,
    heading: 'Create your password',
    body: `You signed up for ${APP_NAME} with a social account, so you don't have a password yet. Click the button below to create one.`,
    button: 'Create Password',
  },
} satisfies Record<PasswordEmailMode, Record<string, string>>;

const SetPassword = ({ url, mode }: SetPasswordProps): React.ReactNode => (
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
        <Preview>{COPY[mode].preview}</Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  {COPY[mode].heading}
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  {COPY[mode].body}
                  <br />
                  If you didn&apos;t make this request, you can safely ignore
                  this email.
                </Text>
              </Section>

              <EmailButton content={COPY[mode].button} url={url} />
              <ExpireToken content="This link expires in 30 minutes." />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

SetPassword.PreviewProps = {
  url: 'https://example.com/',
  mode: 'setup',
} satisfies SetPasswordProps;

export default SetPassword;
