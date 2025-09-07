import { test, expect } from '@playwright/test';

test('Home page should be visible', async ({ page }) => {
  await page.goto('http://localhost:3000/index.html');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveURL(/localhost/);
  const pageTitle = await page.locator('.logo-section h1').textContent();
  await expect(pageTitle).toEqual('Hub de Leitura');
});
