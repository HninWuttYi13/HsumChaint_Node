import { z } from 'zod';
import { PaginationQuerySchema } from '../../helper/paginationSchema';
import { validator } from '../../middlewares/validator';
import {
  CreateDonationListSchema,
  CreateDonorSchema,
  GetAllDonationListsQuerySchema,
  GetAllDonorsQuerySchema,
  UpdateDonationListSchema,
  UpdateDonorSchema,
  idParamSchema,
} from './donor.schema';

const GetAllDonorsFullSchema = z.object({
  query: GetAllDonorsQuerySchema.shape.query.extend(PaginationQuerySchema.shape),
});

const UpdateDonorFullSchema = z.object({
  params: idParamSchema.shape.params,
  body: UpdateDonorSchema.shape.body,
});

const GetAllDonationListsFullSchema = z.object({
  query: GetAllDonationListsQuerySchema.shape.query.extend(PaginationQuerySchema.shape),
});

const UpdateDonationListFullSchema = z.object({
  params: idParamSchema.shape.params,
  body: UpdateDonationListSchema.shape.body,
});

export const validateCreateDonor = validator(CreateDonorSchema);
export const validateGetAllDonors = validator(GetAllDonorsFullSchema);
export const validateGetDonorById = validator(idParamSchema);
export const validateUpdateDonor = validator(UpdateDonorFullSchema);
export const validateDeleteDonor = validator(idParamSchema);

export const validateCreateDonationList = validator(CreateDonationListSchema);
export const validateGetAllDonationLists = validator(GetAllDonationListsFullSchema);
export const validateGetDonationListById = validator(idParamSchema);
export const validateUpdateDonationList = validator(UpdateDonationListFullSchema);
export const validateDeleteDonationList = validator(idParamSchema);
