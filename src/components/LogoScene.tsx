import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
export default function LogoScene({
  progress,
}: {
  progress: MutableRefObject<number>
}) {
  const host = useRef<HTMLDivElement>(null),
    [fallback, setFallback] = useState(false)
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
      setFallback(true)
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
    scene.environmentIntensity = 2.2
    pmrem.dispose()
    room.dispose()
    const light = new THREE.DirectionalLight('#eff6ff', 3)
    light.position.set(-2, 3, 5)
    scene.add(light)
    const rim = new THREE.DirectionalLight('#b6cde5', 4)
    rim.position.set(3, -1, -2)
    scene.add(rim)
    const group = new THREE.Group()
    scene.add(group)
    let textGeometry: TextGeometry | undefined,
      material: THREE.MeshPhysicalMaterial | undefined,
      text: THREE.Mesh | undefined
    let visible = false,
      disposed = false,
      distance = 4,
      lastFrame = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      if (textGeometry) {
        textGeometry.computeBoundingBox()
        const size = textGeometry.boundingBox!.getSize(new THREE.Vector3())
        distance =
          Math.max(size.y / 0.57, size.x / (0.57 * camera.aspect)) * 1.3
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
      },
      { rootMargin: '120px' },
    )
    io.observe(el)
    void new FontLoader()
      .loadAsync(
        `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`,
      )
      .then((font) => {
        if (disposed) return
        textGeometry = new TextGeometry("L'MOR.", {
          font,
          size: 1,
          depth: 0.16,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.026,
          bevelSize: 0.015,
          bevelSegments: 4,
        })
        textGeometry.center()
        material = new THREE.MeshPhysicalMaterial({
          color: '#d8e2e8',
          metalness: 1,
          roughness: 0.22,
          clearcoat: 0.5,
          clearcoatRoughness: 0.22,
        })
        text = new THREE.Mesh(textGeometry, material)
        group.add(text)
        resize()
      })
      .catch(() => {
        if (!disposed) setFallback(true)
      })
    renderer.setAnimationLoop((time) => {
      if (!visible || document.hidden || !text || time - lastFrame < 32) return
      lastFrame = time
      group.rotation.y = reduced
        ? -0.1
        : -0.35 + progress.current * 0.65 + Math.sin(time * 0.0002) * 0.035
      group.rotation.x = reduced ? 0.05 : 0.15 - progress.current * 0.22
      group.rotation.z = reduced ? 0 : -0.025 + Math.sin(time * 0.0003) * 0.012
      camera.position.set(0, 0.08, distance)
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    })
    return () => {
      disposed = true
      renderer.setAnimationLoop(null)
      io.disconnect()
      ro.disconnect()
      textGeometry?.dispose()
      material?.dispose()
      env.dispose()
      renderer.dispose()
      el.replaceChildren()
    }
  }, [])
  return (
    <div
      className="logo-scene"
      ref={host}
      role="img"
      aria-label="Logo L’MOR tiga dimensi berbahan silver"
    >
      {fallback && <span>L’MOR.</span>}
    </div>
  )
}
