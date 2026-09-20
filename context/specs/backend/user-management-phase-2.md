# User Management Phase 2

## Overview

In this phase, implement the authenticated user's dashboard, inspired by the look and feel of Medium's user dashboard.

These endpoints are **private** and must only be accessible to authenticated users with the `user` role. Do **not** add `@AllowAnnonymus()`.

This phase focuses on:

- Fetching the current user's profile data for the dashboard sidebar.
- Fetching the current user's blogs with filtering, sorting, and pagination.

The profile data displayed in the dashboard will include information such as:

- Profile image
- Name
- Email
- `isPro`

`isPro` functionality will be implemented later. For now, return a fixed `true` value.

## Key Features

### Endpoints

Create the following **GET** endpoints:

- `GET /api/users/me`
- `GET /api/users/me/blogs`

Both endpoints must require authentication and the `user` role.

### Authentication and Ownership

- Do **not** add `@AllowAnnonymus()`.
- Use the existing `@Roles(['user'])` authorization pattern.
- Use the `@Session()` decorator to identify the currently authenticated user.
- The `/api/users/me` endpoint must return the user associated with the current session.
- Do not accept a user ID from the client for either endpoint. The authenticated user's identity must come from `@Session()`.

### GET `/api/users/me`

The endpoint must return the current authenticated user's profile information.

Return both the `session` and `user` objects:

```ts
{
  session: {
    // ...
  },
  user: {
    // ...
  }
}
```

Return the complete objects provided by the existing authentication/session implementation rather than reconstructing them unnecessarily.

Add `isPro` as a fixed `true` value for now. This will be replaced with the actual implementation later.

Create a shared type in `/packages/types` to define the response shape of this endpoint. This type will be reused by the Next.js application when fetching the current user during SSR.

### GET `/api/users/me/blogs`

This endpoint must return only blogs belonging to the currently authenticated user.

- Use `@Session()` to identify the current user.
- Use the session user's identifier when constructing the database `where` clause.
- Do not allow the client to provide another user's ID to retrieve their blogs.
- Only return blogs belonging to the authenticated user.

Reuse the existing `BlogQueryDto` because this endpoint uses the same filtering, sorting, and pagination behavior as the public user-blog endpoint.

Reuse `buildBlogQuery()` for the common query processing, but only destructure and use:

- `querySort`
- `pageValue`
- `limitValue`

Do **not** use the `queryValue` returned by `buildBlogQuery()`.

Instead, use `buildUserBlogsFilter()` to construct the search/filter conditions because the current user's name should not be part of the blog search criteria.

The filtering should therefore focus on the blog-specific fields, such as:

- Blog title
- Blog content

Follow the existing implementation patterns used by the public user-blog endpoint.

## Reference

- `context/project-overview.md`
- `context/user-management-plan.md`
