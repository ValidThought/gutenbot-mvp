import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should load home page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/GutenBot/);
      await expect(page.locator('h1')).toContainText('GutenBot');
    });

    test('should have start button', async ({ page }) => {
      const startButton = page.getByRole('link', { name: /starten|Jetzt starten/i });
      await expect(startButton).toBeVisible();
    });

    test('should navigate to onboarding when clicking start', async ({ page }) => {
      const startButton = page.getByRole('link', { name: /starten|Jetzt starten/i });
      await startButton.click();
      await expect(page).toHaveURL(/\/onboarding/);
    });
  });

  test.describe('Onboarding Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/onboarding');
    });

    test('should display onboarding page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/onboarding|starten/i);
    });

    test('should have Bundesland selector', async ({ page }) => {
      const bundeslandSelect = page.locator('select, [role="combobox"]').first();
      await expect(bundeslandSelect).toBeVisible();
    });
  });

  test.describe('Scan Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/scan');
    });

    test('should display scan page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/scannen|Scan/i);
    });

    test('should have camera or upload option', async ({ page }) => {
      const scanOptions = page.locator('button, [role="button"]').filter({
        hasText: /camera|kamera|upload|hochladen/i,
      });
      await expect(scanOptions.first()).toBeVisible();
    });
  });

  test.describe('History Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/history');
    });

    test('should display history page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText(/verlauf|history/i);
    });
  });
});
