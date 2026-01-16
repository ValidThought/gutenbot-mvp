import { test, expect } from '@playwright/test';

test.describe('Scan Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
    await page.evaluate(() => {
      localStorage.setItem('gutenbot-user', JSON.stringify({
        state: {
          profile: {
            id: 'test-user-1',
            name: 'Hans Müller',
            address: { street: 'Hauptstraße 1', zip: '10115', city: 'Berlin' },
            bundesland: 'BE',
            email: 'hans@example.de',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          isOnboarded: true,
        },
        version: 0,
      }));
    });
    await page.reload();
  });

  test('should process uploaded image', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('tests/fixtures/images/sample-letter.jpg');
    await expect(page.getByRole('button', { name: /weiter/i })).toBeVisible({ timeout: 60000 });
  });
});
