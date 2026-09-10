import { BlogQueryDto } from '../../blogs/dto/blog-query-dto';

// Pagination and sorting are identical to the blog feed, so they are inherited.
// `search` is applied differently here — see `buildUserBlogsFilter`.
export class UserBlogsQueryDto extends BlogQueryDto {}
