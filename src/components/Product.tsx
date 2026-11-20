import { useLocale, translateNode as tn, translateText as tt } from '../i18n'
import { useState } from 'react'
import { Check, Heart, Plus, ShoppingBag, ScanLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  imageUrl,
  money,
  sizes,
  type Product,
  type Selection,
  type Size,
} from '../data'
import { useStore } from '../state'
import Dialog from './Dialog'
export function Swatches({
  product,
  selected,
  onChange,
}: {
  product: Product
  selected: number
  onChange: (n: number) => void
}) {
  useLocale()
  return (
    <div
      className="swatches"
      role="group"
      aria-label={tt(`Warna ${product.name}`)}
    >
      {tn(
        product.colors.map((color, i) => (
          <button
            key={color.name}
            className={`swatch ${selected === i ? 'selected' : ''}`}
            style={
              {
                '--swatch': color.hex,
              } as React.CSSProperties
            }
            aria-label={tt(color.name)}
            aria-pressed={selected === i}
            title={tt(color.name)}
            onClick={() => onChange(i)}
          >
            {tn(
              selected === i && (
                <Check
                  size={12}
                  style={{
                    color:
                      i === 0 && color.hex === '#f1eddf'
                        ? '#292b25'
                        : undefined,
                  }}
                />
              ),
            )}
          </button>
        )),
      )}
    </div>
  )
}
export function ProductCard({
  product,
  onOpen,
  onSelect,
  selected = false,
  compact = false,
}: {
  product: Product
  onOpen: (p: Product) => void
  onSelect?: (p: Product) => void
  selected?: boolean
  compact?: boolean
}) {
  useLocale()
  const { state, favorite } = useStore(),
    saved = state.favorites.includes(product.id)
  return (
    <article
      className={`product-card ${compact ? 'compact' : ''} ${selected ? 'is-selected' : ''}`}
    >
      <div className="product-visual">
        <button
          className="product-image-btn"
          onClick={() => (onSelect ? onSelect(product) : onOpen(product))}
          aria-label={tt(`${onSelect ? 'Pakai' : 'Lihat'} ${product.name}`)}
        >
          <img
            src={imageUrl(product)}
            alt={tt(product.name)}
            loading="lazy"
            width="760"
            height="900"
          />
          {tn(
            selected && (
              <span className="selected-label">
                <Check size={12} />
                {tn(' DIPAKAI')}
              </span>
            ),
          )}
        </button>
        {tn(
          product.badge && !selected && (
            <span
              className={`product-badge ${product.badge === 'NEW' ? 'lime' : ''}`}
            >
              {tn(product.badge)}
            </span>
          ),
        )}
        <button
          className={`favorite-btn ${saved ? 'saved' : ''}`}
          aria-label={tt(
            `${saved ? 'Hapus' : 'Simpan'} ${product.name} ${saved ? 'dari' : 'ke'} favorit`,
          )}
          aria-pressed={saved}
          onClick={() => favorite(product.id)}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {tn(
          !compact && (
            <button className="quick-view" onClick={() => onOpen(product)}>
              <Plus size={15} />
              {tn(' Lihat detail')}
            </button>
          ),
        )}
      </div>
      <div className="product-meta">
        <span>{tn(product.fit)}</span>
        <div
          className="mini-swatches"
          role="img"
          aria-label={tt(`${product.colors.length} pilihan warna`)}
        >
          {tn(
            product.colors.map((c) => (
              <i
                key={c.name}
                style={{
                  background: c.hex,
                }}
              />
            )),
          )}
        </div>
      </div>
      <button
        className="product-name"
        onClick={() => (onSelect ? onSelect(product) : onOpen(product))}
      >
        {tn(product.name)}
      </button>
      <div className="product-price">
        {tn(money(product.price))}
        {tn(
          compact && (
            <button
              aria-label={tt(`Detail ${product.name}`)}
              onClick={() => onOpen(product)}
            >
              <Plus size={16} />
            </button>
          ),
        )}
      </div>
    </article>
  )
}
export function ProductDialog({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  useLocale()
  const { state, add, select, favorite } = useStore(),
    [color, setColor] = useState(0),
    [size, setSize] = useState<Size>('M'),
    [guide, setGuide] = useState(false),
    navigate = useNavigate()
  const selection: Selection = {
    id: product.id,
    color,
    size,
  }
  return (
    <Dialog title={tt('A closer look.')} wide onClose={onClose}>
      <div className="product-detail">
        <div className="detail-photo">
          <img src={imageUrl(product)} alt={tt(product.name)} />
          <span className="photo-note">
            {tn('Foto referensi \xB7 produk demo')}
          </span>
        </div>
        <div className="detail-content">
          <p className="eyebrow">{tn('L\u2019MOR / EVERYDAY COLLECTION')}</p>
          <h3>{tn(product.name)}</h3>
          <p className="detail-price">{tn(money(product.price))}</p>
          <p className="muted">{tn(product.description)}</p>
          <div className="detail-specs">
            <span>{tn(product.fit)}</span>
            <span>{tn(product.material)}</span>
          </div>
          <label className="field-label">
            {tn('Warna ')}
            <span>{tn(product.colors[color].name)}</span>
          </label>
          <Swatches product={product} selected={color} onChange={setColor} />
          <div className="size-heading">
            <label className="field-label">{tn('Ukuran')}</label>
            <button className="text-link" onClick={() => setGuide(!guide)}>
              {tn('Panduan ukuran')}
            </button>
          </div>
          <div className="size-options">
            {tn(
              sizes.map((s) => (
                <button
                  key={s}
                  className={s === size ? 'selected' : ''}
                  aria-pressed={s === size}
                  onClick={() => setSize(s)}
                >
                  {tn(s)}
                </button>
              )),
            )}
          </div>
          {tn(guide && <SizeGuide />)}
          <button
            className="btn btn-dark full"
            onClick={() => {
              add([selection])
              onClose()
            }}
          >
            <ShoppingBag size={17} />
            {tn(' Tambah ke bag')}
          </button>
          <div className="detail-actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                select(selection)
                onClose()
                navigate('/?studio=1')
              }}
            >
              <ScanLine size={17} />
              {tn(' Coba di studio')}
            </button>
            <button
              className="btn btn-outline"
              aria-label={tt('Simpan ke favorit')}
              aria-pressed={state.favorites.includes(product.id)}
              onClick={() => favorite(product.id)}
            >
              <Heart
                size={18}
                fill={
                  state.favorites.includes(product.id) ? 'currentColor' : 'none'
                }
              />
            </button>
          </div>
          <p className="tiny muted">
            {tn(
              'Koleksi dan harga merupakan contoh. Siluet avatar adalah visualisasi, bukan simulasi kain atau jaminan ukuran.',
            )}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
export function SizeGuide() {
  useLocale()
  return (
    <div className="size-guide">
      <p>{tn('Panduan ilustratif (cm)')}</p>
      <table>
        <thead>
          <tr>
            <th>{tn('Ukuran')}</th>
            <th>{tn('Dada')}</th>
            <th>{tn('Pinggang')}</th>
          </tr>
        </thead>
        <tbody>
          {tn(
            sizes.map((s, i) => (
              <tr key={s}>
                <td>{tn(s)}</td>
                <td>
                  {tn(82 + i * 6)}
                  {tn('\u2013')}
                  {tn(87 + i * 6)}
                </td>
                <td>
                  {tn(62 + i * 6)}
                  {tn('\u2013')}
                  {tn(67 + i * 6)}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      <p className="tiny">
        {tn(
          'Referensi demo. Cocokkan dengan pengukuran produk asli sebelum membeli.',
        )}
      </p>
    </div>
  )
}
