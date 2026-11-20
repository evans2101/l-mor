import { useLocale, translateNode as tn, translateText as tt } from '../i18n'
import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { brandSymbolUrl } from '../brand'
export default function LogoScene({
  progress,
  active = true,
}: {
  progress: MutableRefObject<number>
  active?: boolean
}) {
  useLocale()
  const host = useRef<HTMLDivElement>(null),
    [ready, setReady] = useState(false)
  const activeRef = useRef(active)
  activeRef.current = active
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
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setClearColor(0, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 25)
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment(),
      env = pmrem.fromScene(room, 0.02)
    scene.environment = env.texture
    scene.environmentIntensity = 1.65
    pmrem.dispose()
    room.dispose()
    const light = new THREE.DirectionalLight('#eff6ff', 3)
    light.position.set(-2, 3, 5)
    scene.add(light)
    const rim = new THREE.DirectionalLight('#8eddd9', 4)
    rim.position.set(3, -1, -2)
    scene.add(rim)
    const warm = new THREE.DirectionalLight('#e9c59e', 3.5)
    warm.position.set(-3, -1, 2)
    scene.add(warm)
    const group = new THREE.Group()
    scene.add(group)
    let geometry: THREE.ExtrudeGeometry | undefined,
      material: THREE.MeshPhysicalMaterial | undefined,
      mark: THREE.Mesh | undefined
    let visible = false,
      disposed = false,
      prepared = false,
      distance = 4,
      lastFrame = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      if (geometry) {
        geometry.computeBoundingBox()
        const size = geometry.boundingBox!.getSize(new THREE.Vector3())
        distance =
          Math.max(size.y / 0.57, size.x / (0.57 * camera.aspect)) * 1.22
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      {
        rootMargin: '120px',
      },
    )
    io.observe(el)
    void new SVGLoader()
      .loadAsync(brandSymbolUrl)
      .then(async (svg) => {
        if (disposed) return
        const shapes = svg.paths.flatMap((path) => SVGLoader.createShapes(path))
        if (!shapes.length) return
        geometry = new THREE.ExtrudeGeometry(shapes, {
          depth: 24,
          steps: 1,
          curveSegments: 10,
          bevelEnabled: true,
          bevelThickness: 3,
          bevelSize: 2.2,
          bevelSegments: 3,
        })
        // SVG coordinates point down; rotate to preserve the supplied silhouette.
        geometry.rotateX(Math.PI)
        geometry.computeBoundingBox()
        const scale = 2.7 / geometry.boundingBox!.getSize(new THREE.Vector3()).x
        geometry.scale(scale, scale, scale)
        geometry.center()
        material = new THREE.MeshPhysicalMaterial({
          color: '#dce8eb',
          metalness: 1,
          roughness: 0.15,
          clearcoat: 0.9,
          clearcoatRoughness: 0.12,
        })
        mark = new THREE.Mesh(geometry, material)
        group.add(mark)
        resize()
        await renderer.compileAsync(scene, camera)
        if (disposed) return
        prepared = true
        setReady(true)
      })
      .catch(() => {
        // The supplied vector remains visible if WebGL or the mesh cannot load.
      })
    renderer.setAnimationLoop((time) => {
      if (
        !activeRef.current ||
        !visible ||
        document.hidden ||
        !mark ||
        !prepared ||
        time - lastFrame < 32
      )
        return
      lastFrame = time
      group.rotation.y = reduced
        ? -0.1
        : -0.35 + progress.current * 0.65 + Math.sin(time * 0.0002) * 0.035
      group.rotation.x = reduced ? 0.05 : 0.15 - progress.current * 0.22
      group.rotation.z = reduced ? 0 : -0.025 + Math.sin(time * 0.0003) * 0.012
      camera.position.set(0, 0, distance)
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    })
    return () => {
      disposed = true
      renderer.setAnimationLoop(null)
      io.disconnect()
      ro.disconnect()
      geometry?.dispose()
      material?.dispose()
      env.dispose()
      renderer.dispose()
      el.replaceChildren()
    }
  }, [])
  return (
    <div
      className="logo-scene"
      role="img"
      aria-label={tt('Simbol L’MOR')}
      data-ready={ready}
    >
      <div className="logo-canvas" ref={host} aria-hidden="true" />
      {tn(
        !ready && (
          <img
            className="logo-fallback"
            src={brandSymbolUrl}
            alt={tt('')}
            width="667"
            height="490"
          />
        ),
      )}
    </div>
  )
}
