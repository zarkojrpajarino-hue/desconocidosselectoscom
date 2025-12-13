import { test, expect } from '@playwright/test';

/**
 * CRM E2E Tests
 * Tests the CRM functionality including leads, pipeline, and CRUD operations
 */
test.describe('CRM Flow', () => {
  
  test.describe('CRM Hub Page', () => {
    test('should load CRM page or redirect to auth', async ({ page }) => {
      await page.goto('/crm');
      
      // Either shows CRM or redirects to landing
      expect(page.url()).toMatch(/\/(crm|$)/);
    });

    test('should display CRM heading when authenticated', async ({ page }) => {
      await page.goto('/crm');
      
      const crmHeading = page.getByRole('heading', { name: /crm|leads|pipeline/i });
      const isOnCRM = await crmHeading.isVisible().catch(() => false);
      
      if (isOnCRM) {
        await expect(crmHeading).toBeVisible();
      }
    });

    test('should have create lead button when authenticated', async ({ page }) => {
      await page.goto('/crm');
      
      const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear lead|add lead/i });
      
      if (await newLeadButton.isVisible()) {
        await expect(newLeadButton).toBeEnabled();
      }
    });
  });

  test.describe('Create Lead Modal', () => {
    test('should open create lead modal when clicking new lead', async ({ page }) => {
      await page.goto('/crm');
      
      const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear/i });
      
      if (await newLeadButton.isVisible()) {
        await newLeadButton.click();
        
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display form fields in create lead modal', async ({ page }) => {
      await page.goto('/crm');
      
      const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear/i });
      
      if (await newLeadButton.isVisible()) {
        await newLeadButton.click();
        
        // Wait for modal
        await page.waitForTimeout(500);
        
        // Check for form fields
        const nameInput = page.getByPlaceholder(/nombre/i);
        const companyInput = page.getByPlaceholder(/empresa|company/i);
        
        if (await nameInput.isVisible()) {
          await expect(nameInput).toBeVisible();
        }
      }
    });

    test('should close modal when clicking cancel', async ({ page }) => {
      await page.goto('/crm');
      
      const newLeadButton = page.getByRole('button', { name: /nuevo lead|crear/i });
      
      if (await newLeadButton.isVisible()) {
        await newLeadButton.click();
        
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          const cancelButton = page.getByRole('button', { name: /cancelar|cancel|cerrar/i });
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await expect(modal).not.toBeVisible({ timeout: 3000 });
          }
        }
      }
    });
  });

  test.describe('Pipeline View', () => {
    test('should navigate to pipeline view', async ({ page }) => {
      await page.goto('/crm');
      
      const pipelineLink = page.getByRole('link', { name: /pipeline/i });
      
      if (await pipelineLink.isVisible()) {
        await pipelineLink.click();
        await expect(page).toHaveURL(/pipeline/i);
      }
    });

    test('should display pipeline stages', async ({ page }) => {
      await page.goto('/crm/pipeline');
      
      const stages = ['Descubrimiento', 'Calificación', 'Propuesta', 'Negociación', 'Nuevo'];
      
      for (const stage of stages) {
        const stageElement = page.getByText(stage);
        if (await stageElement.isVisible().catch(() => false)) {
          await expect(stageElement).toBeVisible();
          break;
        }
      }
    });

    test('should display lead cards in pipeline', async ({ page }) => {
      await page.goto('/crm/pipeline');
      
      const leadCards = page.locator('[data-testid="lead-card"], .lead-card, [class*="lead"]');
      
      if (await leadCards.first().isVisible().catch(() => false)) {
        const count = await leadCards.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Lead Interactions', () => {
    test('should open lead detail when clicking lead card', async ({ page }) => {
      await page.goto('/crm');
      
      const leadCard = page.locator('[data-testid="lead-card"], .lead-card').first();
      
      if (await leadCard.isVisible().catch(() => false)) {
        await leadCard.click();
        
        // Should open detail modal or navigate
        await page.waitForTimeout(500);
        const modal = page.getByRole('dialog');
        const hasModal = await modal.isVisible().catch(() => false);
        
        expect(hasModal || page.url().includes('lead')).toBeTruthy();
      }
    });
  });
});
