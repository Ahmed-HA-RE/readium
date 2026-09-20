# User Management Phase 1

## Overview

Add the user module, controller, and service. This phase will start by creating a **GET** endpoint that fetches a user's published blogs where **`isPublished`** is set to `true`.

The endpoint will be publicly accessible, allowing anonymous and unauthenticated users to access it. Users can filter, sort, and paginate the blogs.

Comments should **not** be fetched by this endpoint, as its primary purpose is to display the user's published blogs along with their public profile information, such as:

- Username
- Bio
- Website
- Avatar image

## Key Features

- Create the user module, controller, and service using the NestJS CLI:
  - `nest g module user`
  - `nest g controller user`
  - `nest g service user`

- Add the user service to the controller constructor and declare it as `private readonly`.

- Make the endpoint publicly accessible to anonymous and unauthenticated users by adding the `@AllowAnnonyms()` decorator.

- Use the `@Query()` decorator and pass the query parameters to `UserBlogsQueryDto`. Make sure `UserBlogsQueryDto` extends `BuildQueryDto` because it uses the same pagination and sorting properties.

- Do not reuse the complete `buildBlogQuery()` function for filtering because the filtering requirements for this endpoint are different.

- Reuse the relevant query values from `buildBlogQuery()`, specifically:
  - `querySort`
  - `limitValue`
  - `pageValue`

- Build the filtering conditions separately for this endpoint. Since the user's blogs are already scoped to the requested user, there is no need to filter or search through author data.

- The search/filtering should only apply to:
  - **Blog title**
  - **Blog content**

- Only return blogs where **`isPublished`** is `true`.

- Do not fetch comments as part of this endpoint.

## Reference

- `context/project-overview.md`
- `context/plans/user-management-plan.md`
