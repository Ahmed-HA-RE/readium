'use client';

import { useEffect, useImperativeHandle } from 'react';
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import type { IconType } from 'react-icons';
import { FiBold, FiItalic } from 'react-icons/fi';
import { IoLink } from 'react-icons/io5';
import { FaQuoteRight, FaRedo, FaUndo } from 'react-icons/fa';
import { FaCode, FaStrikethrough } from 'react-icons/fa6';
import { LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { MdFormatListNumbered } from 'react-icons/md';
import { GoListUnordered } from 'react-icons/go';
import { cn } from '@/lib/utils';
import { blogProseClassName } from '@/lib/blog-prose';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// `html` is registered as an alias of `xml`.
const lowlight = createLowlight({
  bash,
  cpp,
  css,
  java,
  javascript,
  php,
  plaintext,
  python,
  typescript,
  xml,
});

// The reader leaves unlabelled blocks uncoloured, so the editor must not auto-detect them.
const editorLowlight = {
  ...lowlight,
  highlightAuto: (value: string) => lowlight.highlight('plaintext', value),
};

const DEFAULT_LANGUAGE = 'default';

const CODE_BLOCK_LANGUAGES = [
  { value: DEFAULT_LANGUAGE, label: 'Default' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'xml', label: 'XML' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
];

// A second press on an active link removes it, like the other toggles.
const toggleLink = (editor: Editor) => {
  if (editor.isActive('link')) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  const href = window.prompt('Link URL', 'https://');
  if (!href) return;

  editor.chain().focus().setLink({ href }).run();
};

type ToolbarAction = {
  label: string;
  Icon: IconType;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'Bold',
    Icon: FiBold,
    run: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive('bold'),
  },
  {
    label: 'Italic',
    Icon: FiItalic,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive('italic'),
  },
  {
    label: 'Link',
    Icon: IoLink,
    run: toggleLink,
    isActive: (editor) => editor.isActive('link'),
  },
  {
    label: 'Quote',
    Icon: FaQuoteRight,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
  {
    label: 'Code block',
    Icon: FaCode,
    // Inside a block this leaves it rather than toggling, which would turn the
    // block back into a paragraph and drop its language.
    run: (editor) =>
      editor.isActive('codeBlock')
        ? editor.chain().focus().exitCode().run()
        : editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  {
    label: 'Heading 1',
    Icon: LuHeading1,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    label: 'Heading 2',
    Icon: LuHeading2,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    label: 'Heading 3',
    Icon: LuHeading3,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
  },
  {
    label: 'Numbered list',
    Icon: MdFormatListNumbered,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    label: 'Bulleted list',
    Icon: GoListUnordered,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    label: 'Strikethrough',
    Icon: FaStrikethrough,
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive('strike'),
  },
  {
    label: 'Undo',
    Icon: FaUndo,
    run: (editor) => editor.chain().focus().undo().run(),
    isDisabled: (editor) => !editor.can().undo(),
  },
  {
    label: 'Redo',
    Icon: FaRedo,
    run: (editor) => editor.chain().focus().redo().run(),
    isDisabled: (editor) => !editor.can().redo(),
  },
];

const EditorToolbar = ({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) => {
  const { active, unavailable, isCodeBlock, language } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      active: TOOLBAR_ACTIONS.map((action) => action.isActive?.(editor)),
      unavailable: TOOLBAR_ACTIONS.map((action) => action.isDisabled?.(editor)),
      isCodeBlock: editor.isActive('codeBlock'),
      language:
        (editor.getAttributes('codeBlock').language as string | null) ??
        DEFAULT_LANGUAGE,
    }),
  });

  return (
    <TooltipProvider>
      <div
        role='toolbar'
        aria-label='Formatting'
        className='flex flex-wrap items-center gap-1.5 border-b p-2'
      >
        {TOOLBAR_ACTIONS.map(({ label, Icon, run, isActive }, index) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  aria-label={label}
                  aria-pressed={isActive ? Boolean(active[index]) : undefined}
                  disabled={disabled || unavailable[index]}
                  onClick={() => run(editor)}
                  className='aria-pressed:bg-muted'
                />
              }
            >
              <Icon />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}

        {isCodeBlock && (
          <Select
            items={CODE_BLOCK_LANGUAGES}
            value={language}
            onValueChange={(value) =>
              editor
                .chain()
                .focus()
                .updateAttributes('codeBlock', {
                  language: value === DEFAULT_LANGUAGE ? null : value,
                })
                .run()
            }
            disabled={disabled}
          >
            <SelectTrigger
              size='sm'
              aria-label='Code block language'
              className='ml-auto'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CODE_BLOCK_LANGUAGES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </TooltipProvider>
  );
};

type BlogEditorProps = {
  ref?: React.Ref<{ focus: () => void }>;
  value: string;
  onChange: (html: string) => void;
  onBlur: () => void;
  labelId: string;
  invalid?: boolean;
  disabled?: boolean;
};

const BlogEditor = ({
  ref,
  value,
  onChange,
  onBlur,
  labelId,
  invalid,
  disabled,
}: BlogEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // `autolink` also makes the mark inclusive, so text typed after a link would join it.
        link: { openOnClick: false, autolink: false, defaultProtocol: 'https' },
      }),
      CodeBlockLowlight.configure({ lowlight: editorLowlight }),
    ],
    content: value,
    // Rendering on the server would mismatch on hydration, per the Next.js guide.
    immediatelyRender: false,
    // An empty document still serialises to `<p></p>`, which would dodge the required check.
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
    onBlur,
  });

  // Lets react-hook-form focus the editor when it is the first invalid field.
  useImperativeHandle(ref, () => ({ focus: () => editor?.commands.focus() }), [
    editor,
  ]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-labelledby': labelId,
          'aria-invalid': String(Boolean(invalid)),
          class: cn(blogProseClassName, 'min-h-80 px-4 py-3 outline-none'),
        },
      },
    });
  }, [editor, labelId, invalid]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        invalid &&
          'border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40',
      )}
    >
      {editor ? (
        <>
          <EditorToolbar editor={editor} disabled={disabled} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <Skeleton className='h-92 rounded-none' />
      )}
    </div>
  );
};

export default BlogEditor;
