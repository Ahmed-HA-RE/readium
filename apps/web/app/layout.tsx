import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import Providers from './providers';
import { SITE_NAME, SITE_URL } from '@/lib/constants';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const SITE_TITLE = `${SITE_NAME} — Read and publish ideas worth sharing`;
const SITE_DESCRIPTION =
  'A publishing platform where developers and creators share practical knowledge. Discover stories worth reading, publish your own, and join the conversation.';

// og:image and twitter:image come from the app/opengraph-image.png file convention,
// which takes precedence over any images declared here.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'readium',
    'publishing platform',
    'blogging platform',
    'developer blog',
    'technical writing',
    'knowledge sharing',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en'>
      <body className={roboto.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
