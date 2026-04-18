import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, API_BASE } from './helpers';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const PARENT_ID = 1;
const COMPONENT_ID = 2;

const MOCK_PARENT_ARTICLE = {
  id: PARENT_ID,
  code: 'ART001',
  name: 'Articolo Padre',
  description: null,
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
};

const MOCK_COMPONENT_ARTICLE = {
  id: COMPONENT_ID,
  code: 'ART002',
  name: 'Componente A',
  description: null,
  categoryId: 1,
  categoryName: 'Categoria 1',
  price: 50,
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
};

const MOCK_MEASURE_UNITS = [{ id: 1, name: 'Pezzo', description: null }];

const MOCK_BOMS = [
  {
    parentArticleId: PARENT_ID,
    parentArticleCode: 'ART001',
    parentArticleName: 'Articolo Padre',
    componentArticleId: COMPONENT_ID,
    componentArticleCode: 'ART002',
    componentArticleName: 'Componente A',
    quantity: 2.5,
    quantityType: 'PHYSICAL',
    umId: 1,
    umName: 'Pezzo',
    scrapPercentage: 5,
    scrapFactor: 0,
    fixedScrap: 0,
  },
];

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

async function mockArticles(page: Page): Promise<void> {
  // /articles/1 → parent article; /articles → all articles (for dialog dropdown)
  await page.route(`${API_BASE}/articles**`, async route => {
    const url = route.request().url().split('?')[0];
    if (url === `${API_BASE}/articles/${PARENT_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PARENT_ARTICLE),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([MOCK_PARENT_ARTICLE, MOCK_COMPONENT_ARTICLE]),
      });
    }
  });
}

async function mockMeasureUnits(page: Page): Promise<void> {
  await page.route(`${API_BASE}/measure-units**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MEASURE_UNITS),
    });
  });
}

