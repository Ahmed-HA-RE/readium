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
