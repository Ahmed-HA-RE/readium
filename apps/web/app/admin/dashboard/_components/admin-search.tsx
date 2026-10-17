'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { IoMdArrowRoundDown, IoMdArrowRoundUp } from 'react-icons/io';
import { GrUndo } from 'react-icons/gr';
import { IoSearch } from 'react-icons/io5';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Combobox,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox';
import { InputGroupAddon } from '@/components/ui/input-group';
import UserSearchSuggestionSkeleton from '@/components/shared/user-search-suggestion-skeleton';
import { useAdminSuggestions } from '@/hooks/admin';
import { DEFAULT_AVATAR } from '@/lib/constants';

const SEARCH_DEBOUNCE_MS = 300;
const HINT_ICON_CLASS = 'size-4';

type AdminSearchProps = {
  trigger: ReactNode;
  className?: string;
};

const AdminSearch = ({ trigger, className }: AdminSearchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const router = useRouter();

  const { data: users = [], isFetching, isError } = useAdminSuggestions(
    debouncedSearch,
    open,
  );

  const goToUser = (username: string | null) => {
    if (!username) return;
    setOpen(false);
    router.push(`/admin/dashboard/users/${encodeURIComponent(username)}`);
  };

  return (
    <div className={className}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className='gap-0 overflow-hidden border-0 p-0 *:data-[slot=dialog-close]:top-1.5 *:data-[slot=dialog-close]:right-1.5 sm:max-w-lg'
          aria-describedby={undefined}
        >
          <DialogTitle className='sr-only'>Search for users</DialogTitle>
          {/* The server already filters by name, so the combobox's own filtering is off. */}
          <Combobox
            open
            filter={null}
            value={null}
            onValueChange={goToUser}
            inputValue={search}
            onInputValueChange={setSearch}
          >
            <ComboboxInput
              placeholder='Search for users...'
              className='border-border h-12 w-full gap-2 rounded-none border-0 border-b px-3 ring-0! has-[[data-slot=input-group-control]:focus-visible]:border-inherit *:data-[align=inline-end]:hidden *:data-[align=inline-start]:p-0 *:data-[slot=input-group-control]:text-base [&_input]:p-0!'
              showTrigger={false}
            >
              <InputGroupAddon>
                <IoSearch className='size-5' />
              </InputGroupAddon>
            </ComboboxInput>
            <ComboboxList className='border-0'>
              {isFetching ? (
                <ComboboxGroup className='p-4!'>
                  <ComboboxLabel className='text-sm'>Users</ComboboxLabel>
                  <UserSearchSuggestionSkeleton />
                  <UserSearchSuggestionSkeleton />
                  <UserSearchSuggestionSkeleton />
                </ComboboxGroup>
              ) : (
                <>
                  {/* A failed request leaves `users` empty, which would otherwise read as no results. */}
                  {isError && (
                    <p className='text-muted-foreground py-6 text-center text-sm'>
                      Something went wrong. Try again.
                    </p>
                  )}

                  {!isError && users.length === 0 && (
                    <p className='text-muted-foreground py-6 text-center text-sm'>
                      No users found.
                    </p>
                  )}

                  {users.length > 0 && (
                    <ComboboxGroup className='p-4!'>
                      <ComboboxLabel className='text-sm'>Users</ComboboxLabel>
                      {users.map((user) => (
                        <ComboboxItem
                          key={user.id}
                          value={user.name}
                          className='cursor-pointer gap-3 p-1.5! text-base'
                        >
                          <Avatar className='size-9.5'>
                            <AvatarImage
                              src={user.image ?? DEFAULT_AVATAR}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              <Skeleton className='size-full rounded-full' />
                            </AvatarFallback>
                          </Avatar>
                          <span className='min-w-0 flex-1 truncate font-medium'>
                            {user.name}
                          </span>
                          {user.role === 'admin' && (
                            <Badge variant='secondary'>Admin</Badge>
                          )}
                          {user.banned && (
                            <Badge variant='destructive'>Banned</Badge>
                          )}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  )}
                </>
              )}
            </ComboboxList>
          </Combobox>

          <div className='bg-border h-px max-sm:hidden' />

          <div className='text-muted-foreground flex flex-wrap items-center gap-4 p-4 max-sm:hidden'>
            <div className='flex flex-1 items-center gap-2'>
              <kbd className='rounded border px-1 text-sm'>esc</kbd>
              <span>To close</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <GrUndo className={HINT_ICON_CLASS} />
              </div>
              <span>To Select</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <IoMdArrowRoundUp className={HINT_ICON_CLASS} />
              </div>
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <IoMdArrowRoundDown className={HINT_ICON_CLASS} />
              </div>
              <span>To Navigate</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSearch;
