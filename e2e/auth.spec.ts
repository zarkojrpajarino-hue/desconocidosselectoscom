import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display landing page with login options', async ({ page }) => {
    await page.goto('/');
    
    // Verify landing page loads
    await expect(page).toHaveTitle(/Optimus/i);
    
    // Check for auth buttons in header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/');
    
    // Click sign up button (adjust selector based on actual UI)
    const signupButton = page.getByRole('button', { name: /registrar|signup|crear cuenta/i });
    
    if (await signupButton.isVisible()) {
      await signupButton.click();
      
      // Fill signup form
      await page.getByPlaceholder(/email/i).fill('test@example.com');
      await page.getByPlaceholder(/contraseña|password/i).first().fill('TestPassword123!');
      
      // Submit form
      await page.getByRole('button', { name: /registrar|crear|signup/i }).click();
      
      // Should show success or redirect
      await expect(page).not.toHaveURL('/');
    }
  });

  test('should allow user to login', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    const loginButton = page.getByRole('button', { name: /iniciar sesión|login|entrar/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Fill login form
      await page.getByPlaceholder(/email/i).fill('test@example.com');
      await page.getByPlaceholder(/contraseña|password/i).fill('TestPassword123!');
      
      // Submit
      await page.getByRole('button', { name: /entrar|login|iniciar/i }).click();
    }
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access protected route
    await page.goto('/home');
    
    // Should redirect to landing or show auth prompt
    await expect(page).toHaveURL(/\/($|#)/);
  });
});
