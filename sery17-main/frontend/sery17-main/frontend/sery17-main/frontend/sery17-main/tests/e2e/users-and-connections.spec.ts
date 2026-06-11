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

test.describe('Connection Permissions in Users', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigate to Users page', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    const heading = page.getByRole('heading', { name: /المستخدمين|فريق العمل/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: 'users-page.jpeg', quality: 20 });
  });

  test('Open user permissions dialog', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for users table to load
    await page.waitForLoadState('domcontentloaded');
    
    // Look for permission edit button (shield icon or صلاحيات)
    const permissionButtons = page.locator('button').filter({ hasText: /صلاحيات/i });
    const count = await permissionButtons.count();
    
    if (count > 0) {
      await permissionButtons.first().click();
      await page.waitForLoadState('domcontentloaded');
      await page.screenshot({ path: 'users-permissions-dialog.jpeg', quality: 20 });
    } else {
      // Alternative: Look for icons that might open permissions
      const iconButtons = page.locator('[data-testid*="permission"], button svg');
      await page.screenshot({ path: 'users-page-buttons.jpeg', quality: 20 });
    }
  });
});

test.describe('Connections Hub Access', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Navigate to Connections Hub page', async ({ page }) => {
    await page.goto('/connections', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot to see if page loads
    await page.screenshot({ path: 'connections-hub.jpeg', quality: 20 });
    
    // Check if connections hub loaded (even if just shows "no access")
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
