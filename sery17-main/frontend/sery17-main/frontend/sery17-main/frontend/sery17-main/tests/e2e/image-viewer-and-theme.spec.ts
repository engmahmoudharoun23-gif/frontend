import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page, username = 'admin', password = '123456') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('اسم المستخدم').fill(username);
  await page.getByPlaceholder('كلمة المرور').fill(password);
  await page.getByRole('button', { name: 'دخول' }).click();
  // Wait for navigation after login
  await page.waitForURL('**/projects', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Image Viewer in Employee Requests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigate to Employee Requests page', async ({ page }) => {
    // Navigate to employee requests
    await page.goto('/employee-requests', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    const heading = page.getByRole('heading', { name: /طلبات الموظفين/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'employee-requests-page.jpeg', quality: 20 });
  });

  test('Check for view details button', async ({ page }) => {
    await page.goto('/employee-requests', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // Check if there are "عرض" (View) buttons
    const viewButtons = page.getByRole('button', { name: /عرض/i });
    const count = await viewButtons.count();
    
    if (count > 0) {
      // Click the first view button to open modal
      await viewButtons.first().click();
      
      // Wait for modal to appear
      await page.waitForLoadState('domcontentloaded');
      
      // Take screenshot of the modal
      await page.screenshot({ path: 'employee-request-view-modal.jpeg', quality: 20 });
    }
  });
});

test.describe('Image Viewer in Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigate to Invoices page', async ({ page }) => {
    await page.goto('/invoices', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    const heading = page.getByRole('heading', { name: /فواتير/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'invoices-page.jpeg', quality: 20 });
  });

  test('Check for view details button in invoices', async ({ page }) => {
    await page.goto('/invoices', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // Check if there are "عرض" (View) buttons
    const viewButtons = page.getByRole('button', { name: /عرض/i });
    const count = await viewButtons.count();
    
    if (count > 0) {
      await viewButtons.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: 'invoice-view-modal.jpeg', quality: 20 });
    }
  });
});

test.describe('Personal Theme Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigate to Settings page', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    const heading = page.getByRole('heading', { name: /الإعدادات/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'settings-page.jpeg', quality: 20 });
  });

  test('Verify personal theme section exists', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Look for personal theme section
    const personalThemeSection = page.getByText('الثيم الشخصي');
    await expect(personalThemeSection.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'settings-personal-theme-section.jpeg', quality: 20 });
  });

  test('Verify theme color options are visible', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check for theme color buttons - they should have the theme names
    const blueTheme = page.getByText('أزرق (الافتراضي)');
    await expect(blueTheme.first()).toBeVisible({ timeout: 10000 });
    
    const greenTheme = page.getByText('أخضر حكومي');
    await expect(greenTheme.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'settings-theme-colors.jpeg', quality: 20 });
  });
});
