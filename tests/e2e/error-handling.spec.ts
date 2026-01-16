import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
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

  test('should show error for invalid file', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });
    const errorMsg = page.getByText(/ungültiges dateiformat|dateityp|invalid/i);
    await expect(errorMsg).toBeVisible({ timeout: 15000 });
  });
});
