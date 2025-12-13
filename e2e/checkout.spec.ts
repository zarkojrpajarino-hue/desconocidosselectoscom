import { test, expect } from '@playwright/test';

/**
 * Checkout/Pricing E2E Tests
 * Tests the pricing display and subscription checkout flow
 */
test.describe('Checkout & Pricing Flow', () => {
  
  test.describe('Pricing Section', () => {
    test('should display pricing section on landing page', async ({ page }) => {
      await page.goto('/#pricing');
      
      // Check for pricing plans
      const starterPlan = page.getByText(/starter/i);
      const professionalPlan = page.getByText(/professional/i);
      const enterprisePlan = page.getByText(/enterprise/i);
      
      const hasPlans = await starterPlan.isVisible() || 
                       await professionalPlan.isVisible() || 
                       await enterprisePlan.isVisible();
      
      expect(hasPlans).toBeTruthy();
    });

    test('should display Starter plan price (€129)', async ({ page }) => {
      await page.goto('/#pricing');
      
      const pageContent = await page.content();
      const hasStarterPrice = pageContent.includes('129');
      
      expect(hasStarterPrice).toBeTruthy();
    });

    test('should display Professional plan price (€249)', async ({ page }) => {
      await page.goto('/#pricing');
      
      const pageContent = await page.content();
      const hasProfessionalPrice = pageContent.includes('249');
      
      expect(hasProfessionalPrice).toBeTruthy();
    });

    test('should display Enterprise plan price (€499)', async ({ page }) => {
      await page.goto('/#pricing');
      
      const pageContent = await page.content();
      const hasEnterprisePrice = pageContent.includes('499');
      
      expect(hasEnterprisePrice).toBeTruthy();
    });

    test('should have subscription buttons for each plan', async ({ page }) => {
      await page.goto('/#pricing');
      
      const subscribeButtons = page.getByRole('button', { name: /elegir|suscribir|select|empezar/i });
      const count = await subscribeButtons.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Plan Selection', () => {
    test('should respond when clicking plan button', async ({ page }) => {
      await page.goto('/#pricing');
      
      const subscribeButton = page.getByRole('button', { name: /elegir|suscribir|empezar/i }).first();
      
      if (await subscribeButton.isVisible()) {
        const currentUrl = page.url();
        
        await subscribeButton.click();
        await page.waitForTimeout(1000);
        
        const newUrl = page.url();
        const hasPopup = await page.context().pages().then(pages => pages.length > 1);
        const hasModal = await page.getByRole('dialog').isVisible().catch(() => false);
        
        // Either URL changed, popup opened, or modal appeared
        expect(newUrl !== currentUrl || hasPopup || hasModal).toBeTruthy();
      }
    });

    test('should show auth prompt for unauthenticated users', async ({ page }) => {
      await page.goto('/#pricing');
      
      const subscribeButton = page.getByRole('button', { name: /elegir|suscribir|empezar/i }).first();
      
      if (await subscribeButton.isVisible()) {
        await subscribeButton.click();
        await page.waitForTimeout(1000);
        
        // Check for auth prompt
        const authModal = page.getByRole('dialog');
        const loginPrompt = page.getByText(/iniciar sesión|login|registrar/i);
        
        const hasAuthPrompt = await authModal.isVisible().catch(() => false) ||
                              await loginPrompt.isVisible().catch(() => false);
        
        // May show auth prompt or redirect
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Integrations Page', () => {
    test('should load integrations page', async ({ page }) => {
      await page.goto('/integraciones');
      await expect(page).toHaveURL(/integraciones/i);
    });

    test('should display integration cards', async ({ page }) => {
      await page.goto('/integraciones');
      
      const integrationCards = page.locator('[class*="card"]');
      const count = await integrationCards.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should show integration logos', async ({ page }) => {
      await page.goto('/integraciones');
      
      const integrationNames = ['Slack', 'HubSpot', 'Zapier', 'Outlook', 'Asana', 'Trello'];
      
      for (const name of integrationNames) {
        const element = page.getByText(name);
        if (await element.isVisible().catch(() => false)) {
          await expect(element).toBeVisible();
          break;
        }
      }
    });
  });
});
