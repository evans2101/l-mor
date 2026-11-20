import { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  Heart,
  Info,
  Layers,
  RotateCcw,
  Ruler,
  ScanLine,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  defaultBody,
  money,
  productById,
  products,
  sizes,
  skinTones,
  type Category,
  type Product,
  type Size,
} from '../data'
import { useStore } from '../state'
import AvatarView from './AvatarView'
import Dialog from './Dialog'
import { ProductCard, ProductDialog, Swatches, SizeGuide } from './Product'
function Measurement({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
}) {
  const [raw, setRaw] = useState(String(value))
  const id = label === 'Tinggi badan' ? 'height' : 'weight'
  useEffect(() => setRaw(String(value)), [value])
  return (
    <div className="measurement">
      <div>
        <label htmlFor={`${id}-range`}>{label}</label>
        <div className="measure-value">
          <input
            aria-label={label}
            type="number"
            min={min}
            max={max}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              const n = Number(e.target.value)
              if (e.target.value && n >= min && n <= max) onChange(n)
            }}
            onBlur={() => {
              const n = Number(raw)
              const next = Math.min(
                max,
                Math.max(min, Number.isFinite(n) && raw ? n : value),
              )
              onChange(next)
              setRaw(String(next))
            }}
          />
          <span>{unit}</span>
        </div>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={
          {
            '--range': `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      <div className="range-labels">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  )
}
export default function Studio() {
  const {
      state,
      select,
      setBody,
      add,
      saveLook,
      restoreLook,
      removeLook,
      reset,
    } = useStore(),
    navigate = useNavigate()
  const [category, setCategory] = useState<Category>('tops'),
    [detail, setDetail] = useState<Product | null>(null),
    [info, setInfo] = useState(false),
    [lookbook, setLookbook] = useState(false),
    [guide, setGuide] = useState(false)
  const top = productById(state.top.id)!,
    bottom = productById(state.bottom.id)!,
    active = category === 'tops' ? state.top : state.bottom,
    activeProduct = productById(active.id)!
  const filtered = products.filter((p) => p.category === category)
  const buy = () => {
    add([state.top, state.bottom])
    navigate('/cart')
  }
  return (
    <section
      className="studio-section"
      id="studio"
      aria-labelledby="studio-title"
    >
      <div className="section-topline">
        <span className="eyebrow">
          <ScanLine size={15} /> THE PERSONAL STYLE STUDIO
        </span>
        <button className="text-link" onClick={() => setInfo(true)}>
          <Info size={15} /> Cara kerjanya
        </button>
      </div>
      <div className="section-heading">
        <h2 id="studio-title">
          Your fit. <span>Your rules.</span>
        </h2>
        <p>
          Jangan cuma dibayangin.
          <br />
          Coba, mix & match, jadiin gayamu.
        </p>
      </div>
      <div className="studio-layout">
        <div className="wardrobe">
          <div className="wardrobe-heading">
            <h3>
              Build your look<span>.</span>
            </h3>
            <button
              className="small-icon"
              title="Lookbook kamu"
              aria-label="Buka lookbook"
              onClick={() => setLookbook(true)}
            >
              <Layers size={18} />
              <span>{state.looks.length}</span>
            </button>
          </div>
          <div className="category-tabs" aria-label="Kategori pakaian">
            <button
              className={category === 'tops' ? 'active' : ''}
              aria-pressed={category === 'tops'}
              onClick={() => setCategory('tops')}
            >
              Baju <span>06</span>
            </button>
            <button
              className={category === 'bottoms' ? 'active' : ''}
              aria-pressed={category === 'bottoms'}
              onClick={() => setCategory('bottoms')}
            >
              Celana <span>06</span>
            </button>
          </div>
          <div className="wardrobe-status">
            <span>{filtered.length} pieces, endless possibilities.</span>
            <span>
              <Check size={12} /> Pilih untuk coba
            </span>
          </div>
          <div className="wardrobe-grid">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                compact
                selected={active.id === p.id}
                onOpen={setDetail}
                onSelect={(p) =>
                  select({ id: p.id, color: 0, size: active.size })
                }
              />
            ))}
          </div>
          <div className="garment-controls">
            <div className="field-heading">
              <span className="field-label">
                Warna <span>{activeProduct.colors[active.color].name}</span>
              </span>
              <Swatches
                product={activeProduct}
                selected={active.color}
                onChange={(color) => select({ ...active, color })}
              />
            </div>
            <div className="field-heading">
              <label htmlFor="studio-size" className="field-label">
                Ukuran {category === 'tops' ? 'baju' : 'celana'}
              </label>
              <div className="select-wrap">
                <select
                  id="studio-size"
                  value={active.size}
                  onChange={(e) =>
                    select({ ...active, size: e.target.value as Size })
                  }
                >
                  {sizes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </div>
            </div>
            <button className="text-link tiny" onClick={() => setGuide(true)}>
              <Ruler size={13} /> Lihat panduan ukuran
            </button>
          </div>
        </div>
        <div className="fitting-panel">
          <div className="fitting-header">
            <div className="live-label">
              <span /> LIVE FITTING <span className="version">5D STUDIO</span>
            </div>
            <button
              className="text-link"
              onClick={reset}
              aria-label="Reset seluruh studio"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
          <div className="avatar-stage">
            <div className="gender-toggle" aria-label="Pilih model">
              <button
                className={state.body.gender === 'male' ? 'active' : ''}
                aria-pressed={state.body.gender === 'male'}
                onClick={() => setBody({ ...state.body, gender: 'male' })}
              >
                Male
              </button>
              <button
                className={state.body.gender === 'female' ? 'active' : ''}
                aria-pressed={state.body.gender === 'female'}
                onClick={() => setBody({ ...state.body, gender: 'female' })}
              >
                Female
              </button>
            </div>
            <div className="stage-word" aria-hidden="true">
              YOU.
            </div>
            <AvatarView
              body={state.body}
              top={state.top}
              bottom={state.bottom}
            />
            <div className="outfit-tag">
              <span>YOUR EVERYDAY LOOK</span>
              <span>
                {state.body.height} CM / {state.body.weight} KG
              </span>
            </div>
          </div>
          <div className="body-controls">
            <div className="skin-row">
              <label className="field-label">
                Skin tone <span>Make it yours.</span>
              </label>
              <div className="skin-options" aria-label="Warna kulit">
                {skinTones.map((hex, skin) => (
                  <button
                    key={hex}
                    className={state.body.skin === skin ? 'selected' : ''}
                    style={{ background: hex }}
                    title={`Skin tone ${skin + 1}`}
                    aria-label={`Skin tone ${skin + 1}`}
                    aria-pressed={state.body.skin === skin}
                    onClick={() => setBody({ ...state.body, skin })}
                  >
                    {state.body.skin === skin && (
                      <Check size={13} color={skin > 2 ? '#fff' : '#3e3226'} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="measurement-grid">
              <Measurement
                label="Tinggi badan"
                value={state.body.height}
                min={140}
                max={205}
                unit="cm"
                onChange={(height) => setBody({ ...state.body, height })}
              />
              <Measurement
                label="Berat badan"
                value={state.body.weight}
                min={40}
                max={130}
                unit="kg"
                onChange={(weight) => setBody({ ...state.body, weight })}
              />
            </div>
            <p className="fit-note">
              <Info size={12} /> Preview proporsi 3D. Bukan jaminan ukuran atau
              jatuh kain.
            </p>
          </div>
          <div className="look-summary">
            <div>
              <span className="eyebrow">THE LOOK</span>
              <div className="look-pieces">
                <span>
                  {top.name} <b>{state.top.size}</b>
                </span>
                <PlusMark />
                <span>
                  {bottom.name} <b>{state.bottom.size}</b>
                </span>
              </div>
            </div>
            <strong>{money(top.price + bottom.price)}</strong>
          </div>
          <div className="studio-actions">
            <button className="btn btn-outline" onClick={saveLook}>
              <Heart size={17} /> Saya suka
            </button>
            <button className="btn btn-dark" onClick={buy}>
              <ShoppingBag size={17} /> Belanja look ini
            </button>
          </div>
        </div>
      </div>
      <div className="studio-foot">
        <span>
          <SlidersHorizontal size={14} /> Ganti proporsi. Lihat langsung.
          Temukan versimu.
        </span>
        <span>YOUR BODY. YOUR STYLE. YOUR L’MOR.</span>
      </div>
      {detail && (
        <ProductDialog
          key={detail.id}
          product={detail}
          onClose={() => setDetail(null)}
        />
      )}
      {guide && (
        <Dialog title="Find your size." onClose={() => setGuide(false)}>
          <SizeGuide />
        </Dialog>
      )}
      {info && (
        <Dialog
          title="Make room for your style."
          onClose={() => setInfo(false)}
        >
          <div className="how-list">
            <div>
              <span>
                <ShoppingBag />
              </span>
              <h3>Pilih pieces kamu</h3>
              <p>
                Klik baju dan celana di sebelah kiri. Keduanya langsung
                dipadukan pada avatar.
              </p>
            </div>
            <div>
              <span>
                <SlidersHorizontal />
              </span>
              <h3>Sesuaikan dengan dirimu</h3>
              <p>
                Pilih model dan skin tone, lalu sesuaikan tinggi serta berat
                badan. Geser avatar untuk melihat sisi lainnya.
              </p>
            </div>
            <div>
              <span>
                <Heart />
              </span>
              <h3>Keep the look</h3>
              <p>
                Simpan di Lookbook atau tambahkan outfit ke bag. Pilihan
                tersimpan hanya di browser perangkat ini.
              </p>
            </div>
          </div>
          <div className="soft-notice">
            <Info size={17} />
            <p>
              Ini visualisasi avatar 3D bergaya ilustratif. Bentuk pakaian
              mewakili kategori produk; foto, material, ukuran, dan harga adalah
              data demo. Preview belum memperhitungkan drape kain atau ukuran
              tubuh secara presisi.
            </p>
          </div>
        </Dialog>
      )}
      {lookbook && (
        <Dialog
          title="Your little lookbook."
          onClose={() => setLookbook(false)}
        >
          {!state.looks.length ? (
            <div className="empty-mini">
              <Layers size={35} />
              <h3>Look favoritmu dimulai di sini.</h3>
              <p>Padukan outfit, lalu klik “Saya suka” untuk menyimpannya.</p>
              <button
                className="btn btn-dark"
                onClick={() => setLookbook(false)}
              >
                Mulai mix & match
              </button>
            </div>
          ) : (
            <div className="saved-looks">
              {state.looks.map((look, i) => (
                <div className="saved-look" key={look.id}>
                  <div
                    className="look-swatch"
                    style={{
                      background: productById(look.top.id)!.colors[
                        look.top.color
                      ].hex,
                    }}
                  >
                    <span
                      style={{
                        background: productById(look.bottom.id)!.colors[
                          look.bottom.color
                        ].hex,
                      }}
                    />
                  </div>
                  <div>
                    <b>My look {state.looks.length - i}</b>
                    <p>
                      {productById(look.top.id)?.name}
                      <br />
                      {productById(look.bottom.id)?.name}
                    </p>
                    <button
                      className="text-link"
                      onClick={() => {
                        restoreLook(look.id)
                        setLookbook(false)
                      }}
                    >
                      Pakai look ini
                    </button>
                  </div>
                  <button
                    className="icon-btn"
                    aria-label="Hapus look"
                    onClick={() => removeLook(look.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="tiny muted">
            Maksimal 12 look, tersimpan di browser ini.
          </p>
        </Dialog>
      )}
    </section>
  )
}
function PlusMark() {
  return (
    <span className="look-plus" aria-hidden="true">
      +
    </span>
  )
}
export const heroBody = { ...defaultBody, skin: 2 }
