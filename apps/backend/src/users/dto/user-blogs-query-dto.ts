import { BlogQueryDto } from '../../blogs/dto/blog-query-dto';

/**
 * Query for `GET /api/users/:username`.
 *
 * Pagination (`page`, `limit`) and sorting (`sort`) are identical to the blog
 * feed, so they are inherited rather than duplicated. `search` is inherited
 * too, but it is applied differently here: see `buildUserBlogsFilter`, which
 * searches title and content only. The blogs are already scoped to one author,
 * so searching author data would be meaningless.
 */
export class UserBlogsQueryDto extends BlogQueryDto {}