async function mockBomList(page: Page, boms = MOCK_BOMS): Promise<void> {
  await page.route(`${API_BASE}/bill-of-materials/by-parent/**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(boms),
    });
  });
}

async function setupBomPage(page: Page, boms = MOCK_BOMS): Promise<void> {
  await mockArticles(page);
  await mockMeasureUnits(page);
  await mockBomList(page, boms);
  await loginAsAdmin(page);
  await page.goto(`/admin/articles/${PARENT_ID}/bom`);
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con le colonne attese
// ---------------------------------------------------------------------------
test('bom_page: mostra la tabella con colonne Codice/Nome/Quantità/Scarto', async ({ page }) => {
  await setupBomPage(page);

  await expect(page.getByRole('columnheader', { name: 'Codice Componente' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Nome Componente' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Quantità' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Scarto' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Azioni' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Mostra i dati BOM nella tabella
// ---------------------------------------------------------------------------
test('bom_page: mostra i dati del componente nella tabella', async ({ page }) => {
  await setupBomPage(page);

  await expect(page.getByRole('cell', { name: 'ART002' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Componente A' })).toBeVisible();

  // Intestazione pagina include il codice articolo padre
  await expect(page.getByRole('heading', { name: /ART001/ })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 3. Mostra messaggio vuoto quando non ci sono componenti
// ---------------------------------------------------------------------------
test('bom_page: mostra messaggio quando non ci sono componenti', async ({ page }) => {
  await setupBomPage(page, []);

  await expect(page.getByText('Nessun componente trovato')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 4. Aprendo il dialog di creazione mostra i campi del form
// ---------------------------------------------------------------------------
test('bom_create: aprendo dialog mostra i campi del form', async ({ page }) => {
  await setupBomPage(page);

  await page.getByRole('button', { name: 'Aggiungi Componente' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Aggiungi Componente' })).toBeVisible();
  await expect(page.getByLabel('Articolo Componente')).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Quantità' })).toBeVisible();
  await expect(page.getByLabel('Tipo Quantità')).toBeVisible();
  await expect(page.getByLabel('Unità di Misura')).toBeVisible();
  await expect(page.getByLabel('Scarto Percentuale (%)')).toBeVisible();

  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 5. Click su edit apre il dialog con i dati pre-compilati
// ---------------------------------------------------------------------------
test('bom_edit: click su edit apre dialog con dati pre-compilati', async ({ page }) => {
  await setupBomPage(page);

  const editButton = page.locator('button:has-text("edit")').first();
  await editButton.click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Modifica Componente' })).toBeVisible();

  // La quantità deve essere pre-compilata
  await expect(page.getByRole('spinbutton', { name: 'Quantità' })).toHaveValue('2.5');

  // Il campo scarto percentuale deve avere 5
  await expect(page.getByLabel('Scarto Percentuale (%)')).toHaveValue('5');

  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 6. Compilando il form di creazione e cliccando Crea invia POST
// ---------------------------------------------------------------------------
test('bom_form_create: compilando il form e cliccando Crea invia POST', async ({ page }) => {
  let capturedMethod = '';

  await mockArticles(page);
  await mockMeasureUnits(page);

  await page.route(`${API_BASE}/bill-of-materials**`, async route => {
    const method = route.request().method();
    if (method === 'GET') {
      // BOM list (initial load and after creation)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOMS),
      });
    } else if (method === 'POST') {
      capturedMethod = 'POST';
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_BOMS[0],
          componentArticleId: COMPONENT_ID,
          componentArticleCode: 'ART002',
          componentArticleName: 'Componente A',
          quantity: 3,
          quantityType: 'PHYSICAL',
        }),
      });
    }
  });

  await loginAsAdmin(page);
  await page.goto(`/admin/articles/${PARENT_ID}/bom`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Aggiungi Componente' }).click();
  await page.waitForLoadState('networkidle');

  // Seleziona articolo componente
  await page.getByLabel('Articolo Componente').click();
  await page.getByRole('option', { name: /ART002/ }).click();

  // Imposta quantità
  const quantityField = page.getByRole('spinbutton', { name: 'Quantità' });
  await quantityField.clear();
  await quantityField.fill('3');

  // Seleziona unità di misura
  await page.getByLabel('Unità di Misura').click();
  await page.getByRole('option', { name: 'Pezzo' }).click();

  await page.getByRole('button', { name: 'Crea' }).click();
  await page.waitForLoadState('networkidle');

  expect(capturedMethod).toBe('POST');
});

// ---------------------------------------------------------------------------
// 7. Modificando un componente e cliccando Aggiorna invia PUT
// ---------------------------------------------------------------------------
test('bom_form_edit: modificando il form e cliccando Aggiorna invia PUT', async ({ page }) => {
  let capturedMethod = '';
  let capturedUrl = '';

  await mockArticles(page);
  await mockMeasureUnits(page);

  await page.route(`${API_BASE}/bill-of-materials**`, async route => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOMS),
      });
    } else if (method === 'PUT') {
      capturedMethod = 'PUT';
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_BOMS[0], quantity: 5 }),
      });
    }
  });

  await loginAsAdmin(page);
  await page.goto(`/admin/articles/${PARENT_ID}/bom`);
  await page.waitForLoadState('networkidle');

  const editButton = page.locator('button:has-text("edit")').first();
  await editButton.click();
  await page.waitForLoadState('networkidle');

  const quantityField = page.getByRole('spinbutton', { name: 'Quantità' });
  await quantityField.clear();
  await quantityField.fill('5');

  await page.getByRole('button', { name: 'Aggiorna' }).click();
  await page.waitForLoadState('networkidle');

  expect(capturedMethod).toBe('PUT');
  expect(capturedUrl).toContain(`${API_BASE}/bill-of-materials/${PARENT_ID}/${COMPONENT_ID}`);
});

// ---------------------------------------------------------------------------
// 8. Click su delete mostra conferma e invia DELETE
// ---------------------------------------------------------------------------
test('bom_delete: click delete mostra conferma e invia DELETE', async ({ page }) => {
  let capturedMethod = '';
  let capturedUrl = '';

  await mockArticles(page);
  await mockMeasureUnits(page);

  await page.route(`${API_BASE}/bill-of-materials**`, async route => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_BOMS),
      });
    } else if (method === 'DELETE') {
      capturedMethod = 'DELETE';
      capturedUrl = route.request().url();
      await route.fulfill({ status: 204 });
    }
  });

  await loginAsAdmin(page);
  await page.goto(`/admin/articles/${PARENT_ID}/bom`);
  await page.waitForLoadState('networkidle');

  // Accetta il dialog di conferma nativo (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  const deleteButton = page.locator('button:has-text("delete")').first();
  await deleteButton.click();
  await page.waitForLoadState('networkidle');

  expect(capturedMethod).toBe('DELETE');
  expect(capturedUrl).toContain(`${API_BASE}/bill-of-materials/${PARENT_ID}/${COMPONENT_ID}`);
});

// ---------------------------------------------------------------------------
// 9. Click su Indietro naviga a /admin/articles
// ---------------------------------------------------------------------------
test('bom_back: click Indietro naviga alla lista articoli', async ({ page }) => {
  await setupBomPage(page);

  await page.getByRole('button', { name: 'Indietro' }).click();

  await expect(page).toHaveURL(/\/admin\/articles$/);
});
