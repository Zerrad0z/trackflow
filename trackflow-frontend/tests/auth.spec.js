import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {

  test('should show login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
await expect(page.getByRole('heading', { name: 'TrackFlow' }).first()).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('your@email.com').fill('wrong@email.com')
  await page.getByPlaceholder('••••••••').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for the red error div to appear
  await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.bg-red-50')).toContainText('Invalid credentials')
})

  test('supervisor login should redirect to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('your@email.com').fill('amine@trackflow.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('admin login should redirect to users page', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('your@email.com').fill('youssef@trackflow.com')
    await page.getByPlaceholder('••••••••').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/users')
    await expect(page.getByText('User Management')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByPlaceholder('your@email.com').fill('amine@trackflow.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL('/login')
  })

})