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

interface SubscriptionWelcomeProps {
  name: string;
  newStoryUrl: string;
  homeUrl: string;
}

// Sent from the Stripe plugin's `onSubscriptionComplete`; receipts and amounts are Stripe's emails.
const SubscriptionWelcome = ({
  name,
  newStoryUrl,
  homeUrl,
}: SubscriptionWelcomeProps): React.ReactNode => (
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
        <Preview>Your {APP_NAME} Pro membership is active.</Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  Welcome to {APP_NAME} Pro
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Hi {name}, thanks for subscribing. Your Pro membership is
                  active, and every story on {APP_NAME} is now open to you.
                </Text>
              </Section>

              <EmailButton
                content="Start writing your story"
                url={newStoryUrl}
                className="mx-[6px] mb-[12px]"
              />
              <EmailButton
                content="Start reading"
                url={homeUrl}
                variant="secondary"
                className="mx-[6px] mb-[12px]"
              />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

SubscriptionWelcome.PreviewProps = {
  name: 'Jane Doe',
  newStoryUrl: 'https://example.com/new-story',
  homeUrl: 'https://example.com/',
} satisfies SubscriptionWelcomeProps;

export default SubscriptionWelcome;
