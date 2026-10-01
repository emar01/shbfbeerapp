const { test, expect } = require('@playwright/test');

test('SHBF API, search, and local BJCP data work in the browser', async ({ page }) => {
  const pageErrors = [];
  const remoteStatuses = new Map();
  let bjcpStatus;

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname === 'styles.shbf.se') {
      remoteStatuses.set(url.pathname, response.status());
    }
    if (url.pathname.endsWith('/db/bjcp-beer-2021_en.xml')) {
      bjcpStatus = response.status();
    }
  });

  await page.goto('/');
  await expect(page.locator('.app-title')).toContainText('Öltypdefinitioner');
  await expect.poll(
    () => page.locator('#accordionKategori .accordion-item').count(),
    { timeout: 60_000 },
  ).toBeGreaterThan(0);

  const selectedVersion = await page.locator('#versionSelect').inputValue();
  expect(selectedVersion).not.toBe('latest');
  expect(remoteStatuses.get('/json/index')).toBe(200);
  expect(remoteStatuses.get(`/json/${selectedVersion}`)).toBe(200);

  const styleName = await page.evaluate(() => window.kategorier?.[0]?.typer?.[0]?.namn);
  expect(styleName).toBeTruthy();
  await page.locator('#searchInput').fill(styleName);
  await expect(page.locator('#accordionKategori .card-header')).toContainText('Sökresultat');
  await expect(page.locator('#accordionKategori .list-group-item')).not.toHaveCount(0);

  await page.locator('#kallaSelect').selectOption('BJCP');
  await expect.poll(
    () => page.locator('#accordionKategori .accordion-item').count(),
    { timeout: 30_000 },
  ).toBeGreaterThan(0);
  expect(bjcpStatus).toBe(200);
  expect(pageErrors).toEqual([]);
});
