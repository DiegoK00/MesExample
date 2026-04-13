import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  mockAuditLogs,
  MOCK_AUDIT_LOGS_PAGE,
  API_BASE,
} from './helpers';

// ---------------------------------------------------------------------------
// Setup: login + navigate to /admin/audit-logs
// ---------------------------------------------------------------------------
async function setupAuditLogsPage(page: Page): Promise<void> {
  await mockAuditLogs(page);
  await loginAsAdmin(page);
  await page.goto('/admin/audit-logs');
  await page.waitForLoadState('networkidle');
}

// ---------------------------------------------------------------------------
// 1. Mostra la tabella con colonne Azione/Entità/Data
// ---------------------------------------------------------------------------
test('audit_logs_page: mostra la tabella con colonne Azione/Entità/Data', async ({ page }) => {
  await setupAuditLogsPage(page);

  // Intestazioni di colonna (da columns: ['timestamp', 'username', 'action', 'entity', 'ip', 'details'])
  await expect(page.getByRole('columnheader', { name: 'Azione' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Entità' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();

  // Verifica che ci siano i dati mock
  await expect(page.getByText('user.login')).toBeVisible();
  await expect(page.getByText('program.created')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 2. Filtro per azione aggiorna la tabella
// ---------------------------------------------------------------------------
test('audit_logs_filter: filtro per azione aggiorna la tabella', async ({ page }) => {
  let lastUrl = '';

  await page.route(`${API_BASE}/audit-logs**`, async route => {
    lastUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [MOCK_AUDIT_LOGS_PAGE.items[0]],
        totalCount: 1,
        page: 1,
        pageSize: 50,
      }),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/audit-logs');
  await page.waitForLoadState('networkidle');

  // Seleziona un valore nel mat-select "Azione"
  await page.getByLabel('Azione').click();

  // Seleziona "user.login" dal pannello del select
  await page.getByRole('option', { name: 'user.login', exact: true }).click();
  await page.waitForLoadState('networkidle');

  // Verifica che la chiamata contenga il filtro action
  expect(lastUrl).toContain('action=user.login');
});

// ---------------------------------------------------------------------------
// 3. Navigazione pagine funziona
// ---------------------------------------------------------------------------
test('audit_logs_pagination: navigazione pagine funziona', async ({ page }) => {
  let requestCount = 0;

  await page.route(`${API_BASE}/audit-logs**`, async route => {
    requestCount++;
    // Simula più pagine: totalCount = 60 con pageSize = 50
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: MOCK_AUDIT_LOGS_PAGE.items,
        totalCount: 60,
        page: 1,
        pageSize: 50,
      }),
    });
  });

  await loginAsAdmin(page);
  await page.goto('/admin/audit-logs');
  await page.waitForLoadState('networkidle');

  // Il paginator deve essere visibile e mostrare il totale
  const paginator = page.locator('mat-paginator');
  await expect(paginator).toBeVisible();
  await expect(paginator).toContainText('60');

  // Clicca "Pagina successiva"
  await page.getByRole('button', { name: 'Next page' }).click();
  await page.waitForLoadState('networkidle');

  // La tabella deve aver richiesto nuovi dati (requestCount > 1: caricamento iniziale + click pagina)
  expect(requestCount).toBeGreaterThan(1);
});
