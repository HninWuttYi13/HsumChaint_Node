import { Router } from 'express';
import {
  createDonationList,
  createDonor,
  deleteDonationList,
  deleteDonor,
  getAllDonationLists,
  getAllDonors,
  getDonationListById,
  getDonorById,
  updateDonationList,
  updateDonor,
} from './donor.controller';
import {
  validateCreateDonationList,
  validateCreateDonor,
  validateDeleteDonationList,
  validateDeleteDonor,
  validateGetAllDonationLists,
  validateGetAllDonors,
  validateGetDonationListById,
  validateGetDonorById,
  validateUpdateDonationList,
  validateUpdateDonor,
} from './donor.middleware';

const router = Router();

router.get('/', validateGetAllDonors, getAllDonors);

router.post('/create', validateCreateDonor, createDonor);

router.get('/donation-lists', validateGetAllDonationLists, getAllDonationLists);

router.get('/donation-lists/:id', validateGetDonationListById, getDonationListById);

router.get('/:id', validateGetDonorById, getDonorById);

router.put('/:id', validateUpdateDonor, updateDonor);

router.delete('/:id', validateDeleteDonor, deleteDonor);

router.post('/donation-lists/create', validateCreateDonationList, createDonationList);

router.put('/donation-lists/:id', validateUpdateDonationList, updateDonationList);

router.delete('/donation-lists/:id', validateDeleteDonationList, deleteDonationList);

export { router as donorRouter };
