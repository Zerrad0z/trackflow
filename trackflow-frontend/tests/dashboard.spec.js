import { test, expect } from '@playwright/test'

async function loginAs(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('your@email.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 })
}

test.describe('Dashboard', () => {

  test('supervisor sees dashboard with stats', async ({ page }) => {
  await loginAs(page, 'amine@trackflow.com', 'password123')
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText(/Welcome back/)).toBeVisible()
  await expect(page.getByText('Total Forms').first()).toBeVisible()
  await expect(page.getByText('Uploaded Today').first()).toBeVisible()  
  await expect(page.getByText('Pending Validation').first()).toBeVisible()
})

  test('admin redirects to users page not dashboard', async ({ page }) => {
    await loginAs(page, 'youssef@trackflow.com', 'admin123')
    await expect(page).toHaveURL('/users')
    await expect(page.getByText('User Management')).toBeVisible()
  })

  test('supervisor cannot access users page', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.goto('/users')
    // Should redirect away from users page
    await expect(page).not.toHaveURL('/users')
  })

  test('dashboard stats cards are clickable', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.getByText('Total Forms').click()
    await expect(page).toHaveURL('/forms')
  })

})

test.describe('Notifications', () => {

  test('notification bell is visible', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible()
  })

  test('can navigate to notifications page', async ({ page }) => {
  await loginAs(page, 'amine@trackflow.com', 'password123')
  await page.goto('/notifications')
  await expect(page.locator('h2').filter({ hasText: 'Notifications' })).toBeVisible()  
})

  test('can mark all notifications as read', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.goto('/notifications')
    const markAllButton = page.getByText('Mark all as read')
    if (await markAllButton.isVisible()) {
      await markAllButton.click()
      await expect(markAllButton).not.toBeVisible({ timeout: 3000 })
    }
  })

})