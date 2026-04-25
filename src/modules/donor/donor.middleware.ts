import { z } from 'zod';
import { PaginationQuerySchema } from '../../helper/paginationSchema';
import { validator } from '../../middlewares/validator';
import {
  CreateDonorSchema,
  GetAllDonorsQuerySchema,
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

export const validateCreateDonor = validator(CreateDonorSchema);
export const validateGetAllDonors = validator(GetAllDonorsFullSchema);
export const validateGetDonorById = validator(idParamSchema);
export const validateUpdateDonor = validator(UpdateDonorFullSchema);
export const validateDeleteDonor = validator(idParamSchema);
export const validateGetDonationListById = validator(idParamSchema);
export const validateDeleteDonationList = validator(idParamSchema);
