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

interface DeleteAccountConfirmationProps {
  url: string;
}

// Sent by Better Auth's `sendDeleteAccountVerification`; the account is only deleted once the link is opened.
const DeleteAccountConfirmation = ({
  url,
}: DeleteAccountConfirmationProps): React.ReactNode => (
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
        <Preview>Confirm the deletion of your {APP_NAME} account.</Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  Delete your account
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Someone asked to permanently delete your {APP_NAME} account.
                  Your stories, responses, likes, bookmarks and reports will be
                  deleted with it, and you will be signed out everywhere.
                </Text>

                <Text className="m-0 mt-4 font-semibold text-red-600">
                  This action cannot be undone.
                </Text>

                <Text className="m-0 mt-4 text-gray-500">
                  If this wasn&apos;t you, ignore this email and your account
                  will stay as it is.
                </Text>
              </Section>

              <EmailButton
                content="Delete My Account"
                url={url}
                variant="destructive"
              />
              <ExpireToken content="This link expires in 1 hour." />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

DeleteAccountConfirmation.PreviewProps = {
  url: 'https://example.com/',
} satisfies DeleteAccountConfirmationProps;

export default DeleteAccountConfirmation;
