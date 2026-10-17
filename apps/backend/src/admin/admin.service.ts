import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3ServiceService } from '../s3-service/s3-service.service';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { generateImageKey } from '../../lib/utils';
import {
  AdminDashboardAnalytics,
  GetMyDataAsAdmin,
  GetAdminSuggestions,
  StripeBalanceAmount,
  UpdateAdminSettings,
} from '@repo/types';
import { subDays } from 'date-fns';
import { stripeClient } from '../../lib/stripe';
import { PRO_STATUSES } from '../../lib/constants';
import { ReportStatus } from '../generated/prisma/enums';
import { UpdateAdminDto } from './dto/update-admin-dto';
import { AdminSuggestionsQueryDto } from './dto/admin-suggestions-query-dto';
import { UsersService } from '../users/users.service';

// A user counts as active when their last activity falls within this window.
const ACTIVE_USER_WINDOW_IN_DAYS = 30;

const ADMIN_SUGGESTIONS_LIMIT = 5;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly s3Service: S3ServiceService,
    private readonly usersService: UsersService,
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

  // Profile fields only: admins don't write, comment, like or bookmark, so there is nothing to count.
  async getMyDataAsAdmin(user: UserSession['user']): Promise<GetMyDataAsAdmin> {
    const admin = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        website: true,
        bio: true,
        createdAt: true,
      },
    });

    return {
      ...admin,
      image: admin.image
        ? await this.s3Service.getSignedUrl(admin.image)
        : null,
    };
  }

  async getDashboardAnalytics(): Promise<AdminDashboardAnalytics> {
    const activeSince = subDays(new Date(), ACTIVE_USER_WINDOW_IN_DAYS);

    // Run every count concurrently so the queries do not stack up sequentially.
    const [
      totalUsers,
      totalBlogs,
      totalReports,
      pendingReports,
      totalActiveUsers,
      totalSubscribers,
      availableBalance,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.blog.count(),
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.user.count({
        where: { lastActivityAt: { gte: activeSince } },
      }),
      this.prisma.subscription.count({
        where: { status: { in: PRO_STATUSES } },
      }),
      this.getAvailableBalance(),
    ]);

    this.logger.verbose('Retrieved admin dashboard analytics');

    return {
      totalUsers,
      totalBlogs,
      totalReports,
      pendingReports,
      totalSubscribers,
      totalActiveUsers,
      availableBalance,
    };
  }

  // Unlike the public palette, banned users and admins are included, since admins search to moderate.
  async getSuggestions({
    q,
  }: AdminSuggestionsQueryDto): Promise<GetAdminSuggestions> {
    const users = await this.prisma.user.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      select: { id: true, name: true, image: true, banned: true, role: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: ADMIN_SUGGESTIONS_LIMIT,
    });

    return Promise.all(
      users.map(async (user) => ({
        ...user,
        image: user.image
          ? await this.s3Service.getSignedUrl(user.image)
          : null,
      })),
    );
  }

  // A Stripe outage shouldn't take the database counts down with it, so it degrades to `null`.
  private async getAvailableBalance(): Promise<StripeBalanceAmount[] | null> {
    try {
      const { available } = await stripeClient.balance.retrieve();
      return available.map(({ amount, currency }) => ({ amount, currency }));
    } catch (error) {
      this.logger.error('Failed to retrieve the Stripe balance', error);
      return null;
    }
  }
}
