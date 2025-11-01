import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import User from '../../models/User.js';
import * as authController from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

// Set up test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRY = '24h';
process.env.JWT_REFRESH_EXPIRY = '30d';

let mongoServer;
let app;

// Create Express app for testing
const createTestApp = () => {
  const testApp = express();
  testApp.use(express.json());

  // Auth routes
  testApp.post('/api/auth/register', authController.register);
  testApp.post('/api/auth/login', authController.login);
  testApp.get('/api/auth/me', authenticate, authController.getProfile);
  testApp.post('/api/auth/logout', authenticate, authController.logout);

  return testApp;
};

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test app
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email.toLowerCase());
      expect(response.body.data.user.firstName).toBe(validUserData.firstName);
      expect(response.body.data.user.userTier).toBe('free');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should store user in database with hashed password', async () => {
      await request(app).post('/api/auth/register').send(validUserData).expect(201);

      const user = await User.findOne({ email: validUserData.email.toLowerCase() });
      expect(user).toBeDefined();
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(validUserData.password);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('should convert email to lowercase', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'TEST@EXAMPLE.COM' })
        .expect(201);

      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: validUserData.password })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: validUserData.email })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REGISTRATION_ERROR');
      expect(response.body.error.message).toContain('Invalid email');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, password: 'weak' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REGISTRATION_ERROR');
    });

    it('should fail when user already exists', async () => {
      // Register first time
      await request(app).post('/api/auth/register').send(validUserData).expect(201);

      // Try to register again
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should initialize user with default values', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.data.user.usageCount).toBe(0);
      expect(response.body.data.user.userTier).toBe('free');
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(async () => {
      // Register a user before each login test
      await request(app).post('/api/auth/register').send(userData);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should be case insensitive for email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: userData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
    });

    it('should update lastLoginAt timestamp', async () => {
      const beforeLogin = new Date();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const user = await User.findOne({ email: userData.email.toLowerCase() });
      expect(user.lastLoginAt).toBeDefined();
      expect(user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: userData.password })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LOGIN_ERROR');
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LOGIN_ERROR');
      expect(response.body.error.message).toContain('Invalid email or password');
    });

    it('should return user data with usage information', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.data.user.usageCount).toBeDefined();
      expect(response.body.data.user.dailyUsageResetAt).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(async () => {
      // Register and get token
      const response = await request(app).post('/api/auth/register').send(userData);
      accessToken = response.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.firstName).toBe(userData.firstName);
      expect(response.body.data.userTier).toBe('free');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', accessToken)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    beforeEach(async () => {
      const response = await request(app).post('/api/auth/register').send(userData);
      accessToken = response.body.data.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token expiration and refresh', () => {
    it('should generate tokens with correct expiration times', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken, refreshToken } = response.body.data;

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
    });

    it('should include correct user data in token payload', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken } = response.body.data;

      // Decode token (without verification for testing)
      const base64Payload = accessToken.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

      expect(payload.email).toBe(userData.email.toLowerCase());
      expect(payload.userTier).toBe('free');
      expect(payload.userId).toBeDefined();
    });
  });

  describe('Complete authentication flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        email: 'fullflow@example.com',
        password: 'TestPassword123!',
        firstName: 'Full',
        lastName: 'Flow',
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const { accessToken: registerToken } = registerResponse.body.data;

      // Step 2: Access protected route with registration token
      const profileResponse1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      expect(profileResponse1.body.data.email).toBe(userData.email.toLowerCase());

      // Step 3: Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200);

      // Step 4: Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const { accessToken: loginToken } = loginResponse.body.data;

      // Step 5: Access protected route with login token
      const profileResponse2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(profileResponse2.body.data.email).toBe(userData.email.toLowerCase());
    });
  });
});
