import { test, expect } from '@playwright/test'

test('header smoothly navigates sections, repeats clicks and follows manual scrolling', async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.goto('/')
  await expect(
    page.locator('.story-model .avatar[data-ready="true"]'),
  ).toBeVisible({ timeout: 20000 })
  await expect(page.locator('html')).toHaveClass(/lenis/)
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarWidth,
    ),
  ).toBe('none')
  await page.evaluate(() => {
    const samples: number[] = []
    ;(window as unknown as { scrollSamples: number[] }).scrollSamples = samples
    window.addEventListener('scroll', () => samples.push(scrollY), {
      passive: true,
    })
  })
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' })
  await nav.getByRole('link', { name: '5D Studio', exact: true }).click()
  await expect
    .poll(
      () =>
        page
          .locator('#studio')
          .evaluate((el) => Math.round(el.getBoundingClientRect().top) || 0),
      { timeout: 15000 },
    )
    .toBe(115)
  await expect(
    nav.getByRole('link', { name: '5D Studio', exact: true }),
  ).toHaveAttribute('aria-current', 'location')
  await expect
    .poll(() =>
      page
        .locator('.studio-wipe')
        .evaluate((el) => el.getBoundingClientRect().bottom <= 0),
    )
    .toBe(true)
  await nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }).click()
  await expect
    .poll(
      () =>
        page
          .locator('#about')
          .evaluate((el) => Math.round(el.getBoundingClientRect().top) || 0),
      { timeout: 15000 },
    )
    .toBe(0)
  await expect(
    nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }),
  ).toHaveAttribute('aria-current', 'location')
  await expect
    .poll(() =>
      page
        .locator('.beyond-wipe')
        .evaluate((el) => el.getBoundingClientRect().bottom <= 0),
    )
    .toBe(true)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(
    nav.getByRole('link', { name: 'Beranda', exact: true }),
  ).toHaveAttribute('aria-current', 'location')
  // The URL still points to about; clicking it again must still scroll.
  await nav.getByRole('link', { name: 'Tentang L’MOR', exact: true }).click()
  await expect
    .poll(
      () =>
        page
          .locator('#about')
          .evaluate((el) => Math.round(el.getBoundingClientRect().top) || 0),
      { timeout: 15000 },
    )
    .toBe(0)
  const samples = await page.evaluate(
    () => (window as unknown as { scrollSamples: number[] }).scrollSamples,
  )
  expect(new Set(samples).size).toBeGreaterThan(4)
  expect(samples.some((y) => y > 100 && y < 1500)).toBe(true)
  await nav.getByRole('link', { name: 'Koleksi', exact: false }).click()
  await expect(page).toHaveURL(/catalog/)
  await nav.getByRole('link', { name: '5D Studio', exact: true }).click()
  await expect
    .poll(
      () =>
        page
          .locator('#studio')
          .evaluate((el) => Math.round(el.getBoundingClientRect().top) || 0),
      { timeout: 15000 },
    )
    .toBe(115)
  await nav.getByRole('link', { name: 'Beranda', exact: true }).click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await page.mouse.move(600, 500)
  await page.mouse.wheel(0, 600)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
  await expect(page.locator('html')).not.toHaveClass(/lenis-scrolling/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(510)
  expect(
    await page
      .locator('.story-pin')
      .evaluate((el) => Math.round(el.getBoundingClientRect().top) || 0),
  ).toBe(0)
  expect(
    await page
      .locator('.story-heading')
      .evaluate((el) => Number(getComputedStyle(el).opacity)),
  ).toBeLessThan(1)
  // Stopping between chapters must never leave a transition covering the UI.
  await page.evaluate(() =>
    window.scrollTo({
      top: document.getElementById('studio')!.offsetTop - innerHeight * 0.1,
      behavior: 'instant',
    }),
  )
  await expect
    .poll(
      () =>
        page.locator('.studio-wipe').evaluate((el) => {
          const rect = el.getBoundingClientRect()
          return rect.bottom <= 0 || rect.top >= innerHeight
        }),
      { timeout: 15000 },
    )
    .toBe(true)
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
  await canvas.scrollIntoViewIfNeeded()
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
