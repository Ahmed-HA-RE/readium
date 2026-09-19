'use client';

import { BlogSortOptions } from '@repo/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Labels live here rather than in the enum: the enum is the API contract, this
// is only how the options read in the UI.
const SORT_LABELS: Record<BlogSortOptions, string> = {
  [BlogSortOptions.NEWEST]: 'Newest',
  [BlogSortOptions.OLDEST]: 'Oldest',
  [BlogSortOptions.MOST_LIKED]: 'Most liked',
};

const SORT_ITEMS = Object.values(BlogSortOptions).map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

type BlogSortSelectProps = {
  sort: BlogSortOptions;
  onSortChange: (sort: BlogSortOptions) => void;
};

const BlogSortSelect = ({ sort, onSortChange }: BlogSortSelectProps) => (
  <Select
    items={SORT_ITEMS}
    value={sort}
    onValueChange={(value) => onSortChange(value as BlogSortOptions)}
  >
    <SelectTrigger size='sm' aria-label='Sort blogs'>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {SORT_ITEMS.map(({ value, label }) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default BlogSortSelect;
