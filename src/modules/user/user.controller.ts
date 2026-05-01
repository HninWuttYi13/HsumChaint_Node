import type { NextFunction, Request, Response } from 'express';
import { generatePaginationData } from '@/helper/paginationHelper';
import { AppError } from '@/utils/AppError';
import { successResponse } from '@/utils/response';
import { uploadToR2 } from '@/utils/s3Storage';
import type { getAllUsersInput, idParamsInput, updateUserBodyInput } from './user.schema';
import {
  getAllUserService,
  getMeService,
  getUserByIdService,
  softDeleteUserService,
  updateUserService,
} from './user.service';

/**
 * Helper to extract and cast pagination without 'any'
 */
const getPaginationParams = (query: Request['query']) => {
  return {
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.max(1, Number(query.limit) || 10),
  };
};

export const getAllUsers = async (
  // 1. Params: Record<string, never> (none expected)
  // 2. ResBody: unknown
  // 3. ReqBody: unknown
  // 4. Query: getAllUsersInput
  req: Request<Record<string, never>, unknown, unknown, getAllUsersInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const queryData: getAllUsersInput = {
      ...req.query,
      page,
      limit,
    };

    const { users, totals } = await getAllUserService(queryData);
    const paginationData = generatePaginationData(req, totals, page, limit);

    return successResponse(res, { users, paginationData }, 'All Users Retrieved Successfully');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const user = await getMeService(userId);
    successResponse(res, user, 'Current user retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (
  req: Request<idParamsInput, unknown, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getUserByIdService(req.params);
    successResponse(res, user, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request<idParamsInput, unknown, updateUserBodyInput, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (req.file) {
      const avatarUrl = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      body.avatar = avatarUrl;
    }

    const result = await updateUserService(id, body);
    return successResponse(res, result, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request<idParamsInput, unknown, unknown, unknown>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedUser = await softDeleteUserService(req.params);
    const { id, username } = deletedUser;

    return successResponse(
      res,
      { id, username },
      `User Account: ${username} has been deleted successfully`
    );
  } catch (err) {
    next(err);
  }
};
