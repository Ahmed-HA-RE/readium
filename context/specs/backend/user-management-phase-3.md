# User Management Phase 3

## Overview

Continue implementing the authenticated user's profile dashboard by adding endpoints for the user's related **comments, likes, and bookmarks**.

The comments endpoint will use **cursor-based pagination**. Likes and bookmarks will use **offset-based pagination** (`page` and `limit`) and will not have filtering or sorting, following the intended behavior of the Medium-style user profile dashboard.

All endpoints in this phase are private and must only be accessible to the authenticated user.

## Key Features

### Comments

Create an endpoint and service for fetching comments made by the current authenticated user.

- Reuse the existing `CommentQueryDto`.
- Use **cursor-based pagination** for comments.
- Do **not** implement filtering or sorting for this endpoint.
- Identify the user through the authenticated session rather than accepting a user ID from the client.
- Return the user's relevant profile information alongside each comment:
  - Name
  - Profile image

- Return the relevant comment information:
  - Content
  - `createdAt`'

- Use the `date-fns` package to format `createdAt` as relative time on the frontend.
- The displayed format should follow the compact relative-time style used by Medium, for example:
  - `3m`
  - `2w`
  - `5mo`
  - `1y`

### Likes && Bookmarks

Create an endpoint and service for fetching blogs liked and bookmarked by the current authenticated user.

Likes and Bookmarks should **not** have filtering or sorting. They **should** be paginated, so that a user with a long history does not pull their entire library down in one response:

- Use **offset-based pagination** with `page` and `limit`, structured like the `page` and `limit` fields on `BlogQueryDto`.
- Default to `limit` of **10** when the client sends none, and `page` **1**.
- Both endpoints share one query DTO — they page identically.
- Return `totalPages` alongside the blogs.
- Order by when the user liked or bookmarked the blog, newest first — not by when the blog was written.

The response should return the related blog information needed by the frontend:

- Blog title
- Blog slug
- Cover image
- Tags
- Author's name
- Author's profile image

Do not return unnecessary like or bookmark record data if it is not required by the frontend.

A blog that has been unpublished since it was liked or bookmarked should **not** be returned at all. It is filtered out server-side rather than returned with a flag for the frontend to grey out, so `isPublished` is not part of the response.

When a liked or bookmarked blog is selected, the frontend should navigate to the blog page using the blog's `slug`.

### Authentication

All three endpoints must:

- Require an authenticated session.
- Require the `user` role.
- Use `@Session()` to determine the current user.
- Never accept a user ID from the client to determine whose data is returned.
- Only return data belonging to the currently authenticated user.

## Reference

- `context/project-overview.md`
- `context/plans/user-management-plan.md`
