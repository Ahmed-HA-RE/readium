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

export interface GetBlogBySlugResponse {
  blog: Blog & {
    author: BlogAuthor;
  };
  isLikedByLoggedInUser: boolean;
  isBookmarkedByLoggedInUser: boolean;
  isReportedByLoggedInUser: boolean;
}
