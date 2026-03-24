import { PaginationQuerySchema } from '@/helper/paginationSchema';
import { z } from 'zod';
import { passwordSchema, phoneSchema } from '../auth/auth.schema';
export const getAllUsersSchema = z.object({
  query: PaginationQuerySchema.extend({
    username: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().email('invalid email format').optional(),
    phone: z.string().optional(),
    userType: z.enum(['Monk', 'Donor']).optional(),
  }),
});
export const idParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'ID must be a number')
      .transform(Number)
      .refine((val) => !Number.isNaN(val), 'ID must be a valid number'),
  }),
});
export const updateUserSchema = z.object({
  params: idParamSchema.shape.params,
  body: z
    .object({
      username: z
        .string('username is required')
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .optional(),
      phone: phoneSchema.optional(),
      email: z.string().trim().toLowerCase().email('Invalid email').optional(),
      oldPassword: z.string().optional(),
      newPassword: passwordSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.newPassword && !data.oldPassword) return false;
        return true;
      },
      {
        message: 'Your old password is required to change new password',
        path: ['oldPassword'],
      }
    ),
});
export type getAllUsersInput = z.infer<typeof getAllUsersSchema>['query'];
export type idParamsInput = z.infer<typeof idParamSchema>['params'];
export type updateUserBodyInput = z.infer<typeof updateUserSchema>['body'];
