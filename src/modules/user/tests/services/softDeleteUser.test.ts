import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { softDeleteUserService } from '../../user.service';

describe('softDeleteUserService Integration Test', () => {
  let userId: number;

  beforeAll(async () => {
    // 1. Clean data pollution
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });

    // 2. Create a test user to delete
    const user = await prisma.user.create({
      data: {
        phone: '09444444444',
        username: 'ghost_user',
        email: 'ghost@test.com',
        password: 'hp',
        userType: 'Donor',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // clean up created test data
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    await prisma.$disconnect();
  });

  it('should soft delete user by setting isDeleted to true', async () => {
    // ACT: Call the service
    const result = await softDeleteUserService({ id: userId });

    // ASSERT: Check the returned data
    expect(result.username).toBe('ghost_user');

    // Verify in DB: Row must still exist but isDeleted should be true
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.isDeleted).toBe(true);
  });

  it('should throw an error if the user is already soft-deleted', async () => {
    // ACT & ASSERT: Try to delete the same user again
    // It should throw the 404 AppError you defined
    await expect(softDeleteUserService({ id: userId })).rejects.toThrow(
      'User is not found or already deleted'
    );
  });

  it('should throw an error if the user ID does not exist', async () => {
    // ACT & ASSERT: Try to delete a non-existent ID
    await expect(softDeleteUserService({ id: 99999 })).rejects.toThrow(
      'User is not found or already deleted'
    );
  });
});
