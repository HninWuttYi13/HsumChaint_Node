import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import type { getAllUsersInput, idParamsInput, updateUserBodyInput } from './user.schema';
export const selectUser = {
  id: true,
  phone: true,
  username: true,
  email: true,
  userType: true,
  createdAt: true,
} as const;
//get all use service
export const getAllUserService = async (data: getAllUsersInput) => {
  const { page, limit, username, email, phone, userType } = data;
  const skip = (page - 1) * limit;
  //check the existing data
  const where = {
    isDeleted: false,
    ...(username && { username: { contains: username } }),
    ...(phone && { phone: { contains: phone } }),
    ...(email && { email: { contains: email } }),
    ...(userType && { userType }),
  };
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
export const getMeService = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: selectUser,
  });
};
export const getUserByIdService = async (data: idParamsInput) => {
  const { id } = data;
  return prisma.user.findUnique({
    where: { id, isDeleted: false },
    select: selectUser,
  });
};
export const updateUserService = async (id: number, data: updateUserBodyInput) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) throw new AppError('User is not found', 404);

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
  const updateData = {
    ...(data.username && { username: data.username }),
    ...(data.email && { email: data.email }),
    ...(data.phone && { phone: data.phone }),
    ...(hashedPassword && { password: hashedPassword }),
  };

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: selectUser,
  });
};
export const softDeleteUserService = async (data: idParamsInput) => {
  const { id } = data;

  const existingUser = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: { id: true, username: true },
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
