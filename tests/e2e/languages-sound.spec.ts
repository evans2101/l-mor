import { expect, test } from '@playwright/test'

test('local languages persist through catalog, product details and cart', async ({
  page,
}) => {
  const errors: string[] = []
  const remoteRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:5173'))
      remoteRequests.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('.language-select').selectOption('en')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    'YOUR STYLE. Your rules.',
  )
  await page.locator('.language-select').selectOption('zh')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await page.goto('/#/catalog')
  await page.getByRole('textbox', { name: '搜索商品' }).fill('牛仔')
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(2)
  await page.locator('.product-image-btn').first().click()
  await expect(page.locator('dialog')).toContainText('尺码')
  await page.getByRole('button', { name: '加入购物袋', exact: true }).click()
  await page
    .getByRole('link', { name: '购物袋，共 1 件商品', exact: true })
    .click()
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await expect(page.locator('.cart-item')).toContainText('牛仔裤')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('.cart-item')).toHaveCount(1)
  await page.locator('.language-select').selectOption('en')
  await page.getByRole('button', { name: 'Continue to checkout' }).click()
  await expect(page.locator('dialog')).toContainText(
    'No transaction takes place.',
  )
  expect(errors).toEqual([])
  expect(remoteRequests).toEqual([])
})

test('typing, activated multilingual narration and smooth transition audio clean up correctly', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const tracking = {
      speech: [] as { text: string; lang: string }[],
      cancellations: 0,
      transitions: 0,
      contexts: [] as AudioContext[],
    }
    Object.assign(window, { __lmorAudio: tracking })
    speechSynthesis.speak = (speech) => {
      tracking.speech.push({ text: speech.text, lang: speech.lang })
    }
    speechSynthesis.cancel = () => {
      tracking.cancellations++
    }
    const NativeAudioContext = window.AudioContext
    window.AudioContext = class extends NativeAudioContext {
      constructor() {
        super()
        tracking.contexts.push(this)
      }
      createBufferSource() {
        tracking.transitions++
        return super.createBufferSource()
      }
    }
  })
  const audio = () =>
    page.evaluate(() => {
      const value = (
        window as unknown as {
          __lmorAudio: {
            speech: { text: string; lang: string }[]
            cancellations: number
            transitions: number
            contexts: AudioContext[]
          }
        }
      ).__lmorAudio
      return {
        ...value,
        contexts: value.contexts.map((context) => context.state),
      }
    })
  await page.goto('/')
  await expect(page.locator('.typing-heading')).toHaveAttribute(
    'data-typing',
    'false',
    { timeout: 15000 },
  )
  expect((await audio()).speech).toHaveLength(0)
  expect((await audio()).contexts).toHaveLength(0)
  await page.getByRole('button', { name: 'Aktifkan suara' }).click()
  await expect.poll(async () => (await audio()).speech.at(-1)?.lang).toBe('id')
  await page.locator('.language-select').selectOption('zh')
  await expect
    .poll(async () => (await audio()).speech.at(-1)?.lang)
    .toBe('zh-CN')
  await page.locator('.chapter-dock button').nth(2).click()
  await expect.poll(async () => (await audio()).transitions).toBe(1)
  expect((await audio()).cancellations).toBeGreaterThan(0)
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.getByRole('button', { name: '关闭声音' }).click()
  await expect.poll(async () => (await audio()).contexts[0]).toBe('suspended')
  await page.locator('.chapter-dock button').first().click()
  await expect(page.locator('.experience-home')).toHaveAttribute(
    'data-transitioning',
    'false',
  )
  expect((await audio()).transitions).toBe(1)
  expect((await audio()).speech).toHaveLength(2)
})

test('all languages keep header controls and content inside mobile and desktop viewports', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/cart')
  await expect(page.locator('.cart-page')).toBeVisible()
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const locale of ['id', 'en', 'zh']) {
      await page.locator('.language-select').selectOption(locale)
      await expect(page.locator('.language-select')).toBeInViewport()
      await expect(page.locator('.sound-toggle')).toBeInViewport()
      const fits = await page.locator('.header').evaluate((element) =>
        [...element.querySelectorAll('a,button,select')]
          .filter((item) => (item as HTMLElement).offsetParent !== null)
          .every((item) => {
            const rect = item.getBoundingClientRect()
            return rect.left >= 0 && rect.right <= innerWidth + 1
          }),
      )
      expect(fits, `header ${width}px ${locale}`).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `cart ${width}px ${locale}`,
      ).toBe(true)
    }
  }
})
