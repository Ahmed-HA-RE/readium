'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { useController, useWatch, type Control } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FaXmark } from 'react-icons/fa6';
import { LuImageUp } from 'react-icons/lu';
import { cn, formatFileSize } from '@/lib/utils';
import type { BlogFormData, BlogValues } from '@/schema/blog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const getExtension = (file: File) =>
  (file.name.includes('.')
    ? file.name.split('.').pop()!
    : file.type.split('/').pop()!
  ).toUpperCase();

type CoverImageFieldProps = {
  control: Control<BlogFormData, unknown, BlogValues>;
  // The saved cover's URL when editing, shown until a new file replaces it.
  currentCover?: string | null;
  disabled?: boolean;
};

const CoverImageField = ({
  control,
  currentCover,
  disabled,
}: CoverImageFieldProps) => {
  const labelId = useId();
  const titleId = useId();
  const { field, fieldState } = useController({ control, name: 'coverImage' });
  const coverImage = useWatch({ control, name: 'coverImage' });

  // Created in the handler rather than an effect, so Strict Mode's double
  // mount cannot revoke the URL the preview is still showing.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const selectFile = (file: File | undefined) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    field.onChange(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    multiple: false,
    disabled,
    // Rejected files are still handed to the form, so zod reports why.
    onDrop: (accepted, rejected) => {
      selectFile(accepted[0] ?? rejected[0]?.file);
      field.onBlur();
    },
  });

  return (
    <Field>
      <FieldLabel id={labelId}>
        Cover image <span className='text-muted-foreground'>(Optional)</span>
      </FieldLabel>

      <div
        {...getRootProps({
          ref: field.ref,
          role: 'button',
          'aria-labelledby': `${labelId} ${titleId}`,
          'aria-invalid': fieldState.invalid,
        })}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive',
          isDragActive && 'border-ring bg-muted/50',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />
        <LuImageUp className='size-6 text-muted-foreground' />
        <span id={titleId} className='text-sm font-medium'>
          Upload image
        </span>
        <span className='text-xs text-muted-foreground'>
          JPEG, JPG, PNG or WEBP · up to 5MB
        </span>
      </div>

      {coverImage ? (
        <Attachment className='w-full'>
          <AttachmentMedia variant='image'>
            {previewUrl && (
              <Image
                src={previewUrl}
                alt='Cover image preview'
                width={40}
                height={40}
                unoptimized
              />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{coverImage.name}</AttachmentTitle>
            <AttachmentDescription>
              {getExtension(coverImage)} · {formatFileSize(coverImage.size)}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label='Remove cover image'
              onClick={() => selectFile(undefined)}
              disabled={disabled}
            >
              <FaXmark />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ) : currentCover ? (
        // No remove action: the backend can replace a cover but not clear it.
        <Attachment className='w-full'>
          <AttachmentMedia variant='image'>
            <Image
              src={currentCover}
              alt='Current cover image'
              width={40}
              height={40}
            />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Current cover</AttachmentTitle>
            <AttachmentDescription>
              Upload a new image to replace it
            </AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ) : null}

      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
};

export default CoverImageField;
