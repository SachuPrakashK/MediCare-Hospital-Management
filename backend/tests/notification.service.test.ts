import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { notificationService } from '../src/services/notification.service.js';

describe('notification service', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('applies ownership, search and read-status filters to the paginated query', async () => {
    const findMany = vi.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.notification, 'count').mockResolvedValue(0);

    await notificationService.list('user-1', 2, 10, { search: 'billing', status: 'unread' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', isRead: false }),
        skip: 10,
        take: 10,
      }),
    );
  });

  it('does not dismiss a notification owned by another user', async () => {
    vi.spyOn(prisma.notification, 'deleteMany').mockResolvedValue({ count: 0 });

    await expect(notificationService.dismiss('user-1', 'notification-1')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });
});
