/**
 * Route-level authorization tests.
 *
 * These tests cover each protected route for:
 *   - 401: unauthenticated request (requireAdminRole returns 401 error)
 *   - 403: manager-role request (requireAdminRole returns 403 error)
 *   - admin pass-through: authorized admin reaches handler logic (not 401/403)
 *
 * Guards are mocked via @/lib/apiAuth. DB models are mocked to avoid real
 * connections. Tests marked (pre-implementation) expect failure before guards
 * exist — they should all pass after guards are added.
 */

// ── Module mocks (hoisted before imports) ────────────────────────────────────

jest.mock('@/lib/apiAuth');
// esModuleInterop: true causes __importDefault to double-wrap modules without __esModule.
// Add __esModule: true so the default export resolves to the function/object directly.
jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@/models/Application', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/models/Admin', () => {
  const MockAdmin = jest.fn() as unknown as jest.Mock & Record<string, jest.Mock>;
  MockAdmin.find = jest.fn();
  MockAdmin.findOne = jest.fn();
  MockAdmin.findById = jest.fn();
  MockAdmin.countDocuments = jest.fn();
  MockAdmin.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: MockAdmin };
});

// Route-level dependencies used only in POST /api/applications (public) —
// mocked to allow import without errors
jest.mock('@/lib/dobValidation', () => ({
  __esModule: true,
  validateDOB: jest.fn().mockReturnValue(null),
}));
jest.mock('@/lib/eligibility', () => ({
  __esModule: true,
  calculateEligibility: jest.fn().mockReturnValue({
    score: 80,
    status: 'likely_approved',
    reasons: [],
  }),
}));
jest.mock('@/lib/emi', () => ({
  __esModule: true,
  calculateEMI: jest.fn().mockReturnValue({ emi: 10000 }),
  formatCurrency: jest.fn(),
  formatNumber: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { requireAdminRole } from '@/lib/apiAuth';
import Application from '@/models/Application';
import Admin from '@/models/Admin';

import {
  GET as getApplications,
  POST as postApplication,
} from '../app/api/applications/route';
import {
  GET as getApplication,
  PATCH as patchApplication,
  DELETE as deleteApplication,
} from '../app/api/applications/[id]/route';
import {
  GET as getMembers,
  POST as postMember,
} from '../app/api/admin/members/route';
import { DELETE as deleteMember } from '../app/api/admin/members/[id]/route';
import { GET as seedGet } from '../app/api/seed/route';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockAdminSession = {
  user: { id: 'admin-id', name: 'Admin', email: 'admin@test.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

const unauthorizedResult = {
  session: null,
  error: { status: 401, json: async () => ({ error: 'Unauthorized' }) },
};

const forbiddenResult = {
  session: null,
  error: { status: 403, json: async () => ({ error: 'Forbidden' }) },
};

const authorizedResult = { session: mockAdminSession, error: null };

// Builds a chainable mock query compatible with both .lean() and direct await
function createChain(resolveValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  chain.sort = jest.fn().mockReturnValue(chain);
  chain.lean = jest.fn().mockResolvedValue(resolveValue);
  chain.select = jest.fn().mockReturnValue(chain);
  return chain;
}

// Admin.find chain ends at .sort() without .lean()
function createAdminFindChain(resolveValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.sort = jest.fn().mockResolvedValue(resolveValue);
  return chain;
}

function makeRequest(url: string, init?: RequestInit) {
  return new Request(`http://localhost${url}`, init);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const mockedRequireAdminRole = requireAdminRole as jest.MockedFunction<
  typeof requireAdminRole
>;
const mockedApp = Application as unknown as Record<string, jest.Mock>;
const mockedAdmin = Admin as unknown as Record<string, jest.Mock> & jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /api/applications ─────────────────────────────────────────────────────

describe('GET /api/applications', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const res = await getApplications();
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const res = await getApplications();
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin and returns applications', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedApp.find = jest.fn().mockReturnValue(createChain([]));
    const res = await getApplications();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ── GET /api/applications/[id] ────────────────────────────────────────────────

describe('GET /api/applications/[id]', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const res = await getApplication(makeRequest('/api/applications/abc'), makeParams('abc') as never);
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const res = await getApplication(makeRequest('/api/applications/abc'), makeParams('abc') as never);
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin (404 when not found)', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedApp.findById = jest.fn().mockReturnValue(createChain(null));
    const res = await getApplication(makeRequest('/api/applications/abc'), makeParams('abc') as never);
    // Handler logic reached — 404 means auth passed, findById was called and returned null
    expect(res.status).toBe(404);
    expect(mockedApp.findById).toHaveBeenCalledWith('abc');
  });
});

// ── PATCH /api/applications/[id] ──────────────────────────────────────────────

describe('PATCH /api/applications/[id]', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const req = makeRequest('/api/applications/abc', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await patchApplication(req, makeParams('abc') as never);
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const req = makeRequest('/api/applications/abc', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await patchApplication(req, makeParams('abc') as never);
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin (404 when not found)', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedApp.findByIdAndUpdate = jest.fn().mockReturnValue(createChain(null));
    const req = makeRequest('/api/applications/abc', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await patchApplication(req, makeParams('abc') as never);
    expect(res.status).toBe(404);
    expect(mockedApp.findByIdAndUpdate).toHaveBeenCalled();
  });
});

// ── DELETE /api/applications/[id] ────────────────────────────────────────────

describe('DELETE /api/applications/[id]', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const res = await deleteApplication(makeRequest('/api/applications/abc', { method: 'DELETE' }), makeParams('abc') as never);
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const res = await deleteApplication(makeRequest('/api/applications/abc', { method: 'DELETE' }), makeParams('abc') as never);
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin (404 when not found)', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedApp.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    const res = await deleteApplication(makeRequest('/api/applications/abc', { method: 'DELETE' }), makeParams('abc') as never);
    expect(res.status).toBe(404);
    expect(mockedApp.findByIdAndDelete).toHaveBeenCalledWith('abc');
  });
});

// ── GET /api/admin/members ────────────────────────────────────────────────────

describe('GET /api/admin/members', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const res = await getMembers();
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const res = await getMembers();
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin and returns members', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedAdmin.find = jest.fn().mockReturnValue(createAdminFindChain([]));
    const res = await getMembers();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ── POST /api/admin/members ───────────────────────────────────────────────────

describe('POST /api/admin/members', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const req = makeRequest('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ username: 'new@test.com', password: 'pass123', name: 'New' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postMember(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const req = makeRequest('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ username: 'new@test.com', password: 'pass123', name: 'New' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postMember(req);
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedAdmin.findOne = jest.fn().mockResolvedValue(null); // username not taken
    mockedAdmin.mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      _id: 'mock-id',
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    }));
    const req = makeRequest('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify({ username: 'new@test.com', password: 'pass123', name: 'New User' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postMember(req);
    // Handler reached and created member — not 401/403
    expect(res.status).toBe(200);
    expect(mockedAdmin.findOne).toHaveBeenCalled();
  });
});

