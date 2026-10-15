'use client';

import { ADMIN_TABLE_PAGE_SIZES } from '@repo/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BlogPagination from '@/components/shared/pagination';

export type AdminTablePageSize = (typeof ADMIN_TABLE_PAGE_SIZES)[number];

const PAGE_SIZE_ITEMS = ADMIN_TABLE_PAGE_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

type TableFooterProps = {
  page: number;
  totalPages: number | undefined;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: AdminTablePageSize) => void;
};

// Rows per page and pagination, shared by the admin tables' domain routes.
const TableFooter = ({
  page,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: TableFooterProps) => (
  <div className='flex items-center justify-between gap-3 px-4 py-4 max-sm:flex-col'>
    <div className='flex items-center gap-2'>
      <span className='text-muted-foreground text-sm whitespace-nowrap'>
        Rows per page
      </span>
      <Select
        items={PAGE_SIZE_ITEMS}
        value={String(limit)}
        onValueChange={(value) =>
          onLimitChange(Number(value) as AdminTablePageSize)
        }
      >
        <SelectTrigger className='w-18' aria-label='Rows per page'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {PAGE_SIZE_ITEMS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {totalPages ? (
      <div className='flex items-center gap-4'>
        <span className='text-muted-foreground text-sm whitespace-nowrap'>
          Page {page} of {totalPages}
        </span>
        <BlogPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    ) : null}
  </div>
);

export default TableFooter;
