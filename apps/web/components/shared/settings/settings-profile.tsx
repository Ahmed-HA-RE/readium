import { IoStarSharp } from 'react-icons/io5';
import type { CurrentUser } from '@repo/types';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type SettingsProfileProps = {
  user: Pick<CurrentUser, 'name' | 'email' | 'image' | 'bio' | 'isPro'>;
  className?: string;
};

// Stacked above the tabs on small screens, a sticky column beside them from `lg` up.
const SettingsProfile = ({ user, className }: SettingsProfileProps) => {
  const { name, email, image, bio, isPro } = user;

  return (
    <aside className={cn('lg:border-l lg:pl-10', className)}>
      <div className='flex flex-col items-center justify-center gap-5 text-center lg:sticky lg:top-21'>
        <Avatar size='xl'>
          <AvatarImage src={image ?? DEFAULT_AVATAR} alt={name} />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className='flex w-full min-w-0 flex-col items-center gap-1.5'>
          <p className='flex items-center justify-center gap-2 text-2xl font-semibold wrap-break-word'>
            {name}
            {isPro && (
              <>
                <IoStarSharp
                  aria-hidden
                  className='size-5 shrink-0 text-yellow-500'
                />
                <span className='sr-only'>Pro member</span>
              </>
            )}
          </p>
          <p className='max-w-full truncate text-base text-muted-foreground'>
            {email}
          </p>
          {bio && (
            <p className='pt-2 text-base whitespace-pre-line text-muted-foreground'>
              {bio}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SettingsProfile;
