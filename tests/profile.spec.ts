import { test, expect } from '@playwright/test';

test.describe('Profile Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should show dashboard button after saving profile', async ({ page }) => {
    // Navigate to profile page
    await page.click('[data-testid="nav-profile"]');
    
    // Fill out profile form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="birthDate"]', '1990-01-01');
    await page.fill('input[name="location"]', 'Test City');
    
    // Save profile
    await page.click('button:has-text("Save Profile")');
    
    // Wait for profile to save
    await expect(page.locator('text=Profile saved')).toBeVisible();
    
    // Dashboard button should now be visible
    await expect(page.locator('button:has-text("Show Dashboard")')).toBeVisible();
  });

  test('should display dashboard with statistics after loading sample data', async ({ page }) => {
    // Navigate to profile page
    await page.click('[data-testid="nav-profile"]');
    
    // Load sample data
    await page.click('button:has-text("Load Sample Data")');
    
    // Wait for data to load
    await expect(page.locator('text=Profile saved')).toBeVisible();
    
    // Click show dashboard
    await page.click('button:has-text("Show Dashboard")');
    
    // Dashboard should be visible with statistics
    await expect(page.locator('text=Life Dashboard')).toBeVisible();
    await expect(page.locator('text=Age Overview')).toBeVisible();
    await expect(page.locator('text=Total Stories')).toBeVisible();
  });

  test('should show empty state when no stories exist', async ({ page }) => {
    // Navigate to profile page
    await page.click('[data-testid="nav-profile"]');
    
    // Fill and save profile without loading sample data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="birthDate"]', '1990-01-01');
    await page.click('button:has-text("Save Profile")');
    
    // Wait for profile to save
    await expect(page.locator('text=Profile saved')).toBeVisible();
    
    // Click show dashboard
    await page.click('button:has-text("Show Dashboard")');
    
    // Should show empty state
    await expect(page.locator('text=No stories to display yet')).toBeVisible();
    await expect(page.locator('button:has-text("Add Your First Story")')).toBeVisible();
  });
});
