import { memo, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RotateCcw, Rotate3D, ZoomIn, ZoomOut } from 'lucide-react'
import {
  productById,
  skinTones,
  type Body,
  type Selection,
  type Garment,
} from '../data'

type Props = { body: Body; top: Selection; bottom: Selection; hero?: boolean }
type Rig = {
  group: THREE.Group
  arm: THREE.Group
  skin: THREE.MeshStandardMaterial
  topMat: THREE.MeshStandardMaterial
  bottomMat: THREE.MeshStandardMaterial
}
function material(color: string, roughness = 0.88) {
  return new THREE.MeshStandardMaterial({ color, roughness })
}
function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  scale?: [number, number, number],
) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  if (scale) m.scale.set(...scale)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}
function sphere(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
) {
  return mesh(parent, new THREE.SphereGeometry(1, 28, 20), mat, x, y, z, [
    sx,
    sy,
    sz,
  ])
}
function capsule(
  parent: THREE.Object3D,
  mat: THREE.Material,
  radius: number,
  length: number,
  x: number,
  y: number,
  z = 0,
) {
  return mesh(
    parent,
    new THREE.CapsuleGeometry(radius, length, 6, 16),
    mat,
    x,
    y,
    z,
  )
}
function lathe(
  parent: THREE.Object3D,
  mat: THREE.Material,
  points: number[][],
  x = 0,
  y = 0,
  z = 0,
  depth = 0.62,
) {
  return mesh(
    parent,
    new THREE.LatheGeometry(
      points.map((p) => new THREE.Vector2(p[0], p[1])),
      32,
    ),
    mat,
    x,
    y,
    z,
    [1, 1, depth],
  )
}
function disposeGroup(group: THREE.Object3D) {
  const materials = new Set<THREE.Material>()
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      ;(Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
        (m) => materials.add(m),
      )
    }
  })
  materials.forEach((m) => m.dispose())
}
function makeRig(
  body: Body,
  top: Selection,
  bottom: Selection,
  hero: boolean,
): Rig {
  const group = new THREE.Group(),
    skin = material(skinTones[body.skin]),
    topMat = material(productById(top.id)!.colors[top.color].hex),
    bottomMat = material(productById(bottom.id)!.colors[bottom.color].hex)
  const dark = material('#272b27'),
    white = material('#eeede5'),
    sole = material('#d4d2c6'),
    stitch = material('#a7a18e'),
    female = body.gender === 'female'
  const type: Garment = productById(top.id)!.type,
    pant = productById(bottom.id)!.type
  // An original, deliberately stylized mannequin: every part is geometry, never a composited photo.
  const shoulder = female ? 0.37 : 0.42
  lathe(
    group,
    skin,
    [
      [0.27, 0],
      [0.29, 0.15],
      [0.26, 0.4],
      [shoulder, 0.7],
      [0.28, 0.79],
    ],
    0,
    1.57,
  )
  capsule(group, skin, 0.105, 0.14, 0, 2.48)
  sphere(group, skin, 0, 2.91, 0.015, 0.255, 0.32, 0.235)
  sphere(group, skin, -0.251, 2.89, 0.015, 0.057, 0.08, 0.05)
  sphere(group, skin, 0.251, 2.89, 0.015, 0.057, 0.08, 0.05)
  sphere(group, skin, 0, 2.86, 0.245, 0.047, 0.055, 0.065)
  // Eyes and a curved smile make the hero a welcoming brand mascot.
  for (const side of [-1, 1]) {
    capsule(group, dark, 0.022, 0.031, side * 0.088, 2.965, 0.227)
    sphere(group, white, side * 0.088 + 0.006, 2.98, 0.248, 0.006, 0.007, 0.003)
    const brow = capsule(group, dark, 0.009, 0.047, side * 0.088, 3.033, 0.22)
    brow.rotation.z = side * -0.14
  }
  const smile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.066, 2.81, 0.228),
    new THREE.Vector3(0, 2.786, 0.246),
    new THREE.Vector3(0.066, 2.81, 0.228),
  ])
  mesh(group, new THREE.TubeGeometry(smile, 18, 0.009, 6, false), dark)
  // Sculpted hair with a directional quiff; female option has an attached ponytail.
  const hair = material('#34352e')
  const hairCap = mesh(
    group,
    new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
    hair,
    0,
    2.98,
    -0.005,
    [0.265, 0.257, 0.247],
  )
  hairCap.rotation.z = -0.07
  sphere(group, hair, -0.075, 3.159, 0.08, 0.21, 0.095, 0.19)
  if (female) {
    sphere(group, hair, 0, 2.94, -0.24, 0.21, 0.26, 0.17)
    capsule(group, hair, 0.1, 0.35, 0.18, 2.63, -0.22)
  }
  // Separately built sleeves retain each selected garment's silhouette.
  const longSleeve =
    type === 'hoodie' || type === 'jacket' || top.id === 'oxford-shirt'
  let rightArm = new THREE.Group()
  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * (shoulder + 0.055), 2.3, 0)
    arm.rotation.z = side * 0.14
    group.add(arm)
    capsule(arm, skin, 0.09, 0.34, 0, -0.22)
    capsule(arm, skin, 0.075, 0.35, 0, -0.68, 0.015)
    sphere(arm, skin, 0, -0.97, 0.02, 0.08, 0.12, 0.058)
    capsule(
      arm,
      topMat,
      type === 'hoodie' ? 0.15 : 0.135,
      longSleeve ? 0.68 : 0.22,
      0,
      longSleeve ? -0.43 : -0.15,
    )
    sphere(arm, topMat, 0, -0.01, 0, 0.145, 0.14, 0.16)
    if (longSleeve)
      mesh(
        arm,
        new THREE.CylinderGeometry(0.109, 0.108, 0.09, 20),
        topMat,
        0,
        -0.87,
      )
    if (side === 1) rightArm = arm
  }
  const roomy =
    top.id === 'essential-tee' || type === 'hoodie' || type === 'jacket'
  const width = female ? 0.39 : 0.43
  lathe(
    group,
    topMat,
    [
      [width * 0.98, 0],
      [width + 0.025, 0.045],
      [width, 0.21],
      [width - (female ? 0.045 : 0), 0.48],
      [width + 0.025, 0.72],
      [0.24, 0.85],
      [0.118, 0.87],
    ],
    0,
    type === 'jacket' ? 1.48 : 1.52,
    0,
    roomy ? 0.7 : 0.65,
  )
  // Ribbed neckline.
  const neck = mesh(
    group,
    new THREE.TorusGeometry(0.132, 0.024, 8, 32),
    topMat,
    0,
    2.39,
  )
  neck.rotation.x = Math.PI / 2
  neck.scale.y = 0.72
  if (type === 'shirt' || type === 'jacket') {
    for (const side of [-1, 1]) {
      const collar = mesh(
        group,
        new THREE.ConeGeometry(0.13, 0.2, 3),
        topMat,
        side * 0.095,
        2.31,
        0.21,
      )
      collar.rotation.z = side * -0.5
      collar.rotation.x = 0.3
      for (const yy of type === 'jacket' ? [1.91] : [])
        mesh(
          group,
          new THREE.BoxGeometry(0.21, 0.22, 0.025),
          topMat,
          side * 0.23,
          yy,
          0.3,
        )
    }
    capsule(group, topMat, 0.018, 0.65, 0, 1.95, 0.302)
    for (let y = 1.68; y < 2.3; y += 0.15)
      sphere(group, stitch, 0, y, 0.326, 0.013, 0.013, 0.008)
  }
  if (type === 'hoodie') {
    sphere(group, topMat, 0, 2.3, -0.17, 0.31, 0.26, 0.17)
    mesh(group, new THREE.BoxGeometry(0.37, 0.19, 0.06), topMat, 0, 1.76, 0.3)
    for (const side of [-1, 1])
      capsule(group, white, 0.008, 0.2, side * 0.075, 2.2, 0.27)
  }
  // Minimal brand tab on the chest.
  mesh(
    group,
    new THREE.BoxGeometry(0.081, 0.036, 0.008),
    white,
    -0.21,
    2.16,
    0.303,
  )
  mesh(
    group,
    new THREE.BoxGeometry(0.035, 0.012, 0.009),
    dark,
    -0.21,
    2.16,
    0.31,
  )
  const shorts = pant === 'shorts',
    legWidth = pant === 'trousers' || bottom.id === 'light-denim' ? 0.218 : 0.19
  lathe(
    group,
    bottomMat,
    [
      [0.34, 0],
      [0.36, 0.14],
      [0.33, 0.29],
    ],
    0,
    1.28,
    0,
    0.66,
  )
  for (const side of [-1, 1]) {
    capsule(group, skin, 0.115, 0.94, side * 0.185, 0.85)
    lathe(
      group,
      bottomMat,
      shorts
        ? [
            [0.21, 0],
            [0.215, 0.45],
            [0.2, 0.62],
          ]
        : [
            [legWidth * 0.85, 0],
            [legWidth * 0.91, 0.08],
            [legWidth, 0.58],
            [0.22, 1.19],
            [0.19, 1.34],
          ],
      side * 0.185,
      shorts ? 0.85 : 0.22,
      0,
      0.86,
    )
    if (pant === 'cargo') {
      const pocket = mesh(
        group,
        new THREE.BoxGeometry(0.09, 0.25, 0.24),
        bottomMat,
        side * 0.365,
        1.02,
        0.025,
      )
      pocket.rotation.z = side * -0.04
      mesh(
        group,
        new THREE.BoxGeometry(0.097, 0.055, 0.25),
        bottomMat,
        side * 0.367,
        1.15,
        0.025,
      )
    }
    if (pant === 'denim') {
      const seam = capsule(
        group,
        stitch,
        0.004,
        shorts ? 0.4 : 1.02,
        side * 0.35,
        0.83,
        0.085,
      )
      seam.rotation.z = side * -0.03
      mesh(
        group,
        new THREE.BoxGeometry(0.17, 0.19, 0.012),
        bottomMat,
        side * 0.17,
        1.34,
        -0.233,
      )
    }
    // Low-profile sneakers with an independent rubber sole.
    sphere(group, white, side * 0.19, 0.16, 0.083, 0.15, 0.125, 0.265)
    sphere(group, sole, side * 0.19, 0.077, 0.09, 0.154, 0.05, 0.267)
    for (let y = 0; y < 3; y++)
      mesh(
        group,
        new THREE.BoxGeometry(0.125, 0.009, 0.012),
        sole,
        side * 0.19,
        0.248 - y * 0.01,
        0.12 + y * 0.045,
      )
  }
  if (hero) rightArm.rotation.z = 2.05
  return { group, arm: rightArm, skin, topMat, bottomMat }
}

