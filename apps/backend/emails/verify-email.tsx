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

interface VerifyEmailProps {
  url: string;
  // Better Auth sends sign-up and email-change verification through the same hook.
  isEmailChange?: boolean;
}

const COPY = {
  signUp: {
    preview: `Confirm your email address to finish setting up your ${APP_NAME} account.`,
    heading: 'One last step',
    body: (
      <>
        Thanks for creating your {APP_NAME} account.
        <br />
        To create your account, share your ideas, and start publishing on{' '}
        {APP_NAME}, please confirm your email address.
      </>
    ),
    button: 'Confirm Email',
  },
  emailChange: {
    preview: `Confirm this address to finish changing your ${APP_NAME} email.`,
    heading: 'Confirm your new email',
    body: (
      <>
        You asked to use this address for your {APP_NAME} account.
        <br />
        Confirm it to finish the change. Until you do, you keep signing in with
        your current email.
      </>
    ),
    button: 'Confirm New Email',
  },
};

const VerifyEmail = ({
  url,
  isEmailChange = false,
}: VerifyEmailProps): React.ReactNode => {
  const copy = isEmailChange ? COPY.emailChange : COPY.signUp;

  return (
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
          <Preview>{copy.preview}</Preview>

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
                    {copy.heading}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">{copy.body}</Text>
                </Section>

                <EmailButton content={copy.button} url={url} />
                <ExpireToken content="This link expires in 1 hour." />
              </Section>
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

VerifyEmail.PreviewProps = {
  url: 'https://example.com/',
  isEmailChange: false,
} satisfies VerifyEmailProps;

export default VerifyEmail;
