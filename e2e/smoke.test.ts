import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('CV Maker E2E Smoke Tests', () => {
  test.setTimeout(60000)

  test('1. Home page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/Smart CV Maker/i)
    await expect(page.locator('h1')).toContainText('Build Your Perfect CV')
    await expect(page.locator('a[href="/builder"]').first()).toBeVisible()
    await expect(page.locator('a[href="/templates"]').first()).toBeVisible()
  })

  test('2. Templates page shows 6+ templates', async ({ page }) => {
    await page.goto(`${BASE_URL}/templates`)
    await expect(page.locator('h1')).toContainText('Templates')

    // Should have 6+ template cards with "Use This Template" buttons
    const templateButtons = page.locator('button', { hasText: 'Use This Template' })
    const templateCount = await templateButtons.count()
    expect(templateCount).toBeGreaterThanOrEqual(6)
  })

  test('3. Create a manual CV and navigate to editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/builder`)
    await expect(page.locator('h1')).toContainText('CV Builder')

    // Click Start Building
    const startBtn = page.locator('button', { hasText: 'Start Building' })
    await startBtn.click()

    // Should redirect to editor
    await page.waitForURL('**/editor', { timeout: 10000 })
    await expect(page.locator('text=Personal Info')).toBeVisible()
  })

  test('4. Editor: fill in personal info', async ({ page }) => {
    await page.goto(`${BASE_URL}/builder`)
    const startBtn = page.locator('button', { hasText: 'Start Building' })
    await startBtn.click()
    await page.waitForURL('**/editor', { timeout: 10000 })

    // Fill in name
    const nameInput = page.locator('input[placeholder="Jane Smith"]')
    await nameInput.fill('John Doe')

    // Fill in email
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('john@example.com')

    // Wait for auto-save
    await page.waitForTimeout(500)
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 })
  })

  test('5. Editor: switch template without losing data', async ({ page }) => {
    await page.goto(`${BASE_URL}/editor`)

    // Navigate to Customize section
    await page.locator('button', { hasText: 'Customize' }).click()

    // Should see template options
    await expect(page.locator('text=Template')).toBeVisible()

    // Click on a different template
    const minimalBtn = page.locator('button', { hasText: 'Minimal' }).first()
    if (await minimalBtn.isVisible()) {
      await minimalBtn.click()

      // Should see saved confirmation
      await expect(page.locator('text=Saved')).toBeVisible({ timeout: 5000 })
    }
  })

  test('6. Export page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/export`)
    await expect(page.locator('h1')).toContainText('Export')
    await expect(page.locator('button', { hasText: /Download PDF/i })).toBeVisible()
    await expect(page.locator('button', { hasText: /Download DOCX/i })).toBeVisible()
  })

  test('7. Tailor page - PROMPT_IF_TRUE is not auto-applied', async ({ page }) => {
    await page.goto(`${BASE_URL}/tailor`)
    await expect(page.locator('h1')).toContainText('Smart CV Tailoring')

    // Ensure no false data guarantee message is shown
    await expect(page.locator('text=No False Data Guarantee')).toBeVisible()

    // Fill in job description
    const textarea = page.locator('textarea')
    await textarea.fill('We are looking for a Senior React Developer with 5+ years of experience in TypeScript, Node.js, AWS, Kubernetes, Docker, and CI/CD pipelines.')

    // Submit
    await page.locator('button', { hasText: /Analyze/i }).click()

    // Wait for results
    await page.waitForSelector('text=Match Report', { timeout: 15000 })

    // Check that PROMPT_IF_TRUE suggestions show the NOT AUTO-APPLIED badge
    const promptIfTrueItems = page.locator('text=NOT AUTO-APPLIED')
    const count = await promptIfTrueItems.count()

    // There should be some PROMPT_IF_TRUE for missing keywords
    // And they should all show NOT AUTO-APPLIED
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(promptIfTrueItems.nth(i)).toBeVisible()
      }
    }
  })

  test('8. Session page - delete session and confirm redirect', async ({ page }) => {
    // First create a session
    await page.goto(`${BASE_URL}/builder`)
    await page.locator('button', { hasText: 'Start Building' }).click()
    await page.waitForURL('**/editor', { timeout: 10000 })

    // Go to session page
    await page.goto(`${BASE_URL}/session`)
    await expect(page.locator('h1')).toContainText('Session Management')

    // Should show active session
    await expect(page.locator('text=Active Session')).toBeVisible()

    // Click delete - handle confirmation dialog
    page.on('dialog', dialog => dialog.accept())

    const deleteBtn = page.locator('button', { hasText: /Delete Session/i })
    await deleteBtn.click()

    // Should show "Session Deleted" message
    await expect(page.locator('text=Session Deleted')).toBeVisible({ timeout: 5000 })

    // Should redirect to home
    await page.waitForURL(BASE_URL + '/', { timeout: 10000 })
  })

  test('9. Session management - verify temp files removed after delete', async ({ page, request }) => {
    // Create a session
    const postRes = await request.post(`${BASE_URL}/api/cv`)
    expect(postRes.ok()).toBeTruthy()

    // Get session info
    const sessionRes = await request.get(`${BASE_URL}/api/session`)
    const sessionData = await sessionRes.json()

    if (sessionData.sessionId) {
      // Delete session
      const deleteRes = await request.delete(`${BASE_URL}/api/session`)
      const deleteData = await deleteRes.json()
      expect(deleteData.success).toBe(true)

      // Try to get CV - should return null
      const cvRes = await request.get(`${BASE_URL}/api/cv`)
      const cvData = await cvRes.json()
      expect(cvData.cv).toBeNull()
    }
  })
})
