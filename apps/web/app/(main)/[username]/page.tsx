import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GoLink } from 'react-icons/go';
import { DEFAULT_AVATAR, SITE_NAME } from '@/lib/constants';
import {
  ADMIN_MY_STORIES_PATH,
  ADMIN_SETTINGS_PATH,
  cn,
  getProfilePath,
} from '@/lib/utils';
import { getPublicUserProfile } from '@/lib/actions/user/getPublicUserProfile';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import UserBlogsList from './_components/user-blogs-list';

type ProfilePageParams = Promise<{ username: string }>;

// Profile URLs are `/@name`, so a segment without the `@` is not one.
const loadProfile = async (params: ProfilePageParams) => {
  const segment = decodeURIComponent((await params).username);

  return segment.startsWith('@')
    ? getPublicUserProfile(segment.slice(1))
    : null;
};

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

// `https://www.example.com/` reads as `example.com`.
const formatWebsite = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export const generateMetadata = async ({
  params,
}: {
  params: ProfilePageParams;
}): Promise<Metadata> => {
  const profile = await loadProfile(params);

  // The page redirects in this case, so there is nothing to describe.
  if (!profile) return {};

  const { name, bio, image } = profile;
  const url = getProfilePath(name);
  const description = bio || `Read stories by ${name} on ${SITE_NAME}.`;
  const images = image ? [{ url: image, alt: name }] : undefined;

  return {
    title: name,
    description,
    authors: [{ name, url }],
    alternates: { canonical: url },
    openGraph: {
      type: 'profile',
      url,
      siteName: SITE_NAME,
      title: name,
      description,
      username: name,
      images,
    },
    twitter: { card: 'summary', title: name, description, images },
  };
};

const ProfilePage = async ({ params }: { params: ProfilePageParams }) => {
  // Both are `cache`d: the profile by `generateMetadata`, the session by the layout.
  const [profile, session] = await Promise.all([
    loadProfile(params),
    getCurrentLoggedInUser(),
  ]);

  // An unknown or banned user, or a segment without the `@`, goes home, as a missing blog does.
  if (!profile) redirect('/');

  const { id, name, image, bio, website, _count } = profile;
  const isOwnProfile = session?.user.id === id;
  const isAdmin = session?.user.role === 'admin';

  const stats = [
    pluralize(_count.blogs, 'story', 'stories'),
    pluralize(_count.likes, 'like', 'likes'),
    pluralize(_count.bookmarks, 'bookmark', 'bookmarks'),
  ];

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8'>
      <header className='flex flex-col items-center gap-5 border-b pb-8 text-center'>
        <Avatar size='xl'>
          <AvatarImage src={image ?? DEFAULT_AVATAR} alt={name} />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className='flex max-w-xl flex-col items-center gap-2'>
          <h1 className='text-3xl font-bold tracking-tight wrap-break-word'>
            {name}
          </h1>
          {bio && (
            <p className='whitespace-pre-line text-muted-foreground'>{bio}</p>
          )}
          {website && (
            <a
              href={website}
              target='_blank'
              rel='noopener noreferrer nofollow'
              className='flex w-fit items-center gap-1.5 text-sm hover:underline'
            >
              <GoLink className='size-4 shrink-0' />
              {formatWebsite(website)}
            </a>
          )}
        </div>

        <ul className='flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground'>
          {stats.map((stat) => (
            <li key={stat}>{stat}</li>
          ))}
        </ul>

        {isOwnProfile && (
          <div className='flex flex-wrap justify-center gap-2'>
            <Link
              href={isAdmin ? ADMIN_SETTINGS_PATH : '/me/settings?tab=account'}
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'rounded-full px-4',
              )}
            >
              Edit profile
            </Link>
            {/* Drafts live only on the dashboard; this page lists published stories. */}
            <Link
              href={isAdmin ? ADMIN_MY_STORIES_PATH : '/me/stories'}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'rounded-full px-4',
              )}
            >
              Manage stories
            </Link>
          </div>
        )}
      </header>

      <UserBlogsList
        username={name}
        viewerId={session?.user.id}
        isAdmin={isAdmin}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default ProfilePage;
