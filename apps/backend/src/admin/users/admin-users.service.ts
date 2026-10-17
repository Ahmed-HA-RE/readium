import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UserQueryDto } from './dto/user-query-dto';
import { Prisma } from '../../generated/prisma/client';
import { DEFAULT_ADMIN_TABLE_PAGE_SIZE } from '@repo/constants';
import {
  GetAllUsersAsAdmin,
  GetUserByUsernameAsAdmin,
  GetUserWithBlogsByUsernameAsAdmin,
  GetUserWithCommentsByUsernameAsAdmin,
  UpdateUserAsAdmin,
} from '@repo/types';
import { UpdateUserDto } from './dto/update-user-dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { S3ServiceService } from '../../s3-service/s3-service.service';
import { generateImageKey } from '../../../lib/utils';
import { BlogQueryDto } from '../../blogs/dto/blog-query-dto';
import { buildBlogQuery } from '../../blogs/utils/blog-query';
import { CommentQueryDto } from '../../comments/dto/comment-query-dto';
import { adminUserSelect } from './utils/user-query';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
  ) {}

  private logger = new Logger(AdminUsersService.name);

  async getAllUsersAsAdmin(query: UserQueryDto): Promise<GetAllUsersAsAdmin> {
    const { limit, page, search, banned, emailVerified } = query;

    // Create search filter for username and email
    const searchFilter: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const statusFilter: Prisma.UserWhereInput =
      banned === true
        ? { banned: true }
        : banned === false
          ? { NOT: { banned: true } }
          : {};

    const emailVerifiedFilter: Prisma.UserWhereInput =
      emailVerified !== undefined
        ? {
            emailVerified,
          }
        : {};

    const where: Prisma.UserWhereInput = {
      ...searchFilter,
      ...statusFilter,
      ...emailVerifiedFilter,
      role: { equals: 'user' }, // admin users should not be returned
    };

    const limitValue = limit ?? DEFAULT_ADMIN_TABLE_PAGE_SIZE;
    const pageValue = page ?? 1;

    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (pageValue - 1) * limitValue,
        take: limitValue,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          banned: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              blogs: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(totalUsers / limitValue);

    this.logger.log(
      `Retrieved ${users.length} ${users.length > 1 ? 'users' : 'user'} out of ${totalUsers} total users`,
    );

    // Return the users with signed URLs for their profile images and total pages
    for (const user of users) {
      if (user.image) {
        user.image = await this.s3Service.getSignedUrl(user.image);
      }
    }

    return { users, totalPages };
  }

  async getUserByUsername(username: string): Promise<GetUserByUsernameAsAdmin> {
    const existingUser = await this.prisma.user.findUnique({
      where: { name: username },
      select: adminUserSelect,
    });

    if (!existingUser) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    if (existingUser.image) {
      existingUser.image = await this.s3Service.getSignedUrl(
        existingUser.image,
      );
    }
    return existingUser;
  }

  async updateUser(
    username: string,
    updateUserDto: UpdateUserDto,
    user: UserSession['user'],
    profileImage?: Express.Multer.File,
  ): Promise<UpdateUserAsAdmin> {
    const { name, website, bio, role } = updateUserDto;
    let imageKey: string | null = null;

    // Check if the user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { name: username },
      select: {
        id: true,
        image: true,
        role: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    // Not allow admin to update other admin accounts
    if (existingUser.role === 'admin') {
      throw new ForbiddenException(
        'You do not have permission to update another admin account',
      );
    }

    // Check if the user is trying to update their own account
    if (user.id === existingUser.id) {
      throw new ForbiddenException('You cannot update your own account');
    }

    // Check if the new name is already taken by another user
    if (name) {
      const nameTaken = await this.prisma.user.findUnique({
        where: { name },
        select: { id: true },
      });
      if (nameTaken && nameTaken.id !== existingUser.id) {
        throw new BadRequestException(
          'The username is already taken by another user',
        );
      }
    }

    // If a new profile image is provided, upload it to S3 and update the user's image key in the database, otherwise keep the existing image key
    if (profileImage) {
      imageKey = generateImageKey({
        fileName: profileImage.originalname,
        userId: existingUser.id,
      });
      await this.s3Service.uploadFile(profileImage, imageKey);
    }

    // Update the user in the database
    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        website,
        bio,
        image: imageKey ?? existingUser.image,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        website: true,
        bio: true,
        createdAt: true,
        role: true,
        banned: true,
      },
    });

    if (existingUser.image && profileImage) {
      await this.s3Service.deleteFile(existingUser.image);
    }

    this.logger.log(
      `User with username ${username} has been updated by admin ${user.name}`,
    );

    return updatedUser;
  }

  async getUserBlogsByUsernameAsAdmin(
    username: string,
    query: BlogQueryDto,
  ): Promise<GetUserWithBlogsByUsernameAsAdmin> {
    const { search, sort, page, limit } = query;

    const { queryFilter, querySort, limitValue, pageValue } = buildBlogQuery(
      search,
      sort,
      page,
      limit,
    );

    const [userWithBlogs, totalBlogs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { name: username },
        select: {
          blogs: {
            where: {
              ...queryFilter,
            },
            select: {
              id: true,
              title: true,
              slug: true,
              shortDescription: true,
              content: true,
              tags: true,
              isPublished: true,
              blogPro: true,
              createdAt: true,
              coverImage: true,
              author: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: querySort,
            skip: (pageValue - 1) * limitValue,
            take: limitValue,
          },
        },
      }),
      this.prisma.blog.count({
        where: {
          ...queryFilter,
          author: {
            name: username,
          },
        },
      }),
    ]);

    if (!userWithBlogs) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    const totalPages = Math.ceil(totalBlogs / limitValue);

    // Generate signed URLs for the cover images of the blogs
    for (const blog of userWithBlogs.blogs) {
      if (blog.coverImage) {
        blog.coverImage = await this.s3Service.getSignedUrl(blog.coverImage);
      }
    }
    return {
      blogs: userWithBlogs.blogs,
      totalPages,
    };
  }

  async getUserCommentsByUsernameAsAdmin(
    username: string,
    query: CommentQueryDto,
  ): Promise<GetUserWithCommentsByUsernameAsAdmin> {
    const { limit, cursor } = query;
    const take = limit ?? 10;

    const user = await this.prisma.user.findUnique({
      where: { name: username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
      );
    }

    const comments = await this.prisma.comment.findMany({
      where: { authorId: user.id },
      take,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
      // `createdAt` alone is not a unique ordering, so a cursor on `id` would
      // sit at an ambiguous position whenever two comments share a timestamp
      // and rows would be skipped or repeated across pages.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        content: true,
        createdAt: true,
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return {
      data: comments,
      nextCursor: comments.length > 0 ? comments[comments.length - 1].id : null,
    };
  }

  // This service is for checking whether the username is already taken by another user
}
