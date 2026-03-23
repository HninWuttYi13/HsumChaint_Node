import { generatePaginationData } from '@/helper/paginationHelper';
import { AppError } from '@/utils/AppError';
import { successResponse } from '@/utils/response';
import type { NextFunction, Request, Response } from 'express';
import type { getAllUsersInput, idParamsInput } from './user.schema';
import { getAllUserService, getMeService, getUserByIdService } from './user.service';
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
    next(err);
  }
};
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const user = await getMeService(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    successResponse(res, user, 'Current user retrieved successfully');
  } catch (err) {
    next(err);
  }
};
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = req.params as unknown as idParamsInput;
    const user = await getUserByIdService(params);
    if (!user) {
      throw new AppError('User is not found', 404);
    }
    successResponse(res, user, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};
