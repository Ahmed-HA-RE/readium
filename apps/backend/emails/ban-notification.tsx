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

interface BanNotificationProps {
  authorName: string;
  blogTitle: string;
  banReason: string;
  banType: 'temporary' | 'permanent';
}

const BanNotification = ({
  authorName,
  blogTitle,
  banReason,
  banType,
}: BanNotificationProps): React.ReactNode => {
  const isTemporary = banType === 'temporary';

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
          <Preview>
            Your {APP_NAME} account has been{' '}
            {isTemporary ? 'temporarily suspended' : 'permanently banned'}.
          </Preview>

          <Container className="mx-auto w-full max-w-[640px]">
            <Section className="bg-gray-50 px-0 pt-14 text-center">
              <Section className="px-6 pb-[72px]">
                <AppLogo />

                <Section className="mx-auto mb-8 max-w-[500px]">
                  <Text className="m-0 text-4xl font-medium">
                    {isTemporary ? 'Account suspended' : 'Account banned'}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    Hi {authorName}, your {APP_NAME} account has been{' '}
                    {isTemporary
                      ? 'suspended for 30 days'
                      : 'permanently banned'}{' '}
                    after one of your blog posts was reported.
                  </Text>

                  <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                    Reported blog post:
                  </Text>
                  <Text className="m-0 mt-1 text-gray-500">{blogTitle}</Text>

                  <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                    Reported for:
                  </Text>
                  <Text className="m-0 mt-1 text-gray-500">{banReason}</Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    {isTemporary
                      ? 'You will not be able to access your account or publish content for the next 30 days.'
                      : 'You will no longer be able to access your account or publish any content on our platform.'}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    Your blog post was reported, and after reviewing it our
                    moderation team found that it violated our Community
                    Guidelines and Terms of Service. Appropriate action has been
                    taken against your account.
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
};

BanNotification.PreviewProps = {
  authorName: 'John Doe',
  blogTitle: 'How to build a React app',
  banReason: 'Harassment, Spam',
  banType: 'temporary',
} satisfies BanNotificationProps;

export default BanNotification;
