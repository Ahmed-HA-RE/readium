'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { IconType } from 'react-icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type DashboardTab = {
  value: string;
  label: string;
  icon: IconType;
  count?: number;
};

type DashboardTabsProps = {
  tabs: DashboardTab[];
  value: string;
  onValueChange: (value: string) => void;
  isCountPending?: boolean;
  children: React.ReactNode;
  className?: string;
};

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -48 : 48, opacity: 0 }),
};

const contentTransition = {
  type: 'spring',
  stiffness: 340,
  damping: 32,
} as const;

const markerTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
} as const;

const DashboardTabs = ({
  tabs,
  value,
  onValueChange,
  isCountPending = false,
  children,
  className,
}: DashboardTabsProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);

  const handleValueChange = (nextValue: string) => {
    const currentIndex = tabs.findIndex((tab) => tab.value === value);
    const nextIndex = tabs.findIndex((tab) => tab.value === nextValue);

    setDirection(nextIndex > currentIndex ? 1 : -1);
    onValueChange(nextValue);
  };

  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => handleValueChange(String(nextValue))}
      className={cn('w-full', className)}
    >
      <TabsList
        variant='line'
        className='no-visible-scrollbar! flex h-auto! w-full justify-start! gap-0! rounded-none border-b border-border bg-transparent p-0!'
        onMouseLeave={() => setHoveredTab(null)}
      >
        {tabs.map(({ value: tabValue, label, icon: Icon, count }) => {
          const isActive = tabValue === value;
          const isHovered = tabValue === hoveredTab;

          return (
            <TabsTrigger
              key={tabValue}
              value={tabValue}
              onMouseEnter={() => setHoveredTab(tabValue)}
              className={cn(
                'relative flex flex-none cursor-pointer items-center justify-center bg-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none',
                'data-active:bg-transparent data-active:text-foreground',
                'dark:data-active:border-transparent dark:data-active:bg-transparent dark:data-active:text-foreground',
                'border-transparent shadow-none after:hidden data-active:border-transparent data-active:shadow-none',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className='relative z-10 flex items-center gap-2 rounded-md px-4 py-3'>
                {isHovered && (
                  <motion.span
                    layoutId='dashboard-tabs-hover'
                    className='pointer-events-none absolute inset-0 rounded-md bg-muted/70'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={markerTransition}
                  />
                )}
                <Icon className='relative z-10 size-4' />
                <span className='relative z-10'>{label}</span>
                {isCountPending ? (
                  <Skeleton className='relative z-10 h-5 w-6 rounded-full' />
                ) : (
                  count !== undefined && (
                    <Badge
                      variant='secondary'
                      className='relative z-10 tabular-nums'
                    >
                      {count}
                    </Badge>
                  )
                )}
              </span>

              {isActive && (
                <motion.div
                  layoutId='dashboard-tabs-indicator'
                  className='absolute right-0 -bottom-px left-0 h-0.5 bg-primary'
                  initial={false}
                  transition={markerTransition}
                />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className='relative overflow-hidden'>
        <AnimatePresence mode='popLayout' custom={direction} initial={false}>
          <motion.div
            key={value}
            custom={direction}
            variants={variants}
            initial='enter'
            animate='center'
            exit='exit'
            transition={contentTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </Tabs>
  );
};

export default DashboardTabs;
