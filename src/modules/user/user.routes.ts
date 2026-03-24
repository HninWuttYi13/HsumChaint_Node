import { authMiddleware } from '@/middlewares/authMiddleWare';
import { validator } from '@/middlewares/validator';
import { Router } from 'express';
import { getAllUsers, getMe, getUserById, updateUser } from './user.controller';
import { getAllUsersSchema, idParamSchema, updateUserSchema } from './user.schema';

const router = Router();
router.use(authMiddleware);
router.get('/', validator(getAllUsersSchema), getAllUsers);
router.get('/me', getMe);
router.get('/:id', validator(idParamSchema), getUserById);
router.put('/:id', validator(updateUserSchema), updateUser);
export { router as userRouter };
