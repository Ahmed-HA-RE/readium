export enum BlogSortOptions {
  'NEWEST' = 'newest',
  'OLDEST' = 'oldest',
  'MOST_LIKED' = 'most_liked',
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  coverImage: string | null;
  isPublished: boolean;
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

export interface GetAllBlogsResponse {
  blogs: (Blog & {
    author: BlogAuthor;
    isLikedByLoggedInUser: boolean;
    isBookmarkedByLoggedInUser: boolean;
  })[];
  totalPages: number;
}

// No author avatar: the detail page does not render one, so the key is not
// selected and never reaches the client as an unsigned S3 key.
export interface GetBlogBySlugResponse {
  blog: Blog & {
    author: Pick<BlogAuthor, 'id' | 'name'>;
  };
  isLikedByLoggedInUser: boolean;
  isBookmarkedByLoggedInUser: boolean;
  isReportedByLoggedInUser: boolean;
}

// The trending panel renders a title, an excerpt, the author and a date, so
// nothing else is selected. `slug` is not rendered but every item is a link.
export interface GetTrendingBlogsResponse {
  title: string;
  slug: string;
  content: string;
  createdAt: Date;
  author: Pick<BlogAuthor, 'name' | 'image'>;
}

export interface GetAllBlogsForAdmin {
  blogs: (Pick<
    Blog,
    'id' | 'title' | 'slug' | 'isPublished' | 'createdAt' | '_count'
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
