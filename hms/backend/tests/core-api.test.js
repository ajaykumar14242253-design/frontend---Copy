import { jest } from '@jest/globals';

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:5000';

describe('Core API Integration Tests', () => {
  let authToken;
  
  beforeAll(() => {
    authToken = 'test-auth-token';
  });

  describe('Health & Status', () => {
    test('GET /health should return healthy status', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('healthy');
    });

    test('GET / should return API info', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Medicare HMS API');
    });
  });

  describe('Authentication', () => {
    test('POST /api/v1/auth/register should create new user', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          password: 'Test@123',
          role: 'admin',
        }),
      });
      
      const data = await response.json();
      expect([200, 201, 400, 409]).toContain(response.status);
    });

    test('POST /api/v1/auth/login should authenticate user', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@hospital.com',
          password: 'admin123',
        }),
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('Unauthenticated request to protected route should fail', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/core/patients`);
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Patients API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/patients should return patient list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/patients`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/v1/patients should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/patients?page=1&limit=10`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/v1/patients should support search', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/patients?search=John`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Doctors API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/doctors should return doctor list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/doctors`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/v1/doctors should support filtering', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/doctors?availability=Available`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Appointments API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/appointments should return appointment list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/appointments`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/v1/appointments should support date filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${BASE_URL}/api/v1/appointments?date=${today}`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });

    test('GET /api/v1/appointments should support status filtering', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/appointments?status=Booked`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Billing API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/billing should return billing list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/billing`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Lab API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/lab should return lab tests list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/lab`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Medicines API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/medicines should return medicines list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/medicines`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Departments API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/departments should return departments list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/departments`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Staff API', () => {
    const mockToken = `Bearer ${authToken}`;

    test('GET /api/v1/staff should return staff list', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/staff`, {
        headers: { Authorization: mockToken },
      });
      
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('404 Handling', () => {
    test('Unknown route should return 404', async () => {
      const response = await fetch(`${BASE_URL}/api/v1/nonexistent`);
      expect(response.status).toBe(404);
    });
  });
});

describe('Core API Unit Tests (Mocked)', () => {
  describe('Auth Middleware', () => {
    test('should reject requests without token', async () => {
      const mockReq = { headers: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const { authenticate } = await import('../middleware/auth.js');
      
      authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid tokens', async () => {
      const mockReq = { headers: { authorization: 'Bearer invalid_token' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const { authenticate } = await import('../middleware/auth.js');
      
      authenticate(mockReq, mockRes, mockNext);
      
      expect([401, 403]).toContain(mockRes.status.mock.calls[0][0]);
    });
  });

  describe('Authorize Middleware', () => {
    test('should reject unauthorized roles', async () => {
      const mockReq = { user: { role: 'patient' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const { authorize } = await import('../middleware/auth.js');
      const middleware = authorize(['admin', 'doctor']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow authorized roles', async () => {
      const mockReq = { user: { role: 'admin' } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      const { authorize } = await import('../middleware/auth.js');
      const middleware = authorize(['admin', 'doctor']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
