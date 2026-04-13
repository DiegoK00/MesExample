import { test, expect } from '@playwright/test';
import { loginAsAdmin, mockChangePassword, mockUsers, API_BASE } from './helpers';

// ---------------------------------------------------------------------------
// Helper: login e apri il dialog cambio password dal sidenav
// ---------------------------------------------------------------------------
async function openChangePasswordDialog(page: Parameters<typeof loginAsAdmin>[0]) {
  await mockUsers(page);
  await loginAsAdmin(page);

  // Apre il sidenav
  await page.getByRole('button', { name: 'Menu' }).click();

  // Clicca "Cambia password"
  await page.getByText('Cambia password').click();

  // Attende che il dialog sia visibile
  await page.waitForSelector('mat-dialog-container');
}

// ---------------------------------------------------------------------------
// 1. "Cambia password" nel sidenav apre il dialog
// ---------------------------------------------------------------------------
test('change_password: click su "Cambia password" nel sidenav apre il dialog', async ({ page }) => {
  await mockUsers(page);
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Cambia password').click();

  await expect(page.locator('mat-dialog-container')).toBeVisible();
  await expect(page.getByText('Cambia password').nth(1)).toBeVisible(); // titolo nel dialog
});

// ---------------------------------------------------------------------------
// 2. Dialog mostra i tre campi password e il bottone "Salva"
// ---------------------------------------------------------------------------
test('change_password: dialog ha i campi "Password attuale", "Nuova password", "Conferma nuova password"', async ({ page }) => {
  await openChangePasswordDialog(page);

  await expect(page.getByLabel('Password attuale')).toBeVisible();
  await expect(page.getByLabel('Nuova password', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Conferma nuova password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salva' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Validazione: campi vuoti mostrano errori obbligatori
// ---------------------------------------------------------------------------
test('change_password: campi vuoti mostrano errori di validazione', async ({ page }) => {
  await openChangePasswordDialog(page);

  // Clicca Salva senza compilare
  await page.getByRole('button', { name: 'Salva' }).click();

  await expect(page.getByText('Password attuale obbligatoria')).toBeVisible();
  await expect(page.getByText('Nuova password obbligatoria')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Cambio password riuscito → mostra "Password aggiornata con successo"
// ---------------------------------------------------------------------------
test('change_password: cambio riuscito mostra "Password aggiornata con successo"', async ({ page }) => {
  await mockUsers(page);
  await mockChangePassword(page, true);
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Cambia password').click();
  await page.waitForSelector('mat-dialog-container');

  await page.getByLabel('Password attuale').fill('OldPassword1!');
  await page.getByLabel('Nuova password', { exact: true }).fill('NewPassword1!');
  await page.getByLabel('Conferma nuova password').fill('NewPassword1!');
  await page.getByRole('button', { name: 'Salva' }).click();

  await expect(page.getByText('Password aggiornata con successo.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chiudi' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 5. Cambio password fallito → mostra "Password attuale non corretta"
// ---------------------------------------------------------------------------
test('change_password: password attuale errata mostra messaggio di errore', async ({ page }) => {
  await mockUsers(page);
  await mockChangePassword(page, false);
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByText('Cambia password').click();
  await page.waitForSelector('mat-dialog-container');

  await page.getByLabel('Password attuale').fill('WrongPassword1!');
  await page.getByLabel('Nuova password', { exact: true }).fill('NewPassword1!');
  await page.getByLabel('Conferma nuova password').fill('NewPassword1!');
  await page.getByRole('button', { name: 'Salva' }).click();

  await expect(page.getByText('Password attuale non corretta.')).toBeVisible();
});
