import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

test.describe('OCR and Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
  });

  test('should display scan page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/scannen|Scan/i);
  });

  test('should have smart scan option', async ({ page }) => {
    const smartScanButton = page.getByRole('button', { name: /smart scan/i });
    await expect(smartScanButton).toBeVisible();
  });

  test('should have upload option', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload|hochladen/i });
    await expect(uploadButton).toBeVisible();
  });

  test('should switch between smart scan and upload', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await uploadButton.click();

    const uploadArea = page.locator('input[type="file"], label[class*="upload"]');
    await expect(uploadArea.first()).toBeVisible();

    const smartScanButton = page.getByRole('button', { name: /smart scan/i });
    await smartScanButton.click();

    await expect(page.locator('video, [class*="camera"]').first()).toBeVisible();
  });

  test('should accept image files', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    
    await fileInput.setInputFiles(testFilePath);

    await expect(page.getByText(/hochgeladen|geladen|processed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show OCR progress', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    const progressIndicator = page.locator('[class*="progress"], [role="progressbar"]').first();
    await expect(progressIndicator).toBeVisible();
  });

  test('should display OCR confidence', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    await expect(page.getByText(/\d+%|erkannt|confidence/i).first()).toBeVisible({ timeout: 30000 });
  });

  test('should show extracted text preview', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    await expect(page.locator('pre, code, [class*="text"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('should have continue button after successful OCR', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    const continueButton = page.getByRole('button', { name: /weiter|fortfahren/i });
    await expect(continueButton).toBeVisible({ timeout: 30000 });
  });

  test('should navigate to analysis after OCR completion', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    const continueButton = page.getByRole('button', { name: /weiter|fortfahren/i });
    await continueButton.click({ timeout: 30000 });

    await expect(page).toHaveURL(/\/analysis/);
  });

  test('should allow retake after OCR', async ({ page }) => {
    await page.getByRole('button', { name: /upload/i }).click();

    const fileInput = page.locator('input[type="file"]').first();
    const testFilePath = join(__dirname, '../fixtures/letters/test-image.jpg');
    writeFileSync(testFilePath, 'fake-image-data');
    await fileInput.setInputFiles(testFilePath);

    const retakeButton = page.getByRole('button', { name: /neu|retake|erneut/i });
    await expect(retakeButton).toBeVisible({ timeout: 30000 });

    await retakeButton.click();
    await expect(page.locator('input[type="file"]').first()).toBeVisible();
  });
});
