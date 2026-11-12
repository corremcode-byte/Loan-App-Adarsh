import { requireSession, requireAdminRole } from '../lib/apiAuth';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../lib/authOptions', () => ({
  authOptions: {},
}));

jest.mock('../lib/serverAuth', () => ({
  isNextAuthSecretConfigured: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { isNextAuthSecretConfigured } from '../lib/serverAuth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockIsConfigured = isNextAuthSecretConfigured as jest.MockedFunction<typeof isNextAuthSecretConfigured>;

const mockSession = {
  user: { id: 'admin-id', name: 'Admin User', email: 'admin@test.com', role: 'admin' },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── requireSession ────────────────────────────────────────────────────────────

describe('requireSession', () => {
  it('returns HTTP 500 when NEXTAUTH_SECRET is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const result = await requireSession();
    expect(result.error).not.toBeNull();
    expect(result.session).toBeNull();
    expect(result.error!.status).toBe(500);
  });

  it('returns HTTP 401 when secret is configured but session is absent', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue(null);
    const result = await requireSession();
    expect(result.error).not.toBeNull();
    expect(result.session).toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns session when secret is configured and session is present', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue(mockSession as never);
    const result = await requireSession();
    expect(result.error).toBeNull();
    expect(result.session).toEqual(mockSession);
  });
});

// ── requireAdminRole ─────────────────────────────────────────────────────────

describe('requireAdminRole', () => {
  it('propagates HTTP 500 when NEXTAUTH_SECRET is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(500);
    expect(result.session).toBeNull();
  });

  it('returns HTTP 401 when session is absent', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue(null);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(401);
    expect(result.session).toBeNull();
  });

  it('returns HTTP 403 when role is "manager"', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'manager' },
    } as never);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(403);
    expect(result.session).toBeNull();
  });

  it('returns HTTP 403 when role is undefined', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: undefined },
    } as never);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(403);
  });

  it('returns HTTP 403 when role is an unknown string', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      user: { ...mockSession.user, role: 'superadmin' },
    } as never);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(403);
  });

  it('returns HTTP 403 when session.user is absent', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue({
      expires: mockSession.expires,
      user: null,
    } as never);
    const result = await requireAdminRole();
    expect(result.error!.status).toBe(403);
  });

  it('returns session when role is "admin"', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGetServerSession.mockResolvedValue(mockSession as never);
    const result = await requireAdminRole();
    expect(result.error).toBeNull();
    expect(result.session).toEqual(mockSession);
  });
});
