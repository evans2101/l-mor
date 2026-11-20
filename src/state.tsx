import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultBody,
  defaultBottom,
  defaultTop,
  productById,
  products,
  sizes,
  type Body,
  type Selection,
} from './data'
export type CartItem = Selection & { quantity: number }
export type SavedLook = {
  id: string
  top: Selection
  bottom: Selection
  body: Body
}
export type Persisted = {
  version: 1
  cart: CartItem[]
  favorites: string[]
  looks: SavedLook[]
  top: Selection
  bottom: Selection
  body: Body
}
const initial: Persisted = {
  version: 1,
  cart: [],
  favorites: [],
  looks: [],
  top: defaultTop,
  bottom: defaultBottom,
  body: defaultBody,
}
export const STORAGE_KEY = 'lmor-studio-v1'
const validSelection = (s: unknown): s is Selection => {
  if (!s || typeof s !== 'object') return false
  const v = s as Selection,
    p = productById(v.id)
  return (
    !!p &&
    Number.isInteger(v.color) &&
    v.color >= 0 &&
    v.color < p.colors.length &&
    sizes.includes(v.size)
  )
}
export function readState(raw: string | null): Persisted {
  try {
    const s = JSON.parse(raw || 'null') as Partial<Persisted> | null
    if (!s || s.version !== 1) return initial
    const b = s.body
    const body: Body =
      b &&
      (b.gender === 'male' || b.gender === 'female') &&
      Number.isInteger(b.skin) &&
      b.skin >= 0 &&
      b.skin < 6 &&
      Number.isFinite(b.height) &&
      Number.isFinite(b.weight)
        ? {
            ...b,
            height: Math.min(205, Math.max(140, b.height)),
            weight: Math.min(130, Math.max(40, b.weight)),
          }
        : defaultBody
    return {
      version: 1,
      cart: Array.isArray(s.cart)
        ? s.cart
            .filter(
              (x) =>
                validSelection(x) &&
                Number.isInteger(x.quantity) &&
                x.quantity > 0 &&
                x.quantity <= 20,
            )
            .slice(0, 100)
        : [],
      favorites: Array.isArray(s.favorites)
        ? [
            ...new Set(
              s.favorites.filter((x) => products.some((p) => p.id === x)),
            ),
          ]
        : [],
      looks: Array.isArray(s.looks)
        ? s.looks
            .filter(
              (x) =>
                x &&
                typeof x.id === 'string' &&
                validSelection(x.top) &&
                validSelection(x.bottom) &&
                x.body &&
                (x.body.gender === 'male' || x.body.gender === 'female') &&
                Number.isInteger(x.body.skin) &&
                x.body.skin >= 0 &&
                x.body.skin < 6 &&
                Number.isFinite(x.body.height) &&
                x.body.height >= 140 &&
                x.body.height <= 205 &&
                Number.isFinite(x.body.weight) &&
                x.body.weight >= 40 &&
                x.body.weight <= 130,
            )
            .slice(0, 12)
        : [],
      top:
        validSelection(s.top) && productById(s.top.id)?.category === 'tops'
          ? s.top
          : defaultTop,
      bottom:
        validSelection(s.bottom) &&
        productById(s.bottom.id)?.category === 'bottoms'
          ? s.bottom
          : defaultBottom,
      body,
    }
  } catch {
    return initial
  }
}
export const itemKey = (s: Selection) => `${s.id}:${s.color}:${s.size}`
export function addItems(cart: CartItem[], items: Selection[]): CartItem[] {
  return items.reduce((result, item) => {
    const key = itemKey(item),
      existing = result.find((x) => itemKey(x) === key)
    return existing
      ? result.map((x) =>
          itemKey(x) === key
            ? { ...x, quantity: Math.min(20, x.quantity + 1) }
            : x,
        )
      : [...result, { ...item, quantity: 1 }]
  }, cart)
}
export function totals(cart: CartItem[], coupon = '') {
  const subtotal = cart.reduce(
    (n, x) => n + (productById(x.id)?.price || 0) * x.quantity,
    0,
  )
  const discount = coupon === 'LMOR10' ? Math.round(subtotal * 0.1) : 0
  const shipping = subtotal === 0 || subtotal >= 500000 ? 0 : 20000
  return { subtotal, discount, shipping, total: subtotal - discount + shipping }
}
type Store = {
  state: Persisted
  setBody: (body: Body) => void
  select: (selection: Selection) => void
  add: (items: Selection[]) => void
  updateQuantity: (key: string, quantity: number) => void
  favorite: (id: string) => void
  saveLook: () => void
  restoreLook: (id: string) => void
  removeLook: (id: string) => void
  reset: () => void
  toast: (message: string) => void
}
const Context = createContext<Store | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => {
    try {
      return readState(localStorage.getItem(STORAGE_KEY))
    } catch {
      return initial
    }
  })
  const [message, setMessage] = useState('')
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* Private browsing can disable persistent storage. */
    }
  }, [state])
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3200)
      return () => clearTimeout(timer)
    }
  }, [message])
  const toast = (msg: string) => setMessage(msg)
  const value: Store = {
    state,
    toast,
    setBody: (body) => setState((s) => ({ ...s, body })),
    select: (selection) =>
      setState((s) => ({
        ...s,
        [productById(selection.id)?.category === 'tops' ? 'top' : 'bottom']:
          selection,
      })),
    add: (items) => {
      setState((s) => ({ ...s, cart: addItems(s.cart, items) }))
      toast('Pilihan kamu masuk ke bag.')
    },
    updateQuantity: (key, quantity) =>
      setState((s) => ({
        ...s,
        cart:
          quantity <= 0
            ? s.cart.filter((x) => itemKey(x) !== key)
            : s.cart.map((x) =>
                itemKey(x) === key
                  ? { ...x, quantity: Math.min(20, quantity) }
                  : x,
              ),
      })),
    favorite: (id) =>
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((x) => x !== id)
          : [...s.favorites, id],
      })),
    saveLook: () => {
      setState((s) => ({
        ...s,
        looks: [
          {
            id: crypto.randomUUID(),
            top: { ...s.top },
            bottom: { ...s.bottom },
            body: { ...s.body },
          },
          ...s.looks,
        ].slice(0, 12),
      }))
      toast('Look disimpan. Temukan lagi di Lookbook kamu.')
    },
    restoreLook: (id) =>
      setState((s) => {
        const look = s.looks.find((x) => x.id === id)
        return look
          ? { ...s, top: look.top, bottom: look.bottom, body: look.body }
          : s
      }),
    removeLook: (id) =>
      setState((s) => ({ ...s, looks: s.looks.filter((x) => x.id !== id) })),
    reset: () => {
      setState((s) => ({
        ...s,
        body: defaultBody,
        top: defaultTop,
        bottom: defaultBottom,
      }))
      toast('Studio kembali ke look awal.')
    },
  }
  return (
    <Context.Provider value={value}>
      {children}
      <div className={`toast ${message ? 'show' : ''}`} role="status">
        {message}
      </div>
    </Context.Provider>
  )
}
export function useStore() {
  const store = useContext(Context)
  if (!store) throw new Error('StoreProvider is required')
  return store
}
