import { z } from 'zod';
import { validator } from '../../middlewares/validator';
import { CreateDonorSchema, idParamSchema, UpdateDonorSchema } from './donor.schema';

const UpdateDonorFullSchema = z.object({
  params: idParamSchema.shape.params,
  body: UpdateDonorSchema.shape.body,
});

export const validateCreateDonor = validator(CreateDonorSchema);
export const validateGetDonorById = validator(idParamSchema);
export const validateUpdateDonor = validator(UpdateDonorFullSchema);
export const validateDeleteDonor = validator(idParamSchema);
export const validateGetDonationListById = validator(idParamSchema);
export const validateDeleteDonationList = validator(idParamSchema);
