import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { differenceInMinutes } from 'date-fns';
import { DatabaseService } from '../../database/database.service';
import { UserSession } from '@thallesp/nestjs-better-auth';

// How stale lastActivityAt must be before it is written again. Without this
// throttle every authenticated request would cost an extra write.
const ACTIVITY_REFRESH_MINUTES = 15;

@Injectable()
export class LastActivityInterceptor implements NestInterceptor {
  constructor(private readonly prisma: DatabaseService) {}

  private logger = new Logger(LastActivityInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ session?: UserSession }>();

    const user = request.session?.user;

    if (user) {
      // Fire and forget so the response is never delayed by the activity write.
      void this.touchLastActivity(user.id);
    }

    return next.handle();
  }

  private async touchLastActivity(userId: string): Promise<void> {
    try {
      const now = new Date();

      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { lastActivityAt: true },
      });

      if (!existingUser) return;

      const { lastActivityAt } = existingUser;

      // Skip the write while the stored value is still recent enough.
      if (
        lastActivityAt &&
        differenceInMinutes(now, lastActivityAt) < ACTIVITY_REFRESH_MINUTES
      ) {
        return;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActivityAt: now },
      });
    } catch (error) {
      // Activity tracking must never break the request it is attached to.
      this.logger.warn(
        `Failed to update last activity for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
