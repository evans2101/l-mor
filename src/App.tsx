import {
  useLocale,
  getDictionary,
  setLocale,
  isLocale,
  translateNode as tn,
  translateText as tt,
} from './i18n'
import { setSoundEnabled, useSound } from './sound'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Heart,
  Info,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { imageUrl, money, productById, products, type Product } from './data'
import { itemKey, totals, useStore } from './state'
import ExperienceHome from './components/ExperienceHome'
import { ProductCard, ProductDialog } from './components/Product'
import Dialog from './components/Dialog'
import { scrollToSection, useHomeSection } from './navigation'
import { scrollSmoothlyTo, useSmoothScroll } from './smoothScroll'
import { brandSymbolUrl } from './brand'
function Brand() {
  useLocale()
  return (
    <span className="brand" aria-hidden="true">
      <img
        className="brand-symbol"
        src={brandSymbolUrl}
        alt={tt('')}
        width="667"
        height="490"
      />
      <span>{tn('L\u2019MOR')}</span>
    </span>
  )
}
function Header() {
  const locale = useLocale()
  const sound = useSound()
  const { state } = useStore(),
    location = useLocation(),
    [menu, setMenu] = useState(false)
  const count = state.cart.reduce((n, x) => n + x.quantity, 0)
  const section = useHomeSection()
  useEffect(() => setMenu(false), [location])
  useEffect(() => {
    if (!menu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menu])
  return (
    <>
      <header className="header">
        <Link to="/" aria-label={tt('L’MOR beranda')}>
          <Brand />
        </Link>
        <nav
          className={menu ? 'nav open' : 'nav'}
          aria-label={tt('Navigasi utama')}
          onClick={() => setMenu(false)}
        >
          <Link
            to="/"
            className={section === 'intro' ? 'active' : ''}
            aria-current={section === 'intro' ? 'location' : undefined}
          >
            {tn('Beranda')}
          </Link>
          <NavLink to="/catalog">
            {tn('Koleksi ')}
            <span className="nav-new">{tn('NEW')}</span>
          </NavLink>
          <Link
            to="/?studio=1"
            className={section === 'studio' ? 'active' : ''}
            aria-current={section === 'studio' ? 'location' : undefined}
          >
            {tn('5D Studio ')}
            <Sparkles size={13} />
          </Link>
          <Link
            to="/?about=1"
            className={section === 'about' ? 'active' : ''}
            aria-current={section === 'about' ? 'location' : undefined}
          >
            {tn('Tentang L\u2019MOR')}
          </Link>
          <Link className="mobile-favorites" to="/catalog?saved=1">
            {tn('Favorit saya')}
          </Link>
        </nav>
        <div className="header-actions">
          <select
            className="language-select"
            aria-label={tt('Bahasa')}
            value={locale}
            onChange={(event) => {
              if (isLocale(event.target.value)) setLocale(event.target.value)
            }}
          >
            <option value="id">ID</option>
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select>
          <button
            className="icon-btn sound-toggle"
            aria-label={tt(sound ? 'Matikan suara' : 'Aktifkan suara')}
            title={tt(sound ? 'Matikan suara' : 'Aktifkan suara')}
            aria-pressed={sound}
            onClick={() => void setSoundEnabled(!sound)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <Link
            className="icon-btn search-nav"
            to="/catalog?search=1"
            aria-label={tt('Cari koleksi')}
          >
            <Search size={20} />
          </Link>
          <Link
            className="icon-btn favorites-nav"
            to="/catalog?saved=1"
            aria-label={tt(`Favorit, ${state.favorites.length} produk`)}
          >
            <Heart size={20} />
            {tn(
              state.favorites.length > 0 && (
                <span className="icon-count">{tn(state.favorites.length)}</span>
              ),
            )}
          </Link>
          <Link
            className="bag-link"
            to="/cart"
            aria-label={tt(`Shopping bag, ${count} produk`)}
          >
            <ShoppingBag size={18} />
            <span className="bag-text">{tn('Bag')}</span>
            <span className="bag-count">{tn(count)}</span>
          </Link>
          <button
            className="icon-btn menu-toggle"
            aria-label={tt(menu ? 'Tutup navigasi' : 'Buka navigasi')}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {tn(menu ? <X /> : <Menu />)}
          </button>
        </div>
      </header>
    </>
  )
}
function ScrollToPage() {
  const locale = useLocale()
  const { pathname, search, key } = useLocation()
  const previousPath = useRef<string | undefined>(undefined)
  useEffect(() => {
    const sameHome = previousPath.current === '/' && pathname === '/'
    previousPath.current = pathname
    if (pathname === '/') {
      // A newly mounted home already selects its initial scene from the URL.
      // Only an explicit in-home navigation should request another transition.
      if (sameHome) {
        const params = new URLSearchParams(search)
        scrollToSection(
          params.has('studio')
            ? 'studio'
            : params.has('about')
              ? 'about'
              : 'intro',
        )
      }
      return
    }
    const frame = requestAnimationFrame(() => scrollSmoothlyTo(0, true))
    return () => cancelAnimationFrame(frame)
  }, [pathname, search, key])
  useEffect(() => {
    document.title = `${tt(pathname === '/catalog' ? 'Koleksi' : pathname === '/cart' ? 'Your Bag' : 'Wear your own way.')} - L’MOR`
    const description = getDictionary().meta
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        pathname === '/catalog'
          ? description.catalog
          : pathname === '/cart'
            ? description.cart
            : description.home,
      )
  }, [pathname, locale])
  return null
}
function Home() {
  return <ExperienceHome />
}
function ScanIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M8 3H4v4m12-4h4v4M4 17v4h4m12-4v4h-4M8 8l4-2 4 2v7l-4 3-4-3zM4 12h16" />
    </svg>
  )
}
function Catalog() {
  useLocale()
  const { state } = useStore(),
    [params, setParams] = useSearchParams(),
    [savedOnly, setSavedOnly] = useState(params.get('saved') === '1')
  const [category, setCategory] = useState('all'),
    [gender, setGender] = useState('all'),
    [query, setQuery] = useState(''),
    [sort, setSort] = useState('featured'),
    [maxPrice, setMaxPrice] = useState(600000),
    [filters, setFilters] = useState(false),
    [visible, setVisible] = useState(9),
    [detail, setDetail] = useState<Product | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setSavedOnly(params.get('saved') === '1')
    if (params.get('search')) searchRef.current?.focus()
  }, [params])
  const filtered = products
    .filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (gender === 'all' || p.gender === gender || p.gender === 'unisex') &&
        p.price <= maxPrice &&
        (!savedOnly || state.favorites.includes(p.id)) &&
        `${p.name} ${tt(p.name)} ${p.material} ${tt(p.material)} ${tt(p.fit)} ${p.category === 'tops' ? 'baju kaos kemeja tops shirt 上装 衬衫' : 'celana bottoms trousers 下装 长裤'}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'price-low'
        ? a.price - b.price
        : sort === 'price-high'
          ? b.price - a.price
          : sort === 'new'
            ? Number(b.badge === 'NEW') - Number(a.badge === 'NEW')
            : 0,
    )
  useEffect(
    () => setVisible(9),
    [query, gender, category, maxPrice, sort, savedOnly],
  )
  const reset = () => {
    setCategory('all')
    setGender('all')
    setMaxPrice(600000)
    setQuery('')
    setSavedOnly(false)
    setParams({})
  }
  return (
    <main className="catalog-page">
      <div className="breadcrumbs">
        <Link to="/">{tn('Beranda')}</Link>
        <span>{tn('/')}</span>
        <span>{tn(savedOnly ? 'Favorit' : 'Koleksi')}</span>
      </div>
      <div className="catalog-intro">
        <div>
          <p className="eyebrow">{tn('THE EVERYDAY COLLECTION \u201926')}</p>
          <h1>
            {tn(
              savedOnly ? (
                <>
                  {tn('Saved for ')}
                  <em>{tn('you.')}</em>
                </>
              ) : (
                <>
                  {tn('Good pieces.')}
                  <br />
                  <em>{tn('Better possibilities.')}</em>
                </>
              ),
            )}
          </h1>
          <p>
            {tn(
              savedOnly
                ? 'Simpan yang kamu suka. Kembali kapan saja.'
                : 'Pieces sederhana, karakter luar biasa. Temukan yang paling kamu.',
            )}
          </p>
        </div>
        <Link className="catalog-studio-card" to="/?studio=1">
          <span className="studio-card-icon">
            <ScanIcon />
          </span>
          <span>
            {tn('Belum yakin dengan look-nya?')}
            <strong>{tn('Coba di 5D Studio')}</strong>
          </span>
          <span className="round-icon">
            <Plus size={18} />
          </span>
        </Link>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-categories">
          {tn(
            [
              ['all', 'Semua'],
              ['tops', 'Baju'],
              ['bottoms', 'Celana'],
            ].map(([id, name]) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={category === id ? 'active' : ''}
              >
                {tn(name)}
                <span>{tn(id === 'all' ? 12 : 6)}</span>
              </button>
            )),
          )}
        </div>
        <div className="catalog-tools">
          <button
            className={`filter-toggle ${filters ? 'active' : ''}`}
            onClick={() => setFilters(!filters)}
            aria-expanded={filters}
          >
            <SlidersHorizontal size={16} />
            {tn(' Filter')}
          </button>
          <div className="select-wrap sort-select">
            <select
              aria-label={tt('Urutkan koleksi')}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">{tn('Pilihan L\u2019MOR')}</option>
              <option value="new">{tn('Terbaru')}</option>
              <option value="price-low">{tn('Harga terendah')}</option>
              <option value="price-high">{tn('Harga tertinggi')}</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
      <div className="catalog-layout">
        <aside className={`catalog-filters ${filters ? 'show' : ''}`}>
          <div className="filter-heading">
            <h3>{tn('Find your pieces')}</h3>
            <button className="text-link" onClick={reset}>
              {tn('Reset')}
            </button>
          </div>
          <div className="search-field">
            <Search size={17} />
            <input
              ref={searchRef}
              placeholder={tt('Cari koleksi…')}
              aria-label={tt('Cari produk')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {tn(
              query && (
                <button
                  aria-label={tt('Hapus pencarian')}
                  onClick={() => setQuery('')}
                >
                  <X size={14} />
                </button>
              ),
            )}
          </div>
          <fieldset>
            <legend>{tn('Untuk siapa?')}</legend>
            {tn(
              [
                ['all', 'Semua model'],
                ['male', 'Male + Unisex'],
                ['female', 'Female + Unisex'],
              ].map(([id, text]) => (
                <label className="radio-label" key={id}>
                  <input
                    type="radio"
                    name="gender"
                    value={id}
                    checked={gender === id}
                    onChange={() => setGender(id)}
                  />
                  <span>{tn(text)}</span>
                </label>
              )),
            )}
          </fieldset>
          <fieldset>
            <legend>{tn('Budget kamu')}</legend>
            <div className="price-values">
              <span>{tn('Rp 0')}</span>
              <strong>{tn(money(maxPrice))}</strong>
            </div>
            <input
              type="range"
              min="180000"
              max="600000"
              step="10000"
              aria-label={tt('Harga maksimal')}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={
                {
                  '--range': `${((maxPrice - 180000) / 420000) * 100}%`,
                } as React.CSSProperties
              }
            />
          </fieldset>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />
            <Heart size={15} />
            {tn(' Hanya favorit saya')}
          </label>
          <div className="filter-note">
            <span>{tn('\u2733')}</span>
            <p>
              {tn('Less scrolling.')}
              <br />
              <strong>{tn('More finding your thing.')}</strong>
            </p>
          </div>
          <p className="tiny muted">
            {tn(
              'Gambar, harga, dan detail koleksi adalah contoh untuk eksplorasi.',
            )}
          </p>
        </aside>
        <div className="catalog-results">
          <div className="results-heading">
            <span>
              {tn(filtered.length)}
              {tn(' pieces')}
              {tn(' ')}
              {tn(savedOnly ? 'di favoritmu' : 'untuk dieksplorasi')}
            </span>
            <span>{tn('MAKE THEM YOURS.')}</span>
          </div>
          {tn(
            filtered.length ? (
              <>
                <div className="catalog-grid">
                  {tn(
                    filtered
                      .slice(0, visible)
                      .map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onOpen={setDetail}
                        />
                      )),
                  )}
                </div>
                {tn(
                  visible < filtered.length && (
                    <div className="load-more">
                      <p>
                        {tn(visible)}
                        {tn(' dari ')}
                        {tn(filtered.length)}
                        {tn(' pieces')}
                      </p>
                      <button
                        className="btn btn-outline"
                        onClick={() => setVisible((n) => n + 9)}
                      >
                        <Plus size={17} />
                        {tn(' Lihat lebih banyak')}
                      </button>
                    </div>
                  ),
                )}
              </>
            ) : (
              <div className="empty-state">
                <Search size={40} />
                <h2>{tn('Belum ketemu yang pas.')}</h2>
                <p>{tn('Coba kata kunci lain atau atur ulang filter kamu.')}</p>
                <button className="btn btn-dark" onClick={reset}>
                  {tn('Lihat semua koleksi')}
                </button>
              </div>
            ),
          )}
        </div>
      </div>
      {tn(
        detail && (
          <ProductDialog
            key={detail.id}
            product={detail}
            onClose={() => setDetail(null)}
          />
        ),
      )}
    </main>
  )
}
function Cart() {
  useLocale()
  const { state, updateQuantity, favorite } = useStore(),
    [code, setCode] = useState(''),
    [coupon, setCoupon] = useState(''),
    [couponError, setCouponError] = useState(''),
    [checkout, setCheckout] = useState(false)
  const bill = totals(state.cart, coupon),
    count = state.cart.reduce((n, x) => n + x.quantity, 0)
  const applyCoupon = (e: FormEvent) => {
    e.preventDefault()
    if (code.trim().toUpperCase() === 'LMOR10') {
      setCoupon('LMOR10')
      setCouponError('')
    } else {
      setCouponError('Kode belum cocok. Coba LMOR10 untuk diskon demo 10%.')
    }
  }
  const download = () => {
    const lines = [
      tt('L’MOR - Ringkasan Bag (DEMO)'),
      new Date().toLocaleString(document.documentElement.lang),
      '',
      ...state.cart.map((x) => {
        const p = productById(x.id)!
        return `${tt(p.name)} / ${tt(p.colors[x.color].name)} / ${x.size} × ${x.quantity}: ${money(p.price * x.quantity)}`
      }),
      '',
      `${tt('Subtotal')}: ${money(bill.subtotal)}`,
      `${tt('Diskon')}: ${money(bill.discount)}`,
      `${tt('Pengiriman demo')}: ${money(bill.shipping)}`,
      `${tt('Total demo')}: ${money(bill.total)}`,
      '',
      tt(
        'Ini hanya ringkasan lokal, bukan pesanan atau bukti pembayaran. Tidak ada transaksi yang dilakukan.',
      ),
    ]
    const url = URL.createObjectURL(
        new Blob([lines.join('\n')], {
          type: 'text/plain;charset=utf-8',
        }),
      ),
      a = document.createElement('a')
    a.href = url
    a.download = 'LMOR-bag-demo.txt'
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <main className="cart-page">
      <div className="breadcrumbs">
        <Link to="/">{tn('Beranda')}</Link>
        <span>{tn('/')}</span>
        <span>{tn('Shopping bag')}</span>
      </div>
      <div className="cart-title">
        <div>
          <p className="eyebrow">{tn('GOOD CHOICES LOOK GOOD ON YOU.')}</p>
          <h1>
            {tn('Your bag')}
            <span>{tn('.')}</span>
            <sup>{tn(count.toString().padStart(2, '0'))}</sup>
          </h1>
        </div>
        <Link className="text-link" to="/catalog">
          {tn('Lanjut eksplorasi ')}
          <Plus size={15} />
        </Link>
      </div>
      {tn(
        !state.cart.length ? (
          <div className="empty-state empty-cart">
            <div className="empty-bag">
              <ShoppingBag size={52} />
              <span>{tn('\u2733')}</span>
            </div>
            <h2>{tn('A little room for your next look.')}</h2>
            <p>
              {tn(
                'Bag kamu masih kosong. Temukan pieces yang terasa kamu banget.',
              )}
            </p>
            <div>
              <Link className="btn btn-dark" to="/catalog">
                {tn('Jelajahi koleksi')}
              </Link>
              <Link className="btn btn-outline" to="/?studio=1">
                {tn('Coba 5D Studio')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-main">
              <div className="shipping-progress">
                <div>
                  <Truck size={19} />
                  <p>
                    {tn(
                      bill.subtotal >= 500000 ? (
                        <>
                          <strong>{tn('Your bag gets a little extra.')}</strong>
                          {tn(' Gratis ongkir demo sudah aktif!')}
                        </>
                      ) : (
                        <>
                          {tn('Tambah ')}
                          <strong>{tn(money(500000 - bill.subtotal))}</strong>
                          {tn(' ')}
                          {tn('lagi untuk gratis ongkir demo.')}
                        </>
                      ),
                    )}
                  </p>
                  {tn(bill.subtotal >= 500000 && <Check size={18} />)}
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${Math.min(100, (bill.subtotal / 500000) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="cart-table-head">
                <span>{tn('PIECES IN YOUR BAG')}</span>
                <span>{tn('JUMLAH / TOTAL')}</span>
              </div>
              <div className="cart-items">
                {tn(
                  state.cart.map((item) => {
                    const product = productById(item.id)!,
                      key = itemKey(item)
                    return (
                      <article className="cart-item" key={key}>
                        <Link to="/catalog" className="cart-photo">
                          <img
                            src={imageUrl(product)}
                            alt={tt(product.name)}
                            width="140"
                            height="180"
                          />
                        </Link>
                        <div className="cart-item-content">
                          <div className="cart-item-top">
                            <div>
                              <span className="eyebrow">
                                {tn(
                                  product.category === 'tops'
                                    ? 'TOPS'
                                    : 'BOTTOMS',
                                )}
                                {tn(' /')}
                                {tn(' ')}
                                {tn(product.fit)}
                              </span>
                              <h2>{tn(product.name)}</h2>
                            </div>
                            <button
                              className="icon-btn"
                              aria-label={tt(`Hapus ${product.name}`)}
                              onClick={() => updateQuantity(key, 0)}
                            >
                              <X size={17} />
                            </button>
                          </div>
                          <div className="cart-variant">
                            <i
                              style={{
                                background: product.colors[item.color].hex,
                              }}
                            />
                            <span>{tn(product.colors[item.color].name)}</span>
                            <span className="variant-divider" />
                            {tn('Size ')}
                            {tn(item.size)}
                          </div>
                          <div className="cart-item-bottom">
                            <div className="quantity">
                              <button
                                aria-label={tt(`Kurangi ${product.name}`)}
                                onClick={() =>
                                  updateQuantity(key, item.quantity - 1)
                                }
                              >
                                <Minus size={13} />
                              </button>
                              <span aria-label={tt('Jumlah')}>
                                {tn(item.quantity)}
                              </span>
                              <button
                                disabled={item.quantity >= 20}
                                aria-label={tt(`Tambah ${product.name}`)}
                                onClick={() =>
                                  updateQuantity(key, item.quantity + 1)
                                }
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                            <button
                              className="cart-save"
                              aria-label={tt(`Favoritkan ${product.name}`)}
                              aria-pressed={state.favorites.includes(
                                product.id,
                              )}
                              onClick={() => favorite(product.id)}
                            >
                              <Heart
                                size={15}
                                fill={
                                  state.favorites.includes(product.id)
                                    ? 'currentColor'
                                    : 'none'
                                }
                              />
                              <span>{tn('Simpan')}</span>
                            </button>
                            <strong>
                              {tn(money(product.price * item.quantity))}
                            </strong>
                          </div>
                        </div>
                      </article>
                    )
                  }),
                )}
              </div>
              <div className="cart-bottom-note">
                <ShieldCheck size={17} />
                <span>
                  {tn('Bag disimpan di browser ini, siap saat kamu kembali.')}
                </span>
              </div>
              <Link className="back-studio" to="/?studio=1">
                <ScanIcon />
                <div>
                  {tn('Masih penasaran dengan padu padannya?')}
                  <strong>{tn('Kembali ke 5D Studio')}</strong>
                </div>
                <Plus size={18} />
              </Link>
            </div>
            <aside className="order-summary">
              <p className="eyebrow">{tn('THE NEXT GOOD THING')}</p>
              <h2>{tn('Ringkasan bag')}</h2>
              <div className="summary-row">
                <span>
                  {tn('Subtotal (')}
                  {tn(count)}
                  {tn(' pieces)')}
                </span>
                <b>{tn(money(bill.subtotal))}</b>
              </div>
              <div className="summary-row">
                <span>{tn('Pengiriman demo')}</span>
                <b className={!bill.shipping ? 'green-text' : ''}>
                  {tn(bill.shipping ? money(bill.shipping) : 'Gratis')}
                </b>
              </div>
              {tn(
                coupon && (
                  <div className="summary-row discount-row">
                    <span>
                      {tn('LMOR10')}
                      {tn(' ')}
                      <button
                        aria-label={tt('Hapus kupon')}
                        onClick={() => {
                          setCoupon('')
                          setCode('')
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                    <b>
                      {tn('\u2212')}
                      {tn(money(bill.discount))}
                    </b>
                  </div>
                ),
              )}
              <form className="coupon-form" onSubmit={applyCoupon}>
                <label htmlFor="coupon">
                  {tn('A little treat? Pakai kode promo.')}
                </label>
                <div>
                  <input
                    id="coupon"
                    placeholder={tt('Coba LMOR10')}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <button type="submit">{tn('Pakai')}</button>
                </div>
                {tn(
                  couponError && (
                    <p className="error-text" role="alert">
                      {tn(couponError)}
                    </p>
                  ),
                )}
                {tn(
                  coupon && (
                    <p className="success-text" role="status">
                      <Check size={13} />
                      {tn(' Diskon demo 10% aktif.')}
                    </p>
                  ),
                )}
              </form>
              <div className="summary-total">
                <span>{tn('Total')}</span>
                <strong>{tn(money(bill.total))}</strong>
              </div>
              <button
                className="btn btn-dark full"
                onClick={() => setCheckout(true)}
              >
                <ShoppingBag size={17} />
                {tn(' Lanjut ke checkout')}
              </button>
              <p className="checkout-note">
                <Info size={13} />
                {tn(' Demo checkout. Belum ada transaksi atau pembayaran.')}
              </p>
              <div className="summary-benefits">
                <span>
                  <Package size={15} />
                  {tn(' Pilihanmu, tersimpan lokal')}
                </span>
                <span>
                  <Truck size={15} />
                  {tn(' Gratis ongkir demo mulai Rp 500.000')}
                </span>
              </div>
            </aside>
          </div>
        ),
      )}
      {tn(
        checkout && (
          <Dialog
            title={tt('Looking good. Almost yours.')}
            onClose={() => setCheckout(false)}
          >
            <div className="checkout-demo">
              <div className="checkout-demo-icon">
                <ShoppingBag size={35} />
              </div>
              <h3>{tn('Your next look, on the list.')}</h3>
              <p>
                {tn('Bag kamu berisi ')}
                {tn(count)}
                {tn(' pieces dengan total demo')}
                {tn(' ')}
                <strong>{tn(money(bill.total))}</strong>
                {tn('.')}
              </p>
              <div className="soft-notice">
                <Info size={19} />
                <p>
                  {tn(
                    'Ini website demo tanpa database. Checkout belum terhubung ke sistem pesanan, pengiriman, atau pembayaran. Tidak ada transaksi yang dilakukan.',
                  )}
                </p>
              </div>
              <button className="btn btn-dark full" onClick={download}>
                <Download size={17} />
                {tn(' Unduh ringkasan bag')}
              </button>
              <button className="text-link" onClick={() => setCheckout(false)}>
                {tn('Kembali ke bag')}
              </button>
            </div>
          </Dialog>
        ),
      )}
    </main>
  )
}
const infoContent: Record<
  string,
  {
    title: string
    text: string
  }
> = {
  about: {
    title: 'A little more you.',
    text: 'L’MOR adalah konsep everyday fashion yang memberi ruang untuk bereksplorasi. Padukan koleksi, sesuaikan avatar, dan temukan gayamu lewat 5D Studio. Seluruh koleksi pada website ini adalah data demonstrasi.',
  },
  shipping: {
    title: 'Delivery, made simple.',
    text: 'Dalam demo ini, biaya pengiriman adalah Rp 20.000 atau gratis untuk subtotal minimal Rp 500.000. Nilai ini hanya ilustrasi. Website belum menerima pesanan atau terhubung dengan kurir.',
  },
  returns: {
    title: 'Room to change your mind.',
    text: 'Kamu bisa menghapus produk atau mengubah jumlahnya kapan saja di bag. Karena website ini masih berupa demo, belum ada transaksi, pengiriman, maupun proses retur barang yang berlangsung.',
  },
  privacy: {
    title: 'Your style stays with you.',
    text: 'Preferensi avatar, daftar favorit, lookbook, dan bag hanya disimpan di localStorage browser ini. Tidak ada akun atau database. Kamu bisa menghapusnya melalui pengaturan data situs pada browser. Memuat font dan foto menggunakan aset lokal.',
  },
}
function Footer() {
  useLocale()
  const [info, setInfo] = useState<string | null>(null)
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" aria-label={tt('L’MOR beranda')}>
            <Brand />
          </Link>
          <p>
            {tn('Everyday pieces.')}
            <br />
            {tn('Extraordinary you.')}
          </p>
          <span>{tn('AN EVERYDAY FASHION CONCEPT \xB7 2026')}</span>
        </div>
        <div className="footer-links">
          <div>
            <h3>{tn('Explore')}</h3>
            <Link to="/catalog">{tn('Semua koleksi')}</Link>
            <Link to="/?studio=1">{tn('5D Studio')}</Link>
            <Link to="/catalog?saved=1">{tn('Favorit saya')}</Link>
          </div>
          <div>
            <h3>{tn('A little help')}</h3>
            <button onClick={() => setInfo('shipping')}>
              {tn('Pengiriman')}
            </button>
            <button onClick={() => setInfo('returns')}>
              {tn('Penukaran & retur')}
            </button>
            <button onClick={() => setInfo('privacy')}>{tn('Privasi')}</button>
          </div>
          <div>
            <h3>{tn('Get to know us')}</h3>
            <button onClick={() => setInfo('about')}>
              {tn('Tentang L\u2019MOR')}
            </button>
            <a
              href="https://github.com/evans2101/l-mor"
              target="_blank"
              rel="noreferrer"
            >
              {tn('Behind the project ')}
              <ArrowUpRight size={13} />
            </a>
            <span className="footer-note">
              {tn('A fashion playground.')}
              <br />
              {tn('Made to be explored.')}
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          {tn('\xA9 ')}
          {tn(new Date().getFullYear())}
          {tn(' L\u2019MOR. Wear your own way.')}
        </span>
        <span>{tn('CONCEPT STORE \xB7 SAMPLE COLLECTION')}</span>
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          {tn('Sample photography: Unsplash')}
        </a>
      </div>
      {tn(
        info && (
          <Dialog
            title={tt(infoContent[info].title)}
            onClose={() => setInfo(null)}
          >
            <p className="info-copy">{tn(infoContent[info].text)}</p>
          </Dialog>
        ),
      )}
    </footer>
  )
}
function NotFound() {
  useLocale()
  return (
    <main className="empty-state">
      <h1>{tn('Lost in the wardrobe?')}</h1>
      <p>{tn('Halaman ini belum ada. Masih banyak look menunggu kamu.')}</p>
      <Link className="btn btn-dark" to="/">
        {tn('Kembali ke beranda')}
      </Link>
    </main>
  )
}
export default function App() {
  useLocale()
  const { pathname } = useLocation()
  useSmoothScroll()
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        {tn('Lewati ke konten')}
      </a>
      <ScrollToPage />
      <Header />
      <div id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {tn(pathname !== '/' && <Footer />)}
    </>
  )
}
