import type { MetadataRoute } from 'next';

// `/reset-password` needs a valid emailed token, `/new-story`, `/me/` and `/notifications` need a
// session, and `/admin/` an admin one. Every other visit redirects, so none is worth crawling.
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: [
      '/reset-password',
      '/new-story',
      '/me/',
      '/notifications',
      '/admin/',
    ],
  },
});

export default robots;
