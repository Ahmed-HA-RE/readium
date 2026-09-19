'use client';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';

type BlogPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};


const buildPageItems = (page: number, totalPages: number) => {
  const items: (number | 'ellipsis')[] = [];

  for (let candidate = 1; candidate <= totalPages; candidate++) {
    const isEdge = candidate === 1 || candidate === totalPages;
    const isNearCurrent = Math.abs(candidate - page) <= 1;

    if (isEdge || isNearCurrent) {
      items.push(candidate);
      continue;
    }

    if (items.at(-1) !== 'ellipsis') items.push('ellipsis');
  }

  return items;
};

const BlogPagination = ({
  page,
  totalPages,
  onPageChange,
  className,
}: BlogPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Go to previous page'
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <FaChevronLeft />
          </Button>
        </PaginationItem>

        {buildPageItems(page, totalPages).map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `gap-${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <Button
                variant={item === page ? 'outline' : 'ghost'}
                size='icon'
                aria-label={`Go to page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Go to next page'
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <FaChevronRight />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default BlogPagination;
