import sanitizeHtml from 'sanitize-html';

// Blog content is author-supplied HTML rendered with `dangerouslySetInnerHTML`,
// so anything outside this allowlist (scripts, event handlers, iframes) is dropped.
const options: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    code: ['class'],
    pre: ['class'],
  },
  allowedSchemes: ['https', 'http', 'mailto'],
  transformTags: {
    // The blog title is the page's only <h1>.
    h1: 'h2',
    a: sanitizeHtml.simpleTransform('a', {
      rel: 'nofollow ugc noopener noreferrer',
      target: '_blank',
    }),
  },
};

export const sanitizeBlogHtml = (html: string) => sanitizeHtml(html, options);
