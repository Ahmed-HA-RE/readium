export interface Comment {
  id: string;
  content: string;
  blogId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface GetBlogCommentsResponse {
  data: Comment[];
  nextCursor: string | null;
}
