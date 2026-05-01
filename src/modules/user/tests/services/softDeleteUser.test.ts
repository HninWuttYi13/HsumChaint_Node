import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
// 1. Import the actual User type from Prisma
import type { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { softDeleteUserService } from '../../user.service';

/**
 * UNIT TEST STRATEGY: Module Mocking with Type Safety
 */
mock.module('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve(null)),
    },
  },
}));

const findFirstMock = spyOn(prisma.user, 'findFirst');
const updateMock = spyOn(prisma.user, 'update');

describe('softDeleteUserService Unit Test (Mocking)', () => {
  beforeEach(() => {
    findFirstMock.mockClear();
    updateMock.mockClear();
  });

  /**
   * 2. Define a strictly typed mock user.
   * This ensures that if your Prisma schema changes, your tests will catch it.
   */
  const mockUser: User = {
    id: 444,
    username: 'ghost_user',
    email: 'ghost@test.com',
    password: 'hashed_password', // Included to satisfy the User type
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  it('should soft delete user by setting isDeleted to true', async () => {
    // 3. No more 'as any' needed. The spy accepts the User type.
    findFirstMock.mockResolvedValue(mockUser);
    updateMock.mockResolvedValue({ ...mockUser, isDeleted: true });

    const result = await softDeleteUserService({ id: 444 });

    expect(result.username).toBe('ghost_user');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 444 },
        data: { isDeleted: true },
      })
    );
  });

  it('should throw an error if the user is already soft-deleted', async () => {
    // Explicitly returning null is type-safe as findFirst can return null
    findFirstMock.mockResolvedValue(null);

    await expect(softDeleteUserService({ id: 444 })).rejects.toThrow(
      'User is not found or already deleted'
    );

    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should throw an error if the user ID does not exist', async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(softDeleteUserService({ id: 999 })).rejects.toThrow(
      'User is not found or already deleted'
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});
