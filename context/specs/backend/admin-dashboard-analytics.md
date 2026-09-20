# Admin Dashboard Analytics

## Overview

The admin dashboard analytics section provides aggregated data about the application, such as **Total Users**, **Total Blogs**, and other key platform metrics. These analytics represent the total counts for each relevant category in the application.

The UI/UX for displaying these metrics in analytics cards will be implemented later. For now, the focus is strictly on the **backend implementation**: fetching and returning the required analytics data.

## Notes

- Create a method inside `apps/backend/src/admin/admin-service.ts` to fetch the admin dashboard analytics. Use a clear and relevant method name.
- Fetch all analytics counts concurrently using `Promise.all([])` to avoid executing the queries sequentially.
- Create a shared interface inside `/packages/types/src/admin.ts` that defines the analytics response shape. This type will be shared between the backend API response and the frontend when consuming the endpoint.
- For **Total Active Users**, count users whose last activity occurred within the past **30 days**.
- Install `date-fns` with `pnpm add date-fns` and use it for the date comparison in the backend.

## Analytics

Return the following 6 analytics:

- **Total Users**
- **Total Blogs**
- **Total Reports**
- **Total Subscribers**
- **Total Active Users**
- **Total Blog Likes**

## Reference

- `context/project-overview.md`
