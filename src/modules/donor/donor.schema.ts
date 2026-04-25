import { z } from 'zod';
import { PaginationQuerySchema } from '../../helper/paginationSchema';

const idParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'ID must be a number')
      .transform(Number)
      .refine((val) => !Number.isNaN(val), 'ID must be a valid number'),
  }),
});

const CreateDonorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Donor name is required'),
    email: z.email('Invalid email address'),
    phoneNo: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .transform((val) => val.replace(/[^\d+]/g, ''))
      .refine(
        (val) => val.length >= 6 && val.length <= 15,
        'Phone number must be between 6 and 15 digits'
      ),
  }),
});

const UpdateDonorSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Donor name is required').optional(),
      email: z.email('Invalid email address').optional(),
      phoneNo: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
        .transform((val) => val.replace(/[^\d+]/g, ''))
        .refine(
          (val) => val.length >= 6 && val.length <= 15,
          'Phone number must be between 6 and 15 digits'
        )
        .optional(),
    })
    .refine((data) => data.name || data.email || data.phoneNo, 'At least one field is required'),
});

const GetAllDonorsQuerySchema = z.object({
  query: z.object({
    name: z.string().min(1, 'Donor name is required').optional(),
    email: z.email('Invalid email address').optional(),
    phoneNo: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
      .transform((val) => val.replace(/[^\d+]/g, ''))
      .refine(
        (val) => val.length >= 6 && val.length <= 15,
        'Phone number must be between 6 and 15 digits'
      )
      .optional(),
  }),
});

const CreateDonationListSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    address: z.string().optional(),
    donationDate: z
      .string()
      .transform((val) => new Date(val))
      .refine((date) => !Number.isNaN(date.getTime()), 'Invalid date'),
    recurrence: z.enum(['OneTime', 'Weekly', 'Monthly']).optional().default('OneTime'),
    addReminder: z.boolean().optional().default(false),
    monasteryId: z.number().int().positive('Monastery ID must be a positive integer'),
    reviewerId: z.number().int().positive('Reviewer ID must be a positive integer').optional(),
    donationTypeId: z.number().int().positive('Donation type ID must be a positive integer'),
    donorIds: z.array(z.number().int().positive()).min(1, 'At least one donor is required'),
  }),
});

const UpdateDonationListSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      donationDate: z
        .string()
        .transform((val) => new Date(val))
        .refine((date) => !Number.isNaN(date.getTime()), 'Invalid date')
        .optional(),
      recurrence: z.enum(['OneTime', 'Weekly', 'Monthly']).optional(),
      addReminder: z.boolean().optional(),
      monasteryId: z.number().int().positive('Monastery ID must be a positive integer').optional(),
      reviewerId: z.number().int().positive('Reviewer ID must be a positive integer').optional(),
      donationTypeId: z
        .number()
        .int()
        .positive('Donation type ID must be a positive integer')
        .optional(),
      donorIds: z.array(z.number().int().positive()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required'),
});

const GetAllDonationListsQuerySchema = z.object({
  query: z.object({
    title: z.string().optional(),
    status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled']).optional(),
    monasteryId: z.number().int().positive().optional(),
  }),
});

type IdParamType = z.infer<typeof idParamSchema>;
type CreateDonorType = z.infer<typeof CreateDonorSchema>;
type UpdateDonorType = z.infer<typeof UpdateDonorSchema>;
type GetAllDonorsQueryType = z.infer<typeof GetAllDonorsQuerySchema>;
type CreateDonationListType = z.infer<typeof CreateDonationListSchema>;
type UpdateDonationListType = z.infer<typeof UpdateDonationListSchema>;
type GetAllDonationListsQueryType = z.infer<typeof GetAllDonationListsQuerySchema>;

export {
  idParamSchema,
  CreateDonorSchema,
  UpdateDonorSchema,
  GetAllDonorsQuerySchema,
  CreateDonationListSchema,
  UpdateDonationListSchema,
  GetAllDonationListsQuerySchema,
};
export type {
  IdParamType,
  CreateDonorType,
  UpdateDonorType,
  GetAllDonorsQueryType,
  CreateDonationListType,
  UpdateDonationListType,
  GetAllDonationListsQueryType,
};
