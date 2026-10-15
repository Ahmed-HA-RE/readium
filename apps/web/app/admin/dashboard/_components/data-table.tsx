'use client';

import {
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
} from '@tanstack/react-table';
import { useCreateAtom } from '@tanstack/react-store';
import { cn } from 'cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import RetryError from '@/components/shared/retry-error';
import { adminTableFeatures, type AdminTableFeatures } from './table-features';

type DataTableProps<TData extends object> = {
  columns: ColumnDef<AdminTableFeatures, TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  // The first load only; later pages keep the previous rows on screen instead.
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyMessage: string;
  skeletonRows: number;
  // Seeds the visibility atom once per mount, e.g. hiding columns in the overview's compact preview.
  initialColumnVisibility?: ColumnVisibilityState;
  // Fits a narrow container (the overview's half-width cards): auto layout, no fixed widths or minimum width.
  compact?: boolean;
  className?: string;
};

const CELL_CLASS = 'h-14 first:pl-4 last:pr-4';

// Only renders: the caller fetches, filters and paginates on the server.
const DataTable = <TData extends object>({
  columns,
  data,
  getRowId,
  isPending,
  isError,
  onRetry,
  emptyMessage,
  skeletonRows,
  initialColumnVisibility = {},
  compact = false,
  className,
}: DataTableProps<TData>) => {
  const columnVisibilityAtom = useCreateAtom<ColumnVisibilityState>(
    initialColumnVisibility,
  );

  const table = useTable({
    features: adminTableFeatures,
    columns,
    data,
    getRowId,
    atoms: { columnVisibility: columnVisibilityAtom },
  });

  const visibleColumns = table.getVisibleLeafColumns();

  const renderBody = () => {
    if (isPending) {
      return Array.from({ length: skeletonRows }, (_, index) => (
        <TableRow key={index} className='hover:bg-transparent'>
          {visibleColumns.map((column) => (
            <TableCell
              key={column.id}
              className={cn(CELL_CLASS, column.columnDef.meta?.className)}
            >
              <Skeleton className='h-4 w-full' />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (isError) {
      return (
        <TableRow className='hover:bg-transparent'>
          <TableCell colSpan={visibleColumns.length}>
            <RetryError
              message='Could not load the data.'
              onRetry={onRetry}
              className='py-10'
            />
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0) {
      return (
        <TableRow className='hover:bg-transparent'>
          <TableCell
            colSpan={visibleColumns.length}
            className='text-muted-foreground h-24 text-center'
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className={cn(CELL_CLASS, cell.column.columnDef.meta?.className)}
          >
            <table.FlexRender cell={cell} />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Table
      className={cn(
        !compact && 'table-fixed max-lg:min-w-[900px]',
        className,
      )}
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className='hover:bg-transparent'>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={compact ? undefined : { width: `${header.getSize()}px` }}
                className={cn(
                  'text-muted-foreground h-10 first:pl-4 last:pr-4',
                  header.column.columnDef.meta?.className,
                )}
              >
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>{renderBody()}</TableBody>
    </Table>
  );
};

export default DataTable;
