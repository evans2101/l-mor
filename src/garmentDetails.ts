import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { HumanAvatar } from './vendor/humanforge/runtime'
import type { Selection } from './data'
let tiePattern: THREE.CanvasTexture | undefined
const materialCache = new WeakMap<HumanAvatar, Map<string, THREE.Material>>()
function cachedMaterial<T extends THREE.Material>(
  avatar: HumanAvatar,
  key: string,
  create: () => T,
): T {
  let cache = materialCache.get(avatar)
  if (!cache) {
    cache = new Map()
    materialCache.set(avatar, cache)
  }
  if (!cache.has(key)) cache.set(key, create())
  return cache.get(key) as T
}
function dots() {
  if (!tiePattern) {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#302e28'
    ctx.fillRect(0, 0, 128, 256)
    ctx.fillStyle = '#e0dbcb'
    for (let y = 10; y < 256; y += 20)
      for (let x = 8 + (y % 40 ? 10 : 0); x < 128; x += 20) {
        ctx.beginPath()
        ctx.arc(x, y, 3.5, 0, Math.PI * 2)
        ctx.fill()
      }
    tiePattern = new THREE.CanvasTexture(canvas)
    tiePattern.colorSpace = THREE.SRGBColorSpace
  }
  return tiePattern
}
export function disposeGarmentDetails(avatar: HumanAvatar, release = false) {
  const old = avatar.group.getObjectByName('lmor-details')
  if (!old) {
    if (release) {
      materialCache.get(avatar)?.forEach((m) => m.dispose())
      materialCache.delete(avatar)
    }
    return
  }
  avatar.group.remove(old)
  old.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose()
    }
  })
  if (release) {
    materialCache.get(avatar)?.forEach((m) => m.dispose())
    materialCache.delete(avatar)
  }
}
export function addGarmentDetails(
  avatar: HumanAvatar,
  top: Selection,
  height: number,
) {
  disposeGarmentDetails(avatar)
  const group = new THREE.Group()
  group.name = 'lmor-details'
  avatar.group.add(group)
  const topMesh = avatar.group.children.find((m) =>
    m.name.startsWith('clothes-lmor_top_'),
  ) as THREE.SkinnedMesh | undefined
  if (topMesh && (top.id === 'resort-shirt' || top.id === 'daily-jacket')) {
    const s = sampler(topMesh)
    if (top.id === 'resort-shirt') {
      const positions: number[] = [],
        uv: number[] = [],
        index: number[] = [],
        rows = 24
      for (let row = 0; row <= rows; row++) {
        const t = row / rows,
          y = height * (0.85 - 0.31 * t)
        const half = t > 0.91 ? (0.043 * (1 - t)) / 0.09 : 0.016 + 0.027 * t
        for (let col = 0; col < 3; col++) {
          const x = (col - 1) * half,
            z = s.z(x, y) + 0.009 + (col === 1 ? 0.002 : 0)
          positions.push(x, y, z)
          uv.push(col / 2, 1 - t)
        }
      }
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < 2; col++) {
          const i = row * 3 + col
          index.push(i, i + 3, i + 1, i + 1, i + 3, i + 4)
        }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3),
      )
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      geometry.setIndex(index)
      attach(
        group,
        topMesh,
        geometry,
        cachedMaterial(
          avatar,
          'tie',
          () =>
            new THREE.MeshStandardMaterial({
              map: dots(),
              color: '#ffffff',
              roughness: 0.6,
              side: THREE.DoubleSide,
            }),
        ),
        s,
      )
    } else {
      for (const sign of [-1, 1]) {
        const points = [
          [sign * 0.18, height * 0.81],
          [sign * 0.075, height * 0.86],
          [sign * 0.025, height * 0.78],
          [sign * 0.125, height * 0.69],
        ]
        const p = points.flatMap(([x, y]) => [x, y, s.z(x, y) + 0.014])
        const lapel = new THREE.BufferGeometry()
        lapel.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
        lapel.setIndex([0, 1, 2, 0, 2, 3])
        attach(
          group,
          topMesh,
          lapel,
          cachedMaterial(
            avatar,
            'lapel',
            () =>
              new THREE.MeshStandardMaterial({
                color: '#252525',
                roughness: 0.43,
                side: THREE.DoubleSide,
              }),
          ),
          s,
        )
      }
      const metal: THREE.BufferGeometry[] = []
      const line = (points: [number, number][], radius = 0.0025) => {
        const curve = new THREE.CatmullRomCurve3(
          points.map(([x, y]) => new THREE.Vector3(x, y, s.z(x, y) + 0.008)),
        )
        return new THREE.TubeGeometry(curve, 32, radius, 6, false)
      }
      // Diagonal hardware and short zipped pockets follow the biker reference photo.
      metal.push(
        line([
          [0.1, height * 0.57],
          [0.015, height * 0.68],
          [-0.11, height * 0.81],
        ]),
      )
      metal.push(
        line(
          [
            [-0.17, height * 0.63],
            [-0.075, height * 0.7],
          ],
          0.002,
        ),
      )
      metal.push(
        line(
          [
            [0.08, height * 0.62],
            [0.17, height * 0.69],
          ],
          0.002,
        ),
      )
      for (const [x, y] of [
        [-0.16, height * 0.8],
        [0.16, height * 0.8],
        [-0.075, height * 0.73],
      ]) {
        const button = new THREE.SphereGeometry(0.007, 12, 8)
        button.scale(1, 1, 0.28)
        button.translate(x, y, s.z(x, y) + 0.01)
        metal.push(button)
      }
      const geometry = mergeGeometries(metal)
      metal.forEach((g) => g.dispose())
      if (geometry)
        attach(
          group,
          topMesh,
          geometry,
          cachedMaterial(
            avatar,
            'hardware',
            () =>
              new THREE.MeshStandardMaterial({
                color: '#c6c9c7',
                metalness: 0.9,
                roughness: 0.27,
              }),
          ),
          s,
        )
    }
  }
}

