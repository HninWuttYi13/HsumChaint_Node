import { authMiddleware } from '@/middlewares/authMiddleWare';
import { validator } from '@/middlewares/validator';
import { Router } from 'express';
import { getAllUsers, getMe, getUserById } from './user.controller';
import { getAllUsersSchema, idParamSchema } from './user.schema';

const router = Router();
router.use(authMiddleware);
router.get('/', validator(getAllUsersSchema), getAllUsers);
router.get('/me', getMe);
router.get('/:id', validator(idParamSchema), getUserById);

export { router as userRouter };
