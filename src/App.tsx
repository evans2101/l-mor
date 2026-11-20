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
  X,
} from 'lucide-react'
import { imageUrl, money, productById, products, type Product } from './data'
import { itemKey, totals, useStore } from './state'
import ExperienceHome from './components/ExperienceHome'
import { ProductCard, ProductDialog } from './components/Product'
import Dialog from './components/Dialog'
import { scrollToSection, useHomeSection } from './navigation'
import { scrollSmoothlyTo, useSmoothScroll } from './smoothScroll'

function Brand({ animated = false }: { animated?: boolean }) {
  return (
    <span className={`brand ${animated ? 'animated-brand' : ''}`}>
      L’MOR<span className="brand-dot">.</span>
      {!animated && <sup>✳</sup>}
    </span>
  )
}
function Header() {
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
        <Link to="/" aria-label="L’MOR beranda">
          <Brand />
        </Link>
        <nav
          className={menu ? 'nav open' : 'nav'}
          aria-label="Navigasi utama"
          onClick={() => setMenu(false)}
        >
          <Link
            to="/"
            className={section === 'intro' ? 'active' : ''}
            aria-current={section === 'intro' ? 'location' : undefined}
          >
            Beranda
          </Link>
          <NavLink to="/catalog">
            Koleksi <span className="nav-new">NEW</span>
          </NavLink>
          <Link
            to="/?studio=1"
            className={section === 'studio' ? 'active' : ''}
            aria-current={section === 'studio' ? 'location' : undefined}
          >
            5D Studio <Sparkles size={13} />
          </Link>
          <Link
            to="/?about=1"
            className={section === 'about' ? 'active' : ''}
            aria-current={section === 'about' ? 'location' : undefined}
          >
            Tentang L’MOR
          </Link>
        </nav>
        <div className="header-actions">
          <Link
            className="icon-btn search-nav"
            to="/catalog?search=1"
            aria-label="Cari koleksi"
          >
            <Search size={20} />
          </Link>
          <Link
            className="icon-btn"
            to="/catalog?saved=1"
            aria-label={`Favorit, ${state.favorites.length} produk`}
          >
            <Heart size={20} />
            {state.favorites.length > 0 && (
              <span className="icon-count">{state.favorites.length}</span>
            )}
          </Link>
          <Link
            className="bag-link"
            to="/cart"
            aria-label={`Shopping bag, ${count} produk`}
          >
            <ShoppingBag size={18} />
            <span className="bag-text">Bag</span>
            <span className="bag-count">{count}</span>
          </Link>
          <button
            className="icon-btn menu-toggle"
            aria-label={menu ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  )
}
function ScrollToPage() {
  const { pathname, search, key } = useLocation()
  useEffect(() => {
    // Wait for the new route and its scroll scenes to mount before navigating.
    let cancelled = false,
      frame = 0
    document.fonts.ready.then(() => {
      if (cancelled) return
      frame = requestAnimationFrame(() => {
        if (pathname === '/') {
          const params = new URLSearchParams(search)
          scrollToSection(
            params.has('studio')
              ? 'studio'
              : params.has('about')
                ? 'about'
                : 'intro',
          )
        } else {
          scrollSmoothlyTo(0, true)
        }
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [pathname, search, key])
  useEffect(() => {
    document.title = `${pathname === '/catalog' ? 'Koleksi' : pathname === '/cart' ? 'Your Bag' : 'Wear your own way.'} — L’MOR`
  }, [pathname])
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
        `${p.name} ${p.material} ${p.fit} ${p.category === 'tops' ? 'baju kaos kemeja' : 'celana'}`
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
        <Link to="/">Beranda</Link>
        <span>/</span>
        <span>{savedOnly ? 'Favorit' : 'Koleksi'}</span>
      </div>
      <div className="catalog-intro">
        <div>
          <p className="eyebrow">THE EVERYDAY COLLECTION ’26</p>
          <h1>
            {savedOnly ? (
              <>
                Saved for <em>you.</em>
              </>
            ) : (
              <>
                Good pieces.
                <br />
                <em>Better possibilities.</em>
              </>
            )}
          </h1>
          <p>
            {savedOnly
              ? 'Simpan yang kamu suka. Kembali kapan saja.'
              : 'Pieces sederhana, karakter luar biasa. Temukan yang paling kamu.'}
          </p>
        </div>
        <Link className="catalog-studio-card" to="/?studio=1">
          <span className="studio-card-icon">
            <ScanIcon />
          </span>
          <span>
            Belum yakin dengan look-nya?<strong>Coba di 5D Studio</strong>
          </span>
          <span className="round-icon">
            <Plus size={18} />
          </span>
        </Link>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-categories">
          {[
            ['all', 'Semua'],
            ['tops', 'Baju'],
            ['bottoms', 'Celana'],
          ].map(([id, name]) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={category === id ? 'active' : ''}
            >
              {name}
              <span>{id === 'all' ? 12 : 6}</span>
            </button>
          ))}
        </div>
        <div className="catalog-tools">
          <button
            className={`filter-toggle ${filters ? 'active' : ''}`}
            onClick={() => setFilters(!filters)}
            aria-expanded={filters}
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
          <div className="select-wrap sort-select">
            <select
              aria-label="Urutkan koleksi"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Pilihan L’MOR</option>
              <option value="new">Terbaru</option>
              <option value="price-low">Harga terendah</option>
              <option value="price-high">Harga tertinggi</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
      <div className="catalog-layout">
        <aside className={`catalog-filters ${filters ? 'show' : ''}`}>
          <div className="filter-heading">
            <h3>Find your pieces</h3>
            <button className="text-link" onClick={reset}>
              Reset
            </button>
          </div>
          <div className="search-field">
            <Search size={17} />
            <input
              ref={searchRef}
              placeholder="Cari koleksi…"
              aria-label="Cari produk"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Hapus pencarian" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <fieldset>
            <legend>Untuk siapa?</legend>
            {[
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
                <span>{text}</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Budget kamu</legend>
            <div className="price-values">
              <span>Rp 0</span>
              <strong>{money(maxPrice)}</strong>
            </div>
            <input
              type="range"
              min="180000"
              max="600000"
              step="10000"
              aria-label="Harga maksimal"
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
            <Heart size={15} /> Hanya favorit saya
          </label>
          <div className="filter-note">
            <span>✳</span>
            <p>
              Less scrolling.
              <br />
              <strong>More finding your thing.</strong>
            </p>
          </div>
          <p className="tiny muted">
            Gambar, harga, dan detail koleksi adalah contoh untuk eksplorasi.
          </p>
        </aside>
        <div className="catalog-results">
          <div className="results-heading">
            <span>
              {filtered.length} pieces{' '}
              {savedOnly ? 'di favoritmu' : 'untuk dieksplorasi'}
            </span>
            <span>MAKE THEM YOURS.</span>
          </div>
          {filtered.length ? (
            <>
              <div className="catalog-grid">
                {filtered.slice(0, visible).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={setDetail}
                  />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="load-more">
                  <p>
                    {visible} dari {filtered.length} pieces
                  </p>
                  <button
                    className="btn btn-outline"
                    onClick={() => setVisible((n) => n + 9)}
                  >
                    <Plus size={17} /> Lihat lebih banyak
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Search size={40} />
              <h2>Belum ketemu yang pas.</h2>
              <p>Coba kata kunci lain atau atur ulang filter kamu.</p>
              <button className="btn btn-dark" onClick={reset}>
                Lihat semua koleksi
              </button>
            </div>
          )}
        </div>
      </div>
      {detail && (
        <ProductDialog
          key={detail.id}
          product={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </main>
  )
}
function Cart() {
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
      'L’MOR — Ringkasan Bag (DEMO)',
      new Date().toLocaleString('id-ID'),
      '',
      ...state.cart.map((x) => {
        const p = productById(x.id)!
        return `${p.name} / ${p.colors[x.color].name} / ${x.size} × ${x.quantity}: ${money(p.price * x.quantity)}`
      }),
      '',
      `Subtotal: ${money(bill.subtotal)}`,
      `Diskon: ${money(bill.discount)}`,
      `Pengiriman demo: ${money(bill.shipping)}`,
      `Total demo: ${money(bill.total)}`,
      '',
      'Ini hanya ringkasan lokal, bukan pesanan atau bukti pembayaran. Tidak ada transaksi yang dilakukan.',
    ]
    const url = URL.createObjectURL(
        new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }),
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
        <Link to="/">Beranda</Link>
        <span>/</span>
        <span>Shopping bag</span>
      </div>
      <div className="cart-title">
        <div>
          <p className="eyebrow">GOOD CHOICES LOOK GOOD ON YOU.</p>
          <h1>
            Your bag<span>.</span>
            <sup>{count.toString().padStart(2, '0')}</sup>
          </h1>
        </div>
        <Link className="text-link" to="/catalog">
          Lanjut eksplorasi <Plus size={15} />
        </Link>
      </div>
      {!state.cart.length ? (
        <div className="empty-state empty-cart">
          <div className="empty-bag">
            <ShoppingBag size={52} />
            <span>✳</span>
          </div>
          <h2>A little room for your next look.</h2>
          <p>Bag kamu masih kosong. Temukan pieces yang terasa kamu banget.</p>
          <div>
            <Link className="btn btn-dark" to="/catalog">
              Jelajahi koleksi
            </Link>
            <Link className="btn btn-outline" to="/?studio=1">
              Coba 5D Studio
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
                  {bill.subtotal >= 500000 ? (
                    <>
                      <strong>Your bag gets a little extra.</strong> Gratis
                      ongkir demo sudah aktif!
                    </>
                  ) : (
                    <>
                      Tambah <strong>{money(500000 - bill.subtotal)}</strong>{' '}
                      lagi untuk gratis ongkir demo.
                    </>
                  )}
                </p>
                {bill.subtotal >= 500000 && <Check size={18} />}
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
              <span>PIECES IN YOUR BAG</span>
              <span>JUMLAH / TOTAL</span>
            </div>
            <div className="cart-items">
              {state.cart.map((item) => {
                const product = productById(item.id)!,
                  key = itemKey(item)
                return (
                  <article className="cart-item" key={key}>
                    <Link to="/catalog" className="cart-photo">
                      <img
                        src={imageUrl(product)}
                        alt={product.name}
                        width="140"
                        height="180"
                      />
                    </Link>
                    <div className="cart-item-content">
                      <div className="cart-item-top">
                        <div>
                          <span className="eyebrow">
                            {product.category === 'tops' ? 'TOPS' : 'BOTTOMS'} /{' '}
                            {product.fit}
                          </span>
                          <h2>{product.name}</h2>
                        </div>
                        <button
                          className="icon-btn"
                          aria-label={`Hapus ${product.name}`}
                          onClick={() => updateQuantity(key, 0)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                      <div className="cart-variant">
                        <i
                          style={{ background: product.colors[item.color].hex }}
                        />
                        <span>{product.colors[item.color].name}</span>
                        <span className="variant-divider" />
                        Size {item.size}
                      </div>
                      <div className="cart-item-bottom">
                        <div className="quantity">
                          <button
                            aria-label={`Kurangi ${product.name}`}
                            onClick={() =>
                              updateQuantity(key, item.quantity - 1)
                            }
                          >
                            <Minus size={13} />
                          </button>
                          <span aria-label="Jumlah">{item.quantity}</span>
                          <button
                            disabled={item.quantity >= 20}
                            aria-label={`Tambah ${product.name}`}
                            onClick={() =>
                              updateQuantity(key, item.quantity + 1)
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          className="cart-save"
                          aria-label={`Favoritkan ${product.name}`}
                          aria-pressed={state.favorites.includes(product.id)}
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
                          <span>Simpan</span>
                        </button>
                        <strong>{money(product.price * item.quantity)}</strong>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="cart-bottom-note">
              <ShieldCheck size={17} />
              <span>Bag disimpan di browser ini, siap saat kamu kembali.</span>
            </div>
            <Link className="back-studio" to="/?studio=1">
              <ScanIcon />
              <div>
                Masih penasaran dengan padu padannya?
                <strong>Kembali ke 5D Studio</strong>
              </div>
              <Plus size={18} />
            </Link>
          </div>
          <aside className="order-summary">
            <p className="eyebrow">THE NEXT GOOD THING</p>
            <h2>Ringkasan bag</h2>
            <div className="summary-row">
              <span>Subtotal ({count} pieces)</span>
              <b>{money(bill.subtotal)}</b>
            </div>
            <div className="summary-row">
              <span>Pengiriman demo</span>
              <b className={!bill.shipping ? 'green-text' : ''}>
                {bill.shipping ? money(bill.shipping) : 'Gratis'}
              </b>
            </div>
            {coupon && (
              <div className="summary-row discount-row">
                <span>
                  LMOR10{' '}
                  <button
                    aria-label="Hapus kupon"
                    onClick={() => {
                      setCoupon('')
                      setCode('')
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
                <b>−{money(bill.discount)}</b>
              </div>
            )}
            <form className="coupon-form" onSubmit={applyCoupon}>
              <label htmlFor="coupon">A little treat? Pakai kode promo.</label>
              <div>
                <input
                  id="coupon"
                  placeholder="Coba LMOR10"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button type="submit">Pakai</button>
              </div>
              {couponError && (
                <p className="error-text" role="alert">
                  {couponError}
                </p>
              )}
              {coupon && (
                <p className="success-text" role="status">
                  <Check size={13} /> Diskon demo 10% aktif.
                </p>
              )}
            </form>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(bill.total)}</strong>
            </div>
            <button
              className="btn btn-dark full"
              onClick={() => setCheckout(true)}
            >
              <ShoppingBag size={17} /> Lanjut ke checkout
            </button>
            <p className="checkout-note">
              <Info size={13} /> Demo checkout. Belum ada transaksi atau
              pembayaran.
            </p>
            <div className="summary-benefits">
              <span>
                <Package size={15} /> Pilihanmu, tersimpan lokal
              </span>
              <span>
                <Truck size={15} /> Gratis ongkir demo mulai Rp 500.000
              </span>
            </div>
          </aside>
        </div>
      )}
      {checkout && (
        <Dialog
          title="Looking good. Almost yours."
          onClose={() => setCheckout(false)}
        >
          <div className="checkout-demo">
            <div className="checkout-demo-icon">
              <ShoppingBag size={35} />
            </div>
            <h3>Your next look, on the list.</h3>
            <p>
              Bag kamu berisi {count} pieces dengan total demo{' '}
              <strong>{money(bill.total)}</strong>.
            </p>
            <div className="soft-notice">
              <Info size={19} />
              <p>
                Ini website demo tanpa database. Checkout belum terhubung ke
                sistem pesanan, pengiriman, atau pembayaran. Tidak ada transaksi
                yang dilakukan.
              </p>
            </div>
            <button className="btn btn-dark full" onClick={download}>
              <Download size={17} /> Unduh ringkasan bag
            </button>
            <button className="text-link" onClick={() => setCheckout(false)}>
              Kembali ke bag
            </button>
          </div>
        </Dialog>
      )}
    </main>
  )
}
const infoContent: Record<string, { title: string; text: string }> = {
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
  const [info, setInfo] = useState<string | null>(null)
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link to="/" aria-label="L’MOR beranda">
            <Brand />
          </Link>
          <p>
            Everyday pieces.
            <br />
            Extraordinary you.
          </p>
          <span>AN EVERYDAY FASHION CONCEPT · 2026</span>
        </div>
        <div className="footer-links">
          <div>
            <h3>Explore</h3>
            <Link to="/catalog">Semua koleksi</Link>
            <Link to="/?studio=1">5D Studio</Link>
            <Link to="/catalog?saved=1">Favorit saya</Link>
          </div>
          <div>
            <h3>A little help</h3>
            <button onClick={() => setInfo('shipping')}>Pengiriman</button>
            <button onClick={() => setInfo('returns')}>
              Penukaran & retur
            </button>
            <button onClick={() => setInfo('privacy')}>Privasi</button>
          </div>
          <div>
            <h3>Get to know us</h3>
            <button onClick={() => setInfo('about')}>Tentang L’MOR</button>
            <a
              href="https://github.com/evans2101/l-mor"
              target="_blank"
              rel="noreferrer"
            >
              Behind the project <ArrowUpRight size={13} />
            </a>
            <span className="footer-note">
              A fashion playground.
              <br />
              Made to be explored.
            </span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} L’MOR. Wear your own way.</span>
        <span>CONCEPT STORE · SAMPLE COLLECTION</span>
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          Sample photography: Unsplash
        </a>
      </div>
      {info && (
        <Dialog title={infoContent[info].title} onClose={() => setInfo(null)}>
          <p className="info-copy">{infoContent[info].text}</p>
        </Dialog>
      )}
    </footer>
  )
}
function NotFound() {
  return (
    <main className="empty-state">
      <h1>Lost in the wardrobe?</h1>
      <p>Halaman ini belum ada. Masih banyak look menunggu kamu.</p>
      <Link className="btn btn-dark" to="/">
        Kembali ke beranda
      </Link>
    </main>
  )
}
export default function App() {
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
        Lewati ke konten
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
      <Footer />
    </>
  )
}
