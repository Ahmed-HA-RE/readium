import { Blog, BlogAuthor } from './blogs';

/**
 * One user in the search palette — avatar and name only. `image` arrives
 * presigned, and `email`, `role` and every moderation column are excluded:
 * this is an anonymous endpoint, so do not add a field without a review.
 */
export type SearchSuggestionUser = Pick<BlogAuthor, 'id' | 'name' | 'image'>;

/**
 * One blog in the search palette. Published blogs only, so every row is safe to
 * link to — the same rule as `LikesAndBookmarksBlogCard`.
 */
export interface SearchSuggestionBlog
  extends Pick<Blog, 'id' | 'title' | 'slug' | 'coverImage'> {
  author: Pick<BlogAuthor, 'name'>;
}

/**
 * `GET /api/search/suggestions`. Either group can be empty, and the palette
 * hides a group's heading when it is.
 */
export interface GetSearchSuggestions {
  users: SearchSuggestionUser[];
  blogs: SearchSuggestionBlog[];
}
