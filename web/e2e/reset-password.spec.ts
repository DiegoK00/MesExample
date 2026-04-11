import { test, expect } from '@playwright/test';
import { mockResetPassword } from './helpers';

// ---------------------------------------------------------------------------
// 1. Senza token → mostra messaggio di errore token non valido
// ---------------------------------------------------------------------------
test('reset_password: senza token mostra errore "Token non valido o mancante"', async ({ page }) => {
  await page.goto('/admin/reset-password');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Token non valido o mancante')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Richiedi nuovo link' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Con token valido → mostra il form di reset
// ---------------------------------------------------------------------------
test('reset_password: con token mostra il form con i campi password', async ({ page }) => {
  await page.goto('/admin/reset-password?token=valid-token-abc');
  await page.waitForLoadState('networkidle');

  await expect(page.getByLabel('Nuova password')).toBeVisible();
  await expect(page.getByLabel('Conferma password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imposta nuova password' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Validazione: password troppo corta mostra errore
// ---------------------------------------------------------------------------
test('reset_password: password troppo corta mostra errore "Minimo 8 caratteri"', async ({ page }) => {
  await page.goto('/admin/reset-password?token=valid-token-abc');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Nuova password').fill('short');
  await page.getByRole('button', { name: 'Imposta nuova password' }).click();

  await expect(page.getByText('Minimo 8 caratteri')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Invio riuscito → mostra messaggio di conferma
// ---------------------------------------------------------------------------
test('reset_password: invio riuscito mostra "Password aggiornata con successo"', async ({ page }) => {
  await mockResetPassword(page, true);

  await page.goto('/admin/reset-password?token=valid-token-abc');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Nuova password').fill('NewPassword1!');
  await page.getByLabel('Conferma password').fill('NewPassword1!');
  await page.getByRole('button', { name: 'Imposta nuova password' }).click();

  await expect(page.getByText('Password aggiornata con successo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vai al login' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Token non valido (400) → mostra messaggio di errore inline
// ---------------------------------------------------------------------------
test('reset_password: token non valido mostra errore "Token non valido o scaduto"', async ({ page }) => {
  await mockResetPassword(page, false);

  await page.goto('/admin/reset-password?token=expired-token');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Nuova password').fill('NewPassword1!');
  await page.getByLabel('Conferma password').fill('NewPassword1!');
  await page.getByRole('button', { name: 'Imposta nuova password' }).click();

  await expect(page.getByText(/Token non valido o scaduto/)).toBeVisible();
});
