import { successResponse } from '@/utils/response';
import type { NextFunction, Request, Response } from 'express';
import type { RegisterInput } from './auth.schema';
import { registerUser } from './auth.service';
export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await registerUser(req.body);
    return successResponse(res, user, 'Register successful');
  } catch (error) {
    next(error);
  }
};
