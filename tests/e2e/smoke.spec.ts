import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('scan page loads', async ({ page }) => {
    await page.goto('/scan');
    await expect(page.locator('h1, div.text-muted')).toBeVisible();
  });

  test('history page loads', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('h1')).toBeVisible();
  });
});
