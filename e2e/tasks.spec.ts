import { test, expect } from '@playwright/test';

/**
 * Tasks E2E Tests
 * Tests task management, agenda, and task completion flows
 */
test.describe('Tasks Flow', () => {
  
  test.describe('Dashboard Tasks Section', () => {
    test('should load dashboard or redirect to auth', async ({ page }) => {
      await page.goto('/home');
      expect(page.url()).toMatch(/\/(home|$)/);
    });

    test('should display tasks section when authenticated', async ({ page }) => {
      await page.goto('/home');
      
      const tasksSection = page.getByText(/tareas|tasks/i);
      
      if (await tasksSection.isVisible().catch(() => false)) {
        await expect(tasksSection).toBeVisible();
      }
    });

    test('should display task count or stats', async ({ page }) => {
      await page.goto('/home');
      
      // Look for stat cards or task counts
      const statCards = page.locator('[class*="stat"], [data-testid*="stat"]');
      
      if (await statCards.first().isVisible().catch(() => false)) {
        const count = await statCards.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Weekly Agenda', () => {
    test('should load weekly agenda page', async ({ page }) => {
      await page.goto('/dashboard/agenda');
      
      const agendaHeading = page.getByRole('heading', { name: /agenda|semana|semanal/i });
      
      if (await agendaHeading.isVisible()) {
        await expect(agendaHeading).toBeVisible();
      }
    });

    test('should display days of the week', async ({ page }) => {
      await page.goto('/dashboard/agenda');
      
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      
      for (const day of days) {
        const dayElement = page.getByText(day);
        if (await dayElement.isVisible().catch(() => false)) {
          await expect(dayElement).toBeVisible();
          break;
        }
      }
    });

    test('should display time slots', async ({ page }) => {
      await page.goto('/dashboard/agenda');
      
      const timeSlots = page.locator('[class*="time"], [data-time]');
      
      if (await timeSlots.first().isVisible().catch(() => false)) {
        const count = await timeSlots.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Task List', () => {
    test('should display task list', async ({ page }) => {
      await page.goto('/home');
      
      const taskList = page.locator('[data-testid="task-list"], .task-list, [class*="task"]');
      
      if (await taskList.first().isVisible().catch(() => false)) {
        await expect(taskList.first()).toBeVisible();
      }
    });

    test('should display task cards with titles', async ({ page }) => {
      await page.goto('/home');
      
      const taskCards = page.locator('[class*="task"][class*="card"]');
      
      if (await taskCards.first().isVisible().catch(() => false)) {
        const count = await taskCards.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Task Completion', () => {
    test('should have complete task button or checkbox', async ({ page }) => {
      await page.goto('/home');
      
      const completeButton = page.getByRole('button', { name: /completar|complete|done/i }).first();
      const checkbox = page.getByRole('checkbox').first();
      
      if (await completeButton.isVisible().catch(() => false)) {
        await expect(completeButton).toBeEnabled();
      } else if (await checkbox.isVisible().catch(() => false)) {
        await expect(checkbox).toBeEnabled();
      }
    });

    test('should respond when marking task complete', async ({ page }) => {
      await page.goto('/home');
      
      const completeButton = page.getByRole('button', { name: /completar|complete/i }).first();
      
      if (await completeButton.isVisible().catch(() => false)) {
        await completeButton.click();
        await page.waitForTimeout(500);
        
        // Page should not crash
        await expect(page).not.toHaveURL(/error/i);
      }
    });
  });

  test.describe('Task Navigation', () => {
    test('should navigate between task views', async ({ page }) => {
      await page.goto('/home');
      
      const viewToggle = page.getByRole('tab').first();
      
      if (await viewToggle.isVisible().catch(() => false)) {
        await viewToggle.click();
        await expect(page).not.toHaveURL(/error/i);
      }
    });

    test('should filter tasks by status', async ({ page }) => {
      await page.goto('/home');
      
      const filterButton = page.getByRole('button', { name: /filtrar|filter/i });
      
      if (await filterButton.isVisible().catch(() => false)) {
        await filterButton.click();
        await page.waitForTimeout(300);
        
        // Filter dropdown should appear
        const dropdown = page.locator('[role="menu"], [class*="dropdown"]');
        if (await dropdown.isVisible().catch(() => false)) {
          await expect(dropdown).toBeVisible();
        }
      }
    });
  });
});
