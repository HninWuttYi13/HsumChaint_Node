import type { Prisma } from 'prisma-client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import type { getAllUsersInput, idParamsInput, updateUserBodyInput } from './user.schema';
export const selectUser = {
  id: true,
  phone: true,
  username: true,
  email: true,
  contactPhone: true,
  userType: true,
  createdAt: true,
  avatar: true,
} as const;
//get all use service
export const getAllUserService = async (data: getAllUsersInput) => {
  const {
    page,
    limit,
    username,
    email,
    phone,
    contactPhone,
    userType,
    monasteryName,
    monasteryAddress,
  } = data;
  const skip = (page - 1) * limit;
  //check the existing data
  const where: Prisma.UserWhereInput = { isDeleted: false };

  if (username) where.username = { startsWith: username };
  if (phone) where.phone = { startsWith: phone };
  if (email) where.email = { contains: email };
  if (contactPhone) where.contactPhone = { startsWith: contactPhone };
  if (userType) where.userType = userType;
  //create empty object to add both monastery address and monastery name
  const monkProfileFilter: Prisma.MonkProfileWhereInput = {};
  if (monasteryAddress) {
    monkProfileFilter.monasteryAddress = { startsWith: monasteryAddress };
  }
  if (monasteryName) {
    monkProfileFilter.monasteryName = { startsWith: monasteryName };
  }
  //after collect all data add into where object
  if (Object.keys(monkProfileFilter).length > 0) {
    where.monkProfile = { is: monkProfileFilter };
    //prevent useless query on data users
    if (!userType) {
      where.userType = 'Monk';
    }
  }
  //ensure findMany and count are perfectly sync
  const [users, totals] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: selectUser,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, totals };
};
//reusable function for specific user id
const getUserWithProfile = (id: number) => {
  return prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: { ...selectUser, monkProfile: true },
  });
};
//me route service
export const getMeService = getUserWithProfile;
//get user by id
export const getUserByIdService = ({ id }: idParamsInput) => getUserWithProfile(id);
//update specific user id
export const updateUserService = async (id: number, data: updateUserBodyInput) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.isDeleted) throw new AppError('User is not found', 404);

  // Handle password separately
  let hashedPassword: string | undefined;

  if (data.newPassword) {
    if (!data.oldPassword) {
      throw new AppError('Old password is required', 400);
    }

    const isPasswordMatch = await Bun.password.verify(data.oldPassword, user.password);

    if (!isPasswordMatch) {
      throw new AppError('Old password is incorrect', 400);
    }

    hashedPassword = await Bun.password.hash(data.newPassword);
  }

  //  Build update object using spread pattern
  const updateData: Prisma.UserUpdateInput = {
    ...(data.username !== undefined && { username: data.username }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(hashedPassword !== undefined && { password: hashedPassword }),
    ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
    ...(data.avatar !== undefined && { avatar: data.avatar }),
  };
  //build monk profile update separately because it belongs to a separate database
  const monkProfileData: Prisma.MonkProfileUpdateInput = {};
  //collet only provide fields (partial update support)
  if (data.monasteryName !== undefined) {
    monkProfileData.monasteryName = data.monasteryName;
  }
  if (data.monasteryAddress !== undefined) {
    monkProfileData.monasteryAddress = data.monasteryAddress;
  }
  // If at least one monastery field is provided, attach nested update
  if (Object.keys(monkProfileData).length > 0) {
    // Business rule: only Monk users are allowed to update monastery info
    if (user.userType !== 'Monk') {
      throw new AppError('Only monk can update monastery info', 400);
    }
    // Prisma nested update for related monkProfile table
    updateData.monkProfile = {
      update: monkProfileData,
    };
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { ...selectUser, monkProfile: true },
  });
};
//delete user account with soft delete
export const softDeleteUserService = async (data: idParamsInput) => {
  const { id } = data;
  const existingUser = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: selectUser,
  });

  if (!existingUser) {
    throw new AppError('User is not found or already deleted', 404);
  }

  await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });
  return existingUser;
};
