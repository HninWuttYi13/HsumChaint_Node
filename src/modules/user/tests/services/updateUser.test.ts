import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { updateUserService } from '../../user.service';
describe('updateUserService Integration Test', () => {
  //Arrange: before test create a user to test
  let userId: number;
  beforeAll(async () => {
    //if there is old data, clean
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });

    const hashPassword = await Bun.password.hash('hashed_password');
    const user = await prisma.user.create({
      data: {
        phone: '09222222222',
        username: 'banana_monk',
        email: 'banana@test.com',
        password: hashPassword,
        userType: 'Monk',
        monkProfile: {
          create: {
            monasteryName: 'Su Taung Pyae',
            monasteryAddress: 'somewhere',
          },
        },
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    //clean up data and disconnect with database
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    await prisma.$disconnect();
  });

  it('should update basic user info correctly', async () => {
    //ACT: update username, email and contact phone
    const updatedData = {
      username: 'updated_banana',
      email: 'updated_banana@test.com',
      contactPhone: '09123456789',
    };
    const result = await updateUserService(userId, updatedData);
    //Assert: check if the database record is updated correctly
    expect(result.username).toBe(updatedData.username);
    expect(result.email).toBe(updatedData.email);
    expect(result.contactPhone).toBe(updatedData.contactPhone);
  });
  //Nested monk profile update test (monastery name only)
  it('should update monk profile(monastery name) correctly', async () => {
    //ACT: update monastery name only
    const result = await updateUserService(userId, {
      monasteryName: 'Thaw Tar Pan Monastery',
    });
    //ASSERT: check the monastery name is updated correctly while other fields remain unchanged
    expect(result.monkProfile?.monasteryName).toBe('Thaw Tar Pan Monastery');
    expect(result.monkProfile?.monasteryAddress).toBe('somewhere'); //unchanged
  });
  // Nested monk profile update test (monastery address only)
  it('should update monk profile(monastery address) correctly', async () => {
    //ACT: update monastery address only
    const result = await updateUserService(userId, {
      monasteryAddress: 'new address',
    });
    //ASSERT: check the monastery address is updated correctly while other fields remain unchanged
    expect(result.monkProfile?.monasteryAddress).toBe('new address');
    expect(result.monkProfile?.monasteryName).toBe('Thaw Tar Pan Monastery'); //unchanged
  });
  // Nested monk profile update test (both monastery name and address)
  it('should update monk profile(both monastery name and address) correctly', async () => {
    //ACT: update both monastery name and address
    const result = await updateUserService(userId, {
      monasteryName: 'new name',
      monasteryAddress: 'new address',
    });
    //ASSERT: check both monastery name and address are updated correctly
    expect(result.monkProfile?.monasteryName).toBe('new name');
    expect(result.monkProfile?.monasteryAddress).toBe('new address');
  });
  // Password Logic Test: accept new password when the old password is correct and reject when the old password is incorrect and store new password in hashed format
  it('should change password successfully when old password is correct', async () => {
    const updatedData = {
      oldPassword: 'hashed_password',
      newPassword: 'new_hashed_password',
    };
    //ACT: update password with correct old password
    await updateUserService(userId, updatedData);
    const result = await prisma.user.findUnique({ where: { id: userId } });
    //ASSERT: check if the password is updated correctly (in hashed format)
    expect(result?.password).not.toBe('new_hashed_password');
  });
  // Password Logic Test: reject password change when the old password is incorrect
  it('should reject password change when old password is incorrect', async () => {
    const updatedData = {
      oldPassword: 'wrong_old_password',
      newPassword: 'new_hashed_password',
    };
    //ACT & ASSERT: attempt to update password with incorrect old password and expect an error to be thrown
    await expect(updateUserService(userId, updatedData)).rejects.toThrow(
      'Old password is incorrect'
    );
  });
  // Uploading Profile Image Test: accept image if the image extension are jpg, jpeg, png, webp
  it('should update avatar URL correctly', async () => {
    //ACT: send avatar url string to user service
    const updatedData = {
      avatar: 'https://pub-f23a17c8e42740bc8e9b4c3b6392328b.r2.dev/profiles/test-image.png',
    };
    const result = await updateUserService(userId, updatedData);
    //ASSERT: check the avatar url link store in database
    expect(result.avatar).toBe(updatedData.avatar);
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.avatar).toBe(updatedData.avatar);
  });
  //failed update test: attempt to update with invalid user ID and expect an error to be thrown
  it('should throw an error when trying to update with invalid user ID', async () => {
    const invalidUserId = 9999; //assuming this ID does not exist
    const updatedData = { username: 'invalid_update' };
    //ACT & ASSERT: attempt to update with invalid user ID and expect an error to be thrown
    await expect(updateUserService(invalidUserId, updatedData)).rejects.toThrow(
      'User is not found'
    );
  });
});
