import { authMiddleware } from '@/middlewares/authMiddleWare';
import { validator } from '@/middlewares/validator';
import { Router } from 'express';
import { getAllUsers, getMe } from './user.controller';
import { getAllUsersSchema } from './user.schema';

const router = Router();
router.use(authMiddleware);
router.get('/', validator(getAllUsersSchema), getAllUsers);
router.get('/me', getMe);

export { router as userRouter };
