import { test, expect } from '@playwright/test';
import {
  mockLoginSuccess,
  mockLoginFailure,
  mockAccountMe,
  mockLogout,
  API_BASE,
} from './helpers';

// ---------------------------------------------------------------------------
// 1. Redirect: / redirige a /admin/login
// ---------------------------------------------------------------------------
test('redirect: la root / redirige a /admin/login', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/admin\/login/);
});

// ---------------------------------------------------------------------------
// 2. Login page: mostra il form con campi email e password
// ---------------------------------------------------------------------------
test('login_page: mostra il form con campi email e password', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Login page: mostra titolo "Backoffice" per /admin/login
// ---------------------------------------------------------------------------
test('login_page: mostra titolo "Accesso Backoffice" per /admin/login', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Accesso Backoffice')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Validazione: email vuota mostra errore
// ---------------------------------------------------------------------------
test('validazione: email vuota mostra errore "Email obbligatoria"', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Focus e blur sull'email senza inserire nulla, poi clicca Accedi
  const emailInput = page.getByLabel('Email');
  await emailInput.click();
  await emailInput.blur();

  await page.getByRole('button', { name: 'Accedi' }).click();

  await expect(page.getByText('Email obbligatoria')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Validazione: password vuota mostra errore
// ---------------------------------------------------------------------------
test('validazione: password vuota mostra errore "Password obbligatoria"', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  // Inserisce email valida ma non la password
  await page.getByLabel('Email').fill('admin@test.com');

  const passwordInput = page.getByLabel('Password');
  await passwordInput.click();
  await passwordInput.blur();

  await page.getByRole('button', { name: 'Accedi' }).click();

  await expect(page.getByText('Password obbligatoria')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. Login fallito: credenziali errate mostrano messaggio di errore
// ---------------------------------------------------------------------------
test('login_fallito: credenziali errate mostrano messaggio di errore', async ({ page }) => {
  await mockLoginFailure(page);

  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('wrong@test.com');
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Accedi' }).click();

  // Il componente mostra il messaggio inline tramite errorMessage signal
  await expect(page.getByText('Credenziali non valide. Riprova.')).toBeVisible();
  // L'URL non deve cambiare
  await expect(page).toHaveURL(/\/admin\/login/);
});

// ---------------------------------------------------------------------------
// 7. Login OK: credenziali valide → redirect a /admin/
// ---------------------------------------------------------------------------
test('login_ok: credenziali valide redirect a /admin/', async ({ page }) => {
  await mockLoginSuccess(page);
  await mockAccountMe(page);

  // Mock per le chiamate successive che avvengono dopo il login (users, ecc.)
  await page.route(`${API_BASE}/users**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 20 }),
    });
  });

  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await page.waitForURL(/\/admin\//);
  await expect(page).toHaveURL(/\/admin\//);
});

// ---------------------------------------------------------------------------
// 8. Logout: click su logout torna a /admin/login
// ---------------------------------------------------------------------------
test('logout: click su logout torna a /admin/login', async ({ page }) => {
  await mockLoginSuccess(page);
  await mockAccountMe(page);
  await mockLogout(page);

  // Mock per le chiamate dati
  await page.route(`${API_BASE}/users**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 20 }),
    });
  });

  // Login
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Accedi' }).click();
  await page.waitForURL(/\/admin\//);
  await page.waitForLoadState('networkidle');

  // Apre sidenav cliccando il pulsante menu nella toolbar
  await page.getByRole('button', { name: 'Menu' }).click();

  // Clicca "Esci" nel sidenav
  await page.getByRole('link', { name: 'Esci' }).click();

  await page.waitForURL(/\/admin\/login/);
  await expect(page).toHaveURL(/\/admin\/login/);
});
