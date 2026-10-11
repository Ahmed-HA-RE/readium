'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';
import { GoSearch } from 'react-icons/go';
import type { GetSearchSuggestions } from '@repo/types';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_AVATAR, DEFAULT_BLOG_COVER } from '@/lib/constants';
import { useSearchSuggestions } from '@/hooks/search';
import { cn, getBlogPath, getProfilePath } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 300;

const UserSkeleton = () => (
  <div className='flex items-center gap-3 px-2 py-1.5'>
    <Skeleton className='size-8 shrink-0 rounded-full' />
    <Skeleton className='h-4 w-40' />
  </div>
);

const BlogSkeleton = () => (
  <div className='flex items-center gap-3 px-2 py-1.5'>
    <Skeleton className='size-8 shrink-0 rounded-md' />
    <div className='flex flex-col gap-1.5'>
      <Skeleton className='h-4 w-48' />
      <Skeleton className='h-3 w-24' />
    </div>
  </div>
);

const SearchCommand = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [debouncedTerm] = useDebounce(term, SEARCH_DEBOUNCE_MS);
  const router = useRouter();

  const { data, isFetching, isError } = useSearchSuggestions(
    debouncedTerm,
    open,
  );

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const users: GetSearchSuggestions['users'] = data?.users ?? [];
  const blogs: GetSearchSuggestions['blogs'] = data?.blogs ?? [];
  const hasResults = users.length > 0 || blogs.length > 0;

  return (
    <>
      <Button
        variant='ghost-plain'
        onClick={() => setOpen(true)}
        className={cn(
          'bg-muted text-muted-foreground hover:bg-muted h-9 w-56 justify-start gap-2 rounded-full px-3 font-normal max-md:hidden',
          className,
        )}
      >
        <GoSearch className='size-5' />
        Search
      </Button>
      <Button
        variant='ghost-plain'
        size='icon-lg'
        onClick={() => setOpen(true)}
        className='text-muted-foreground md:hidden'
      >
        <GoSearch className='size-5' />
        <span className='sr-only'>Search</span>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title='Search Readium'
        description='Search for people and stories'
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder='Search people and stories...'
          />
          <CommandList>
            {isFetching ? (
              <>
                <CommandGroup heading='Users'>
                  <UserSkeleton />
                  <UserSkeleton />
                  <UserSkeleton />
                </CommandGroup>
                <CommandGroup heading='Blogs'>
                  <BlogSkeleton />
                  <BlogSkeleton />
                  <BlogSkeleton />
                </CommandGroup>
              </>
            ) : (
              <>
                {/* A failed request leaves `data` undefined, which would
                    otherwise read as a genuine empty result. */}
                {isError && (
                  <CommandEmpty>Something went wrong. Try again.</CommandEmpty>
                )}

                {!isError && !hasResults && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}

                {users.length > 0 && (
                  <CommandGroup heading='Users'>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={() => go(getProfilePath(user.name))}
                        className='gap-3'
                      >
                        <Avatar>
                          <AvatarImage src={user.image ?? DEFAULT_AVATAR} />
                          <AvatarFallback>
                            <Skeleton className='size-full rounded-full' />
                          </AvatarFallback>
                        </Avatar>
                        <span className='truncate'>{user.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {blogs.length > 0 && (
                  <CommandGroup heading='Blogs'>
                    {blogs.map((blog) => (
                      <CommandItem
                        key={blog.id}
                        value={blog.id}
                        onSelect={() => go(getBlogPath(blog.author.name, blog.slug))}
                        className='gap-3'
                      >
                        <Image
                          src={blog.coverImage ?? DEFAULT_BLOG_COVER}
                          alt=''
                          width={32}
                          height={32}
                          className='size-8 shrink-0 rounded-md object-cover'
                        />
                        <div className='flex min-w-0 flex-col'>
                          <span className='truncate'>{blog.title}</span>
                          <span className='text-muted-foreground truncate text-xs'>
                            {blog.author.name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default SearchCommand;
