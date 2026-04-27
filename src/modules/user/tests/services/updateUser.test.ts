import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
// 1. Import types from Prisma Client
import type { MonkProfile, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateUserService } from '../../user.service';

/**
 * UNIT TEST STRATEGY: Module Mocking with Strict Typing
 */
mock.module('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve(null)),
    },
  },
}));

const findUniqueMock = spyOn(prisma.user, 'findUnique');
const updateMock = spyOn(prisma.user, 'update');

const passwordVerifyMock = spyOn(Bun.password, 'verify');
const passwordHashMock = spyOn(Bun.password, 'hash');

// 2. Define a type for the Mock User that includes the relation
type UserWithProfile = User & { monkProfile: MonkProfile | null };

describe('updateUserService Unit Test (Mocking)', () => {
  beforeEach(() => {
    findUniqueMock.mockClear();
    updateMock.mockClear();
    passwordVerifyMock.mockClear();
    passwordHashMock.mockClear();
  });

  /**
   * 3. Strictly typed mock data.
   * This ensures all required Prisma fields (id, createdAt, etc.) are present.
   */
  const mockUser: UserWithProfile = {
    id: 222,
    username: 'banana_monk',
    email: 'banana@test.com',
    password: 'hashed_password_in_db',
    userType: 'Monk',
    avatar: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    monkProfile: {
      id: 1,
      userId: 222,
      monasteryName: 'Su Taung Pyae',
      monasteryAddress: 'somewhere',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  it('should update basic user info correctly', async () => {
    // No more 'as any' — the mock matches the expected return type
    findUniqueMock.mockResolvedValue(mockUser);
    updateMock.mockResolvedValue({ ...mockUser, username: 'updated_banana' });

    const result = await updateUserService(222, { username: 'updated_banana' });

    expect(result.username).toBe('updated_banana');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 222 },
        data: expect.objectContaining({ username: 'updated_banana' }),
      })
    );
  });

  it('should update monk profile monastery name correctly', async () => {
    findUniqueMock.mockResolvedValue(mockUser);

    // Safety: ensure monkProfile exists before spreading in the mock update
    const updatedProfile = mockUser.monkProfile
      ? { ...mockUser.monkProfile, monasteryName: 'New Monastery' }
      : null;

    updateMock.mockResolvedValue({
      ...mockUser,
      monkProfile: updatedProfile,
    });

    const result = await updateUserService(222, {
      monasteryName: 'New Monastery',
    });

    expect(result.monkProfile?.monasteryName).toBe('New Monastery');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monkProfile: { update: { monasteryName: 'New Monastery' } },
        }),
      })
    );
  });

  it('should change password successfully when old password is correct', async () => {
    findUniqueMock.mockResolvedValue(mockUser);
    // Bun.password.verify returns boolean (or Promise<boolean>), which is type-safe
    passwordVerifyMock.mockResolvedValue(true);
    passwordHashMock.mockResolvedValue('new_hashed_password');

    updateMock.mockResolvedValue({
      ...mockUser,
      password: 'new_hashed_password',
    });

    await updateUserService(222, {
      oldPassword: 'old_password_input',
      newPassword: 'new_password_input',
    });

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'new_hashed_password' }),
      })
    );
  });

  it('should reject password change when old password is incorrect', async () => {
    findUniqueMock.mockResolvedValue(mockUser);
    passwordVerifyMock.mockResolvedValue(false);

    await expect(
      updateUserService(222, {
        oldPassword: 'wrong_password',
        newPassword: 'new_password',
      })
    ).rejects.toThrow('Old password is incorrect');

    expect(passwordHashMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should update avatar URL correctly', async () => {
    findUniqueMock.mockResolvedValue(mockUser);
    const avatarUrl = 'https://example.com/photo.png';
    updateMock.mockResolvedValue({ ...mockUser, avatar: avatarUrl });

    const result = await updateUserService(222, { avatar: avatarUrl });

    expect(result.avatar).toBe(avatarUrl);
  });

  it('should throw an error when trying to update with invalid user ID', async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(updateUserService(999, { username: 'ghost' })).rejects.toThrow(
      'User is not found'
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});
