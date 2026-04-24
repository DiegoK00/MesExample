import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  mockUsers,
  MOCK_USERS_PAGE,
  API_BASE,
} from './helpers';

// ---------------------------------------------------------------------------
// Setup: every test logs in via mocked auth and navigates to /admin/users
// ---------------------------------------------------------------------------
async function setupUsersPage(page: Page): Promise<void> {
  await mockUsers(page);
  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con colonne Email/Username/Stato
// ---------------------------------------------------------------------------
test('users_page: mostra la tabella con colonne Email/Username/Stato', async ({ page }) => {
  await setupUsersPage(page);

  // Verifica le intestazioni di colonna
  await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Username' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Stato' })).toBeVisible();

  // Verifica che i dati mock siano presenti
  await expect(page.getByRole('cell', { name: 'admin@test.com' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'user@test.com' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Mostra paginazione con totalCount
// ---------------------------------------------------------------------------
test('users_page: mostra paginazione con totalCount', async ({ page }) => {
  await setupUsersPage(page);

  // mat-paginator mostra "1 – 2 of 2" o simile a seconda del locale
  const paginator = page.locator('mat-paginator');
  await expect(paginator).toBeVisible();

  // Verifica che ci siano 2 risultati (totalCount: 2 dai mock)
  await expect(paginator).toContainText('2');
});

// ---------------------------------------------------------------------------
// 3. Inserendo testo nel campo ricerca invia la query filtrata
// ---------------------------------------------------------------------------
test('users_search: inserendo testo nel campo ricerca filtra la lista', async ({ page }) => {
  // Intercetta la chiamata filtrata e verifica che contenga il parametro search
  let capturedUrl = '';
  await page.route(`${API_BASE}/users**`, async route => {
    capturedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], totalCount: 0, page: 1, pageSize: 20 }),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  // Inserisce testo nel campo cerca e preme Cerca
  await page.getByPlaceholder('Cerca...').fill('admin');
  await page.getByRole('button', { name: 'Cerca' }).click();
  await page.waitForLoadState('networkidle');

  // Verifica che l'URL della chiamata API contenga il parametro search
  expect(capturedUrl).toContain('search=admin');
});

// ---------------------------------------------------------------------------
// 4. Aprendo il dialog di creazione mostra i campi obbligatori
// ---------------------------------------------------------------------------
test('users_create: aprendo il dialog di creazione mostra i campi obbligatori', async ({ page }) => {
  await setupUsersPage(page);

  const newUserButton = page.getByRole('button', { name: 'Nuovo Utente' });
  await expect(newUserButton).toBeVisible({ timeout: 15_000 });
  await newUserButton.click();

  // Il dialog deve aprirsi con titolo "Nuovo Utente"
  await expect(page.getByRole('heading', { name: 'Nuovo Utente' })).toBeVisible();

  // Campi obbligatori presenti nel dialog (scoped al dialog per evitare match multipli)
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog.getByLabel('Email')).toBeVisible();
  await expect(dialog.getByLabel('Username')).toBeVisible();
  await expect(dialog.getByLabel('Password')).toBeVisible();

  // Chiude il dialog
  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 5. Click su disattiva chiama DELETE sulla riga e aggiorna la lista
// ---------------------------------------------------------------------------
test('users_deactivate: click su disattiva chiama DELETE sulla riga', async ({ page }) => {
  let deactivateCalled = false;

  await page.route(`${API_BASE}/users**`, async route => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'DELETE' && url.match(/\/users\/\d+$/)) {
      deactivateCalled = true;
      await route.fulfill({ status: 204 });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USERS_PAGE),
      });
    } else {
      await route.continue();
    }
  });

  await loginAsAdmin(page);
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  // Accetta il dialog di conferma prima del click (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  // Clicca il bottone "Disattiva" (icona person_off) sulla prima riga
  await page.locator('button:has-text("person_off")').first().click();
  await page.waitForLoadState('networkidle');

  expect(deactivateCalled).toBe(true);
});
