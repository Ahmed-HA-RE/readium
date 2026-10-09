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

interface SubscriptionCancelledProps {
  name: string;
  homeUrl: string;
  accessEndsAt?: Date;
}

// Sent from the Stripe plugin's `onSubscriptionCancel`, when the cancel is scheduled for the period end.
const SubscriptionCancelled = ({
  name,
  homeUrl,
  accessEndsAt,
}: SubscriptionCancelledProps): React.ReactNode => (
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
        <Preview>Your {APP_NAME} Pro membership has been cancelled.</Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  We&apos;re sorry to see you go
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Hi {name}, your Pro membership has been cancelled.
                  {accessEndsAt
                    ? ` You'll keep full access until ${accessEndsAt.toLocaleDateString(
                        'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' },
                      )}, and you won't be charged again.`
                    : " You won't be charged again."}
                </Text>

                <Text className="m-0 mt-4 text-gray-500">
                  Thank you for being part of {APP_NAME}. Your stories stay
                  right where they are, and you&apos;re welcome back anytime.
                </Text>
              </Section>

              <EmailButton content="Keep reading" url={homeUrl} />
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

SubscriptionCancelled.PreviewProps = {
  name: 'Jane Doe',
  homeUrl: 'https://example.com/',
  accessEndsAt: new Date(),
} satisfies SubscriptionCancelledProps;

export default SubscriptionCancelled;
