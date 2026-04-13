import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  mockPrograms,
  MOCK_PROGRAMS,
  API_BASE,
} from './helpers';

// ---------------------------------------------------------------------------
// Setup: login + navigate to /admin/programs
// ---------------------------------------------------------------------------
async function setupProgramsPage(page: Page): Promise<void> {
  await mockPrograms(page);
  await loginAsAdmin(page);
  await page.goto('/admin/programs');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella programmi con le colonne attese
// ---------------------------------------------------------------------------
test('programs_page: mostra la tabella programmi', async ({ page }) => {
  await setupProgramsPage(page);

  // Intestazioni di colonna
  await expect(page.getByRole('columnheader', { name: 'Codice' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Stato' })).toBeVisible();

  // Contenuto dai dati mock
  await expect(page.getByText('PROGRAM_A')).toBeVisible();
  await expect(page.getByText('Programma A')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Dialog di creazione — il codice viene forzato in uppercase
// ---------------------------------------------------------------------------
test('programs_create: dialog di creazione — codice viene forzato in uppercase', async ({ page }) => {
  await setupProgramsPage(page);

  // Apre il dialog "Nuovo Programma"
  await page.getByRole('button', { name: 'Nuovo Programma' }).click();
  await expect(page.getByRole('heading', { name: 'Nuovo Programma' })).toBeVisible();

  // Digita in minuscolo nel campo Codice
  const codeInput = page.getByLabel('Codice');
  await codeInput.fill('test_code');

  // Emette l'evento input per attivare uppercaseCode()
  await codeInput.dispatchEvent('input');

  // Il valore deve essere convertito in maiuscolo
  await expect(codeInput).toHaveValue('TEST_CODE');

  // Chiude
  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 3. Toggle "Solo attivi" filtra la lista (activeOnly=true)
// ---------------------------------------------------------------------------
test('programs_filter: toggle "solo attivi" filtra la lista', async ({ page }) => {
  let lastUrl = '';

  await page.route(`${API_BASE}/programs**`, async route => {
    lastUrl = route.request().url();
    // Restituisce solo il programma attivo
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_PROGRAMS[0]]),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/programs');
  await page.waitForLoadState('networkidle');

  // Clicca il toggle "Solo attivi" (mat-slide-toggle)
  // mat-slide-toggle renders a button with role="switch"
  const toggle = page.getByRole('switch', { name: 'Solo attivi' });
  await toggle.click();
  await page.waitForLoadState('networkidle');

  // L'URL deve contenere activeOnly=true
  expect(lastUrl).toContain('activeOnly=true');
});

// ---------------------------------------------------------------------------
// 4. Click elimina su un programma chiama DELETE e aggiorna la lista
// ---------------------------------------------------------------------------
test('programs_delete: click elimina su un programma chiama DELETE', async ({ page }) => {
  let deleteCalled = false;

  await page.route(`${API_BASE}/programs**`, async route => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'DELETE' && url.match(/\/programs\/\d+$/)) {
      deleteCalled = true;
      await route.fulfill({ status: 204 });
    } else if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROGRAMS),
      });
    } else {
      await route.continue();
    }
  });

  await loginAsAdmin(page);
  await page.goto('/admin/programs');
  await page.waitForLoadState('networkidle');

  // Accetta il dialog di conferma (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  // Clicca il primo pulsante delete (mat-icon-button con matTooltip="Elimina")
  await page.locator('button:has-text("delete")').first().click();
  await page.waitForLoadState('networkidle');

  expect(deleteCalled).toBe(true);
});
