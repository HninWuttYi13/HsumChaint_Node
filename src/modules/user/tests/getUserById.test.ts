import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { getUserByIdService } from '../user.service';

describe('getUserByIdService Integration Test', () => {
  let donorId: number;
  let monkId: number;

  beforeAll(async () => {
    // 1. Clean data to avoid pollution
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });

    // 2. Create a Donor (No profile)
    const donor = await prisma.user.create({
      data: {
        phone: '09111111111',
        username: 'test_donor',
        email: 'donor@test.com',
        password: 'hp',
        userType: 'Donor',
      },
    });
    donorId = donor.id;

    // 3. Create a Monk (With nested profile)
    const monk = await prisma.user.create({
      data: {
        phone: '09222222222',
        username: 'test_monk',
        email: 'monk@test.com',
        password: 'hp',
        userType: 'Monk',
        monkProfile: {
          create: {
            monasteryName: 'Golden Monastery',
            monasteryAddress: 'Yangon',
          },
        },
      },
    });
    monkId = monk.id;
  });

  afterAll(async () => {
    // clean up created test data
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    await prisma.$disconnect();
  });

  it('should return user with monkProfile when user is a Monk', async () => {
    const result = await getUserByIdService({ id: monkId });

    expect(result).not.toBeNull();
    expect(result?.username).toBe('test_monk');
    expect(result?.monkProfile?.monasteryName).toBe('Golden Monastery');
  });

  it('should return user with null monkProfile when user is a Donor', async () => {
    const result = await getUserByIdService({ id: donorId });

    expect(result).not.toBeNull();
    expect(result?.username).toBe('test_donor');
    expect(result?.monkProfile).toBeNull();
  });

  it('should return null for non-existent ID', async () => {
    const result = await getUserByIdService({ id: 99999 });
    expect(result).toBeNull();
  });

  it('should return null if the user is soft-deleted (isDeleted: true)', async () => {
    // Arrange: Soft delete the donor
    await prisma.user.update({
      where: { id: donorId },
      data: { isDeleted: true },
    });

    // Act
    const result = await getUserByIdService({ id: donorId });

    // Assert
    expect(result).toBeNull();
  });
});
