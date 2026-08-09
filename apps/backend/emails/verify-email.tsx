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

interface VerifyEmailProps {
  url: string;
}

const VerifyEmail = ({ url }: VerifyEmailProps): React.ReactNode => (
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
          Confirm your email address to finish setting up your {APP_NAME}
          account.
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
                <Text className="m-0 text-4xl font-medium">One last step</Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Thanks for creating your {APP_NAME} account.
                  <br />
                  To create your account, share your ideas, and start publishing
                  on {APP_NAME}, please confirm your email address.
                </Text>
              </Section>

              <EmailButton content="Confirm Email" url={url} />
              <Text className="text-sm text-gray-400 mt-6 mb-0">
                This link expires in 1 hour.
              </Text>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

VerifyEmail.PreviewProps = {
  url: 'https://example.com/',
} satisfies VerifyEmailProps;

export default VerifyEmail;
