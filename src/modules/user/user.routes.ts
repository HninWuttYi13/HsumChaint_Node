import { Router } from 'express';
import { authMiddleware } from '@/middlewares/authMiddleWare';
import { upload } from '@/middlewares/upload.Middleware';
import { validator } from '@/middlewares/validator';
import { deleteUser, getAllUsers, getMe, getUserById, updateUser } from './user.controller';
import { getAllUsersSchema, idParamSchema, updateUserSchema } from './user.schema';

const router = Router();
router.use(authMiddleware);
router.get('/', validator(getAllUsersSchema), getAllUsers);
router.get('/me', getMe);
router.get('/:id', validator(idParamSchema), getUserById);
router.put('/:id', upload.single('avatar'), validator(updateUserSchema), updateUser);
router.delete('/:id', validator(idParamSchema), deleteUser);

export { router as userRouter };
