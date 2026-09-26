'use client';

import { useState, useEffect } from 'react';
import { FiCopy } from 'react-icons/fi';
import { IoMdCheckmark } from 'react-icons/io';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CopyButtonProps = {
  // The text shown in the pill.
  title: string;
  // The value written to the clipboard.
  link: string;
  className?: string;
};

const CopyButton = ({ title, link, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [progress, setProgress] = useState(0);

  const DURATION = 3500;

  useEffect(() => {
    if (copied) {
      const showTimer = setTimeout(() => {
        setShowConfirmation(true);
      }, 300);

      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / DURATION) * 100, 100);
        setProgress(newProgress);

        if (elapsed >= DURATION) {
          clearInterval(interval);
          setShowConfirmation(false);
          setTimeout(() => {
            setCopied(false);
            setProgress(0);
          }, 300);
        }
      }, 16);

      return () => {
        clearInterval(interval);
        clearTimeout(showTimer);
      };
    }
  }, [copied]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden flex items-center justify-center bg-muted rounded-full px-6 min-w-64 h-12 border border-border',
        className,
      )}
    >
      {/* Progress background */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 bg-primary/15 transition-opacity duration-500 ease-in-out',
          copied ? 'opacity-100' : 'opacity-0',
        )}
        style={{ width: `${progress}%` }}
      />

      {/* Original content — title and copy button */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-between gap-3 pl-6 pr-2 transition-all duration-500 ease-in-out',
          copied
            ? 'opacity-0 blur-md scale-95 pointer-events-none z-0'
            : 'opacity-100 blur-none scale-100 pointer-events-auto z-20',
        )}
      >
        <span className='text-base font-medium text-muted-foreground select-all truncate min-w-0 flex-1'>
          {title}
        </span>
        <Button
          onClick={handleCopy}
          className='gap-1.5 rounded-full cursor-pointer select-none hover:bg-primary/80'
        >
          <FiCopy className='w-3.5 h-3.5' />
          Copy
        </Button>
      </div>

      {/* Confirmation content */}
      <div
        className={cn(
          'relative flex items-center gap-2 transition-all duration-700 ease-in-out pointer-events-none z-10',
          showConfirmation
            ? 'opacity-100 blur-none scale-100'
            : 'opacity-0 blur-md scale-105',
        )}
      >
        <div className='w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center'>
          <IoMdCheckmark
            className='w-3.5 h-3.5 text-white'
            style={{
              strokeDasharray: 24,
              strokeDashoffset: showConfirmation ? 0 : 24,
              transition: 'stroke-dashoffset 0.6s ease-in-out 0.3s',
            }}
          />
        </div>
        <span className='text-sm font-semibold text-foreground'>
          Copied to clipboard!
        </span>
      </div>
    </div>
  );
};

export default CopyButton;
