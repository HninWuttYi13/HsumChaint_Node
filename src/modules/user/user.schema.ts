import { PaginationQuerySchema } from '@/helper/paginationSchema';
import { z } from 'zod';
import { passwordSchema, phoneSchema } from '../auth/auth.schema';
const normalizePhoneSearch = z
  .string()
  .trim()
  .transform((value) => {
    // remove non-digits
    const cleaned = value.replace(/\D/g, '');
    // normalize Myanmar formats
    if (cleaned.startsWith('959')) return `09${cleaned.slice(3)}`;
    if (cleaned.startsWith('09')) return cleaned;
    return cleaned;
  })
  .optional();
export const getAllUsersSchema = z.object({
  query: PaginationQuerySchema.extend({
    username: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().optional(),
    phone: normalizePhoneSearch,
    contactPhone: normalizePhoneSearch,
    userType: z.enum(['Monk', 'Donor']).optional(),
    monasteryName: z.string().optional(),
    monasteryAddress: z.string().optional(),
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
      contactPhone: phoneSchema.optional(),
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
