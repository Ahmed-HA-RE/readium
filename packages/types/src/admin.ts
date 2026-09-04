import { Blog, BlogAuthor } from './blogs';
import { Comment } from './comments';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  banned: boolean | null;
  role: string | null;
  _count: {
    comments: number;
    blogs: number;
  };
}

export interface GetAllUsersAsAdmin {
  users: User[];
  totalPages: number;
}

export interface UpdateUserAsAdmin extends Pick<
  User,
  'id' | 'name' | 'email' | 'image' | 'createdAt' | 'role' | 'banned'
> {
  website?: string | null;
  bio?: string | null;
}

export interface GetUserByUsernameAsAdmin extends Pick<
  User,
  'id' | 'name' | 'email' | 'image' | 'createdAt' | 'banned' | '_count'
> {
  website?: string | null;
  bio?: string | null;
  banReason?: string | null;
  blogs: Pick<
    Blog,
    'id' | 'title' | 'slug' | 'isPublished' | 'createdAt' | 'coverImage'
  >[];
  comments: Pick<Comment, 'id' | 'content' | 'createdAt'>[];
}

export interface GetUserWithBlogsByUsernameAsAdmin {
  blogs: (Omit<Blog, '_count' | 'updatedAt' | 'authorId'> & {
    author: Pick<BlogAuthor, 'name'>;
  })[];
  totalPages: number;
}

export interface GetUserWithCommentsByUsernameAsAdmin {
  data: (Pick<Comment, 'id' | 'content' | 'createdAt'> & {
    blog: { id: string; title: string; slug: string };
  })[];
  nextCursor: string | null;
}

export interface UpdateAdminSettings extends Omit<
  UpdateUserAsAdmin,
  'role' | 'banned'
> {}
