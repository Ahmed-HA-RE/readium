export enum BlogSortOptions {
  'NEWEST' = 'newest',
  'OLDEST' = 'oldest',
  'MOST_LIKED' = 'most_liked',
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  tags: string[];
  coverImage: string | null;
  isPublished: boolean;
  blogPro: boolean;
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogLike {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  blogId: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  image: string | null;
}

// No `content`: cards render `shortDescription`, so the body is omitted.
export interface GetAllBlogsResponse {
  blogs: (Omit<Blog, 'content'> & {
    author: BlogAuthor;
    isLikedByLoggedInUser: boolean;
    isBookmarkedByLoggedInUser: boolean;
  })[];
  totalPages: number;
}

export interface GetBlogBySlugResponse {
  blog: Blog & {
    author: BlogAuthor;
  };
  isLikedByLoggedInUser: boolean;
  isBookmarkedByLoggedInUser: boolean;
  // True when `blog.content` is the first half of a pro blog the caller cannot read in full.
  isContentLocked: boolean;
  // Words in the full body, so reading time is right even when `content` is cut.
  wordCount: number;
  // For the author only: why the story was taken down, with a ban outranking a warning.
  moderation: BlogModeration | null;
}

export type BlogModeration = 'warning' | 'ban';

// The trending panel renders a title, an excerpt, the author and a date, so
// nothing else is selected. `slug` is not rendered but every item is a link.
export interface GetTrendingBlogsResponse {
  title: string;
  slug: string;
  shortDescription: string;
  createdAt: Date;
  author: Pick<BlogAuthor, 'name' | 'image'>;
}

// The one remaining `{ success, data }` envelope, alongside `PUT /api/blogs/:slug`.
export interface CreateBlogResponse {
  success: boolean;
  data: Omit<Blog, '_count'>;
}

// `data.slug` is new when the title changed.
export type UpdateMyBlogResponse = CreateBlogResponse;

export enum AdminBlogStatus {
  PUBLISHED = 'Published',
  UNPUBLISHED = 'Unpublished',
}

export interface GetAllBlogsForAdmin {
  blogs: (Pick<
    Blog,
    | 'id'
    | 'title'
    | 'slug'
    | 'coverImage'
    | 'isPublished'
    | 'createdAt'
    | '_count'
  > & {
    author: Pick<BlogAuthor, 'id' | 'name'>;
  })[];
  totalPages: number;
}

export interface GetBlogBySlugForAdmin {
  blog: Blog & {
    author: Pick<BlogAuthor, 'name' | 'image' | 'id'> & {
      banned: boolean | null;
      role: string | null;
    };
  };
}
