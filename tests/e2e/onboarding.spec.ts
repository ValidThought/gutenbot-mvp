import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('should display onboarding page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/willkommen|onboarding|starten/i);
  });

  test('should have multi-step form', async ({ page }) => {
    const progressIndicator = page.locator('[class*="progress"], [role="progressbar"]').first();
    await expect(progressIndicator).toBeVisible();
  });

  test('should require Bundesland selection', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /weiter|fortfahren/i });
    await expect(nextButton).toBeVisible();
    await nextButton.click();

    const errorMessage = page.locator('text=/pflicht|required|erforderlich/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('should allow Berlin selection', async ({ page }) => {
    const bundeslandSelect = page.locator('select').first();
    await bundeslandSelect.selectOption('BE');

    const selectedValue = await bundeslandSelect.inputValue();
    expect(selectedValue).toBe('BE');
  });

  test('should allow Hessen selection', async ({ page }) => {
    const bundeslandSelect = page.locator('select').first();
    await bundeslandSelect.selectOption('HE');

    const selectedValue = await bundeslandSelect.inputValue();
    expect(selectedValue).toBe('HE');
  });

  test('should collect user data', async ({ page }) => {
    await page.locator('select').first().selectOption('BE');

    const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
    await nameInput.fill('Hans Müller');

    const streetInput = page.locator('input[name="street"], input[id*="street"]').first();
    await streetInput.fill('Hauptstraße 1');

    const zipInput = page.locator('input[name="zip"], input[id*="zip"]').first();
    await zipInput.fill('10115');

    const cityInput = page.locator('input[name="city"], input[id*="city"]').first();
    await cityInput.fill('Berlin');

    const emailInput = page.locator('input[type="email"], input[id*="email"]').first();
    await emailInput.fill('hans@example.de');
  });

  test('should navigate to scan after completion', async ({ page }) => {
    await page.locator('select').first().selectOption('BE');
    await page.locator('input[name="name"], input[id*="name"]').first().fill('Hans Müller');
    await page.locator('input[type="email"], input[id*="email"]').first().fill('hans@example.de');

    const submitButton = page.getByRole('button', { name: /starten|abschließen|fertig/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/scan/);
  });

  test('should validate email format', async ({ page }) => {
    await page.locator('input[type="email"], input[id*="email"]').first().fill('invalid-email');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.blur();

    const errorMessage = page.locator('text=/ungült|invalid|email/i').first();
    await expect(errorMessage).toBeVisible();
  });

  test('should validate German postal code format', async ({ page }) => {
    const zipInput = page.locator('input[name="zip"], input[id*="zip"]').first();
    await zipInput.fill('123');
    await zipInput.blur();

    const errorMessage = page.locator('text=/5 stellig|5 digits/i').first();
    await expect(errorMessage.first()).toBeVisible();
  });
});
