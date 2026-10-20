'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQueryStates } from 'nuqs';
import { format } from 'date-fns';
import type { ColumnDef, ColumnVisibilityState } from '@tanstack/react-table';
import { GrPowerReset } from 'react-icons/gr';
import { PiWarningFill } from 'react-icons/pi';
import { TbClockX } from 'react-icons/tb';
import { MdBlock } from 'react-icons/md';
import { IoCheckmarkDoneCircle } from 'react-icons/io5';
import type { IconType } from 'react-icons';
import {
  ModerationAction,
  ReportReason,
  ReportStatus,
  type GetAllReportsWithFilters,
} from '@repo/types';
import { cn } from '@/lib/utils';
import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchInput from '@/components/shared/search-input';
import { adminReportsParsers } from '@/lib/search-params';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { getAdminBlogPath } from '@/lib/routes';
import { MIN_ADMIN_TABLE_SEARCH_LENGTH, useAdminReports } from '@/hooks/admin';
import DataTable from './data-table';
import TableFooter from './table-footer';
import type { AdminTableFeatures } from './table-features';
import ReviewReportDialog from './review-report-dialog';

type AdminReport = GetAllReportsWithFilters['reports'][number];

const ALL = 'all';

const REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.HARASSMENT]: 'Harassment',
  [ReportReason.RULES_VIOLATION]: 'Rules Violation',
  [ReportReason.SPAM]: 'Spam',
  [ReportReason.AI_GENERATED]: 'AI-generated',
};

const STATUS_BADGES: Record<
  ReportStatus,
  { label: string; variant: 'warning' | 'success' | 'secondary' }
> = {
  [ReportStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [ReportStatus.RESOLVED]: { label: 'Resolved', variant: 'success' },
  [ReportStatus.REJECTED]: { label: 'Rejected', variant: 'secondary' },
};

const REASON_ITEMS = [
  { value: ALL, label: 'All reasons' },
  ...Object.values(ReportReason).map((value) => ({
    value,
    label: REASON_LABELS[value],
  })),
];

const STATUS_ITEMS = [
  { value: ALL, label: 'All statuses' },
  ...Object.values(ReportStatus).map((value) => ({
    value,
    label: STATUS_BADGES[value].label,
  })),
];

type Outcome = { label: string; Icon: IconType; className: string };

// What a closed report led to; the Status badge already says whether it was resolved or rejected.
const OUTCOMES: Record<ModerationAction, Outcome> = {
  [ModerationAction.WARNING]: {
    label: 'Author warned',
    Icon: PiWarningFill,
    className: 'text-amber-500',
  },
  [ModerationAction.TEMPORARY_BAN]: {
    label: 'Author banned temporarily',
    Icon: TbClockX,
    className: 'text-orange-500',
  },
  [ModerationAction.PERMANENT_BAN]: {
    label: 'Author banned permanently',
    Icon: MdBlock,
    className: 'text-destructive',
  },
};

// Rejected reports, and resolved ones from before `action` was recorded.
const NO_ACTION_OUTCOME: Outcome = {
  label: 'No action taken',
  Icon: IoCheckmarkDoneCircle,
  className: 'text-muted-foreground',
};

const ReportOutcome = ({ action }: { action: ModerationAction | null }) => {
  const { label, Icon, className } = action
    ? OUTCOMES[action]
    : NO_ACTION_OUTCOME;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type='button'
            aria-label={label}
            className='inline-flex cursor-default'
          />
        }
      >
        <Icon aria-hidden className={cn('size-5', className)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
};

// Stable references, so TanStack Table doesn't re-render in a loop.
const EMPTY_REPORTS: AdminReport[] = [];

const columns: ColumnDef<AdminTableFeatures, AdminReport>[] = [
  {
    id: 'reporter',
    header: 'Reporter',
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <Avatar className='size-8 shrink-0'>
          <AvatarImage
            src={row.original.user.image ?? DEFAULT_AVATAR}
            alt={row.original.user.name}
          />
          <AvatarFallback>
            <Skeleton className='size-full rounded-full' />
          </AvatarFallback>
        </Avatar>
        <span className='truncate font-medium'>{row.original.user.name}</span>
      </div>
    ),
    size: 200,
  },
  {
    id: 'blog',
    header: 'Blog',
    cell: ({ row }) => (
      <div className='flex min-w-0 flex-col'>
        <Link
          href={getAdminBlogPath(row.original.blog.slug)}
          className='line-clamp-2 font-medium whitespace-normal hover:underline'
        >
          {row.original.blog.title}
        </Link>
        <span className='text-muted-foreground truncate text-xs'>
          by {row.original.blog.author.name}
        </span>
      </div>
    ),
    size: 320,
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => (
      <Badge variant='outline'>{REASON_LABELS[row.original.reason]}</Badge>
    ),
    meta: { className: 'text-center' },
    size: 150,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { label, variant } = STATUS_BADGES[row.original.status];

      return <Badge variant={variant}>{label}</Badge>;
    },
    meta: { className: 'text-center' },
    size: 120,
  },
  {
    accessorKey: 'createdAt',
    header: 'Reported',
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
    cell: ({ row }) =>
      row.original.status === ReportStatus.PENDING ? (
        <ReviewReportDialog
          reportId={row.original.id}
          blogTitle={row.original.blog.title}
        />
      ) : (
        <ReportOutcome action={row.original.action} />
      ),

    meta: { className: 'text-center last:pr-6' },
    size: 110,
  },
];

