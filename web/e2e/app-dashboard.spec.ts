import { test, expect } from '@playwright/test';
import {
  loginAsAppUser,
  mockLoginSuccess,
  mockAccountMe,
  mockLogout,
  mockChangePassword,
  MOCK_USER_APP,
  API_BASE,
} from './helpers';

// ---------------------------------------------------------------------------
// 1. Login area App: mostra titolo "MesClaude"
// ---------------------------------------------------------------------------
test('app_login: mostra titolo "MesClaude"', async ({ page }) => {
  await page.goto('/app/login');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Accesso Applicazione')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Login area App: credenziali valide → redirect a /app/dashboard
// ---------------------------------------------------------------------------
test('app_login_ok: credenziali valide redirect a /app/dashboard', async ({ page }) => {
  await mockLoginSuccess(page);
  await mockAccountMe(page, MOCK_USER_APP);

  await page.goto('/app/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await page.waitForURL(/\/app\//);
  await expect(page).toHaveURL(/\/app\//);
});

// ---------------------------------------------------------------------------
// 3. Dashboard: mostra "Benvenuto, {username}"
// ---------------------------------------------------------------------------
test('app_dashboard: mostra il benvenuto con username', async ({ page }) => {
  await loginAsAppUser(page);

  await expect(page.getByText('Benvenuto, user')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Dashboard: mostra email e ruolo dell'utente
// ---------------------------------------------------------------------------
test('app_dashboard: mostra email e ruolo dell\'utente', async ({ page }) => {
  await loginAsAppUser(page);

  await expect(page.getByText('user@test.com')).toBeVisible();
  await expect(page.getByText('User', { exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Dashboard: mostra i programmi assegnati
// ---------------------------------------------------------------------------
test('app_dashboard: mostra i programmi assegnati', async ({ page }) => {
  await loginAsAppUser(page);

  await expect(page.getByText('PROG_A', { exact: true })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. Sidenav: mostra username e programmi nel menu laterale
// ---------------------------------------------------------------------------
test('app_sidenav: mostra username e programmi assegnati nel sidenav', async ({ page }) => {
  await loginAsAppUser(page);

  // Apre il sidenav
  await page.getByRole('button', { name: 'menu' }).first().click();

  // Username nell'intestazione sidenav
  await expect(page.getByText('user').first()).toBeVisible();

  // Programma assegnato nel sidenav
  await expect(page.getByText('PROG_A').first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// 7. Logout: click su "Esci" nel sidenav torna a /app/login
// ---------------------------------------------------------------------------
test('app_logout: click su "Esci" torna a /app/login', async ({ page }) => {
  await mockLogout(page);
  await loginAsAppUser(page);

  await page.getByRole('button', { name: 'menu' }).first().click();
  await page.getByText('Esci').click();

  await page.waitForURL(/\/app\/login/);
  await expect(page).toHaveURL(/\/app\/login/);
});

// ---------------------------------------------------------------------------
// 8. Cambio password: dialog aperta dal sidenav
// ---------------------------------------------------------------------------
test('app_change_password: dialog cambio password si apre dal sidenav', async ({ page }) => {
  await mockChangePassword(page, true);
  await loginAsAppUser(page);

  await page.getByRole('button', { name: 'menu' }).first().click();
  await page.getByText('Cambia password').click();

  await expect(page.locator('mat-dialog-container')).toBeVisible();
  await expect(page.getByLabel('Password attuale')).toBeVisible();
});
