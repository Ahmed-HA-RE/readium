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
                    {isTemporary ? 'Account suspended' : 'Account banned'}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    Hi {authorName}, your {APP_NAME} account has been{' '}
                    {isTemporary
                      ? 'suspended for 30 days'
                      : 'permanently banned'}{' '}
                    following a report on one of your blog posts.
                  </Text>

                  <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                    Reported blog post:
                  </Text>
                  <Text className="m-0 mt-1 text-gray-500">{blogTitle}</Text>

                  <Text className="m-0 mt-6 text-gray-700 font-bold text-lg">
                    Reason:
                  </Text>
                  <Text className="m-0 mt-1 text-gray-500 capitalize">
                    {banReason.slice(0, 1).toUpperCase() +
                      banReason.slice(1).toLowerCase().replaceAll('_', ' ')}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    {isTemporary
                      ? 'You will not be able to access your account or publish content for the next 30 days.'
                      : 'You will no longer be able to access your account or publish any content on our platform.'}
                  </Text>

                  <Text className="m-0 mt-6 text-gray-500">
                    This report has been carefully reviewed by our moderation
                    team. Based on our review, we determined that your content
                    violated our Community Guidelines and Terms of Service, and
                    appropriate action has been taken against your account.
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
  banReason: 'RULES_VIOLATION',
  banType: 'temporary',
} satisfies BanNotificationProps;

export default BanNotification;
