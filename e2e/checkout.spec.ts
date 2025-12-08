import { test, expect } from '@playwright/test';

test.describe('Checkout/Pricing Flow', () => {
  test('should display pricing section on landing', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to pricing section
    await page.goto('/#pricing');
    
    // Check for pricing plans
    const starterPlan = page.getByText(/starter/i);
    const professionalPlan = page.getByText(/professional/i);
    const enterprisePlan = page.getByText(/enterprise/i);
    
    // At least one plan should be visible
    const hasPlans = await starterPlan.isVisible() || 
                     await professionalPlan.isVisible() || 
                     await enterprisePlan.isVisible();
    
    expect(hasPlans).toBeTruthy();
  });

  test('should display plan prices correctly', async ({ page }) => {
    await page.goto('/#pricing');
    
    // Check for price elements
    const priceElements = page.locator('[class*="price"], [data-price]');
    
    // Should show €129, €249, €499
    const pageContent = await page.content();
    const hasStarterPrice = pageContent.includes('129');
    const hasProfessionalPrice = pageContent.includes('249');
    
    expect(hasStarterPrice || hasProfessionalPrice).toBeTruthy();
  });

  test('should have subscription buttons on plans', async ({ page }) => {
    await page.goto('/#pricing');
    
    // Look for subscribe/select buttons
    const subscribeButtons = page.getByRole('button', { name: /elegir|suscribir|select|empezar/i });
    
    const count = await subscribeButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking plan button should trigger checkout or auth', async ({ page }) => {
    await page.goto('/#pricing');
    
    const subscribeButton = page.getByRole('button', { name: /elegir|suscribir|empezar/i }).first();
    
    if (await subscribeButton.isVisible()) {
      // Store current URL
      const currentUrl = page.url();
      
      await subscribeButton.click();
      
      // Should either open Stripe, show auth modal, or redirect
      await page.waitForTimeout(1000);
      
      // Page should respond (not freeze)
      const newUrl = page.url();
      const hasPopup = await page.context().pages().then(pages => pages.length > 1);
      
      // Either URL changed, popup opened, or modal appeared
      expect(newUrl !== currentUrl || hasPopup || await page.getByRole('dialog').isVisible().catch(() => false)).toBeTruthy();
    }
  });

  test('integrations page should be accessible', async ({ page }) => {
    await page.goto('/integraciones');
    
    // Check page loads
    await expect(page).toHaveURL(/integraciones/i);
    
    // Should show integration logos or cards
    const integrationCards = page.locator('[class*="integration"], [class*="card"]');
    const count = await integrationCards.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
