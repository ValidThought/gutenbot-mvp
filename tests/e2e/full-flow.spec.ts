import { test, expect } from '@playwright/test';

test.describe('Full User Flow', () => {
  test('complete flow: home → onboarding → scan → analyze → compose', async ({
    page,
  }) => {
    test.slow();

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should complete full user journey', async ({ page }) => {
      await expect(page).toHaveTitle(/GutenBot/);
      await expect(page.locator('h1')).toContainText('GutenBot');

      await page.getByRole('link', { name: /starten/i }).click();
      await expect(page).toHaveURL(/\/onboarding/);

      const bundeslandSelect = page.locator('select').first();
      await bundeslandSelect.selectOption('BE');

      const nameInput = page.locator('input[name="name"], input[id*="name"]').first();
      await nameInput.fill('Hans Müller');

      const emailInput = page.locator('input[type="email"], input[id*="email"]').first();
      await emailInput.fill('hans@example.de');

      const submitButton = page.getByRole('button', { name: /weiter|fortfahren|start/i });
      await submitButton.click();

      await expect(page).toHaveURL(/\/scan/);

      const uploadOption = page.getByRole('button', { name: /upload|hochladen/i }).first();
      await uploadOption.click();

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles('tests/fixtures/letters/finanzamt_bescheid.txt');

      await expect(page.locator('text=/analyziert|verarbeitet/i')).toBeVisible({ timeout: 30000 });
    });
  });
});

test.describe('Analysis Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis/new');
  });

  test('should display analysis page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/analyse|analyze/i);
  });

  test('should show classification result', async ({ page }) => {
    const classificationBadge = page.locator('[class*="badge"], span[class*="tag"]').first();
    await expect(classificationBadge).toBeVisible();
  });

  test('should show deadlines if present', async ({ page }) => {
    const deadlineSection = page.locator('text=/frist/i').first();
    await expect(deadlineSection).toBeVisible();
  });

  test('should show recommended actions', async ({ page }) => {
    const actionsSection = page.locator('text=/aktion|action/i').first();
    await expect(actionsSection).toBeVisible();
  });
});

test.describe('Compose Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compose/1');
  });

  test('should display compose page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/schreiben|verfassen|compose/i);
  });

  test('should have editor area', async ({ page }) => {
    const editor = page.locator('textarea, [contenteditable], [role="textbox"]').first();
    await expect(editor).toBeVisible();
  });

  test('should have send/download options', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /senden|send|download|herunterladen/i }).first();
    await expect(sendButton).toBeVisible();
  });
});
