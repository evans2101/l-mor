import { test, expect } from '@playwright/test'

test('home swaps blurred scenes in one viewport; nested controls and navigation remain usable', async ({
  page,
}) => {
  test.setTimeout(60000)
  const scene = async (name: string) => {
    await expect(page.locator('.experience-fixed')).toHaveAttribute(
      'data-active-scene',
      name,
    )
    await expect(page.locator('.experience-fixed')).toHaveAttribute(
      'data-transitioning',
      'false',
      { timeout: 15000 },
    )
    expect(await page.evaluate(() => scrollY)).toBe(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true)
  }
  await page.goto('/')
  await scene('intro')
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  await page.mouse.move(600, 400)
  await page.mouse.wheel(0, 600)
  await scene('studio')
  await expect(
    nav.getByRole('link', { name: '5D Studio', exact: true }),
  ).toHaveAttribute('aria-current', 'location')
  await expect(page.locator('#intro')).toHaveAttribute('inert', '')
  await expect(page.locator('#intro')).toBeHidden()
  const grid = page.locator('.wardrobe-grid')
  const box = await grid.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.wheel(0, 320)
  await expect
    .poll(() => grid.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  await scene('studio')
  await nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }).click()
  await scene('about')
  await expect(
    nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }),
  ).toHaveAttribute('aria-current', 'location')
  await nav.getByRole('link', { name: 'Beranda', exact: true }).click()
  await scene('intro')
  await page.locator('main').focus()
  await page.keyboard.press('PageDown')
  await scene('studio')
  await page.keyboard.press('PageUp')
  await scene('intro')
  await nav.getByRole('link', { name: '5D Studio', exact: true }).click()
  await nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }).click()
  await scene('about')
  await nav.getByRole('link', { name: 'Koleksi', exact: false }).click()
  await expect(page).toHaveURL(/catalog/)
  await expect(page.locator('.catalog-page')).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY))
    .not.toBe('hidden')
  await nav.getByRole('link', { name: '5D Studio', exact: true }).click()
  await scene('studio')
})

test('mobile swipe changes scenes without moving the document', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  await page.goto('/')
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 340, y: 590 }],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 340, y: 280 }],
  })
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await expect(page.locator('.experience-fixed')).toHaveAttribute(
    'data-active-scene',
    'studio',
  )
  await expect(page.locator('.experience-fixed')).toHaveAttribute(
    'data-transitioning',
    'false',
    { timeout: 15000 },
  )
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await context.close()
})

