import { prisma } from '@/lib/prisma';
import type { getAllUsersInput, idParamsInput } from './user.schema';
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
