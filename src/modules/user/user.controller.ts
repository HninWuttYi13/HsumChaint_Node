import { generatePaginationData } from '@/helper/paginationHelper';
import { PaginationQueryType } from '@/helper/paginationSchema';
import { AppError } from '@/utils/AppError';
import { successResponse } from '@/utils/response';
import type { NextFunction, Request, Response } from 'express';
import type { getAllUsersInput } from './user.schema';
import { getAllUserService, getUserById } from './user.service';
//get all users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQuery = req.query as any;
    // This is the "Safety Guard" for Prisma.
    const page = Number(rawQuery.page) || 1;
    const limit = Number(rawQuery.limit) || 10;

    // Create a clean object for the service
    const queryData: getAllUsersInput = {
      ...rawQuery,
      page,
      limit,
    };
    const { users, totals } = await getAllUserService(queryData);

    // 4. Generate pagination
    const paginationData = generatePaginationData(req, totals, page, limit);

    return successResponse(res, { users, paginationData }, 'All Users are Retrieved Successfully');
  } catch (err) {
    console.log('ERROR:', err);
    next(err);
  }
};
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const user = await getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    successResponse(res, user, 'Current user retrieved successfully');
  } catch (err) {
    next(err);
  }
};
