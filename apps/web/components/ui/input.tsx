import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const inputVariants = cva(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      file: {
        true: 'cursor-pointer p-0 pr-3 text-muted-foreground italic file:mr-3 file:h-full file:border-r file:border-solid file:border-input file:px-3 file:not-italic',
        false: '',
      },
      fileSize: {
        default: '',
        large: '',
      },
    },
    compoundVariants: [{ file: true, fileSize: 'large', className: 'h-9' }],
    defaultVariants: {
      file: false,
      fileSize: 'default',
    },
  },
);

function Input({
  className,
  type,
  fileSize = 'default',
  ...props
}: React.ComponentProps<'input'> &
  Pick<VariantProps<typeof inputVariants>, 'fileSize'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot='input'
      className={cn(
        inputVariants({ file: type === 'file', fileSize }),
        className,
      )}
      {...props}
    />
  );
}

export { Input };
