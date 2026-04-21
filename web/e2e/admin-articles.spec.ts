import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  mockUsers,
  API_BASE,
} from './helpers';

const MOCK_ARTICLES = [
  {
    id: 1,
    code: 'ART001',
    name: 'Articolo 1',
    description: 'Primo articolo',
    categoryId: 1,
    categoryName: 'Categoria 1',
    price: 100,
    umId: 1,
    umName: 'Pezzo',
    um2Id: null,
    um2Name: null,
    measures: null,
    composition: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    createdByUsername: 'admin',
    deletedAt: null,
    deletedByUsername: null,
  },
];

const MOCK_CATEGORIES = [{ id: 1, name: 'Categoria 1', description: null }];
const MOCK_MEASURE_UNITS = [{ id: 1, name: 'Pezzo', description: null }];

// Mock helper
async function mockArticles(page: Page, data?: any) {
  await page.route(`${API_BASE}/categories**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CATEGORIES),
    });
  });

  await page.route(`${API_BASE}/measure-units**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MEASURE_UNITS),
    });
  });

  await page.route(`${API_BASE}/articles**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data ?? MOCK_ARTICLES),
    });
  });
}

async function setupArticlesPage(page: Page): Promise<void> {
  await mockArticles(page);
  await mockUsers(page);
  await loginAsAdmin(page);
  await page.goto('/admin/articles');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con colonne Codice/Nome/Categoria/Prezzo/UM
// ---------------------------------------------------------------------------
test('articles_page: mostra la tabella con colonne Codice/Nome/Prezzo/Quantità', async ({ page }) => {
  await setupArticlesPage(page);

  await expect(page.getByRole('columnheader', { name: 'Codice' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Categoria' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Prezzo' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'UM' })).toBeVisible();

  await expect(page.getByRole('cell', { name: 'ART001' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Articolo 1' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Aprendo il dialog di creazione mostra i campi obbligatori
// ---------------------------------------------------------------------------
test('articles_create: aprendo dialog mostra campi Nome/Prezzo/Categoria/UM', async ({ page }) => {
  await setupArticlesPage(page);

  await page.getByRole('button', { name: 'Nuovo Articolo' }).click();

  await expect(page.getByRole('heading', { name: 'Nuovo Articolo' })).toBeVisible();
  await expect(page.getByLabel('Codice')).toBeVisible();
  await expect(page.getByLabel('Nome')).toBeVisible();
  await expect(page.getByLabel('Prezzo')).toBeVisible();
  await expect(page.getByLabel('Categoria')).toBeVisible();

  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 3. Click su edit apre il dialog con i dati pre-compilati
// ---------------------------------------------------------------------------
test('articles_edit: click su edit apre dialog con dati pre-compilati', async ({ page }) => {
  await setupArticlesPage(page);

  // Cerca il tasto edit (icona di edit sulla prima riga)
  const editButton = page.locator('button:has-text("edit")').first();
  await editButton.click();

  // Il dialog deve avere il titolo "Modifica Articolo"
  await expect(page.getByRole('heading', { name: 'Modifica Articolo' })).toBeVisible();

  // I campi devono contenere i dati dell'articolo
  const nomeField = page.getByLabel('Nome');
  await expect(nomeField).toHaveValue('Articolo 1');
});

// ---------------------------------------------------------------------------
// 4. Compilando il form e cliccando Salva invia POST/PUT
// ---------------------------------------------------------------------------
test('articles_form: compilando form e cliccando Salva invia la richiesta', async ({ page }) => {
  let capturedMethod = '';

  await page.route(`${API_BASE}/articles**`, async route => {
    const method = route.request().method();
    if (method !== 'GET') {
      capturedMethod = method;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          code: 'NEW_ART',
          name: 'Nuovo Articolo',
          description: null,
          categoryId: 1,
          categoryName: 'Categoria 1',
          price: 199.99,
          umId: 1,
          umName: 'Pezzo',
          um2Id: null,
          um2Name: null,
          measures: null,
          composition: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
          createdByUsername: 'admin',
          deletedAt: null,
          deletedByUsername: null,
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ARTICLES),
      });
    }
  });

  await page.route(`${API_BASE}/categories**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CATEGORIES),
    });
  });

  await page.route(`${API_BASE}/measure-units**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MEASURE_UNITS),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/articles');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Nuovo Articolo' }).click();

  const codeField = page.getByLabel('Codice');
  const nomeField = page.getByLabel('Nome');
  const prezzoField = page.getByLabel('Prezzo');

  await codeField.fill('NEW_ART');
  await nomeField.fill('Nuovo Articolo');
  await prezzoField.fill('199.99');

  // Seleziona categoria e UM
  await page.getByLabel('Categoria').click();
  await page.getByRole('option', { name: 'Categoria 1' }).click();

  await page.getByLabel('UM', { exact: true }).click();
  await page.getByRole('option', { name: 'Pezzo' }).click();

  await page.getByRole('button', { name: 'Crea' }).click();
  await page.waitForLoadState('networkidle');

  expect(capturedMethod).toBe('POST');
});

// ---------------------------------------------------------------------------
// 5. Click su delete apre conferma nativa e invia DELETE
// ---------------------------------------------------------------------------
test('articles_delete: click delete mostra conferma e invia DELETE', async ({ page }) => {
  let capturedMethod = '';

  await page.route(`${API_BASE}/categories**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CATEGORIES),
    });
  });

  await page.route(`${API_BASE}/measure-units**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MEASURE_UNITS),
    });
  });

  await page.route(`${API_BASE}/articles**`, async route => {
    const method = route.request().method();
    if (method === 'DELETE') {
      capturedMethod = 'DELETE';
      await route.fulfill({ status: 204 });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ARTICLES),
      });
    }
  });

  await loginAsAdmin(page);
  await page.goto('/admin/articles');
  await page.waitForLoadState('networkidle');

  // Attende che la riga dati sia visibile prima di cercare il pulsante
  await page.getByRole('cell', { name: 'ART001' }).waitFor();

  // Accetta il dialog di conferma nativo (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  // Cerca il tasto delete (icona mat-icon "delete")
  const deleteButton = page.locator('button:has-text("delete")').first();
  await deleteButton.click();

  await page.waitForLoadState('networkidle');
  expect(capturedMethod).toBe('DELETE');
});
