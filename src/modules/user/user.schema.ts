import { PaginationQuerySchema } from '@/helper/paginationSchema';
import { z } from 'zod';
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
export type getAllUsersInput = z.infer<typeof getAllUsersSchema>['query'];
export type idParamsInput = z.infer<typeof idParamSchema>['params'];
