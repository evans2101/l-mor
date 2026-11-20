export type Category = 'tops' | 'bottoms'
import { getLocale } from './i18n'
export type Gender = 'male' | 'female'
export type Garment =
  | 'tee'
  | 'shirt'
  | 'hoodie'
  | 'jacket'
  | 'trousers'
  | 'denim'
  | 'cargo'
  | 'shorts'
export type Color = { name: string; hex: string }
export type Product = {
  id: string
  name: string
  category: Category
  type: Garment
  price: number
  image: string
  colors: Color[]
  fit: string
  material: string
  badge?: string
  gender: 'unisex' | Gender
  description: string
}
const color = (name: string, hex: string) => ({ name, hex })
export const products: Product[] = [
  {
    id: 'essential-tee',
    name: 'Essential Oversized Tee',
    category: 'tops',
    type: 'tee',
    price: 189000,
    image: 'tee-white',
    colors: [
      color('Chalk', '#f1eddf'),
      color('Ink', '#30312e'),
      color('Sage', '#9ca58d'),
    ],
    fit: 'Oversized fit',
    material: 'Cotton combed 240 gsm',
    badge: 'ESSENTIAL',
    gender: 'unisex',
    description:
      'Siluet santai dengan bahu turun dan bahan katun yang terasa lembut. Satu tee, banyak kemungkinan.',
  },
  {
    id: 'washed-tee',
    name: 'Everyday Washed Tee',
    category: 'tops',
    type: 'tee',
    price: 219000,
    image: 'tee-washed',
    colors: [
      color('Washed charcoal', '#252624'),
      color('Dusty rose', '#bf9290'),
      color('Ecru', '#dcd1ba'),
    ],
    fit: 'Relaxed fit',
    material: 'Washed cotton 220 gsm',
    badge: 'NEW',
    gender: 'unisex',
    description:
      'Warna washed yang punya karakter, dalam potongan relaxed untuk hari yang bergerak mengikuti kamu.',
  },
  {
    id: 'resort-shirt',
    name: 'Weekend Resort Shirt',
    category: 'tops',
    type: 'shirt',
    price: 329000,
    image: 'shirt-sage',
    colors: [
      color('White', '#f2f1eb'),
      color('Sand', '#c8b896'),
      color('Midnight', '#373e4b'),
    ],
    fit: 'Boxy fit',
    material: 'Linen cotton blend',
    gender: 'unisex',
    description:
      'Kemeja boxy ringan dengan kerah terbuka. Pas untuk akhir pekan atau hari biasa yang ingin terasa berbeda.',
  },
  {
    id: 'oxford-shirt',
    name: 'Studio Oxford Shirt',
    category: 'tops',
    type: 'shirt',
    price: 359000,
    image: 'shirt-oxford',
    colors: [
      color('Navy', '#3d4b5c'),
      color('White', '#f3f0e7'),
      color('Burgundy', '#6f3f48'),
    ],
    fit: 'Regular fit',
    material: 'Cotton oxford',
    gender: 'male',
    description:
      'Oxford klasik dengan detail bersih. Mudah dipadukan, dari denim santai sampai celana tailored.',
  },
  {
    id: 'cloud-hoodie',
    name: 'Cloud Relaxed Hoodie',
    category: 'tops',
    type: 'hoodie',
    price: 429000,
    image: 'hoodie',
    colors: [
      color('Sage grey', '#9eaea9'),
      color('Forest', '#536357'),
      color('Ink', '#30312e'),
    ],
    fit: 'Relaxed fit',
    material: 'Cotton fleece 330 gsm',
    badge: 'COZY PICK',
    gender: 'unisex',
    description:
      'Hoodie bervolume dengan bagian dalam yang lembut. Dibuat untuk layering dan momen tanpa agenda.',
  },
  {
    id: 'daily-jacket',
    name: 'Daily Utility Jacket',
    category: 'tops',
    type: 'jacket',
    price: 549000,
    image: 'jacket',
    colors: [
      color('Black', '#252625'),
      color('Espresso', '#604b40'),
      color('Olive', '#74765b'),
    ],
    fit: 'Boxy fit',
    material: 'Cotton twill',
    gender: 'unisex',
    description:
      'Outer berkarakter dengan potongan utility dan detail saku. Sentuhan terakhir untuk look sehari-hari.',
  },
  {
    id: 'pleated-trouser',
    name: 'Flow Pocket Joggers',
    category: 'bottoms',
    type: 'trousers',
    price: 389000,
    image: 'trousers',
    colors: [
      color('Dusty rose', '#d3a295'),
      color('Charcoal', '#4c4d49'),
      color('Cream', '#e6decb'),
    ],
    fit: 'Relaxed tapered fit',
    material: 'Poly rayon twill',
    badge: 'ESSENTIAL',
    gender: 'unisex',
    description:
      'Celana tapered dengan saku depan dan waistband elastis. Ruang gerak lebih, tanpa kehilangan bentuk.',
  },
  {
    id: 'straight-denim',
    name: 'Original Straight Denim',
    category: 'bottoms',
    type: 'denim',
    price: 449000,
    image: 'denim',
    colors: [
      color('Indigo', '#465c76'),
      color('Washed black', '#4e5050'),
      color('Vintage blue', '#8dabc0'),
    ],
    fit: 'Straight fit',
    material: 'Denim cotton 12 oz',
    gender: 'unisex',
    description:
      'Denim lurus yang timeless. Tekstur autentik dan proporsi pas untuk menemani rotasi outfit kamu.',
  },
  {
    id: 'utility-cargo',
    name: 'Utility Cargo Pants',
    category: 'bottoms',
    type: 'cargo',
    price: 399000,
    image: 'chino',
    colors: [
      color('Olive', '#7b8166'),
      color('Sand', '#bdae90'),
      color('Black', '#30312e'),
    ],
    fit: 'Relaxed fit',
    material: 'Cotton ripstop',
    badge: 'NEW',
    gender: 'unisex',
    description:
      'Siluet utility dengan saku samping dan ruang gerak leluasa. Partner yang pas untuk tee favoritmu.',
  },
  {
    id: 'light-denim',
    name: 'Daylight Wide Denim',
    category: 'bottoms',
    type: 'denim',
    price: 459000,
    image: 'denim-light',
    colors: [color('Ice blue', '#9bb8ca'), color('Off white', '#e9e3d5')],
    fit: 'Wide fit',
    material: 'Denim cotton 11 oz',
    gender: 'female',
    description:
      'Denim lebar dengan nuansa warna ringan. Pinggang tinggi dan siluet santai untuk tampil sebagai diri sendiri.',
  },
  {
    id: 'daily-chino',
    name: 'Daily Straight Chino',
    category: 'bottoms',
    type: 'trousers',
    price: 349000,
    image: 'chino',
    colors: [
      color('Khaki', '#b5a17f'),
      color('Navy', '#394459'),
      color('Stone', '#bab9ad'),
    ],
    fit: 'Straight fit',
    material: 'Cotton stretch twill',
    gender: 'male',
    description:
      'Celana chino serbaguna dengan sentuhan stretch. Terlihat rapi, tetap terasa nyaman sepanjang hari.',
  },
  {
    id: 'weekend-short',
    name: 'Off Duty Joggers',
    category: 'bottoms',
    type: 'trousers',
    price: 259000,
    image: 'trousers',
    colors: [
      color('Dusty rose', '#d3a295'),
      color('Olive', '#7b8166'),
      color('Ink', '#30312e'),
    ],
    fit: 'Relaxed fit',
    material: 'Cotton twill',
    gender: 'unisex',
    description:
      'Celana jogger dengan pergelangan elastis dan potongan santai. Untuk langkah ringan di hari libur.',
  },
]
export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export type Size = (typeof sizes)[number]
export const skinTones = [
  '#f1d3b4',
  '#dfb18a',
  '#c48e64',
  '#a5714d',
  '#805238',
  '#543a2d',
]
export const money = (n: number) =>
  new Intl.NumberFormat(
    { id: 'id-ID', en: 'en-US', zh: 'zh-CN' }[getLocale()],
    {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    },
  ).format(n)
export const productById = (id: string) => products.find((p) => p.id === id)
export const imageUrl = (p: Product) =>
  `${import.meta.env.BASE_URL}images/${p.image}.jpg`
export type Selection = { id: string; color: number; size: Size }
export type Body = {
  gender: Gender
  skin: number
  height: number
  weight: number
}
export const defaultBody: Body = {
  gender: 'male',
  skin: 2,
  height: 175,
  weight: 68,
}
export const defaultTop: Selection = {
  id: 'essential-tee',
  color: 0,
  size: 'M',
}
export const defaultBottom: Selection = {
  id: 'utility-cargo',
  color: 0,
  size: 'M',
}
