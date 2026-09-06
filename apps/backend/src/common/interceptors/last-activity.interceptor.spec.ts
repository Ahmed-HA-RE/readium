import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, of } from 'rxjs';
import { subMinutes } from 'date-fns';
import { LastActivityInterceptor } from './last-activity.interceptor';
import { DatabaseService } from '../../database/database.service';

const NOW = new Date('2026-09-06T12:00:00.000Z');
const USER_ID = 'user-1';

// Lets the fire-and-forget activity write settle before assertions run.
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('LastActivityInterceptor', () => {
  let interceptor: LastActivityInterceptor;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let handle: jest.Mock;
  let next: CallHandler;

  const contextWithUser = (user?: { id: string }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => (user ? { session: { user } } : {}),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    // setImmediate stays real so flushPromises() can still drain the
    // fire-and-forget activity write.
    jest.useFakeTimers({ doNotFake: ['setImmediate'] }).setSystemTime(NOW);

    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };

    handle = jest.fn(() => of('handler-result'));
    next = { handle };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LastActivityInterceptor,
        { provide: DatabaseService, useValue: prisma },
      ],
    }).compile();

    interceptor = module.get(LastActivityInterceptor);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('records activity the first time a user is seen', async () => {
    prisma.user.findUnique.mockResolvedValue({ lastActivityAt: null });

    interceptor.intercept(contextWithUser({ id: USER_ID }), next);
    await flushPromises();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { lastActivityAt: NOW },
    });
  });

  it('refreshes activity once the stored value is older than the throttle', async () => {
    prisma.user.findUnique.mockResolvedValue({
      lastActivityAt: subMinutes(NOW, 16),
    });

    interceptor.intercept(contextWithUser({ id: USER_ID }), next);
    await flushPromises();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { lastActivityAt: NOW },
    });
  });

  it('skips the write while the stored value is still fresh', async () => {
    prisma.user.findUnique.mockResolvedValue({
      lastActivityAt: subMinutes(NOW, 14),
    });

    interceptor.intercept(contextWithUser({ id: USER_ID }), next);
    await flushPromises();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not touch the database for unauthenticated requests', async () => {
    interceptor.intercept(contextWithUser(), next);
    await flushPromises();

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('skips the write when the user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    interceptor.intercept(contextWithUser({ id: USER_ID }), next);
    await flushPromises();

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('swallows database failures so the request still succeeds', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('connection lost'));

    const result = interceptor.intercept(
      contextWithUser({ id: USER_ID }),
      next,
    );

    await expect(lastValueFrom(result)).resolves.toBe('handler-result');
    await expect(flushPromises()).resolves.not.toThrow();
  });

  it('passes the handler response through untouched', async () => {
    prisma.user.findUnique.mockResolvedValue({ lastActivityAt: null });

    const result = interceptor.intercept(
      contextWithUser({ id: USER_ID }),
      next,
    );

    await expect(lastValueFrom(result)).resolves.toBe('handler-result');
    expect(handle).toHaveBeenCalledTimes(1);
    await flushPromises();
  });
});