test('studio → personalized outfit → lookbook → persistent bag → demo summary', async ({
  page,
}) => {
  test.setTimeout(60000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Explore 5D Studio' }).click()
  await expect(page.locator('#studio canvas')).toBeVisible({ timeout: 15000 })
  await expect(page.locator('#studio .avatar[data-ready="true"]')).toBeVisible({
    timeout: 20000,
  })
  await page
    .getByRole('button', {
      name: 'Pakai Cloud Relaxed Hoodie',
      exact: true,
    })
    .click()
  await page.getByRole('button', { name: 'Celana 06', exact: true }).click()
  await page
    .getByRole('button', { name: 'Pakai Original Straight Denim', exact: true })
    .click()
  await page.getByRole('button', { name: 'Female', exact: true }).click()
  await page.getByRole('button', { name: 'Skin tone 6', exact: true }).click()
  await page
    .getByRole('spinbutton', { name: 'Tinggi badan', exact: true })
    .fill('162')
  await page
    .getByRole('spinbutton', { name: 'Berat badan', exact: true })
    .fill('58')
  await page.getByRole('button', { name: 'Washed black', exact: true }).click()
  await page.locator('#studio-size').selectOption('L')
  await expect(page.locator('#studio .canvas-host')).toHaveAttribute(
    'aria-label',
    /perempuan, tinggi 162 cm, berat 58 kg/,
  )
  await page.getByRole('button', { name: 'Samping', exact: true }).click()
  await page
    .getByRole('button', { name: 'Perbesar avatar', exact: true })
    .click()
  await page.getByRole('button', { name: 'Saya suka', exact: true }).click()
  await page.getByRole('button', { name: 'Buka lookbook', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Cloud Relaxed Hoodie')
  await page
    .getByRole('button', { name: 'Pakai look ini', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Belanja look ini', exact: true })
    .click()
  await expect(page).toHaveURL(/cart/)
  await expect(page.locator('.cart-item')).toHaveCount(2)
  await expect(page.locator('.summary-total')).toContainText('878.000')
  await page
    .getByRole('textbox', { name: 'A little treat? Pakai kode promo.' })
    .fill('lmor10')
  await page.getByRole('button', { name: 'Pakai', exact: true }).click()
  await expect(page.locator('.summary-total')).toContainText('790.200')
  await page
    .getByRole('button', {
      name: 'Tambah Cloud Relaxed Hoodie',
      exact: true,
    })
    .click()
  await expect(page.locator('.summary-total')).toContainText('1.176.300')
  await page.reload()
  await expect(
    page.locator('.cart-item').first().locator('.quantity'),
  ).toContainText('2')
  await expect(page.locator('.summary-total')).toContainText('1.307.000')
  await page
    .getByRole('button', { name: 'Lanjut ke checkout', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toContainText(
    'Tidak ada transaksi yang dilakukan.',
  )
  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('button', { name: 'Unduh ringkasan bag', exact: true })
    .click()
  expect((await downloadPromise).suggestedFilename()).toBe('LMOR-bag-demo.txt')
  await page
    .getByRole('button', { name: 'Kembali ke bag', exact: true })
    .click()
  await page
    .getByRole('button', {
      name: 'Hapus Cloud Relaxed Hoodie',
      exact: true,
    })
    .click()
  await page
    .getByRole('button', { name: 'Hapus Original Straight Denim', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'A little room for your next look.' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('catalog filters, favorites, variants and quick add', async ({ page }) => {
  await page.goto('/#/catalog')
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(9)
  await page
    .getByRole('button', { name: 'Lihat lebih banyak', exact: true })
    .click()
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(12)
  await page.getByRole('textbox', { name: 'Cari produk' }).fill('denim')
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(2)
  await page
    .getByRole('button', {
      name: 'Simpan Original Straight Denim ke favorit',
      exact: true,
    })
    .click()
  await page
    .getByRole('checkbox', { name: 'Hanya favorit saya', exact: true })
    .check()
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Lihat detail', exact: true }).click()
  await page.getByRole('button', { name: 'Vintage blue', exact: true }).click()
  await page.getByRole('button', { name: 'XL', exact: true }).click()
  await page.getByRole('button', { name: 'Tambah ke bag', exact: true }).click()
  await page
    .getByRole('link', { name: 'Shopping bag, 1 produk', exact: true })
    .click()
  await expect(page.locator('.cart-variant')).toContainText('Vintage blue')
  await expect(page.locator('.cart-variant')).toContainText('XL')
  await expect(page.locator('.summary-total')).toContainText('469.000')
})

test('corrupt local storage recovers without a blank screen', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('lmor-studio-v1', '{bad json'))
  await page.reload()
  await expect(page.getByRole('heading', { name: /GAYA KAMU/ })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Shopping bag, 0 produk', exact: true }),
  ).toBeVisible()
})

test('all pages fit narrow, mobile, tablet and desktop viewports', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [320, 390, 540, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/#/catalog', '/#/cart']) {
      await page.goto(route)
      await expect(page.locator('.header')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow at ${width}px ${route}`,
      ).toBe(true)
      if (route === '/') {
        await page
          .getByRole('button', { name: 'THE STUDIO', exact: true })
          .click()
        await expect(page.locator('.experience-fixed')).toHaveAttribute(
          'data-active-scene',
          'studio',
        )
        await expect(page.locator('.experience-fixed')).toHaveAttribute(
          'data-transitioning',
          'false',
          { timeout: 15000 },
        )
        const grid = await page.locator('.wardrobe-grid').boundingBox(),
          controls = await page.locator('.garment-controls').boundingBox()
        expect(
          grid!.y + grid!.height,
          `wardrobe overlap at ${width}px`,
        ).toBeLessThanOrEqual(controls!.y + 1)
      }
    }
  }
  expect(errors).toEqual([])
})

test('mobile: menu, live canvas changes, catalog filter and cart', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click()
  await page
    .locator('.nav')
    .getByRole('link', { name: '5D Studio', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Buka navigasi', exact: true }),
  ).toBeVisible()
  const canvas = page.locator('#studio canvas')
  await page.locator('#studio .avatar-view').scrollIntoViewIfNeeded()
  await expect(canvas).toBeVisible()
  await expect(page.locator('#studio .avatar[data-ready="true"]')).toBeVisible({
    timeout: 20000,
  })
  await expect(page.getByText('Model manusia belum tersedia')).toHaveCount(0)
  const before = await canvas.screenshot()
  await page.getByRole('button', { name: 'Skin tone 6', exact: true }).click()
  await expect
    .poll(async () => (await canvas.screenshot()).equals(before))
    .toBe(false)
  await page
    .getByRole('spinbutton', { name: 'Berat badan', exact: true })
    .fill('110')
  await expect(page.locator('#studio .canvas-host')).toHaveAttribute(
    'aria-label',
    /berat 110 kg/,
  )
  await page
    .getByRole('button', { name: 'Belanja look ini', exact: true })
    .click()
  await expect(page.locator('.cart-item')).toHaveCount(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  await page
    .getByRole('link', { name: 'Lanjut eksplorasi', exact: true })
    .click()
  await page.getByRole('button', { name: 'Filter', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Cari produk', exact: true })
    .fill('hoodie')
  await expect(page.locator('.catalog-grid .product-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Lihat detail', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('critical WCAG checks on home, catalog, populated bag and product dialog', async ({
  page,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  for (const route of ['/', '/#/catalog']) {
    await page.goto(route)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([])
  }
  await page
    .getByRole('button', { name: 'Lihat detail', exact: true })
    .first()
    .click()
  const dialogResult = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    dialogResult.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  await page.getByRole('button', { name: 'Tambah ke bag', exact: true }).click()
  await page
    .getByRole('link', { name: 'Shopping bag, 1 produk', exact: true })
    .click()
  const cartResult = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    cartResult.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
})
