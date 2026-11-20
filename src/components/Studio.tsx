import { useLocale, translateNode as tn, translateText as tt } from '../i18n'
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
  useLocale()
  const [raw, setRaw] = useState(String(value))
  const id = label === 'Tinggi badan' ? 'height' : 'weight'
  useEffect(() => setRaw(String(value)), [value])
  return (
    <div className="measurement">
      <div>
        <label htmlFor={`${id}-range`}>{tn(label)}</label>
        <div className="measure-value">
          <input
            aria-label={tt(label)}
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
          <span>{tn(unit)}</span>
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
          {tn(min)} {tn(unit)}
        </span>
        <span>
          {tn(max)} {tn(unit)}
        </span>
      </div>
    </div>
  )
}
export default function Studio({
  active: sceneActive = true,
}: {
  active?: boolean
}) {
  useLocale()
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
          <ScanLine size={15} />
          {tn(' THE PERSONAL STYLE STUDIO')}
        </span>
        <button className="text-link" onClick={() => setInfo(true)}>
          <Info size={15} />
          {tn(' Cara kerjanya')}
        </button>
      </div>
      <div className="section-heading">
        <h2 id="studio-title" tabIndex={-1}>
          {tn('Your fit.')}
          <br /> <span>{tn('Your rules.')}</span>
        </h2>
        <p>
          {tn('Jangan cuma dibayangin.')}
          <br />
          {tn(' Coba, mix & match, jadiin gayamu.')}
        </p>
      </div>
      <div className="studio-layout">
        <div className="wardrobe">
          <div className="wardrobe-heading">
            <h3>
              {tn('Build your look')}
              <span>{tn('.')}</span>
            </h3>
            <button
              className="small-icon"
              title={tt('Lookbook kamu')}
              aria-label={tt('Buka lookbook')}
              onClick={() => setLookbook(true)}
            >
              <Layers size={18} />
              <span>{tn(state.looks.length)}</span>
            </button>
          </div>
          <div className="category-tabs" aria-label={tt('Kategori pakaian')}>
            <button
              className={category === 'tops' ? 'active' : ''}
              aria-pressed={category === 'tops'}
              onClick={() => setCategory('tops')}
            >
              {tn('Baju ')}
              <span>{tn('06')}</span>
            </button>
            <button
              className={category === 'bottoms' ? 'active' : ''}
              aria-pressed={category === 'bottoms'}
              onClick={() => setCategory('bottoms')}
            >
              {tn('Celana ')}
              <span>{tn('06')}</span>
            </button>
          </div>
          <div className="wardrobe-status">
            <span>
              {tn(filtered.length)}
              {tn(' pieces, endless possibilities.')}
            </span>
            <span>
              <Check size={12} />
              {tn(' Pilih untuk coba')}
            </span>
          </div>
          <div className="wardrobe-grid" data-lenis-prevent>
            {tn(
              filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  compact
                  selected={active.id === p.id}
                  onOpen={setDetail}
                  onSelect={(p) =>
                    select({
                      id: p.id,
                      color: 0,
                      size: active.size,
                    })
                  }
                />
              )),
            )}
          </div>
          <div className="garment-controls">
            <div className="field-heading">
              <span className="field-label">
                {tn('Warna ')}
                <span>{tn(activeProduct.colors[active.color].name)}</span>
              </span>
              <Swatches
                product={activeProduct}
                selected={active.color}
                onChange={(color) =>
                  select({
                    ...active,
                    color,
                  })
                }
              />
            </div>
            <div className="field-heading">
              <label htmlFor="studio-size" className="field-label">
                {tn('Ukuran ')}
                {tn(category === 'tops' ? 'baju' : 'celana')}
              </label>
              <div className="select-wrap">
                <select
                  id="studio-size"
                  value={active.size}
                  onChange={(e) =>
                    select({
                      ...active,
                      size: e.target.value as Size,
                    })
                  }
                >
                  {tn(sizes.map((s) => <option key={s}>{tn(s)}</option>))}
                </select>
                <ChevronDown size={13} />
              </div>
            </div>
            <button className="text-link tiny" onClick={() => setGuide(true)}>
              <Ruler size={13} />
              {tn(' Lihat panduan ukuran')}
            </button>
          </div>
        </div>
        <div className="fitting-panel">
          <div className="fitting-header">
            <div className="live-label">
              <span />
              {tn(' LIVE FITTING ')}
              <span className="version">{tn('5D STUDIO')}</span>
            </div>
            <button
              className="text-link"
              onClick={reset}
              aria-label={tt('Reset seluruh studio')}
            >
              <RotateCcw size={13} />
              {tn(' Reset')}
            </button>
          </div>
          <div className="avatar-stage">
            <div className="gender-toggle" aria-label={tt('Pilih model')}>
              <button
                className={state.body.gender === 'male' ? 'active' : ''}
                aria-pressed={state.body.gender === 'male'}
                onClick={() =>
                  setBody({
                    ...state.body,
                    gender: 'male',
                  })
                }
              >
                {tn('Male')}
              </button>
              <button
                className={state.body.gender === 'female' ? 'active' : ''}
                aria-pressed={state.body.gender === 'female'}
                onClick={() =>
                  setBody({
                    ...state.body,
                    gender: 'female',
                  })
                }
              >
                {tn('Female')}
              </button>
            </div>
            <div className="stage-word" aria-hidden="true">
              {tn('YOU.')}
            </div>
            <AvatarView
              active={sceneActive}
              body={state.body}
              top={state.top}
              bottom={state.bottom}
            />
            <div className="outfit-tag">
              <span>{tn('YOUR EVERYDAY LOOK')}</span>
              <span>
                {tn(state.body.height)}
                {tn(' CM / ')}
                {tn(state.body.weight)}
                {tn(' KG')}
              </span>
            </div>
          </div>
          <div className="body-controls">
            <div className="skin-row">
              <label className="field-label">
                {tn('Skin tone ')}
                <span>{tn('Make it yours.')}</span>
              </label>
              <div className="skin-options" aria-label={tt('Warna kulit')}>
                {tn(
                  skinTones.map((hex, skin) => (
                    <button
                      key={hex}
                      className={state.body.skin === skin ? 'selected' : ''}
                      style={{
                        background: hex,
                      }}
                      title={tt(`Skin tone ${skin + 1}`)}
                      aria-label={tt(`Skin tone ${skin + 1}`)}
                      aria-pressed={state.body.skin === skin}
                      onClick={() =>
                        setBody({
                          ...state.body,
                          skin,
                        })
                      }
                    >
                      {tn(
                        state.body.skin === skin && (
                          <Check
                            size={13}
                            color={skin > 2 ? '#fff' : '#3e3226'}
                          />
                        ),
                      )}
                    </button>
                  )),
                )}
              </div>
            </div>
            <div className="measurement-grid">
              <Measurement
                label="Tinggi badan"
                value={state.body.height}
                min={140}
                max={205}
                unit="cm"
                onChange={(height) =>
                  setBody({
                    ...state.body,
                    height,
                  })
                }
              />
              <Measurement
                label="Berat badan"
                value={state.body.weight}
                min={40}
                max={130}
                unit="kg"
                onChange={(weight) =>
                  setBody({
                    ...state.body,
                    weight,
                  })
                }
              />
            </div>
            <p className="fit-note">
              <Info size={12} />
              {tn(
                ' Preview proporsi 3D. Bukan jaminan ukuran atau jatuh kain.',
              )}
            </p>
          </div>
          <div className="look-summary">
            <div>
              <span className="eyebrow">{tn('THE LOOK')}</span>
              <div className="look-pieces">
                <span>
                  {tn(top.name)} <b>{tn(state.top.size)}</b>
                </span>
                <PlusMark />
                <span>
                  {tn(bottom.name)} <b>{tn(state.bottom.size)}</b>
                </span>
              </div>
            </div>
            <strong>{tn(money(top.price + bottom.price))}</strong>
          </div>
          <div className="studio-actions">
            <button className="btn btn-outline" onClick={saveLook}>
              <Heart size={17} />
              {tn(' Saya suka')}
            </button>
            <button className="btn btn-dark" onClick={buy}>
              <ShoppingBag size={17} />
              {tn(' Belanja look ini')}
            </button>
          </div>
        </div>
      </div>
      <div className="studio-foot">
        <span>
          <SlidersHorizontal size={14} />
          {tn(' Ganti proporsi. Lihat langsung. Temukan versimu.')}
        </span>
        <span>{tn('YOUR BODY. YOUR STYLE. YOUR L\u2019MOR.')}</span>
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
      {tn(
        guide && (
          <Dialog title={tt('Find your size.')} onClose={() => setGuide(false)}>
            <SizeGuide />
          </Dialog>
        ),
      )}
      {tn(
        info && (
          <Dialog
            title={tt('Make room for your style.')}
            onClose={() => setInfo(false)}
          >
            <div className="how-list">
              <div>
                <span>
                  <ShoppingBag />
                </span>
                <h3>{tn('Pilih pieces kamu')}</h3>
                <p>
                  {tn(
                    'Klik baju dan celana di sebelah kiri. Keduanya langsung dipadukan pada avatar.',
                  )}
                </p>
              </div>
              <div>
                <span>
                  <SlidersHorizontal />
                </span>
                <h3>{tn('Sesuaikan dengan dirimu')}</h3>
                <p>
                  {tn(
                    'Pilih model dan skin tone, lalu sesuaikan tinggi serta berat badan. Geser avatar untuk melihat sisi lainnya.',
                  )}
                </p>
              </div>
              <div>
                <span>
                  <Heart />
                </span>
                <h3>{tn('Keep the look')}</h3>
                <p>
                  {tn(
                    'Simpan di Lookbook atau tambahkan outfit ke bag. Pilihan tersimpan hanya di browser perangkat ini.',
                  )}
                </p>
              </div>
            </div>
            <div className="soft-notice">
              <Info size={17} />
              <p>
                {tn(
                  'Model manusia 3D ini memakai tekstur kulit dan bentuk tubuh anatomis. Pakaian mewakili pilihan koleksi; foto, material, ukuran, dan harga adalah data demo. Preview belum memperhitungkan drape kain atau ukuran tubuh secara presisi.',
                )}
              </p>
            </div>
          </Dialog>
        ),
      )}
      {tn(
        lookbook && (
          <Dialog
            title={tt('Your little lookbook.')}
            onClose={() => setLookbook(false)}
          >
            {tn(
              !state.looks.length ? (
                <div className="empty-mini">
                  <Layers size={35} />
                  <h3>{tn('Look favoritmu dimulai di sini.')}</h3>
                  <p>
                    {tn(
                      'Padukan outfit, lalu klik \u201CSaya suka\u201D untuk menyimpannya.',
                    )}
                  </p>
                  <button
                    className="btn btn-dark"
                    onClick={() => setLookbook(false)}
                  >
                    {tn('Mulai mix & match')}
                  </button>
                </div>
              ) : (
                <div className="saved-looks">
                  {tn(
                    state.looks.map((look, i) => (
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
                          <b>
                            {tn('My look ')}
                            {tn(state.looks.length - i)}
                          </b>
                          <p>
                            {tn(productById(look.top.id)?.name)}
                            <br />
                            {tn(productById(look.bottom.id)?.name)}
                          </p>
                          <button
                            className="text-link"
                            onClick={() => {
                              restoreLook(look.id)
                              setLookbook(false)
                            }}
                          >
                            {tn('Pakai look ini')}
                          </button>
                        </div>
                        <button
                          className="icon-btn"
                          aria-label={tt('Hapus look')}
                          onClick={() => removeLook(look.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )),
                  )}
                </div>
              ),
            )}
            <p className="tiny muted">
              {tn('Maksimal 12 look, tersimpan di browser ini.')}
            </p>
          </Dialog>
        ),
      )}
    </section>
  )
}
function PlusMark() {
  useLocale()
  return (
    <span className="look-plus" aria-hidden="true">
      {tn('+')}
    </span>
  )
}
