import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  API_BASE,
} from './helpers';

const MOCK_MEASURE_UNITS = [
  { id: 1, name: 'Pezzo', description: 'Pezzi' },
  { id: 2, name: 'Kilogrammo', description: 'Chilogrammi' },
];

async function mockMeasureUnits(page: Page, data?: any) {
  await page.route(`${API_BASE}/measure-units**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data ?? MOCK_MEASURE_UNITS),
    });
  });
}

async function setupMeasureUnitsPage(page: Page): Promise<void> {
  await mockMeasureUnits(page);
  await loginAsAdmin(page);
  await page.goto('/admin/measure-units');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con colonne Nome/Descrizione
// ---------------------------------------------------------------------------
test('measure_units_page: mostra la tabella con colonne Simbolo/Nome', async ({ page }) => {
  await setupMeasureUnitsPage(page);

  await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Descrizione' })).toBeVisible();

  await expect(page.getByRole('cell', { name: 'Pezzo' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Aprendo il dialog di creazione mostra i campi obbligatori
// ---------------------------------------------------------------------------
test('measure_units_create: aprendo dialog mostra campi Simbolo/Nome', async ({ page }) => {
  await setupMeasureUnitsPage(page);

  await page.getByRole('button', { name: 'Nuova UM' }).click();

  await expect(page.getByRole('heading', { name: 'Nuova Unità di Misura' })).toBeVisible();
  await expect(page.getByLabel('Nome')).toBeVisible();
  await expect(page.getByLabel('Descrizione (opzionale)')).toBeVisible();

  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 3. Click su edit apre il dialog con i dati pre-compilati
// ---------------------------------------------------------------------------
test('measure_units_edit: click su edit apre dialog con dati pre-compilati', async ({ page }) => {
  await setupMeasureUnitsPage(page);

  const editButton = page.locator('button:has-text("edit")').first();
  await editButton.click();

  await expect(page.getByRole('heading', { name: 'Modifica Unità di Misura' })).toBeVisible();

  const nomeField = page.getByLabel('Nome');
  await expect(nomeField).toHaveValue('Pezzo');
});

// ---------------------------------------------------------------------------
// 4. Compilando il form e cliccando Crea invia POST
// ---------------------------------------------------------------------------
test('measure_units_form: compilando form e cliccando Salva invia la richiesta', async ({ page }) => {
  let capturedPostSent = false;

  await page.route(`${API_BASE}/measure-units**`, async route => {
    const method = route.request().method();
    if (method === 'POST') capturedPostSent = true;

    await route.fulfill({
      status: method === 'POST' ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        method === 'GET'
          ? MOCK_MEASURE_UNITS
          : { id: 999, name: 'Nuova Unità', description: null },
      ),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/measure-units');
  await expect(page.getByRole('button', { name: 'Nuova UM' })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Nuova UM' }).click();

  const nomeField = page.getByLabel('Nome');
  await nomeField.fill('Nuova Unità');

  await page.getByRole('button', { name: 'Crea' }).click();
  await page.waitForLoadState('networkidle');

  expect(capturedPostSent).toBe(true);
});

// ---------------------------------------------------------------------------
// 5. Click su delete mostra conferma nativa e invia DELETE
// ---------------------------------------------------------------------------
test('measure_units_delete: click delete mostra conferma e invia DELETE', async ({ page }) => {
  let capturedMethod = '';

  await page.route(`${API_BASE}/measure-units**`, async route => {
    const method = route.request().method();
    if (method === 'DELETE') {
      capturedMethod = 'DELETE';
      await route.fulfill({ status: 204 });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MEASURE_UNITS),
      });
    }
  });

  await loginAsAdmin(page);
  await page.goto('/admin/measure-units');
  await page.waitForLoadState('networkidle');

  // Accetta il dialog di conferma nativo (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  const deleteButton = page.locator('button:has-text("delete")').first();
  await deleteButton.click();

  await page.waitForLoadState('networkidle');
  expect(capturedMethod).toBe('DELETE');
});
