import { test, expect } from '@playwright/test';
import { mockForgotPassword } from './helpers';

// ---------------------------------------------------------------------------
// 1. Mostra il form con campo email e bottone "Invia istruzioni"
// ---------------------------------------------------------------------------
test('forgot_password: mostra il form con campo email e bottone "Invia istruzioni"', async ({ page }) => {
  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Invia istruzioni' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Mostra il titolo "Password dimenticata"
// ---------------------------------------------------------------------------
test('forgot_password: mostra il titolo "Password dimenticata"', async ({ page }) => {
  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Password dimenticata')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Validazione: email vuota mostra errore
// ---------------------------------------------------------------------------
test('forgot_password: email vuota mostra errore "Email obbligatoria"', async ({ page }) => {
  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  const emailInput = page.getByLabel('Email');
  await emailInput.click();
  await emailInput.blur();

  await page.getByRole('button', { name: 'Invia istruzioni' }).click();

  await expect(page.getByText('Email obbligatoria')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Validazione: email non valida mostra errore
// ---------------------------------------------------------------------------
test('forgot_password: email non valida mostra errore "Email non valida"', async ({ page }) => {
  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('nonemail');
  await page.getByRole('button', { name: 'Invia istruzioni' }).click();

  await expect(page.getByText('Email non valida')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Invio riuscito → mostra messaggio di conferma (anti-enumeration)
// ---------------------------------------------------------------------------
test('forgot_password: invio riuscito mostra messaggio di conferma', async ({ page }) => {
  await mockForgotPassword(page);

  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByRole('button', { name: 'Invia istruzioni' }).click();

  await expect(page.getByText(/Se l'indirizzo è registrato/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Torna al login' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 6. Link "Torna al login" punta alla login area corretta (/admin/login)
// ---------------------------------------------------------------------------
test('forgot_password: link "Torna al login" punta a /admin/login', async ({ page }) => {
  await page.goto('/admin/forgot-password');
  await page.waitForLoadState('networkidle');

  const link = page.getByRole('link', { name: 'Torna al login' });
  await expect(link).toHaveAttribute('href', /\/admin\/login/);
});
