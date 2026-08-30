import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UserQueryDto } from './dto/user-query-dto';
import { Prisma } from '../../generated/prisma/client';
import { GetAllUsersAsAdmin } from '@repo/types';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: DatabaseService) {}

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

    return { users, totalPages };
  }
}
