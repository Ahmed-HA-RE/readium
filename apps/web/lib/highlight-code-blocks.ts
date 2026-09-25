import { common, createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';

const lowlight = createLowlight(common);

// TipTap's code block markup: `<pre><code class="language-typescript">`, language optional.
const CODE_BLOCK =
  /<pre([^>]*)><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code>\s*<\/pre>/g;

// `sanitize-html` only escapes these in text, so this restores the exact source.
const decodeEntities = (html: string) =>
  html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

const highlight = (language: string, inner: string) =>
  toHtml(
    lowlight.highlight(language, decodeEntities(inner.replace(/<[^>]*>/g, ''))),
  );

// Expects sanitized HTML. Every block gets the theme's `hljs` box; only known languages get colored.
export const highlightCodeBlocks = (html: string) =>
  html.replace(
    CODE_BLOCK,
    (_block, preAttributes, language: string | undefined, inner: string) => {
      const tokens =
        language && lowlight.registered(language)
          ? highlight(language, inner)
          : inner;
      const languageClass = language ? ` language-${language}` : '';

      return `<pre${preAttributes}><code class="hljs${languageClass}">${tokens}</code></pre>`;
    },
  );
