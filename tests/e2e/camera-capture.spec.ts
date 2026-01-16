import { test, expect } from '@playwright/test';

test.describe('Camera Capture', () => {
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

  test('should have smart scan button', async ({ page }) => {
    const button = page.getByRole('button', { name: /smart scan/i });
    await expect(button).toBeVisible();
  });
});
