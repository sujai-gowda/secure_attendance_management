import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display home page content', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: /blockendance/i })).toBeVisible()
  })

  test('should navigate to records page', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('link', { name: /view records/i }).click()
    
    await expect(page).toHaveURL(/.*records/)
  })
})

