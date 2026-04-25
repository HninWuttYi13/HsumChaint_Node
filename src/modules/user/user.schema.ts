import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().describe('The user ID'),
  phone: z.string().describe('The user phone number'),
  username: z.string().describe('The user username'),
  email: z.string().email().nullable().describe('The user email address'),
  userType: z.enum(['Monk', 'Donor']).describe('The user type'),
  createdAt: z.date().describe('The user creation date'),
});

export const CreateUserSchema = z.object({
  phone: z.string().describe('The user phone number'),
  username: z.string().describe('The user username'),
  email: z.string().email().optional().describe('The user email address'),
  password: z.string().describe('The user password'),
  userType: z.enum(['Monk', 'Donor']).describe('The user type'),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
