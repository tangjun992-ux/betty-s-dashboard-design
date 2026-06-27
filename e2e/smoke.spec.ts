import { test, expect } from '@playwright/test';

test('home loads and shows brand', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Betty/i);
  await expect(page.locator('body')).toBeVisible();
});

test('explore route renders', async ({ page }) => {
  await page.goto('/explore');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('pricing route renders plans', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText(/credit|plan|month/i).first()).toBeVisible();
});

test('protected route redirects unauthenticated users', async ({ page }) => {
  await page.goto('/library');
  await page.waitForURL(/\/auth/);
  await expect(page.getByRole('heading').first()).toBeVisible();
});
