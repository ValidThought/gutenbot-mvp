import { test, expect } from '@playwright/test';

test.describe('GutenBot E2E Flow', () => {
  test('should load landing page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check landing page loads
    await expect(page).toHaveTitle(/GutenBot/);
    
    // Check main heading
    const heading = page.getByText(/GutenBot/);
    await expect(heading).toBeVisible();
    
    // Check CTA button
    const ctaButton = page.getByRole('link', { name: /starten/ });
    await expect(ctaButton).toBeVisible();
  });

  test('should navigate through onboarding', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check onboarding page loads - use exact match for step label
    await expect(page.getByText('Bundesland', { exact: true })).toBeVisible();
    
    // Select a bundesland
    await page.click('button:has-text("Berlin")');
    
    // Continue to next step
    await page.click('button:has-text("Weiter")');
    
    // Check personal data step
    await expect(page.getByLabel('Name')).toBeVisible();
  });

  test('should load scan page', async ({ page }) => {
    await page.goto('http://localhost:3000/scan');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check scan page loads - scan page redirects to onboarding if not onboarded
    // So we check for either scan content or onboarding redirect
    const content = page.getByText(/scan|Bundesland/);
    await expect(content.first()).toBeVisible();
  });

  test('should load history page', async ({ page }) => {
    await page.goto('http://localhost:3000/history');
    
    // Check history page loads
    await expect(page.getByText(/Verlauf|Noch keine Briefe/)).toBeVisible();
  });

  test('API routes should respond', async ({ request }) => {
    // Test templates API
    const templatesResponse = await request.get('http://localhost:3000/api/templates');
    expect(templatesResponse.ok()).toBe(true);
    
    const templates = await templatesResponse.json();
    expect(templates.templates).toBeDefined();
    expect(templates.templates.length).toBeGreaterThan(0);
  });
});
