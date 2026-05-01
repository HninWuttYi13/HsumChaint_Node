import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { User } from 'prisma-client';
import { prisma } from '@/lib/prisma';
import { getUserByIdService } from '../../user.service';

/**
 * UNIT TEST STRATEGY: Module Mocking
 *
 * Converted from integration test (real DB) to unit test (mocked Prisma).
 * Why? We want to test ONLY the logic inside getUserByIdService in isolation —
 * no real DB connection needed, tests run faster and never leave dirty data.
 *
 * How it works:
 *  1. mock.module() replaces the entire "@/lib/prisma" import with a fake
 *     before any test runs. findUnique must be a real function, not a value.
 *  2. spyOn() wraps the fake so we can control its return value per-test
 *     with mockResolvedValue() and assert how it was called.
 *  3. Each test sets its own fake return value to simulate a specific DB state
 *     (found user, null, soft-deleted, etc.) — no seed/cleanup needed at all.
 */
mock.module('@/lib/prisma', () => ({
  prisma: {
    user: {
      // Placeholder — spyOn below will override the return value per test
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
    },
  },
}));

// Attach spy AFTER mock.module() so it wraps the already-mocked function.
// This gives us mockResolvedValue() and call-assertion abilities per test.
const findFirstMock = spyOn(prisma.user, 'findFirst');

const findUniqueMock = spyOn(prisma.user, 'findUnique');

/**
 * Shared mock data — mirrors what the real DB would return.
 * Donor has no monkProfile (null), Monk has a nested monkProfile object.
 * We reuse these across tests instead of seeding/cleaning a real DB.
 */

enum UserType {
  Monk = 'Monk',
  Donor = 'Donor',
}
const mockDonor = {
  id: 1,
  phone: '09111111111',
  username: 'test_donor',
  email: 'donor@test.com',
  userType: UserType.Donor,
  isDeleted: false,
  monkProfile: null, // Donors never have a monkProfile
};

const mockMonk = {
  id: 2,
  phone: '09222222222',
  username: 'test_monk',
  email: 'monk@test.com',
  userType: UserType.Monk,
  isDeleted: false,
  monkProfile: {
    monasteryName: 'Golden Monastery',
    monasteryAddress: 'Yangon',
  },
};

describe('getUserByIdService Unit Test (Mocking)', () => {
  // Reset call history and return values between tests to prevent bleed-over.
  // Without this, a mockResolvedValue() from one test could affect the next.
  beforeEach(() => {
    findFirstMock.mockClear();
    findUniqueMock.mockClear();
  });

  // Happy path for Monks: verifies the service returns the user AND
  // correctly exposes the nested monkProfile relation.
  it('should return user with monkProfile when user is a Monk', async () => {
    findFirstMock.mockResolvedValue(mockMonk as unknown as User); // fake: DB found the monk

    const result = await getUserByIdService({ id: mockMonk.id });

    expect(result).not.toBeNull();
    expect(result?.username).toBe('test_monk');
    expect(result?.monkProfile?.monasteryName).toBe('Golden Monastery');
  });

  // Happy path for Donors: verifies the service returns the user,
  // and that monkProfile is null since Donors have no profile row.
  it('should return user with null monkProfile when user is a Donor', async () => {
    findFirstMock.mockResolvedValue(mockDonor as unknown as User); // fake: DB found the donor

    const result = await getUserByIdService({ id: mockDonor.id });

    expect(result).not.toBeNull();
    expect(result?.username).toBe('test_donor');
    expect(result?.monkProfile).toBeNull();
  });

  // Edge case: ID doesn't exist in the DB.
  // Prisma returns null for findUnique when no record matches —
  // the service should pass that null through rather than throw.
  it('should throw error for non-existent ID', async () => {
    findFirstMock.mockResolvedValue(null);
    findUniqueMock.mockResolvedValue(null);

    await expect(getUserByIdService({ id: 99999 })).rejects.toThrow('User is not found');
  });

  it('should throw error if user is soft-deleted', async () => {
    findFirstMock.mockResolvedValue(null);

    const softDeletedUser = {
      ...mockDonor,
      isDeleted: true,
    };

    findUniqueMock.mockResolvedValue(softDeletedUser);

    await expect(getUserByIdService({ id: 1 })).rejects.toThrow('User is not found');
  });
});
