import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { products, defaultBody, defaultTop, defaultBottom } from '../src/data'
import { humanConfig } from '../src/realisticHuman'
import { readGlb } from '../src/vendor/humanforge/glb'
const manifest = JSON.parse(readFileSync('public/human/manifest.json', 'utf8'))
describe('realistic humans and matching garment assets', () => {
  it('uses anatomical shape targets with monotonic height and weight controls', () => {
    const normal = humanConfig(defaultBody, defaultTop, defaultBottom)
    const heavier = humanConfig(
      { ...defaultBody, weight: 110 },
      defaultTop,
      defaultBottom,
    )
    expect(heavier.weight).toBeGreaterThan(normal.weight!)
    expect(
      humanConfig({ ...defaultBody, height: 205 }, defaultTop, defaultBottom)
        .height,
    ).toBeGreaterThan(normal.height!)
    expect(
      manifest.shapes.morphs.some(
        (m: { name: string }) => m.name === 'macro/weightUpM',
      ),
    ).toBe(true)
    expect(normal.gender).toBe(1)
    expect(
      humanConfig(
        { ...defaultBody, gender: 'female' },
        defaultTop,
        defaultBottom,
      ).gender,
    ).toBe(0)
  })
  it('has local skin textures and real hair proxies for every selectable model and skin tone', () => {
    for (const gender of ['male', 'female'] as const)
      for (let skin = 0; skin < 6; skin++) {
        const c = humanConfig(
          { ...defaultBody, gender, skin },
          defaultTop,
          defaultBottom,
        )
        expect(existsSync(`public/human/skins/${c.skin}_2k.webp`)).toBe(true)
        expect(
          manifest.proxies.some(
            (p: { id: string; kind: string }) =>
              p.kind === 'hair' && p.id === c.hair,
          ),
        ).toBe(true)
      }
  })
  it('uses independent skinned garment meshes and preserves the original catalog photographs', () => {
    for (const product of products) {
      const s = { id: product.id, color: 0, size: 'M' as const }
      const c = humanConfig(
        defaultBody,
        product.category === 'tops' ? s : defaultTop,
        product.category === 'bottoms' ? s : defaultBottom,
      )
      const id = c.clothes!.find((id) =>
        id.startsWith(
          product.category === 'tops' ? 'lmor_top_' : 'lmor_bottom_',
        ),
      )
      const meta = manifest.proxies.find((p: { id: string }) => p.id === id)
      const bytes = gunzipSync(readFileSync(`public/human/${meta.file}`))
      const prim = readGlb(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
      )
      expect(prim.index.length).toBeGreaterThan(500)
      expect(prim.attributes._REFS).toBeDefined()
      expect(prim.attributes._WEIGHTS).toBeDefined()
      expect(prim.attributes.TEXCOORD_0).toBeDefined()
      expect(existsSync(`public/images/${product.image}.jpg`)).toBe(true)
    }
  })
})