function Avatar({ body, top, bottom, hero = false }: Props) {
  const host = useRef<HTMLDivElement>(null),
    rigRef = useRef<Rig | null>(null),
    sceneRef = useRef<THREE.Scene | null>(null)
  const live = useRef({ body, top, bottom }),
    targetAngle = useRef(-0.22),
    zoom = useRef(hero ? 4.9 : 5.35),
    rotating = useRef(false),
    dirty = useRef(true)
  const [failed, setFailed] = useState(false),
    [auto, setAuto] = useState(false),
    [view, setView] = useState('front')
  live.current = { body, top, bottom }
  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    sceneRef.current = scene
    const camera = new THREE.PerspectiveCamera(hero ? 34 : 36, 1, 0.1, 30)
    scene.add(new THREE.HemisphereLight('#fffdf0', '#737b63', 2.8))
    const key = new THREE.DirectionalLight('#fff5dd', 4)
    key.position.set(-3, 6, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight('#e7f9f3', 2.8)
    rim.position.set(3, 4, -3)
    scene.add(rim)
    const fill = new THREE.DirectionalLight('#ffffff', 0.8)
    fill.position.set(2, 2, 5)
    scene.add(fill)
    const pedestal = mesh(
      scene,
      new THREE.CylinderGeometry(1.08, 1.08, 0.1, 64),
      material(hero ? '#c4e635' : '#d2d4c5'),
      0,
      -0.025,
    )
    const ring = mesh(
      scene,
      new THREE.TorusGeometry(1.04, 0.008, 8, 80),
      material(hero ? '#a7bb42' : '#b0b4a0'),
      0,
      0.03,
    )
    ring.rotation.x = Math.PI / 2
    // A static contact shadow avoids expensive shadow-map updates while adjusting the avatar.
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = shadowCanvas.height = 128
    const ctx = shadowCanvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 62)
    gradient.addColorStop(0, 'rgba(35,40,25,0.28)')
    gradient.addColorStop(1, 'rgba(35,40,25,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
    const shadow = mesh(
      scene,
      new THREE.PlaneGeometry(1.7, 1.3),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
      0,
      0.035,
      0.03,
    )
    shadow.rotation.x = -Math.PI / 2
    let inView = true,
      pointerStart = 0,
      startAngle = 0,
      isDragging = false,
      lastFrame = 0,
      currentAngle = -0.22,
      currentZoom = zoom.current
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      dirty.current = true
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(el)
    resize()
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        dirty.current = true
      },
      { rootMargin: '80px' },
    )
    observer.observe(el)
    const pointerDown = (e: PointerEvent) => {
      if (hero) return
      isDragging = true
      pointerStart = e.clientX
      startAngle = targetAngle.current
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    const pointerMove = (e: PointerEvent) => {
      if (isDragging) {
        targetAngle.current = startAngle + (e.clientX - pointerStart) * 0.012
        dirty.current = true
      }
    }
    const pointerUp = () => {
      isDragging = false
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointercancel', pointerUp)
    const contextLost = (e: Event) => {
      e.preventDefault()
      setFailed(true)
    }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    renderer.setAnimationLoop((time) => {
      if (!inView || document.hidden || time - lastFrame < 32) return
      lastFrame = time
      const rig = rigRef.current
      if (!rig) return
      const { body: b, top: t, bottom: p } = live.current
      const width = Math.max(
        0.84,
        Math.min(
          1.38,
          0.98 + (b.weight - 68) * 0.006 - (b.height - 175) * 0.002,
        ),
      )
      const height = b.height / 175
      if (rotating.current) targetAngle.current += 0.013
      const changing =
        Math.abs(rig.group.scale.x - width) +
          Math.abs(rig.group.scale.y - height) +
          Math.abs(currentAngle - targetAngle.current) +
          Math.abs(currentZoom - zoom.current) >
        0.001
      if (!hero && !dirty.current && !rotating.current && !changing) return
      rig.group.scale.x = THREE.MathUtils.lerp(rig.group.scale.x, width, 0.16)
      rig.group.scale.z = rig.group.scale.x
      rig.group.scale.y = THREE.MathUtils.lerp(rig.group.scale.y, height, 0.16)
      rig.skin.color.set(skinTones[b.skin])
      rig.topMat.color.set(productById(t.id)!.colors[t.color].hex)
      rig.bottomMat.color.set(productById(p.id)!.colors[p.color].hex)
      currentAngle = THREE.MathUtils.lerp(
        currentAngle,
        targetAngle.current,
        0.18,
      )
      rig.group.rotation.y = currentAngle
      if (hero && !reduced) {
        rig.arm.rotation.z = 2.05 + Math.sin(time * 0.003) * 0.18
        rig.group.position.y = Math.sin(time * 0.0015) * 0.02
      }
      currentZoom = THREE.MathUtils.lerp(currentZoom, zoom.current, 0.18)
      camera.position.set(0, hero ? 2.05 : 2.2, currentZoom + 0.85)
      camera.lookAt(0, hero ? 1.65 : 1.87, 0)
      renderer.render(scene, camera)
      dirty.current = false
    })
    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', pointerDown)
      renderer.domElement.removeEventListener('pointermove', pointerMove)
      renderer.domElement.removeEventListener('pointerup', pointerUp)
      renderer.domElement.removeEventListener('pointercancel', pointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      if (rigRef.current) {
        disposeGroup(rigRef.current.group)
        rigRef.current = null
      }
      disposeGroup(pedestal)
      disposeGroup(ring)
      disposeGroup(shadow)
      shadowTexture.dispose()
      renderer.dispose()
      el.replaceChildren()
      sceneRef.current = null
    }
  }, [hero])
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const old = rigRef.current
    if (old) {
      scene.remove(old.group)
      disposeGroup(old.group)
    }
    const rig = makeRig(
      live.current.body,
      live.current.top,
      live.current.bottom,
      hero,
    )
    rigRef.current = rig
    scene.add(rig.group)
    dirty.current = true
  }, [top.id, bottom.id, body.gender, hero])
  useEffect(() => {
    dirty.current = true
  }, [body.height, body.weight, body.skin, top.color, bottom.color])
  const setAngle = (angle: number, name: string) => {
    targetAngle.current = angle
    setView(name)
    dirty.current = true
  }
  if (failed)
    return (
      <div className="avatar-fallback">
        <Rotate3D size={44} />
        <h3>Preview 3D belum tersedia</h3>
        <p>
          Aktifkan akselerasi hardware atau buka browser yang mendukung WebGL 2.
          Kamu tetap bisa memilih outfit dan belanja.
        </p>
      </div>
    )
  return (
    <div className={`avatar ${hero ? 'avatar-hero' : ''}`}>
      <div
        className="canvas-host"
        ref={host}
        role="img"
        aria-label={`Avatar 3D ${body.gender === 'male' ? 'laki-laki' : 'perempuan'}, tinggi ${body.height} cm, berat ${body.weight} kg, mengenakan ${productById(top.id)?.name} dan ${productById(bottom.id)?.name}`}
        tabIndex={hero ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            targetAngle.current += e.key === 'ArrowLeft' ? -0.25 : 0.25
            dirty.current = true
          }
        }}
      />
      {!hero && (
        <>
          <div className="view-pills" aria-label="Sudut pandang">
            {[
              ['front', 'Depan', -0.22],
              ['side', 'Samping', Math.PI / 2],
              ['back', 'Belakang', Math.PI],
            ].map(([key, name, angle]) => (
              <button
                key={key}
                className={view === key ? 'active' : ''}
                onClick={() => setAngle(Number(angle), String(key))}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="camera-tools">
            <button
              title="Perbesar avatar"
              aria-label="Perbesar avatar"
              onClick={() => {
                zoom.current = Math.max(3.4, zoom.current - 0.4)
                dirty.current = true
              }}
            >
              <ZoomIn size={17} />
            </button>
            <button
              title="Perkecil avatar"
              aria-label="Perkecil avatar"
              onClick={() => {
                zoom.current = Math.min(6.2, zoom.current + 0.4)
                dirty.current = true
              }}
            >
              <ZoomOut size={17} />
            </button>
            <button
              title="Putar otomatis"
              aria-label="Putar otomatis"
              aria-pressed={auto}
              className={auto ? 'active' : ''}
              onClick={() => {
                rotating.current = !auto
                setAuto(!auto)
              }}
            >
              <Rotate3D size={17} />
            </button>
            <button
              title="Reset kamera"
              aria-label="Reset kamera"
              onClick={() => {
                setAngle(-0.22, 'front')
                zoom.current = 5.35
                rotating.current = false
                setAuto(false)
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="drag-label">
            <Rotate3D size={14} /> Geser untuk putar · 360°
          </div>
        </>
      )}
    </div>
  )
}
export default memo(Avatar)
