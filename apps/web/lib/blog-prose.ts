import { Source_Serif_4 } from 'next/font/google';
import { cn } from '@/lib/utils';

const serif = Source_Serif_4({ subsets: ['latin'] });

// Shared by the reader and the editor, so a draft looks the way it will publish.
export const blogProseClassName = cn(
  serif.className,
  'prose prose-lg max-w-none dark:prose-invert prose-headings:mt-8 prose-headings:mb-3 prose-headings:tracking-tightprose-a:underline-offset-4 prose-pre:my-4 prose-pre:rounded-lg prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-foreground prose-blockquote:text-foreground marker:text-foreground',
);
