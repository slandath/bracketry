import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  // Uses baseURL from playwright.config.ts if set; otherwise navigates to '/'
  const response = await page.goto('/');
  // basic sanity: navigation succeeded and body is visible
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
});
