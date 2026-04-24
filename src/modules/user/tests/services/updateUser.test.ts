import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { updateUserService } from '../../user.service';

/**
 * UNIT TEST STRATEGY: Module Mocking
 *
 * updateUserService is the most complex service we test because it touches
 * THREE different systems that all need to be mocked:
 *
 *  1. prisma.user.findUnique — guard check: does the user exist?
 *  2. prisma.user.update     — persists the changed fields to DB
 *  3. Bun.password           — verify() checks old password, hash() hashes new one
 *
 * The service handles several distinct update scenarios in one function:
 *  - Basic field updates (username, avatar, etc.)
 *  - Nested relation updates (monkProfile.monasteryName)
 *  - Password changes (requires old password verification before hashing new one)
 *
 * By mocking all three systems, each test can simulate a precise DB/auth state
 * and assert only the behavior relevant to that scenario — no real DB or
 * bcrypt hashing involved.
 */
mock.module('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve(null)),
    },
  },
}));

// Prisma spies — control what "DB state" the service sees (findUnique)
// and verify the exact payload sent back to the DB (update).
const findUniqueMock = spyOn(prisma.user, 'findUnique');
const updateMock = spyOn(prisma.user, 'update');

// Bun.password spies — mock crypto so tests don't do real hashing.
// verify() simulates checking the old password, hash() simulates hashing the new one.
const passwordVerifyMock = spyOn(Bun.password, 'verify');
const passwordHashMock = spyOn(Bun.password, 'hash');

describe('updateUserService Unit Test (Mocking)', () => {
  // Clear all four mocks between tests — especially important here because
  // passwordVerifyMock returning true/false in one test must not leak into another.
  beforeEach(() => {
    findUniqueMock.mockClear();
    updateMock.mockClear();
    passwordVerifyMock.mockClear();
    passwordHashMock.mockClear();
  });

  /**
   * Shared mock user — represents the current DB state before any update.
   * Tests that change specific fields spread this object and override only
   * what that scenario needs, keeping mock data minimal and readable.
   */
  const mockUser = {
    id: 222,
    username: 'banana_monk',
    email: 'banana@test.com',
    password: 'hashed_password_in_db', // pre-hashed, as it would be in a real DB
    userType: 'Monk',
    monkProfile: {
      monasteryName: 'Su Taung Pyae',
      monasteryAddress: 'somewhere',
    },
  };

  // Happy path — basic field update: verifies the service correctly passes
  // simple scalar fields (username, email, etc.) to Prisma's update call.
  it('should update basic user info correctly', async () => {
    // Arrange: user exists, update returns the mutated version
    findUniqueMock.mockResolvedValue(mockUser as any);
    updateMock.mockResolvedValue({
      ...mockUser,
      username: 'updated_banana',
    } as any);
    const result = await updateUserService(222, { username: 'updated_banana' });

    expect(result.username).toBe('updated_banana');
    // Verify the exact shape sent to Prisma — catches bugs where the service
    // sends the wrong field name or wraps data incorrectly.
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 222 },
        data: expect.objectContaining({ username: 'updated_banana' }),
      })
    );
  });

  // Nested relation update: Prisma requires a specific `{ update: { ... } }`
  // shape when updating a related record. This test verifies the service
  // constructs that nested payload correctly, not just a flat field update.
  it('should update monk profile monastery name correctly', async () => {
    // Arrange: user exists with an existing monkProfile to update
    findUniqueMock.mockResolvedValue(mockUser as any);
    updateMock.mockResolvedValue({
      ...mockUser,
      monkProfile: { ...mockUser.monkProfile, monasteryName: 'New Monastery' },
    } as any);

    const result = await updateUserService(222, {
      monasteryName: 'New Monastery',
    });

    expect(result.monkProfile?.monasteryName).toBe('New Monastery');
    // Critical assertion: Prisma nested update must use `{ update: { field } }`
    // not just `{ monasteryName: "..." }` at the top level.
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monkProfile: { update: { monasteryName: 'New Monastery' } },
        }),
      })
    );
  });

  // Password change — happy path: verifies the full 3-step flow:
  //  1. verify() confirms old password matches what's stored
  //  2. hash() produces a new hashed password
  //  3. update() is called with the NEW hash, not the plain text input
  it('should change password successfully when old password is correct', async () => {
    // Arrange: user exists, old password check passes, new hash is produced
    findUniqueMock.mockResolvedValue(mockUser as any);
    passwordVerifyMock.mockResolvedValue(true as any); // old password is correct
    passwordHashMock.mockResolvedValue('new_hashed_password' as any);
    updateMock.mockResolvedValue({
      ...mockUser,
      password: 'new_hashed_password',
    } as any);

    await updateUserService(222, {
      oldPassword: 'old_password_input',
      newPassword: 'new_password_input',
    });

    // The hashed value (not plain text) must be what reaches the DB
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'new_hashed_password' }),
      })
    );
  });

  // Password change — wrong old password: if verify() returns false,
  // the service must throw before ever calling hash() or update().
  it('should reject password change when old password is incorrect', async () => {
    // Arrange: user exists but old password check fails
    findUniqueMock.mockResolvedValue(mockUser as any);
    passwordVerifyMock.mockResolvedValue(false as any); // wrong password

    await expect(
      updateUserService(222, {
        oldPassword: 'wrong_password',
        newPassword: 'new_password',
      })
    ).rejects.toThrow('Old password is incorrect');

    // Guard: neither hash nor update should have been reached
    expect(passwordHashMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  // Avatar update: isolated test to confirm avatar URL is passed through
  // correctly without interfering with other fields or the password flow.
  it('should update avatar URL correctly', async () => {
    // Arrange: user exists, update returns user with new avatar
    findUniqueMock.mockResolvedValue(mockUser as any);
    const avatarUrl = 'https://example.com/photo.png';
    updateMock.mockResolvedValue({ ...mockUser, avatar: avatarUrl } as any);

    const result = await updateUserService(222, { avatar: avatarUrl });

    expect(result.avatar).toBe(avatarUrl);
  });

  // Guard check — user not found: if findUnique returns null,
  // the service should throw immediately without calling update at all.
  it('should throw an error when trying to update with invalid user ID', async () => {
    // Arrange: simulate a DB miss — no user with this ID
    findUniqueMock.mockResolvedValue(null);

    await expect(updateUserService(999, { username: 'ghost' })).rejects.toThrow(
      'User is not found'
    );

    // Guard: update must never be reached if the user doesn't exist
    expect(updateMock).not.toHaveBeenCalled();
  });
});