// ── DELETE /api/admin/members/[id] ───────────────────────────────────────────

describe('DELETE /api/admin/members/[id]', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(unauthorizedResult as never);
    const res = await deleteMember(
      makeRequest('/api/admin/members/abc', { method: 'DELETE' }),
      makeParams('abc') as never
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for manager-role requests', async () => {
    mockedRequireAdminRole.mockResolvedValue(forbiddenResult as never);
    const res = await deleteMember(
      makeRequest('/api/admin/members/abc', { method: 'DELETE' }),
      makeParams('abc') as never
    );
    expect(res.status).toBe(403);
  });

  it('reaches handler logic for authenticated admin (404 when not found)', async () => {
    mockedRequireAdminRole.mockResolvedValue(authorizedResult as never);
    mockedAdmin.countDocuments = jest.fn().mockResolvedValue(2);
    mockedAdmin.findById = jest.fn().mockResolvedValue(null); // not found
    const res = await deleteMember(
      makeRequest('/api/admin/members/abc', { method: 'DELETE' }),
      makeParams('abc') as never
    );
    expect(res.status).toBe(404);
    expect(mockedAdmin.findById).toHaveBeenCalledWith('abc');
  });
});

// ── POST /api/applications — must remain PUBLIC ───────────────────────────────

describe('POST /api/applications (public endpoint)', () => {
  it('does not call requireAdminRole', async () => {
    // Public endpoint: auth guard must NOT be called
    mockedApp.create = jest.fn().mockResolvedValue({
      _id: 'app-id',
      loanAmount: 100000,
      loanType: 'unsecured',
    });
    const req = makeRequest('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        loanType: 'unsecured',
        loanAmount: 100000,
        preferredTenure: 60,
        interestRate: 12,
        // minimal valid body — eligibility/emi are mocked
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    await postApplication(req);
    expect(mockedRequireAdminRole).not.toHaveBeenCalled();
  });
});

// ── GET /api/seed — disabled outside development ──────────────────────────────

describe('GET /api/seed', () => {
  it('returns 503 when NODE_ENV is not "development" (jest sets NODE_ENV=test)', async () => {
    // Jest always runs with NODE_ENV=test, so the endpoint is always disabled in tests
    const res = await seedGet();
    expect(res.status).toBe(503);
  });

  it('503 response body does not contain credentials', async () => {
    const res = await seedGet();
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('password');
    expect(JSON.stringify(body)).not.toContain('admin12');
    expect(body).not.toHaveProperty('credentials');
  });

  it('development response does not include credentials in body', async () => {
    const original = process.env.NODE_ENV;
    try {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });
      mockedAdmin.findOne = jest.fn().mockResolvedValue({
        _id: 'existing-id',
        username: 'admin@mail.com',
        name: 'Admin User',
        role: 'admin',
      });
      const res = await seedGet();
      const body = await res.json();
      expect(JSON.stringify(body)).not.toContain('password');
      expect(JSON.stringify(body)).not.toContain('admin12');
      expect(body).not.toHaveProperty('credentials');
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: original,
        configurable: true,
      });
    }
  });
});
