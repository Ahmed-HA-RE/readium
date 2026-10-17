import {
  columnSizingFeature,
  columnVisibilityFeature,
  tableFeatures,
} from '@tanstack/react-table';

// Shared by every admin table, so their column definitions type against the same features.
// `columnMeta` is type-only: a column's `className` styles its header and cells alike.
export const adminTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnSizingFeature,
  columnMeta: {} as { className?: string },
});

export type AdminTableFeatures = typeof adminTableFeatures;
