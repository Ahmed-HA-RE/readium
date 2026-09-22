# Blog Actions Phase

## Overview

Wire up blog card interactions: toggling like, toggling bookmark, and reporting a blog. Like/bookmark must reflect instantly in the UI (optimistic update) even while the backend call is still in flight.

---

## Like & Bookmark

### Setup

- UI and backend endpoints already exist — only the frontend action layer is missing.
- Create actions in `apps/web/lib/actions/blogs/` to invoke the endpoints via `axios`.

### Optimistic Update Pattern (critical — follow exactly)

- Use `useOptimistic()` from React.
  - Initial value comes from the blog props: `isLikedByLoggedInUser` and `isBookmarkedByLoggedInUser`.
  - Two separate optimistic setters:
    - `setIsLikedOptimistic`
    - `setIsBookmarkedOptimistic`
- In each action's `onClick` handler, compute the flipped boolean (the new optimistic value) and pass it to the corresponding setter before the actual API call resolves.
- Wrap the action call in `useTransition()`.
  - **Guard against double-firing:** inside the transition, check `if (isPending) return` first — the UI should still reflect the optimistic state instantly, but the actual mutation should not be re-triggered while a previous call is still in flight.

### Cache Invalidation

- On successful completion of the action, invalidate the `blogs` query key so the list reflects the latest server state:
  ```ts
  await queryClient.invalidateQueries({ queryKey: ['blogs'] });
  ```
- Reference: https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient#invalidatequeries

---

## Report

### Component Structure

- **Must be its own component, in its own file** — do not embed the report UI inside `BlogCard`.

### Trigger

- Use shadcn's `DropdownMenu`.
- Trigger icon:
  ```tsx
  <IoEllipsisHorizontal className='absolute top-8 right-0 z-10 size-5 text-muted-foreground' />
  ```
- `variant='destructive'` on the trigger — signals this leads to a significant/important action.

### Report Dialog

- Use shadcn's `Dialog`.
- `DialogTrigger` content: `<VscReport />` (from `react-icons/vsc`) + "Report" label.
  - Pass a `render` attribute to `<DialogTrigger>`.
  - `variant='destructive'`.
- Visual reference: `@/context/screenshots/report-blog.png` — **but not a full match.** Adjust as follows:
  - **Keep:** "Report" heading, radio button options.
  - **Remove:** the "Block" checkbox, and the "Report a different issue / submit a request / read our rules" content block.

### Radio Options

- Use shadcn's `RadioGroup`.
- Options come from the existing `ReportReason` enum at `packages/types/src/reports.ts` — reuse it, don't redefine the values here.

### Validation

Schema — create at `app/schema/report.ts`:

```tsx
export const reportBlogSchema = z.object({
  reason: z.enum(Object.values(ReportReason)),
});

export type ReportBlogFormData = z.infer<typeof reportBlogSchema>;
```

- Wire the schema to the form with `react-hook-form`.
- Use shadcn's `<Field>` component for the form structure — reference shadcn MCP server first, or https://ui.shadcn.com/docs/forms/react-hook-form#radio-group if MCP is unavailable.
- **Submit button must be disabled until a reason is selected.** Use `useWatch` from `react-hook-form` to track the `reason` field's current value; disable submit while it's `undefined`/`null`.

### Action

- Backend endpoint already exists.
- Create the frontend action at `apps/web/lib/actions/report/`.
- On successful submit, invalidate the `blogs` query key as well, so the card reflects the new
  reported state:
  ```ts
  await queryClient.invalidateQueries({ queryKey: ['blogs'] });
  ```

## References

- `@/context/screenshots/report-blog.png`
- https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient#invalidatequeries
- https://ui.shadcn.com/docs/forms/react-hook-form#radio-group
