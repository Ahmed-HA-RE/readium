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
import { GetAllUsersAsAdmin, UpdateUserAsAdmin } from '@repo/types';
import { UpdateUserDto } from './dto/update-user-dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { S3ServiceService } from '../../s3-service/s3-service.service';
import { generateImageKey } from '../../../lib/utils';

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

    // Create is banned filter
    const statusFilter: Prisma.UserWhereInput = banned
      ? {
          banned,
        }
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

    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: limit && page ? (page - 1) * limit : undefined,
        take: limit,
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

    const totalPages = limit ? Math.ceil(totalUsers / limit) : 1;

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

  async updateUser(
    username: string,
    updateUserDto: UpdateUserDto,
    user: UserSession['user'],
    profileImage?: Express.Multer.File,
  ): Promise<UpdateUserAsAdmin> {
    const { name, website, bio } = updateUserDto;
    let imageKey: string | undefined;

    // Check if the user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { name: username },
      select: {
        id: true,
        image: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(
        `User with username ${username} does not exist`,
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

    // Update the user in the database
    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        website,
        bio,
        image: imageKey ?? existingUser.image,
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

    // If a new profile image is provided, upload it to S3 and update the user's image key in the database, otherwise keep the existing image key
    if (profileImage) {
      imageKey = existingUser.image
        ? existingUser.image
        : generateImageKey({
            fileName: profileImage.originalname,
            userId: existingUser.id,
          });
      await this.s3Service.uploadFile(profileImage, imageKey);
    }

    this.logger.log(
      `User with username ${username} has been updated by admin ${user.name}`,
    );

    return updatedUser;
  }
}
