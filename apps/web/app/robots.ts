import type { MetadataRoute } from 'next';

// `/reset-password` needs a valid emailed token, and `/new-story` and `/me/`
// need a session. Every other visit redirects, so none is worth crawling.
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/reset-password', '/new-story', '/me/'],
  },
});

export default robots;
