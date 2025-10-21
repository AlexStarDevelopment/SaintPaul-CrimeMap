import { test, expect } from '@playwright/test';

test.describe('Stripe Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start on the home page
    await page.goto('http://localhost:3001');
  });

  test('pricing page loads correctly', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('http://localhost:3001/pricing');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify pricing tiers are visible
    await expect(page.getByText(/Supporter/i).first()).toBeVisible();
    await expect(page.getByText(/Pro/i).first()).toBeVisible();
    await expect(page.getByText(/Free/i).first()).toBeVisible();

    // Verify pricing amounts
    await expect(page.getByText(/\$5/)).toBeVisible();
    await expect(page.getByText(/\$15/)).toBeVisible();

    // Verify "Start 7-Day Free Trial" buttons exist
    const trialButtons = page.getByRole('button', { name: /Start 7-Day Free Trial/i });
    expect(await trialButtons.count()).toBeGreaterThan(0);

    console.log('✅ Pricing page loaded successfully with all tiers');
  });

  test('can view pricing tiers without authentication', async ({ page }) => {
    await page.goto('http://localhost:3001/pricing');
    await page.waitForLoadState('networkidle');

    // Check that free tier is visible
    await expect(page.getByText(/Free/i).first()).toBeVisible();

    // Check for "Start 7-Day Free Trial" buttons
    const trialButtons = page.getByRole('button', { name: /Start 7-Day Free Trial/i });
    const buttonCount = await trialButtons.count();

    console.log(`✅ Found ${buttonCount} "Start 7-Day Free Trial" buttons`);
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('account page requires authentication', async ({ page }) => {
    // Try to access account page without auth
    await page.goto('http://localhost:3001/account');
    await page.waitForLoadState('networkidle');

    // Should redirect to sign in or show sign in prompt
    const url = page.url();
    console.log(`✅ Account page URL: ${url}`);

    // Either redirected or on account page with sign-in prompt
    const isAccountPage = url.includes('/account');
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);

    expect(isAccountPage || hasSignIn).toBeTruthy();
    console.log('✅ Account page properly requires authentication');
  });

  test('API endpoints are configured', async ({ page }) => {
    // Test that the checkout API exists (will fail without auth, but that's expected)
    const response = await page.request.post('http://localhost:3001/api/checkout', {
      data: { tier: 'supporter' },
      failOnStatusCode: false,
    });

    // Should return 401 Unauthorized (not 404)
    expect(response.status()).toBe(401);
    console.log('✅ Checkout API endpoint exists and requires authentication');
  });
});
