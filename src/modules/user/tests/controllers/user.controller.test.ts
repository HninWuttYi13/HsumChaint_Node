import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { type TokenPayload, generateAccessToken } from '@/utils/jwt';
import request from 'supertest';
describe('UserController Integration Tests', () => {
  let accessToken: string;
  let userId: number;
  beforeAll(async () => {
    //clean up old data
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    //Arrange: create a test user and generate access token
    const user = await prisma.user.create({
      data: {
        username: 'api_test_user',
        email: 'controller@test.com',
        password: await Bun.password.hash('password123'),
        phone: '09111111111',
        userType: 'Monk',
        monkProfile: {
          create: {
            monasteryName: 'Test Monastery',
            monasteryAddress: 'Test Address',
          },
        },
      },
    });
    userId = user.id;
    //generate real token for authMiddleware
    const payload: TokenPayload = { userId: user.id, userType: user.userType };
    const token = generateAccessToken(payload);
    accessToken = `Bearer ${token}`;
  });
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@test.com' } },
    });
    await prisma.$disconnect();
  });
  // --- GET /api/v1/users/me ---
  it('GET /api/v1/users/me - should return current user profile', async () => {
    const response = await request(app).get('/api/v1/users/me').set('Authorization', accessToken);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: userId,
      email: 'controller@test.com',
      username: 'api_test_user',
      phone: '09111111111',
      userType: 'Monk',
      monkProfile: {
        monasteryName: 'Test Monastery',
        monasteryAddress: 'Test Address',
      },
    });
    expect(response.body.message).toContain('successfully');
  });
  // --- GET /api/v1/users (Pagination & Filter) ---
  it('GET /api/v1/users - should return paginated users with filter', async () => {
    const response = await request(app)
      .get('/api/v1/users?page=1&limit=10')
      .set('Authorization', accessToken);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.users)).toBe(true);
    expect(response.body.data.paginationData).toBeDefined();
  });
  // --- PUT /api/v1/users/:id (Validation Test) ---
  it('PUT /api/v1/users/:id - should return 400 for invalid data (Zod check)', async () => {
    const response = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set('Authorization', accessToken)
      .send({
        username: 'hi', // too short, should trigger Zod validation error
        email: 'wrong-email',
      });

    expect(response.status).toBe(400); // Bad Request due to validation errors
  });

  it('PUT /api/v1/users/:id - should update user successfully', async () => {
    const response = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set('Authorization', accessToken)
      .send({
        username: 'updated_api_user',
        contactPhone: '09888888888',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe('updated_api_user');
  });

  // --- DELETE /api/v1/users/:id ---
  it('DELETE /api/v1/users/:id - should soft delete user', async () => {
    const response = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set('Authorization', accessToken);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('deleted successfully');

    // check if the user is soft deleted in the database
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser?.isDeleted).toBe(true);
  });

  // --- Security Test ---
  it('GET /api/v1/users/me - should return 401 if no token provided', async () => {
    const response = await request(app).get('/api/v1/users/me');
    expect(response.status).toBe(401);
  });
});
