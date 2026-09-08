## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Server components by default

- Only use `'use client'` when needed (interactivity, hooks, browser APIs)

- Use API routes when you need:
  
  - Webhooks (Stripe, GitHub, etc.)
  - File uploads with progress tracking
  - Long-running operations
  - Specific HTTP status codes or headers
  - Endpoints for future mobile/CLI clients
  - Third-party integrations

- Dynamic routes for item/collection pages

## Monorepo Architecture (Turborepo)

- The project is managed as a monorepo using **Turborepo**.
- Shared workspace packages live inside `/packages/`.
- Every shared package must include its own `package.json` with properly defined `name`, `version`, `main`, and `exports` fields.
- **Shared Types (`/packages/types`)**:
  - All return types, DTO shapes, and shared data models must be stored in `/packages/types`.
  - Use **Prisma payloads** (e.g., `Prisma.UserGetPayload<{ ... }>`) inside `/packages/types` to ensure strict type matching between database queries and API responses.
  - Both frontend fetch calls and NestJS service methods must import response types from `@project-name/types`.

## NestJS Backend (`apps/backend`)

- All backend code lives inside `apps/backend`.

### Domain Folder Structure

For each domain/feature module (e.g., `users`, `posts`), organize code under `/src/modules/<domain>/` with the following 3 files:

1. `<domain>.module.ts`
2. `<domain>.controller.ts`
3. `<domain>.service.ts`

### Request Validation & DTOs

- Create a `/dto` folder inside the domain directory when request validation is needed (`/src/<domain>/dto/`).
- Use **`class-validator`** for backend DTO validation:
  - Install via `pnpm add class-validator`.
  - Annotate DTO properties using standard decorators (`@IsString()`, `@IsEmail()`, `@IsNotEmpty()`, etc.).

### Database & ORM

- Use **Prisma ORM** connected to **PostgreSQL (Neon)**.
- Database access and Prisma queries belong strictly inside **Services**, never inside Controllers.

### Typing & Naming Conventions

- Service method names must clearly reflect their purpose (e.g., `getUsers()`, `getPostBySlug()`, `createSubscription()`).
- **Service Annotations**: Annotate return types explicitly in Service methods using types imported from `/packages/types`.
- **Controller Annotations**: Do NOT annotate return types on Controller methods to avoid redundant code (keep it DRY).

## Tailwind CSS v4

**CRITICAL**: We are using Tailwind CSS v4, which uses CSS-based configuration.

- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration must be done in CSS using the `@theme` directive in `@/app/globals.css`
- Use CSS custom properties for colors, spacing, etc.
- No JavaScript-based config allowed

Example v4 configuration:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

## File Organization

- Components:  If a component is only used within a specific route, place it in a route-scoped `_components` folder inside that route. If it is reused across multiple routes, place it in the global `@/components` directory.

- Pages: `@/app/[route]/page.tsx`

- Types: `@/types/[feature].ts`

- Lib/Utils: `@/lib/[utility].ts`

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files:  kebab-case (`item-card.tsx`)
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Use shadcn/ui components where applicable
- No inline styles
- Dark mode first, light mode as option

## Database

- Use Prisma ORM for all database operations

- Always use `prisma migrate dev` for schema changes (not `db push`)

- Run `prisma migrate status` before committing to verify migrations are in sync

- Production deployments must run `prisma migrate deploy` before the app starts

- Use try/catch in Server Actions

- Return `{ success, data, message }` pattern from actions

- Display user-friendly error messages via toast

#### Data Fetching & State Management (`apps/web`)

### API Request Layer (`/apps/web/lib/server/`)

- All API fetch request functions must live inside `/apps/web/lib/server/` organized by domain (e.g., `user.ts`, `posts.ts`).
- Keep these functions pure and typed—they take parameters, issue HTTP requests (via Axios or native `fetch`), and return typed payloads imported from `@project-name/types`.

### Client-Side Fetching & Caching (TanStack Query)

- Use **TanStack Query** for interactive components, client-side filtering, searching, or pagination to leverage loading states, error states, and automatic cache management.
- Custom query hooks must be placed inside `/apps/web/hooks/` (e.g., `use-posts.ts`, `use-user-profile.ts`).
- Hooks must wrap the underlying API functions from `/apps/web/lib/server/`.

### Server-Side Rendering (SSR) & Suspense

- Do NOT perform top-level data fetching inside a parent `page.tsx` if child components depend on `<Suspense>` boundary streaming.
- Create dedicated **SSR child components** that call the server API functions directly at their top level, enabling independent loading fallbacks with `<Suspense>`.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
