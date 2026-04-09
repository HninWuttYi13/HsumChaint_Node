import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '@/lib/prisma';
import { getAllUserService } from '../user.service';
describe('getAllUserService Integration test', () => {
  //Arrange: before test, create 3 valid users
  beforeAll(async () => {
    //if there are old data, clean them
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });

    //creating donor users
    await prisma.user.createMany({
      data: [
        {
          phone: '09111111111',
          username: 'apple_donor',
          email: 'apple@test.com',
          password: 'hp',
          userType: 'Donor',
        },
        {
          phone: '09333333333',
          username: 'cherry_donor',
          email: 'cherry@test.com',
          password: 'hp',
          userType: 'Donor',
        },
      ],
    });

    //for monk, use nested create
    await prisma.user.create({
      data: {
        phone: '09222222222',
        username: 'banana_monk',
        email: 'banana@test.com',
        password: 'hp',
        userType: 'Monk',
        monkProfile: {
          create: {
            monasteryName: 'Su Taung Pyae',
            monasteryAddress: 'somewhere',
          },
        },
      },
    });
  });

  afterAll(async () => {
    //after test, clean up created data and disconnect with database
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    await prisma.$disconnect();
  });
  //testing return correct pagination data
  it('should return correct pagination data(limit test)', async () => {
    //ACT: show the two users
    const result = await getAllUserService({ page: 1, limit: 2 });
    //ASSERT: data is two and total is 3
    expect(result.users.length).toBe(2);
    expect(result.totals).toBeGreaterThanOrEqual(3);
  });
  //Edge Case: search by partial name (starts with test)
  it('should filter users by partial username', async () => {
    //ACT: search "app" instead of "apple_donor"
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      username: 'app',
    });
    //ASSERT
    expect(result.users[0].username).toBe('apple_donor');
    expect(result.users.length).toBe(1);
    expect(result.totals).toBe(1);
  });
  //Logic Case: Searching by Monastery (Nested Filter Test)
  it('should filter monks by monastery name correctly', async () => {
    //find monks from Su Taung Pyae Monastery
    const result = await getAllUserService({
      page: 1,
      limit: 1,
      monasteryName: 'Su Taung',
    });
    //ASSERT
    expect(result.users[0].username).toBe('banana_monk');
    expect(result.users.length).toBe(1);
    expect(result.totals).toBe(1);
  });
  //Safety Case: isDeleted Filter (The Ghost Data Test)
  it('should not include soft-deleted users in the list', async () => {
    //Arrange: make one of the user soft delete
    await prisma.user.update({
      where: { phone: '09111111111' },
      data: { isDeleted: true },
    });
    //ACT
    const result = await getAllUserService({ page: 1, limit: 10 });
    //ASSERT: "apple_donor" is deleted and now remain two;
    expect(result.users.find((u) => u.phone === '09111111111')).toBeUndefined();
    //clean up for other tests
    await prisma.user.update({
      where: { phone: '09111111111' },
      data: { isDeleted: false },
    });
  });
  //Boundary Case: Empty Results
  it('should return empty array and zero total when no users match criteria', async () => {
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      username: 'non_existent_user_xyz',
    });

    expect(result.users.length).toBe(0);
    expect(result.totals).toBe(0);
  });
  // Logic Case: Search by valid phone format
  it('should filter users by phone number correctly', async () => {
    // ACT: search using partial phone number
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      phone: '09111',
    });

    // ASSERT
    expect(result.users[0].phone).toBe('09111111111');
    expect(result.users.length).toBe(1);
    expect(result.totals).toBe(1);
  });

  // Logic Case: Search by email (contains test)
  it('should filter users by email correctly', async () => {
    // ACT: search for 'cherry' in email
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      email: 'cherry@test.com',
    });

    // ASSERT
    expect(result.users[0].email).toBe('cherry@test.com');
    expect(result.users.length).toBe(1);
  });

  // Logic Case: Filter by userType
  it('should filter users by userType (Donor)', async () => {
    // ACT: fetch only Donors
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      userType: 'Donor',
    });

    // ASSERT: should only return apple and cherry (2 donors)
    expect(result.users.length).toBe(2);
    const allAreDonors = result.users.every((u) => u.userType === 'Donor');
    expect(allAreDonors).toBe(true);
  });

  // Logic Case: Search by Monastery Address
  it('should filter monks by monastery address correctly', async () => {
    // ACT: search monks from 'somewhere'
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      monasteryAddress: 'some',
    });

    // ASSERT
    expect(result.users[0].username).toBe('banana_monk');
    expect(result.users.length).toBe(1);
  });

  // Complex Case: Search by both Monastery Name and Address
  it('should filter monks by both monastery name and address correctly', async () => {
    // ACT: combined filter
    const result = await getAllUserService({
      page: 1,
      limit: 10,
      monasteryName: 'Su Taung',
      monasteryAddress: 'some',
    });

    // ASSERT
    expect(result.users.length).toBe(1);
    expect(result.users[0].username).toBe('banana_monk');
  });

  // Pagination Case: Second page test
  it('should return correct data for page 2', async () => {
    // ACT: limit 2, page 2 (since we have 3 users, page 2 should have 1 user)
    const result = await getAllUserService({
      page: 2,
      limit: 2,
    });

    // ASSERT
    expect(result.users.length).toBe(1);
    expect(result.totals).toBe(3);
  });
});
