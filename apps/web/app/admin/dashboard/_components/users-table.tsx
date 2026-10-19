'use client';

import { useEffect } from 'react';
import { useQueryStates } from 'nuqs';
import { format } from 'date-fns';
import type { ColumnDef, ColumnVisibilityState } from '@tanstack/react-table';
import { GrPowerReset } from 'react-icons/gr';
import { IoMdCheckmark, IoMdClose } from 'react-icons/io';
import type { GetAllUsersAsAdmin } from '@repo/types';
import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchInput from '@/components/shared/search-input';
import { adminUsersParsers, type AdminUserStatus } from '@/lib/search-params';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { MIN_ADMIN_TABLE_SEARCH_LENGTH, useAdminUsers } from '@/hooks/admin';
import DataTable from './data-table';
import TableFooter from './table-footer';
import type { AdminTableFeatures } from './table-features';
import UserActionsMenu from './user-actions-menu';

type AdminUser = GetAllUsersAsAdmin['users'][number];

const ALL_STATUSES = 'all';

const STATUS_ITEMS = [
  { value: ALL_STATUSES, label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

// Stable references, so TanStack Table doesn't re-render in a loop.
const EMPTY_USERS: AdminUser[] = [];

const COUNT_CLASS = 'text-center tabular-nums';

const columns: ColumnDef<AdminTableFeatures, AdminUser>[] = [
  {
    id: 'id',
    header: 'ID',
    // The full id is long and random; the first 8 characters are enough to tell rows apart.
    cell: ({ row }) => (
      <span
        title={row.original.id}
        className='text-muted-foreground font-mono text-xs'
      >
        #{row.original.id.slice(0, 8)}
      </span>
    ),
    size: 100,
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <Avatar className='size-9 shrink-0'>
          <AvatarImage
            src={row.original.image ?? DEFAULT_AVATAR}
            alt={row.original.name}
          />
          <AvatarFallback>
            <Skeleton className='size-full rounded-full' />
          </AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          <span className='truncate font-medium'>{row.original.name}</span>
          <span className='text-muted-foreground truncate text-xs'>
            {row.original.email}
          </span>
        </div>
      </div>
    ),
    size: 280,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant='destructive'>Banned</Badge>
      ) : (
        <Badge variant='success'>Active</Badge>
      ),
    meta: { className: 'text-center' },
    size: 110,
  },
  {
    id: 'emailVerified',
    header: 'Email',
    cell: ({ row }) =>
      row.original.emailVerified ? (
        // The solid success badge keeps its white icon; an emerald one would vanish on it.
        <Badge variant='success'>
          <IoMdCheckmark />
          Verified
        </Badge>
      ) : (
        <Badge variant='warning'>
          <IoMdClose className='text-red-600' />
          Unverified
        </Badge>
      ),
    meta: { className: 'text-center' },
    size: 130,
  },
  {
    id: 'blogs',
    header: 'Blogs',
    cell: ({ row }) => row.original._count.blogs.toLocaleString('en-US'),
    meta: { className: COUNT_CLASS },
    size: 90,
  },
  {
    id: 'comments',
    header: 'Comments',
    cell: ({ row }) => row.original._count.comments.toLocaleString('en-US'),
    meta: { className: COUNT_CLASS },
    size: 110,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <span className='text-muted-foreground whitespace-nowrap'>
        {format(row.original.createdAt, 'MMM d, yyyy')}
      </span>
    ),
    size: 120,
  },
  {
    id: 'actions',
    header: () => <span>Actions</span>,
    cell: ({ row }) => (
      <UserActionsMenu
        userId={row.original.id}
        name={row.original.name}
        banned={row.original.banned}
        stripeCustomerId={row.original.stripeCustomerId}
      />
    ),
    // Overrides the table's `last:pr-4`, so the "Actions" header has room on the right.
    meta: { className: 'text-center last:pr-6' },
    size: 100,
  },
];

// The overview's compact preview keeps user, status and actions; the users route shows every column.
const OVERVIEW_HIDDEN_COLUMNS: ColumnVisibilityState = {
  id: false,
  emailVerified: false,
  blogs: false,
  comments: false,
  createdAt: false,
};

// The overview's preview: the newest users, with no filters in the URL.
const OVERVIEW_PARAMS = {
  search: '',
  status: null,
  page: 1,
  limit: DEFAULT_ADMIN_TABLE_PAGE_SIZE,
};

type UsersTableProps = {
  // The overview hides the toolbar and footer; the users domain route shows them.
  showControls?: boolean;
};

const UsersTable = ({ showControls = false }: UsersTableProps) => {
  const [urlParams, setParams] = useQueryStates(adminUsersParsers);
  const params = showControls ? urlParams : OVERVIEW_PARAMS;
  const { search, status, page, limit } = params;

  const { data, isPending, isError, refetch } = useAdminUsers(params);

  const totalPages = data?.totalPages;
  const isSearchTooShort =
    search.length > 0 && search.length < MIN_ADMIN_TABLE_SEARCH_LENGTH;

  // Banning the only user on the last page under the "Active" filter leaves `page` past the end.
  useEffect(() => {
    if (showControls && totalPages && page > totalPages) {
      setParams({ page: totalPages });
    }
  }, [showControls, page, totalPages, setParams]);

  const hasFilters = Boolean(search || status);

  return (
    <div className='flex flex-col'>
      {showControls && (
        <div className='flex flex-col gap-2 p-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <SearchInput
              // Remounts the input when the filters are cleared, so its own state resets too.
              key={search ? 'search' : 'empty'}
              defaultValue={search}
              onSearch={(next) => setParams({ search: next, page: 1 })}
              placeholder='Search by name or email...'
              className='w-full max-w-72'
            />

            <div className='flex items-center gap-2'>
              <Select
                items={STATUS_ITEMS}
                value={status ?? ALL_STATUSES}
                onValueChange={(value) =>
                  setParams({
                    status:
                      value === ALL_STATUSES
                        ? null
                        : (value as AdminUserStatus),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className='w-40' aria-label='Filter by status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {STATUS_ITEMS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant='outline'
                size='icon'
                aria-label='Clear filters'
                disabled={!hasFilters}
                onClick={() => setParams({ search: '', status: null, page: 1 })}
              >
                <GrPowerReset />
              </Button>
            </div>
          </div>

          {isSearchTooShort && (
            <p className='text-muted-foreground text-xs'>
              Type at least {MIN_ADMIN_TABLE_SEARCH_LENGTH} characters to
              search.
            </p>
          )}
        </div>
      )}

      <div className='overflow-x-auto'>
        <DataTable
          columns={columns}
          data={data?.users ?? EMPTY_USERS}
          getRowId={(user) => user.id}
          isPending={isPending && !isSearchTooShort}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={
            hasFilters ? 'No users match these filters.' : 'No users yet.'
          }
          skeletonRows={limit}
          initialColumnVisibility={
            showControls ? undefined : OVERVIEW_HIDDEN_COLUMNS
          }
          compact={!showControls}
        />
      </div>

      {showControls && (
        <TableFooter
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPageChange={(next) => setParams({ page: next })}
          onLimitChange={(next) => setParams({ limit: next, page: 1 })}
        />
      )}
    </div>
  );
};

export default UsersTable;
