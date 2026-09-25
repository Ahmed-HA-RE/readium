import type { MetadataRoute } from 'next';

// `/reset-password` needs a valid emailed token and `/new-story` needs a
// session. Every other visit redirects, so neither is worth crawling.
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/reset-password', '/new-story'],
  },
});

export default robots;
