'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useQueryStates } from 'nuqs';
import { format } from 'date-fns';
import type { ColumnDef, ColumnVisibilityState } from '@tanstack/react-table';
import { GrPowerReset } from 'react-icons/gr';
import { AdminBlogStatus, type GetAllBlogsForAdmin } from '@repo/types';
import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchInput from '@/components/shared/search-input';
import { adminBlogsParsers } from '@/lib/search-params';
import { DEFAULT_BLOG_COVER } from '@/lib/constants';
import { MIN_ADMIN_TABLE_SEARCH_LENGTH, useAdminBlogs } from '@/hooks/admin';
import DataTable from './data-table';
import TableFooter from './table-footer';
import type { AdminTableFeatures } from './table-features';
import BlogActionsMenu from './blog-actions-menu';

type AdminBlog = GetAllBlogsForAdmin['blogs'][number];

const ALL_STATUSES = 'all';

const STATUS_ITEMS = [
  { value: ALL_STATUSES, label: 'All statuses' },
  { value: AdminBlogStatus.PUBLISHED, label: 'Published' },
  { value: AdminBlogStatus.UNPUBLISHED, label: 'Unpublished' },
];

const EMPTY_BLOGS: AdminBlog[] = [];

const COUNT_CLASS = 'text-center tabular-nums';

const columns: ColumnDef<AdminTableFeatures, AdminBlog>[] = [
  {
    id: 'blog',
    header: 'Blog',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <Image
          src={row.original.coverImage ?? DEFAULT_BLOG_COVER}
          alt=''
          width={56}
          height={40}
          className='h-10 w-14 min-w-14 shrink-0 rounded-md object-cover'
        />
        <span className='line-clamp-2 font-medium whitespace-normal'>
          {row.original.title}
        </span>
      </div>
    ),
    size: 360,
  },
  {
    id: 'author',
    header: 'Author',
    cell: ({ row }) => (
      <span className='text-muted-foreground'>
        {row.original.author.name}
      </span>
    ),
    size: 140,
  },
  {
    accessorKey: 'isPublished',
    header: 'Status',
    cell: ({ row }) =>
      row.original.isPublished ? (
        <Badge variant='success'>Published</Badge>
      ) : (
        <Badge variant='warning'>Unpublished</Badge>
      ),
    meta: { className: 'text-center' },
    size: 120,
  },
  {
    id: 'likes',
    header: 'Likes',
    cell: ({ row }) => row.original._count.likes.toLocaleString('en-US'),
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
    id: 'bookmarks',
    header: 'Bookmarks',
    cell: ({ row }) => row.original._count.bookmarks.toLocaleString('en-US'),
    meta: { className: COUNT_CLASS },
    size: 110,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
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
      <BlogActionsMenu
        slug={row.original.slug}
        title={row.original.title}
        isPublished={row.original.isPublished}
        banLocked={row.original.banLocked}
      />
    ),

    meta: { className: 'text-center last:pr-6' },
    size: 100,
  },
];

// The overview's compact preview keeps blog, status and actions; the blogs route shows every column.
const OVERVIEW_HIDDEN_COLUMNS: ColumnVisibilityState = {
  author: false,
  likes: false,
  comments: false,
  bookmarks: false,
  createdAt: false,
};

// The overview's preview: the latest page, with no filters in the URL.
const OVERVIEW_PARAMS = {
  search: '',
  status: null,
  page: 1,
  limit: DEFAULT_ADMIN_TABLE_PAGE_SIZE,
};

type BlogsTableProps = {
  // The overview hides the toolbar and footer; the blogs domain route shows them.
  showControls?: boolean;
};

const BlogsTable = ({ showControls = false }: BlogsTableProps) => {
  const [urlParams, setParams] = useQueryStates(adminBlogsParsers);
  const params = showControls ? urlParams : OVERVIEW_PARAMS;
  const { search, status, page, limit } = params;

  const { data, isPending, isError, refetch } = useAdminBlogs(params);

  const totalPages = data?.totalPages;
  const isSearchTooShort =
    search.length > 0 && search.length < MIN_ADMIN_TABLE_SEARCH_LENGTH;

  // Deleting the only blog on the last page leaves `page` past the end.
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
              placeholder='Search by title or author...'
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
                        : (value as AdminBlogStatus),
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
          data={data?.blogs ?? EMPTY_BLOGS}
          getRowId={(blog) => blog.id}
          isPending={isPending && !isSearchTooShort}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={
            hasFilters ? 'No blogs match these filters.' : 'No blogs yet.'
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

export default BlogsTable;
