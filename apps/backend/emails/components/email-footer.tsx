import { APP_NAME } from '@repo/constants';
import React from 'react';
import { Column, Img, Link, Row, Section, Text } from 'react-email';

const currentYear = new Date().getFullYear();

const socialLinks = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    logo: 'https://public-assets-00.s3.ap-southeast-1.amazonaws.com/instagram-logo.png',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/',
    logo: 'https://public-assets-00.s3.ap-southeast-1.amazonaws.com/linkedin-logo.png',
  },
  {
    name: 'Reddit',
    url: 'https://www.reddit.com/',
    logo: 'https://public-assets-00.s3.ap-southeast-1.amazonaws.com/reddit-logo.png',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/',
    logo: 'https://public-assets-00.s3.ap-southeast-1.amazonaws.com/facebook-logo.png',
  },
];
const EmailFooter = (): React.ReactNode => {
  return (
    <Section className="px-6 pt-10 pb-10 text-center">
      <Row className="max-w-[160px] mx-auto mb-4">
        {socialLinks.map((link, index) => (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          <Column
            key={link.name}
            className={index !== socialLinks.length - 1 ? 'pr-[20px]' : ''}
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

      <Text className="text-gray-400 text-[11px] mt-1.5 mb-0">
        © {currentYear} {APP_NAME}. All rights reserved.
      </Text>
    </Section>
  );
};

export default EmailFooter;
