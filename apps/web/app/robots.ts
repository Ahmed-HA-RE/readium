import type { MetadataRoute } from 'next';

// `/reset-password` only resolves when reached from a valid emailed token — every
// other visit redirects, so there is nothing there worth crawling.
const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/reset-password'],
  },
});

export default robots;
