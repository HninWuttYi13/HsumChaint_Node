import { PaginationQuerySchema } from '@/helper/paginationSchema';
import { z } from 'zod';
export const UserSchema = z.object({
  id: z.number(),
  phone: z.string(),
  username: z.string(),
  email: z.string().nullable().optional(),
  userType: z.enum(['Monk', 'Donor']),
  createdAt: z.date(),
});
export const getAllUsersSchema = z.object({
  query: PaginationQuerySchema.extend({
    username: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().email('invalid email format').optional(),
    phone: z.string().optional(),
    userType: z.enum(['Monk', 'Donor']).optional(),
  }),
});
export type getAllUsersInput = z.infer<typeof getAllUsersSchema>['query'];
export type User = z.infer<typeof UserSchema>;
