import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from 'react-email';
import { APP_NAME } from '@repo/constants';
import { APP_LOGO } from '@repo/assets';
import EmailButton from './components/email-button';

const baseUrl = process.env.APP_BACKEND_URL
  ? `https://${process.env.APP_BACKEND_URL}`
  : '';

interface VerifyEmailProps {
  url: string;
}

const socialLinks = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    logo: `${baseUrl}/static/instagram-logo.png`,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/',
    logo: `${baseUrl}/static/linkedin-logo.png`,
  },
  {
    name: 'Reddit',
    url: 'https://www.reddit.com/',
    logo: `${baseUrl}/static/reddit-logo.png`,
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/',
    logo: `${baseUrl}/static/facebook-logo.png`,
  },
];

const currentYear = new Date().getFullYear();

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
        <Preview>Confirm your email address</Preview>

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
            </Section>
          </Section>

          <Section className="px-6 pt-10 pb-10 text-center">
            <Row className="max-w-[160px] mx-auto mb-6">
              {socialLinks.map((link, index) => (
                <Column
                  key={link.name}
                  className={
                    index !== socialLinks.length - 1 ? 'pr-[20px]' : ''
                  }
                >
                  <Link href={link.url} className="inline-block">
                    <Img
                      src={link.logo}
                      alt={link.name}
                      width={24}
                      height={24}
                      className="block"
                    />
                  </Link>
                </Column>
              ))}
            </Row>

            <Text className="text-gray-400 text-[12px] m-0">
              Follow us to stay up to date with the latest news and features.
            </Text>

            <Text className="text-gray-400 text-[11px] mt-3 mb-0">
              © {currentYear} {APP_NAME}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

VerifyEmail.PreviewProps = {
  url: 'https://example.com/',
} satisfies VerifyEmailProps;

export default VerifyEmail;