function sampler(source: THREE.SkinnedMesh) {
  const positions = source.geometry.getAttribute(
    'position',
  ) as THREE.BufferAttribute
  const indices = [...new Set(source.geometry.getIndex()!.array)].filter(
    (i) => positions.getZ(i) > -0.005,
  )
  const nearest = (x: number, y: number) => {
    let best = indices[0],
      distance = Infinity
    for (const i of indices) {
      const d = (positions.getX(i) - x) ** 2 + (positions.getY(i) - y) ** 2
      if (d < distance) {
        distance = d
        best = i
      }
    }
    return best
  }
  return {
    positions,
    indices,
    nearest,
    z: (x: number, y: number) => positions.getZ(nearest(x, y)),
  }
}
function attach(
  group: THREE.Group,
  source: THREE.SkinnedMesh,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  sample: ReturnType<typeof sampler>,
) {
  const p = geometry.getAttribute('position'),
    sourceI = source.geometry.getAttribute('skinIndex'),
    sourceW = source.geometry.getAttribute('skinWeight')
  const indices: number[] = [],
    weights: number[] = []
  for (let i = 0; i < p.count; i++) {
    const v = sample.nearest(p.getX(i), p.getY(i))
    indices.push(
      sourceI.getX(v),
      sourceI.getY(v),
      sourceI.getZ(v),
      sourceI.getW(v),
    )
    weights.push(
      sourceW.getX(v),
      sourceW.getY(v),
      sourceW.getZ(v),
      sourceW.getW(v),
    )
  }
  geometry.setAttribute(
    'skinIndex',
    new THREE.Uint16BufferAttribute(indices, 4),
  )
  geometry.setAttribute(
    'skinWeight',
    new THREE.Float32BufferAttribute(weights, 4),
  )
  geometry.computeVertexNormals()
  const mesh = new THREE.SkinnedMesh(geometry, material)
  mesh.name = 'lmor-reference-detail'
  mesh.frustumCulled = false
  mesh.castShadow = true
  mesh.bind(source.skeleton, source.bindMatrix)
  group.add(mesh)
}
