import dropbox from 'thesvg/dropbox';
import github from 'thesvg/github';
import google from 'thesvg/google';
import microsoft from 'thesvg/microsoft';
import shopify from 'thesvg/shopify';
import slack from 'thesvg/slack';
import stripe from 'thesvg/stripe';
import { Marquee } from '@/components/ui/marquee';

// `thesvg` ships markup, not components, and its wordmarks carry hardcoded
// brand fills — swapping them for `currentColor` is what lets one tint apply.
const toBrandTint = (markup: string) =>
  markup.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');

const brands = [
  { name: 'Google', markup: google.variants.wordmark! },
  { name: 'Microsoft', markup: microsoft.variants.wordmark! },
  { name: 'Dropbox', markup: dropbox.variants.wordmark! },
  { name: 'Shopify', markup: shopify.variants.wordmark! },
  { name: 'GitHub', markup: github.variants.wordmark! },
  { name: 'Slack', markup: slack.variants.default! },
  { name: 'Stripe', markup: stripe.variants.default! },
];

const BrandMarquee = () => (
  <section aria-label='Trusted by writers at' className='w-full'>
    <p className='text-muted-foreground mb-6 text-center text-sm'>
      Trusted by Writers At
    </p>

    {/* The edges fade into the page so the loop has no visible seam. */}
    <div className='relative [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]'>
      <Marquee pauseOnHover duration={32} gap={4}>
        {brands.map(({ name, markup }) => (
          <span
            key={name}
            title={name}
            className='text-app/80 flex h-7 w-auto shrink-0 items-center [&>svg]:h-full [&>svg]:w-auto'
            dangerouslySetInnerHTML={{ __html: toBrandTint(markup) }}
          />
        ))}
      </Marquee>
    </div>
  </section>
);

export default BrandMarquee;
