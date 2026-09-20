# Home Page Phase 3

## Overview

This phase will be about rendering the blogs on the main page only for authenticated users!. users will be able to prefom sorting and pagination. Also we will prefetch the blogs with **Tanstack query** on the SSR component for better **SEO** and again fetch it in the useQuery hook for client interactivity.

## Key Features

- We want to match the same max-width that **Medium** home page have. I already embeded the photo so you can refer to it on what i excatly mean you can find it in `context/screenshots/medium-hompage.png`. You will also notice that there's a right side `aside` UI don't overcomplicate things ignore it but!!! add an `<aside>` tag of `<h2>` that says Trending on `{APP_NAME}` why? becuase we will later inshaa Allah implement the a get all trending articles/blogs that display the latest 3 of most liked blogs.
- As for the prefetching on the SSR we already setted up the queryClient for that now all you need to do is
  1. Create the action in `apps/web/lib/actions/blogs/getAllBlogs` to invoke the `getAllBlogs` controller.
  2. Create the useQuery hook and invoke the action in it. you will need to pass a **3** params of
     - search
     - sort
     - page

  3. In **Home** page you will wrap the child component with `<Suspense fallback={<BlogCardSkeleton/>}>` why I'm doing that? let me explain. When on first render for the home page i don't wanna let the user wait for the blogs to be rendered to be able to see them i want to let the user see that we are loading/fetching the blogs and i also fetched in the SSR component because for the SEO to be able to crawl when it's indexed. because the child component will prefetch the blogs.
  4. Inside the child component you will prefetch the blogs and wrap the grandchild client component with `<HydrationBoundary state={dehydrate(queryClient)}>` like what the docs says https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#server-components-next-js-app-router. Don't forget to initilize a variable of `const queryClient = new QueryClient()` inside the the component so you can pass it to the state attribute.
  5. Now inside the grandchild client component it's very important what we will do so focus and if stuck ask me instead of automatically throw anything!!. We will mark the component as `use client` so we can make a client interactivity you will import the `useQuery` hook and invoke the action function created `getAllBlogs` and pass the required params of (search, sort, and page).
     **Important Note**: Make sure the prefetch and the useQuery queryKey both have the same key name!!.

  ### URL

  For the URL query params we will use `nuqs` library for that. Make sure to install and setup nuqs by refering to the docs https://nuqs.dev/docs/installation.
  After that step you will need to do multiple things:

1. We will need to acquire the searchParams becuase the child component is prefetching and i said we must match the keys for the qeryKey property so make sure you follow the docs https://nuqs.dev/docs/server-side for setting up the server side fetching query params with nuqs.
2. in the client component is where we will create the URL interactivity so make sure to import `useQueryStates` from nuqs and implement the getter and setter for both the page and sort. Refer to the docs for more reference https://nuqs.dev/docs/batching#usequerystates. Make sure to pass a boolean value of false to shallow property so the SSR component who fetch the searchParams gets updated when the interactivity happens on the client `{shallow:false}`

### Sorting && Pagination

- For the UI/UX the provided **Medium** home page mockup screenshot `context/screenshots/medium-hompage.png` dosen't include the sorting and pagination at the bottom of the page it's fine i want to add that extra on top of it.

#### Sorting

Use from the shadcn the `<Select>` component and make sure to refactor the option values to our created enum. You will to import the enum from `packages/types/src/blogs.ts`

#### Pagination

Use from shadcn/studio the component **Pagination 2** and refactor it based on the feature. Make sure you create the component in `/components/shared` becuase we will use the same pagination component across multiple domains

### Blogs Card UI

- Regarding the blog card make sure to create a shared directory in `apps/web/components/shared` called `blog-card.tsx` because we are going to use this component so many times across diffrent domains.
- As on how it should look run the shadcn/studio mcp server and get the blog-component-03 you will notice that extra files will be added with it make sure you delete all of them and keep just the blog-component. Change the name of the file and component to what i mentioned and refactor the component to include the provided fields that the backend returns.
- You will notice there's no tags section so make sure you include them in the card component maybe at the top or at the bottom i don't know maybe suggest for me before moving forward with the design.
- Read More button should navigate to `/blogSlug`.
- You will also notice that there's no bookmarked, like, and ellipsis that opens a dropdown menu for let's say to report the blog make sure to add them. I think adding the dropdown trigger which is ellipsis should be at the top-right of the blog card and the other 2 actions must be next to each other maybe bottom-right of the blog card?
- you will also notice that the response returns ` isLikedByLoggedInUser: boolean, isBookmarkedByLoggedInUser: boolean, isReportedByLoggedInUser: boolean;` make sure you render diffrent colors based on these 3 fields.
- You will notice that the author contains a role under his name when refactoring the blog card from shadcn/studio it's fine just remove it.
  **Important Note**: The dropdown menu will be implemented later so only add the icons.

#### Action Icons:

- For bookmark
  - `import { LuBookmarkPlus } from "react-icons/lu"` with text-muted-foreground
  - `import { FaBookmark } from "react-icons/fa"` with `text-blue-600` if he has the blog bookmarked.
- For Like
- `import { FaRegHeart } from "react-icons/fa"` with text-muted-foreground
- `import { FaHeart } from "react-icons/fa"` with `text-red-600` if he has the blog liked.
- For Report
  - `import { IoEllipsisHorizontal } from "react-icons/io5` with text-muted-foreground

  ## Reference
  - `context/project-overview.md`
  - `https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr#server-components-next-js-app-router`
  - `https://nuqs.dev/docs/installation`
  - `https://nuqs.dev/docs/server-side`
  - `https://nuqs.dev/docs/batching#usequerystates`
  - `context/screenshots/medium-hompage.png`
