import { Page } from '@playwright/test';

// Base URL dell'API — usata nelle route mock per evitare di intercettare
// le navigazioni SPA di Angular (es. GET http://localhost:4200/admin/users).
export const API_BASE = 'http://localhost:5260';

// -----------------------------------------------------------------------
// Shared mock data
// -----------------------------------------------------------------------

export const MOCK_USER_ADMIN = {
  id: 1,
  email: 'admin@test.com',
  username: 'admin',
  loginArea: 1,
  roles: ['SuperAdmin'],
  programs: [],
  isActive: true,
};

export const MOCK_USER_APP = {
  id: 2,
  email: 'user@test.com',
  username: 'user',
  loginArea: 2,
  roles: ['User'],
  programs: ['PROG_A'],
  isActive: true,
};

export const MOCK_USER_APP = {
  id: 2,
  email: 'user@test.com',
  username: 'user',
  loginArea: 2,
  roles: ['User'],
  programs: ['PROG_A'],
  isActive: true,
};

export const MOCK_LOGIN_RESPONSE = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: '2026-05-01T00:00:00Z',
};

export const MOCK_USERS_PAGE = {
  items: [
    {
      id: 1,
      email: 'admin@test.com',
      username: 'admin',
      loginArea: 1,
      roles: ['SuperAdmin'],
      isActive: true,
    },
    {
      id: 2,
      email: 'user@test.com',
      username: 'user',
      loginArea: 2,
      roles: ['User'],
      isActive: true,
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 20,
};

export const MOCK_PROGRAMS = [
  { id: 1, code: 'PROGRAM_A', name: 'Programma A', description: 'Desc A', isActive: true },
  { id: 2, code: 'PROGRAM_B', name: 'Programma B', description: null, isActive: false },
];

export const MOCK_AUDIT_LOGS_PAGE = {
  items: [
    {
      id: 1,
      timestamp: '2026-04-01T10:00:00Z',
      username: 'admin',
      action: 'user.login',
      entityName: 'User',
      entityId: 1,
      ipAddress: '127.0.0.1',
      newValues: null,
    },
    {
      id: 2,
      timestamp: '2026-04-01T10:05:00Z',
      username: 'admin',
      action: 'program.created',
      entityName: 'Program',
      entityId: 1,
      ipAddress: '127.0.0.1',
      newValues: '{"code":"PROG_X"}',
    },
  ],
  totalCount: 2,
  page: 1,
  pageSize: 50,
};

// -----------------------------------------------------------------------
// Mock helpers
// -----------------------------------------------------------------------

/** Mock POST /auth/login → 200 with valid tokens */
export async function mockLoginSuccess(page: Page): Promise<void> {
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LOGIN_RESPONSE),
    });
  });
}

/** Mock POST /auth/login → 401 Unauthorized */
export async function mockLoginFailure(page: Page): Promise<void> {
  await page.route('**/auth/login', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ title: 'Credenziali non valide', status: 401 }),
    });
  });
}

/** Mock GET /account/me → 200 with admin user */
export async function mockAccountMe(page: Page, user = MOCK_USER_ADMIN): Promise<void> {
  await page.route('**/account/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    });
  });
}

/** Mock POST /auth/logout → 204 */
export async function mockLogout(page: Page): Promise<void> {
  await page.route('**/auth/logout', async route => {
    await route.fulfill({ status: 204 });
  });
}

/** Mock GET /users* → paginated users list */
export async function mockUsers(page: Page, data = MOCK_USERS_PAGE): Promise<void> {
  await page.route(`${API_BASE}/users**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/** Mock GET /programs* → programs list */
export async function mockPrograms(page: Page, data = MOCK_PROGRAMS): Promise<void> {
  await page.route(`${API_BASE}/programs**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/** Mock GET /audit-logs* → audit logs page */
export async function mockAuditLogs(page: Page, data = MOCK_AUDIT_LOGS_PAGE): Promise<void> {
  await page.route(`${API_BASE}/audit-logs**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

/** Mock POST /auth/forgot-password → 200 */
export async function mockForgotPassword(page: Page): Promise<void> {
  await page.route('**/auth/forgot-password', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

/** Mock POST /auth/reset-password → 204 (success) or 400 (invalid token) */
export async function mockResetPassword(page: Page, success = true): Promise<void> {
  await page.route('**/auth/reset-password', async route => {
    if (success) {
      await route.fulfill({ status: 204 });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Token non valido o scaduto', status: 400 }),
      });
    }
  });
}

/** Mock PUT /account/password → 204 (success) or 400 (wrong current password) */
export async function mockChangePassword(page: Page, success = true): Promise<void> {
  await page.route('**/account/password', async route => {
    if (success) {
      await route.fulfill({ status: 204 });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Password attuale non corretta', status: 400 }),
      });
    }
  });
}

/** Perform a full mocked login flow and navigate to /admin */
export async function loginAsAdmin(page: Page): Promise<void> {
  await mockLoginSuccess(page);
  await mockAccountMe(page);

  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await page.waitForURL('**/admin**');
  await page.waitForLoadState('networkidle');
}

/** Perform a full mocked login flow for the App area and navigate to /app/dashboard */
export async function loginAsAppUser(page: Page): Promise<void> {
  await mockLoginSuccess(page);
  await mockAccountMe(page, MOCK_USER_APP);

  await page.goto('/app/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await page.waitForURL('**/app**');
  await page.waitForLoadState('networkidle');
}
