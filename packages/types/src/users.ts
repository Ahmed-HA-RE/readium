import { Blog } from './blogs';

/**
 * The public face of a user. Deliberately excludes `email`, `role`, `banned`
 * and every other moderation column: this payload is served to anonymous
 * callers, so anything not listed here must not be added without a review.
 */
export interface PublicUserProfile {
  name: string;
  bio: string | null;
  website: string | null;
  image: string | null;
}

export interface GetUserProfileWithBlogs {
  user: PublicUserProfile;
  // Published blogs only. No comment list is embedded — the profile shows the
  // blogs themselves, and comments belong to the single-blog endpoint.
  blogs: Pick<
    Blog,
    | 'id'
    | 'title'
    | 'slug'
    | 'content'
    | 'tags'
    | 'coverImage'
    | 'createdAt'
    | '_count'
  >[];
  totalPages: number;
}
