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
  return (
    <div className="swatches" role="group" aria-label={`Warna ${product.name}`}>
      {product.colors.map((color, i) => (
        <button
          key={color.name}
          className={`swatch ${selected === i ? 'selected' : ''}`}
          style={{ '--swatch': color.hex } as React.CSSProperties}
          aria-label={color.name}
          aria-pressed={selected === i}
          title={color.name}
          onClick={() => onChange(i)}
        >
          {selected === i && (
            <Check
              size={12}
              style={{
                color:
                  i === 0 && color.hex === '#f1eddf' ? '#292b25' : undefined,
              }}
            />
          )}
        </button>
      ))}
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
          aria-label={`${onSelect ? 'Pakai' : 'Lihat'} ${product.name}`}
        >
          <img
            src={imageUrl(product)}
            alt={product.name}
            loading="lazy"
            width="760"
            height="900"
          />
          {selected && (
            <span className="selected-label">
              <Check size={12} /> DIPAKAI
            </span>
          )}
        </button>
        {product.badge && !selected && (
          <span
            className={`product-badge ${product.badge === 'NEW' ? 'lime' : ''}`}
          >
            {product.badge}
          </span>
        )}
        <button
          className={`favorite-btn ${saved ? 'saved' : ''}`}
          aria-label={`${saved ? 'Hapus' : 'Simpan'} ${product.name} ${saved ? 'dari' : 'ke'} favorit`}
          aria-pressed={saved}
          onClick={() => favorite(product.id)}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {!compact && (
          <button className="quick-view" onClick={() => onOpen(product)}>
            <Plus size={15} /> Lihat detail
          </button>
        )}
      </div>
      <div className="product-meta">
        <span>{product.fit}</span>
        <div
          className="mini-swatches"
          role="img"
          aria-label={`${product.colors.length} pilihan warna`}
        >
          {product.colors.map((c) => (
            <i key={c.name} style={{ background: c.hex }} />
          ))}
        </div>
      </div>
      <button
        className="product-name"
        onClick={() => (onSelect ? onSelect(product) : onOpen(product))}
      >
        {product.name}
      </button>
      <div className="product-price">
        {money(product.price)}
        {compact && (
          <button
            aria-label={`Detail ${product.name}`}
            onClick={() => onOpen(product)}
          >
            <Plus size={16} />
          </button>
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
  const { state, add, select, favorite } = useStore(),
    [color, setColor] = useState(0),
    [size, setSize] = useState<Size>('M'),
    [guide, setGuide] = useState(false),
    navigate = useNavigate()
  const selection: Selection = { id: product.id, color, size }
  return (
    <Dialog title="A closer look." wide onClose={onClose}>
      <div className="product-detail">
        <div className="detail-photo">
          <img src={imageUrl(product)} alt={product.name} />
          <span className="photo-note">Foto referensi · produk demo</span>
        </div>
        <div className="detail-content">
          <p className="eyebrow">L’MOR / EVERYDAY COLLECTION</p>
          <h3>{product.name}</h3>
          <p className="detail-price">{money(product.price)}</p>
          <p className="muted">{product.description}</p>
          <div className="detail-specs">
            <span>{product.fit}</span>
            <span>{product.material}</span>
          </div>
          <label className="field-label">
            Warna <span>{product.colors[color].name}</span>
          </label>
          <Swatches product={product} selected={color} onChange={setColor} />
          <div className="size-heading">
            <label className="field-label">Ukuran</label>
            <button className="text-link" onClick={() => setGuide(!guide)}>
              Panduan ukuran
            </button>
          </div>
          <div className="size-options">
            {sizes.map((s) => (
              <button
                key={s}
                className={s === size ? 'selected' : ''}
                aria-pressed={s === size}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {guide && <SizeGuide />}
          <button
            className="btn btn-dark full"
            onClick={() => {
              add([selection])
              onClose()
            }}
          >
            <ShoppingBag size={17} /> Tambah ke bag
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
              <ScanLine size={17} /> Coba di studio
            </button>
            <button
              className="btn btn-outline"
              aria-label="Simpan ke favorit"
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
            Koleksi dan harga merupakan contoh. Siluet avatar adalah
            visualisasi, bukan simulasi kain atau jaminan ukuran.
          </p>
        </div>
      </div>
    </Dialog>
  )
}
export function SizeGuide() {
  return (
    <div className="size-guide">
      <p>Panduan ilustratif (cm)</p>
      <table>
        <thead>
          <tr>
            <th>Ukuran</th>
            <th>Dada</th>
            <th>Pinggang</th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((s, i) => (
            <tr key={s}>
              <td>{s}</td>
              <td>
                {82 + i * 6}–{87 + i * 6}
              </td>
              <td>
                {62 + i * 6}–{67 + i * 6}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tiny">
        Referensi demo. Cocokkan dengan pengukuran produk asli sebelum membeli.
      </p>
    </div>
  )
}
