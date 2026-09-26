'use client';

import { IoShareOutline } from 'react-icons/io5';
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  ThreadsIcon,
  ThreadsShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from 'react-share';
import { SITE_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CopyButton from '@/components/shared/copy-button';

type ShareBlogDialogProps = {
  // Absolute, so it works wherever it is pasted.
  url: string;
  title: string;
  shortDescription: string;
  authorName: string;
};

const ICON_SIZE = 56;

const SHARE_ITEM_CLASS =
  'flex flex-col items-center gap-2 rounded-lg text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50';

const ShareBlogDialog = ({
  url,
  title,
  shortDescription,
  authorName,
}: ShareBlogDialogProps) => {
  // Each platform appends the URL after this text.
  const message = `Check out "${title}" by @${authorName} on ${SITE_NAME}`;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant='ghost-plain' className='text-muted-foreground' />
        }
      >
        <IoShareOutline />
        Share
      </DialogTrigger>

      <DialogContent className='gap-8 p-8 sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-semibold'>Share</DialogTitle>
        </DialogHeader>

        {/* Facebook takes no text; its card comes entirely from the page's OG tags. */}
        <div className='grid grid-cols-4 gap-y-6'>
          <EmailShareButton
            url={url}
            subject={`${title} by @${authorName}`}
            body={`Hi,\n\nI came across "${title}" by @${authorName} on ${SITE_NAME} and thought you might enjoy it:\n\n${shortDescription}`}
            separator={'\n\n'}
            className={SHARE_ITEM_CLASS}
          >
            <EmailIcon size={ICON_SIZE} round />
            Email
          </EmailShareButton>
          <FacebookShareButton url={url} className={SHARE_ITEM_CLASS}>
            <FacebookIcon size={ICON_SIZE} round />
            Facebook
          </FacebookShareButton>
          <LinkedinShareButton
            url={url}
            title={message}
            summary={shortDescription}
            source={SITE_NAME}
            className={SHARE_ITEM_CLASS}
          >
            <LinkedinIcon size={ICON_SIZE} round />
            LinkedIn
          </LinkedinShareButton>
          {/* A Reddit post title is the story's own title, not a message. */}
          <RedditShareButton
            url={url}
            title={title}
            className={SHARE_ITEM_CLASS}
          >
            <RedditIcon size={ICON_SIZE} round />
            Reddit
          </RedditShareButton>
          <TelegramShareButton
            url={url}
            title={message}
            className={SHARE_ITEM_CLASS}
          >
            <TelegramIcon size={ICON_SIZE} round />
            Telegram
          </TelegramShareButton>
          <ThreadsShareButton
            url={url}
            title={message}
            className={SHARE_ITEM_CLASS}
          >
            <ThreadsIcon size={ICON_SIZE} round />
            Threads
          </ThreadsShareButton>
          <TwitterShareButton
            url={url}
            title={message}
            className={SHARE_ITEM_CLASS}
          >
            <XIcon size={ICON_SIZE} round />X
          </TwitterShareButton>
          <WhatsappShareButton
            url={url}
            title={message}
            separator=': '
            className={SHARE_ITEM_CLASS}
          >
            <WhatsappIcon size={ICON_SIZE} round />
            WhatsApp
          </WhatsappShareButton>
        </div>

        <div className='flex flex-col gap-3'>
          <span className='font-medium'>Copy page link</span>
          <CopyButton title={url} link={url} className='w-full' />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareBlogDialog;
