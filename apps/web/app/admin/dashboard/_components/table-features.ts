import {
  columnSizingFeature,
  columnVisibilityFeature,
  tableFeatures,
} from '@tanstack/react-table';

// Shared by every admin table, so their column definitions type against the same features.
// `columnMeta` is type-only: a column's `className` styles its header and cells alike.
// A `fluid` column takes the width the others leave, and its `size` becomes its minimum.
export const adminTableFeatures = tableFeatures({
  columnVisibilityFeature,
  columnSizingFeature,
  columnMeta: {} as { className?: string; fluid?: boolean },
});

export type AdminTableFeatures = typeof adminTableFeatures;
