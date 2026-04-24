import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  mockUsers,
  API_BASE,
} from './helpers';

async function mockCategories(page: Page, data?: any) {
  const defaultData = [
    {
      id: 1,
      name: 'Categoria 1',
      description: 'Prima categoria',
      isActive: true,
    },
  ];

  await page.route(`${API_BASE}/categories**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data || defaultData),
    });
  });
}

async function setupCategoriesPage(page: Page): Promise<void> {
  await mockCategories(page);
  await mockUsers(page);
  await loginAsAdmin(page);
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con colonne Nome/Descrizione
// ---------------------------------------------------------------------------
test('categories_page: mostra la tabella con colonne Nome', async ({ page }) => {
  await setupCategoriesPage(page);

  await expect(page.locator('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Categoria 1' })).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Aprendo il dialog di creazione mostra i campi obbligatori
// ---------------------------------------------------------------------------
test('categories_create: aprendo dialog mostra campo Nome', async ({ page }) => {
  await setupCategoriesPage(page);

  await page.getByRole('button', { name: 'Nuova Categoria' }).click();

  await expect(page.getByRole('heading', { name: 'Nuova Categoria' })).toBeVisible();
  await expect(page.getByLabel('Nome')).toBeVisible();

  await page.getByRole('button', { name: 'Annulla' }).click();
});

// ---------------------------------------------------------------------------
// 3. Click su edit apre il dialog con i dati pre-compilati
// ---------------------------------------------------------------------------
test('categories_edit: click su edit apre dialog con dati pre-compilati', async ({ page }) => {
  await setupCategoriesPage(page);

  const editButton = page.locator('button:has-text("edit")').first();
  await editButton.click();

  await expect(page.getByRole('heading', { name: 'Modifica Categoria' })).toBeVisible();

  const nomeField = page.getByLabel('Nome');
  await expect(nomeField).toHaveValue('Categoria 1');
});

// ---------------------------------------------------------------------------
// 4. Compilando il form e cliccando Salva invia POST/PUT
// ---------------------------------------------------------------------------
test('categories_form: compilando form e cliccando Salva invia la richiesta', async ({ page }) => {
  let capturedMethod = '';

  await page.route(`${API_BASE}/categories**`, async route => {
    const method = route.request().method();
    capturedMethod = method;
    
    await route.fulfill({
      status: method === 'POST' ? 201 : 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 999,
        name: 'Nuova Categoria',
        isActive: true,
      }),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Nuova Categoria' }).click();

  const nomeField = page.getByLabel('Nome');
  await nomeField.fill('Nuova Categoria');

  await page.getByRole('button', { name: 'Crea' }).click();
  await page.waitForLoadState('networkidle');

  expect(capturedMethod).toBe('POST');
});

// ---------------------------------------------------------------------------
// 5. Click su delete apre conferma e invia DELETE
// ---------------------------------------------------------------------------
test('categories_delete: click delete mostra conferma e invia DELETE', async ({ page }) => {
  let capturedMethod = '';
  
  await page.route(`${API_BASE}/categories**`, async route => {
    if (route.request().method() === 'DELETE') {
      capturedMethod = 'DELETE';
      await route.fulfill({
        status: 204,
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Categoria 1',
            isActive: true,
          },
        ]),
      });
    }
  });

  await mockUsers(page);
  await loginAsAdmin(page);
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');

  // Attende che la riga dati sia visibile prima di cercare il pulsante delete
  await expect(page.getByRole('cell', { name: 'Categoria 1' })).toBeVisible();

  // Accetta il dialog di conferma nativo (window.confirm)
  page.on('dialog', dialog => dialog.accept());

  const deleteButton = page.locator('button:has-text("delete")').first();
  await deleteButton.click();

  await page.waitForLoadState('networkidle');
  expect(capturedMethod).toBe('DELETE');
});
