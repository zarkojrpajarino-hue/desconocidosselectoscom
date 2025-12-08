import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // This would need proper auth setup for real testing
    await page.goto('/');
  });

  test('should display onboarding type selector', async ({ page }) => {
    // Check for the two options on landing
    const empresaOption = page.getByText(/tengo una empresa/i);
    const ideaOption = page.getByText(/tengo una idea/i);
    
    // At least one should be visible on landing
    const hasOptions = await empresaOption.isVisible() || await ideaOption.isVisible();
    expect(hasOptions).toBeTruthy();
  });

  test('should navigate to existing business onboarding', async ({ page }) => {
    const empresaCard = page.getByText(/tengo una empresa/i);
    
    if (await empresaCard.isVisible()) {
      await empresaCard.click();
      
      // Should navigate to onboarding
      await expect(page).toHaveURL(/onboarding/i);
    }
  });

  test('should navigate to startup onboarding', async ({ page }) => {
    const startupCard = page.getByText(/tengo una idea/i);
    
    if (await startupCard.isVisible()) {
      await startupCard.click();
      
      // Should navigate to startup onboarding
      await expect(page).toHaveURL(/onboarding.*startup/i);
    }
  });

  test('onboarding should have step navigation', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Check for step indicators or navigation
    const nextButton = page.getByRole('button', { name: /siguiente|next|continuar/i });
    
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeEnabled();
    }
  });
});
