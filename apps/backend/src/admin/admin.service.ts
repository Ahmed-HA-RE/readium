import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { AdminUsersService } from './users/admin-users.service';
import { generateImageKey } from '../../lib/utils';
import {
  AdminDashboardAnalytics,
  GetMyDataAsAdmin,
  GetMyBlogs,
  GetUserWithCommentsByUsernameAsAdmin,
  UpdateAdminSettings,
  UpdateMyBlogResponse,
} from '@repo/types';
import { subDays } from 'date-fns';
import { UpdateAdminDto } from './dto/update-admin-dto';
import { AdminMyBlogsQueryDto } from './dto/admin-my-blogs-query-dto';
import { CommentQueryDto } from '../comments/dto/comment-query-dto';
import { UsersService } from '../users/users.service';
import { BlogsService } from '../blogs/blogs.service';
import { UpdateBlogDto } from '../blogs/dto/update-blog-dto';

// A user counts as active when their last activity falls within this window.
const ACTIVE_USER_WINDOW_IN_DAYS = 30;

// The subscription feature is not implemented yet, so there is no table to count.
// Replace this placeholder with the real subscription count once Stripe lands.
const PLACEHOLDER_TOTAL_SUBSCRIBERS = 10;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
    private readonly AdminUsersService: AdminUsersService,
    private readonly usersService: UsersService,
    private readonly blogsService: BlogsService,
  ) {}

  readonly logger = new Logger(AdminService.name);

  async updateAdmin(
    updateAdminDto: UpdateAdminDto,
    user: UserSession['user'],
    image: Express.Multer.File,
  ): Promise<UpdateAdminSettings> {
    const { name, bio, website } = updateAdminDto;

    let imageKey: string | null = null;

    // Check if name is not taken by another user
    if (name && name.toLowerCase() !== user.name.toLowerCase()) {
      const existingUser = await this.usersService.isUsernameTaken(name);

      if (existingUser) {
        throw new BadRequestException(`${name} name is already taken`);
      }
    }

    if (image) {
      imageKey = generateImageKey({
        userId: user.id,
        fileName: image.originalname,
      });
      await this.s3Service.uploadFile(image, imageKey);
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        bio,
        website,
        image: imageKey ?? user.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        website: true,
        bio: true,
        createdAt: true,
        banned: true,
      },
    });

    if (user.image && image) {
      await this.s3Service.deleteFile(user.image);
    }

    this.logger.verbose(`Admin with username ${user.name} has been updated`);

    return updatedUser;
  }

  // The three /api/admin/me endpoints delegate to the services that already
  // back /api/admin/users/:username. The session carries the admin's username,
  // so the only difference is that the subject is fixed to the caller — and
  // that the profile drops the moderation columns.
  async getMyDataAsAdmin(user: UserSession['user']): Promise<GetMyDataAsAdmin> {
    return this.AdminUsersService.getUserByUsername(user.name, false);
  }

  async getMyBlogsAsAdmin(
    user: UserSession['user'],
    query: AdminMyBlogsQueryDto,
  ): Promise<GetMyBlogs> {
    return this.usersService.getMyBlogs(user, query);
  }

  async getMyCommentsAsAdmin(
    user: UserSession['user'],
    query: CommentQueryDto,
  ): Promise<GetUserWithCommentsByUsernameAsAdmin> {
    return this.AdminUsersService.getUserCommentsByUsernameAsAdmin(
      user.name,
      query,
    );
  }

  async updateMyBlogAsAdmin(
    user: UserSession['user'],
    slug: string,
    coverImage: Express.Multer.File | undefined,
    updateBlogDto: UpdateBlogDto,
  ): Promise<UpdateMyBlogResponse> {
    return this.blogsService.updateBlog(
      slug,
      coverImage,
      updateBlogDto,
      user.id,
    );
  }

  async deleteMyBlogAsAdmin(
    user: UserSession['user'],
    slug: string,
  ): Promise<void> {
    return this.blogsService.deleteBlog(slug, user.id);
  }

  async getDashboardAnalytics(): Promise<AdminDashboardAnalytics> {
    const activeSince = subDays(new Date(), ACTIVE_USER_WINDOW_IN_DAYS);

    // Run every count concurrently so the queries do not stack up sequentially.
    const [
      totalUsers,
      totalBlogs,
      totalReports,
      totalActiveUsers,
      totalBlogLikes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.blog.count(),
      this.prisma.report.count(),
      this.prisma.user.count({
        where: { lastActivityAt: { gte: activeSince } },
      }),
      this.prisma.like.count(),
    ]);

    this.logger.verbose('Retrieved admin dashboard analytics');

    return {
      totalUsers,
      totalBlogs,
      totalReports,
      totalSubscribers: PLACEHOLDER_TOTAL_SUBSCRIBERS,
      totalActiveUsers,
      totalBlogLikes,
    };
  }
}
