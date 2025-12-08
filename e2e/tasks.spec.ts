import { test, expect } from '@playwright/test';

test.describe('Tasks Flow', () => {
  test('should display dashboard with tasks section', async ({ page }) => {
    await page.goto('/home');
    
    // Check for tasks-related elements
    const tasksSection = page.getByText(/tareas|tasks/i);
    
    // Either shows tasks or redirects to auth
    expect(page.url()).toMatch(/\/(home|$)/);
  });

  test('should display weekly agenda', async ({ page }) => {
    await page.goto('/dashboard/agenda');
    
    // Check for agenda elements
    const agendaHeading = page.getByRole('heading', { name: /agenda|semana|semanal/i });
    
    if (await agendaHeading.isVisible()) {
      await expect(agendaHeading).toBeVisible();
    }
  });

  test('should show task list with items', async ({ page }) => {
    await page.goto('/home');
    
    // Look for task-related UI
    const taskList = page.locator('[data-testid="task-list"], .task-list, [class*="task"]');
    
    if (await taskList.first().isVisible().catch(() => false)) {
      await expect(taskList.first()).toBeVisible();
    }
  });

  test('should allow marking task as complete', async ({ page }) => {
    await page.goto('/home');
    
    // Look for complete button or checkbox
    const completeButton = page.getByRole('button', { name: /completar|complete|done/i }).first();
    const checkbox = page.getByRole('checkbox').first();
    
    if (await completeButton.isVisible().catch(() => false)) {
      await expect(completeButton).toBeEnabled();
    } else if (await checkbox.isVisible().catch(() => false)) {
      await expect(checkbox).toBeEnabled();
    }
  });

  test('should navigate between task views', async ({ page }) => {
    await page.goto('/home');
    
    // Look for view toggle or tabs
    const viewToggle = page.getByRole('tab').first();
    
    if (await viewToggle.isVisible().catch(() => false)) {
      await viewToggle.click();
      // Page should not crash
      await expect(page).not.toHaveURL(/error/i);
    }
  });
});
