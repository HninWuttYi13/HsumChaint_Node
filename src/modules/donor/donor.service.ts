import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { generatePaginationData } from '../../helper/paginationHelper';
import type { PaginationQueryType } from '../../helper/paginationSchema';
import { prisma } from '../../lib/prisma';
import { BadRequestError } from '../../utils/BadRequestError';
import { NotFoundError } from '../../utils/NotFoundError';
import type {
  CreateDonationListType,
  CreateDonorType,
  GetAllDonationListsQueryType,
  GetAllDonorsQueryType,
  UpdateDonationListType,
  UpdateDonorType,
} from './donor.schema';

const donorListInclude = {
  donationListDonors: {
    include: {
      donationList: {
        select: {
          id: true,
          title: true,
          status: true,
          donationDate: true,
          donationType: {
            select: {
              id: true,
              donationType: true,
              duration: true,
            },
          },
        },
      },
    },
  },
} as const;

export async function createDonorService(data: CreateDonorType) {
  const { name, email, phoneNo } = data.body;

  const existingDonor = await prisma.donor.findFirst({
    where: {
      OR: [{ email }, ...(phoneNo ? [{ phoneNo }] : [])],
    },
  });

  if (existingDonor) {
    throw new BadRequestError('A donor with this email or phone number already exists');
  }

  return prisma.donor.create({
    data: {
      name,
      email,
      phoneNo: phoneNo ?? '',
    },
  });
}

export async function getAllDonorsService(
  req: Request,
  query: GetAllDonorsQueryType['query'],
  pagination: PaginationQueryType
) {
  const { name, email, phoneNo } = query;
  const { page, limit } = pagination;

  const where: Prisma.DonorWhereInput = {};

  if (name) {
    where.name = { contains: name };
  }
  if (email) {
    where.email = { contains: email };
  }
  if (phoneNo) {
    where.phoneNo = { contains: phoneNo };
  }

  const [donors, total] = await Promise.all([
    prisma.donor.findMany({
      where,
      include: donorListInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.donor.count({ where }),
  ]);

  const paginationData = generatePaginationData(req, total, page, limit);

  return { donors, pagination: paginationData };
}

export async function getDonorByIdService(id: number) {
  const donor = await prisma.donor.findUnique({
    where: { id },
  });

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  return donor;
}

export async function updateDonorService(id: number, data: UpdateDonorType) {
  const { name, email, phoneNo } = data.body;

  const donor = await prisma.donor.findUnique({ where: { id } });

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  if (email && email !== donor.email) {
    const emailTaken = await prisma.donor.findFirst({
      where: { email, NOT: { id } },
    });
    if (emailTaken) {
      throw new BadRequestError('A donor with this email already exists');
    }
  }

  return prisma.donor.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(phoneNo && { phoneNo }),
    },
  });
}

export async function deleteDonorService(id: number) {
  const donor = await prisma.donor.findUnique({ where: { id } });

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  await prisma.donor.delete({ where: { id } });

  return donor;
}

const donationListInclude = {
  monastery: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  donationType: {
    select: {
      id: true,
      donationType: true,
      duration: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      role: true,
      isOwner: true,
    },
  },
  donors: {
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNo: true,
        },
      },
    },
  },
} as const;

export async function createDonationListService(data: CreateDonationListType) {
  const {
    title,
    description,
    address,
    donationDate,
    recurrence,
    addReminder,
    // monasteryId,
    // reviewerId,
    donationTypeId,
    donorIds,
  } = data.body;

  // Check if donors exist
  const donors = await prisma.donor.findMany({
    where: { id: { in: donorIds } },
  });
  if (donors.length !== donorIds.length) {
    throw new BadRequestError('Some donors not found');
  }

  return prisma.donationList.create({
    data: {
      title,
      description,
      address,
      donationDate,
      recurrence,
      addReminder,
      donationTypeId,
      donors: {
        create: donorIds.map((donorId) => ({ donorId })),
      },
    },
    include: donationListInclude,
  });
}

export async function getAllDonationListsService(
  req: Request,
  query: GetAllDonationListsQueryType['query'],
  pagination: PaginationQueryType
) {
  const { title, status, monasteryId } = query;
  const { page, limit } = pagination;

  const where: Prisma.DonationListWhereInput = {};

  if (title) {
    where.title = { contains: title };
  }
  if (status) {
    where.status = status;
  }
  if (monasteryId) {
    where.monasteryId = monasteryId;
  }

  const [donationLists, total] = await Promise.all([
    prisma.donationList.findMany({
      where,
      include: donationListInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdDate: 'desc' },
    }),
    prisma.donationList.count({ where }),
  ]);

  if (donationLists.length === 0) {
    throw new NotFoundError('No donation lists found');
  }

  const paginationData = generatePaginationData(req, total, page, limit);

  return { donationLists, pagination: paginationData };
}

export async function getDonationListByIdService(id: number) {
  const donationList = await prisma.donationList.findUnique({
    where: { id },
    include: donationListInclude,
  });

  if (!donationList) {
    throw new NotFoundError('Donation list not found');
  }

  return donationList;
}

export async function updateDonationListService(id: number, data: UpdateDonationListType) {
  const {
    title,
    description,
    address,
    donationDate,
    recurrence,
    addReminder,
    monasteryId,
    reviewerId,
    donationTypeId,
    donorIds,
  } = data.body;

  const donationList = await prisma.donationList.findUnique({ where: { id } });

  if (!donationList) {
    throw new NotFoundError('Donation list not found');
  }

  type DonationUpdateData = {
    title?: string;
    description?: string;
    address?: string;
    donationDate?: Date | string;
    recurrence?: string;
    addReminder?: boolean;
    monasteryId?: number;
    reviewerId?: number;
    donationTypeId?: number;
  };

  const updateData: DonationUpdateData = {};
  if (title) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (address !== undefined) updateData.address = address;
  if (donationDate) updateData.donationDate = donationDate;
  if (recurrence) updateData.recurrence = recurrence;
  if (addReminder !== undefined) updateData.addReminder = addReminder;
  if (monasteryId) updateData.monasteryId = monasteryId;
  if (reviewerId !== undefined) updateData.reviewerId = reviewerId;
  if (donationTypeId) updateData.donationTypeId = donationTypeId;

  if (donorIds) {
    // Check if donors exist
    const donors = await prisma.donor.findMany({
      where: { id: { in: donorIds } },
    });
    if (donors.length !== donorIds.length) {
      throw new BadRequestError('Some donors not found');
    }
    // Delete existing and create new
    await prisma.donationListDonor.deleteMany({ where: { donationListId: id } });
    updateData.donors = {
      create: donorIds.map((donorId) => ({ donorId })),
    };
  }

  return prisma.donationList.update({
    where: { id },
    data: updateData,
    include: donationListInclude,
  });
}

export async function deleteDonationListService(id: number) {
  const donationList = await prisma.donationList.findUnique({ where: { id } });

  if (!donationList) {
    throw new NotFoundError('Donation list not found');
  }

  await prisma.donationList.delete({ where: { id } });

  return donationList;
}
