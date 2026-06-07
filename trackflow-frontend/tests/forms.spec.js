import { test, expect } from '@playwright/test'

async function loginAs(page, email, password) {
  await page.goto('/login')
  await page.getByPlaceholder('your@email.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 })
}

test.describe('Forms', () => {

  test('supervisor can see forms list', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.goto('/forms')
    await expect(page.locator('h2').filter({ hasText: 'Forms' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload Form' })).toBeVisible()
  })

  test('supervisor cannot see export button', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.goto('/forms')
    await expect(page.getByRole('button', { name: /Export Excel/i })).not.toBeVisible()
  })

  test('supervisor can navigate to form detail', async ({ page }) => {
    await loginAs(page, 'amine@trackflow.com', 'password123')
    await page.goto('/forms')
    await page.getByRole('button', { name: 'View' }).first().click()
    await expect(page.getByText('Back to Forms')).toBeVisible()
    await expect(page.getByText('Form Fields')).toBeVisible()
    await expect(page.getByText('AI Validation')).toBeVisible()
  })

  test('manager can see export button', async ({ page }) => {
    await loginAs(page, 'manager@trackflow.com', 'manager123')
    await page.goto('/forms')
    await expect(page.getByRole('button', { name: /Export Excel/i })).toBeVisible()
  })

  test('manager can see filters', async ({ page }) => {
    await loginAs(page, 'manager@trackflow.com', 'manager123')
    await page.goto('/forms')
    await expect(page.getByText('Filters')).toBeVisible()
  })

})