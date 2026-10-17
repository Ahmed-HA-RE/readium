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

interface WarningNotificationProps {
  authorName: string;
  blogTitle: string;
  banReason: string;
}

const WarningNotification = ({
  authorName,
  blogTitle,
  banReason,
}: WarningNotificationProps): React.ReactNode => (
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
          You have received a content warning on your {APP_NAME} account.
        </Preview>

        <Container className="mx-auto w-full max-w-[640px]">
          <Section className="bg-gray-50 px-0 pt-14 text-center">
            <Section className="px-6 pb-[72px]">
              <AppLogo />

              <Section className="mx-auto mb-8 max-w-[500px]">
                <Text className="m-0 text-4xl font-medium">
                  Content warning
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Hi {authorName}, your blog post was reported, and after
                  reviewing it our moderation team found that it goes against
                  our community guidelines. This is an official warning on your{' '}
                  {APP_NAME} account.
                </Text>

                <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                  Reported blog post:
                </Text>
                <Text className="m-0 mt-1 text-gray-500">{blogTitle}</Text>

                <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                  Reported for:
                </Text>
                <Text className="m-0 mt-1 text-gray-500">{banReason}</Text>

                <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                  What happens now:
                </Text>
                <Text className="m-0 mt-1 text-gray-500">
                  This blog post has been unpublished and is no longer visible
                  to readers. Please edit it to remove or change the content
                  that goes against our community guidelines, then republish
                  it from the editor. Republishing it without those changes
                  may lead to further reports.
                </Text>

                <Text className="m-0 mt-6 text-gray-500">
                  Please be aware that any further reports upheld against any of
                  your blog posts will result in a temporary or permanent ban
                  from {APP_NAME}. We encourage you to review our community
                  guidelines and terms of service to avoid future violations.
                </Text>
              </Section>
            </Section>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

WarningNotification.PreviewProps = {
  authorName: 'John Doe',
  blogTitle: 'How to build a React app',
  banReason: 'Harassment, Spam',
} satisfies WarningNotificationProps;

export default WarningNotification;
