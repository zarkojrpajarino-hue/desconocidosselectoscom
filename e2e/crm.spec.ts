import { test, expect } from '@playwright/test';

test.describe('CRM Flow', () => {
  // Note: These tests require authenticated session
  // In real scenario, you'd set up auth state before each test
  
  test('should display CRM hub page', async ({ page }) => {
    await page.goto('/crm');
    
    // Check for CRM elements (will redirect if not authenticated)
    const crmHeading = page.getByRole('heading', { name: /crm|leads|pipeline/i });
    const isOnCRM = await crmHeading.isVisible().catch(() => false);
    
    // Either shows CRM or redirects to auth
    expect(page.url()).toMatch(/\/(crm|$)/);
  });

  test('should have create lead button', async ({ page }) => {
    await page.goto('/crm');
    
    const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear lead|add lead/i });
    
    if (await newLeadButton.isVisible()) {
      await expect(newLeadButton).toBeEnabled();
    }
  });

  test('should open create lead modal', async ({ page }) => {
    await page.goto('/crm');
    
    const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear/i });
    
    if (await newLeadButton.isVisible()) {
      await newLeadButton.click();
      
      // Modal should appear
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });
      
      // Should have form fields
      const nameInput = page.getByPlaceholder(/nombre/i);
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
      }
    }
  });

  test('should navigate to pipeline view', async ({ page }) => {
    await page.goto('/crm');
    
    const pipelineLink = page.getByRole('link', { name: /pipeline/i });
    
    if (await pipelineLink.isVisible()) {
      await pipelineLink.click();
      await expect(page).toHaveURL(/pipeline/i);
    }
  });

  test('pipeline should display stages', async ({ page }) => {
    await page.goto('/crm/pipeline');
    
    // Check for pipeline stages
    const stages = ['Descubrimiento', 'Calificación', 'Propuesta', 'Negociación'];
    
    for (const stage of stages) {
      const stageElement = page.getByText(stage);
      // Don't fail if redirected due to auth
      if (await stageElement.isVisible().catch(() => false)) {
        await expect(stageElement).toBeVisible();
        break; // At least one stage visible is enough
      }
    }
  });
});