const OVERVIEW_HIDDEN_COLUMNS: ColumnVisibilityState = {
  createdAt: false,
};

const OVERVIEW_PARAMS = {
  search: '',
  reason: null,
  status: ReportStatus.PENDING,
  page: 1,
  limit: DEFAULT_ADMIN_TABLE_PAGE_SIZE,
};

type ReportsTableProps = {
  showControls?: boolean;
};

const ReportsTable = ({ showControls = false }: ReportsTableProps) => {
  const [urlParams, setParams] = useQueryStates(adminReportsParsers);
  const params = showControls ? urlParams : OVERVIEW_PARAMS;
  const { search, reason, status, page, limit } = params;

  const { data, isPending, isError, refetch } = useAdminReports(params);

  const totalPages = data?.totalPages;
  const isSearchTooShort =
    search.length > 0 && search.length < MIN_ADMIN_TABLE_SEARCH_LENGTH;

  // Reviewing the only report on the last page under the "Pending" filter leaves `page` past the end.
  useEffect(() => {
    if (showControls && totalPages && page > totalPages) {
      setParams({ page: totalPages });
    }
  }, [showControls, page, totalPages, setParams]);

  const hasFilters = Boolean(search || reason || status);

  const emptyMessage = !showControls
    ? "No pending reports. You're all caught up."
    : hasFilters
      ? 'No reports match these filters.'
      : 'No reports yet.';

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
              placeholder='Search by reporter...'
              className='w-full max-w-72'
            />

            <div className='flex flex-wrap items-center gap-2'>
              <Select
                items={REASON_ITEMS}
                value={reason ?? ALL}
                onValueChange={(value) =>
                  setParams({
                    reason: value === ALL ? null : (value as ReportReason),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className='w-40' aria-label='Filter by reason'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {REASON_ITEMS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={STATUS_ITEMS}
                value={status ?? ALL}
                onValueChange={(value) =>
                  setParams({
                    status: value === ALL ? null : (value as ReportStatus),
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
                onClick={() =>
                  setParams({ search: '', reason: null, status: null, page: 1 })
                }
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
          data={data?.reports ?? EMPTY_REPORTS}
          getRowId={(report) => report.id}
          isPending={isPending && !isSearchTooShort}
          isError={isError}
          onRetry={() => refetch()}
          emptyMessage={emptyMessage}
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

export default ReportsTable;
