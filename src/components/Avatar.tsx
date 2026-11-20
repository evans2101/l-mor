import { useLocale, translateNode as tn, translateText as tt } from '../i18n'
import { memo, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RotateCcw, Rotate3D, ZoomIn, ZoomOut } from 'lucide-react'
import { productById, type Body, type Selection } from '../data'
import { HumanAvatar } from '../vendor/humanforge/runtime'
import { finishHuman, humanConfig, humanPackage } from '../realisticHuman'
import { disposeGarmentDetails } from '../garmentDetails'
type Props = {
  body: Body
  top: Selection
  bottom: Selection
  hero?: boolean
  active?: boolean
  journey?: React.MutableRefObject<number>
}
function Avatar({
  body,
  top,
  bottom,
  hero = false,
  journey,
  active = true,
}: Props) {
  useLocale()
  const host = useRef<HTMLDivElement>(null)
  const live = useRef({
    body,
    top,
    bottom,
    journey,
    active,
  })
  const targetAngle = useRef(-0.12),
    zoom = useRef(hero ? 3.25 : 3.55)
  const rotating = useRef(false),
    dirty = useRef(true),
    configureRef = useRef<() => void>(() => {})
  const [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false)
  const [auto, setAuto] = useState(false),
    [view, setView] = useState('front')
  live.current = {
    body,
    top,
    bottom,
    journey,
    active,
  }
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
    renderer.toneMappingExposure = 0.92
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.05, 25)
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.75
    room.dispose()
    pmrem.dispose()
    scene.add(new THREE.HemisphereLight('#fcf6ec', '#727a6b', 0.6))
    const key = new THREE.DirectionalLight('#fff9f1', 2.1)
    key.position.set(-3, 4, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    Object.assign(key.shadow.camera, {
      left: -1.5,
      right: 1.5,
      top: 2.4,
      bottom: -1,
      near: 0.1,
      far: 12,
    })
    key.shadow.bias = -0.0001
    key.shadow.normalBias = 0.008
    key.shadow.radius = 3
    scene.add(key)
    const rim = new THREE.DirectionalLight('#f3f5ff', 0.8)
    rim.position.set(3, 3, -3)
    scene.add(rim)
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.64, 0.64, 0.035, 80),
      new THREE.MeshStandardMaterial({
        color: hero ? '#191e21' : '#30383b',
        roughness: 0.8,
      }),
    )
    base.position.y = -0.027
    base.receiveShadow = true
    scene.add(base)
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = shadowCanvas.height = 128
    const ctx = shadowCanvas.getContext('2d')!,
      gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 62)
    gradient.addColorStop(0, 'rgba(30,32,26,0.4)')
    gradient.addColorStop(1, 'rgba(30,32,26,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -0.007
    scene.add(shadow)
    const character = new THREE.Group()
    scene.add(character)
    let human: HumanAvatar | undefined,
      pose: ReturnType<typeof finishHuman> | undefined
    let disposed = false,
      renderReady = false,
      inView = true,
      isDragging = false,
      startX = 0,
      startAngle = 0
    let lastFrame = 0,
      currentAngle = -0.12,
      currentZoom = zoom.current,
      version = 0,
      timer: ReturnType<typeof setTimeout> | undefined
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
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        dirty.current = true
      },
      {
        rootMargin: '80px',
      },
    )
    io.observe(el)
    async function configure() {
      if (!human || disposed || !live.current.active) return
      const request = ++version,
        current = live.current
      await human.setConfig(
        humanConfig(current.body, current.top, current.bottom),
      )
      if (disposed || request !== version || !live.current.active) return
      renderReady = false
      pose = finishHuman(human, current.body, current.top, current.bottom, hero)
      human.group.visible = true
      // Prepare GPU programs asynchronously before the first visible frame or
      // a garment swap, so shader compilation does not interrupt scrolling.
      await renderer.compileAsync(scene, camera)
      if (disposed || request !== version) return
      renderReady = true
      setReady(true)
      dirty.current = true
    }
    const reportError = () => {
      if (!disposed) setFailed(true)
    }
    configureRef.current = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void configure().catch(reportError)
      }, 16)
    }
    void humanPackage()
      .then(async (pkg) => {
        if (disposed) return
        human = new HumanAvatar(pkg)
        human.textureSize = '2k'
        human.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
        human.group.visible = false
        character.add(human.group)
        await configure()
      })
      .catch(reportError)
    const down = (e: PointerEvent) => {
      if (hero) return
      isDragging = true
      startX = e.clientX
      startAngle = targetAngle.current
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (isDragging) {
        targetAngle.current = startAngle + (e.clientX - startX) * 0.012
        dirty.current = true
      }
    }
    const up = () => {
      isDragging = false
    }
    const lost = (e: Event) => {
      e.preventDefault()
      reportError()
    }
    renderer.domElement.addEventListener('pointerdown', down)
    renderer.domElement.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('pointerup', up)
    renderer.domElement.addEventListener('pointercancel', up)
    renderer.domElement.addEventListener('webglcontextlost', lost)
    renderer.setAnimationLoop((time) => {
      if (
        !live.current.active ||
        !inView ||
        document.hidden ||
        time - lastFrame < 32 ||
        !human?.group.visible ||
        !renderReady
      )
        return
      lastFrame = time
      if (hero && live.current.journey)
        targetAngle.current = -0.12 + live.current.journey.current * Math.PI * 2
      if (rotating.current) targetAngle.current += 0.012
      const moving =
        Math.abs(currentAngle - targetAngle.current) +
          Math.abs(currentZoom - zoom.current) >
        0.001
      if (reduced && !dirty.current && !rotating.current && !moving) return
      currentAngle = THREE.MathUtils.lerp(
        currentAngle,
        targetAngle.current,
        0.18,
      )
      currentZoom = THREE.MathUtils.lerp(currentZoom, zoom.current, 0.18)
      character.rotation.y = currentAngle
      if (!reduced && pose) {
        const seconds = time / 1000
        if (pose.head && pose.headRest)
          pose.head.quaternion
            .copy(pose.headRest)
            .multiply(
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                  Math.sin(seconds * 0.43) * 0.007,
                  Math.sin(seconds * 0.29) * 0.012,
                  Math.sin(seconds * 0.37) * 0.005,
                ),
              ),
            )
        if (pose.chest && pose.chestRest)
          pose.chest.quaternion
            .copy(pose.chestRest)
            .multiply(
              new THREE.Quaternion().setFromEuler(
                new THREE.Euler(
                  Math.sin(seconds * 1.45) * 0.0035,
                  0,
                  Math.sin(seconds * 0.55) * 0.002,
                ),
              ),
            )
        const phase = (seconds + 2.7) % 6.3
        const blink = Math.max(0, 1 - Math.abs(phase - 0.14) / 0.105)
        human.setExpression('eyeBlinkLeft', blink)
        human.setExpression('eyeBlinkRight', blink * 0.97)
        if (
          hero &&
          pose.rightArm &&
          pose.rightForearm &&
          pose.armRest &&
          pose.forearmRest &&
          pose.armWave &&
          pose.forearmWave
        ) {
          const cycle = seconds % 11
          const greeting =
            cycle < 3.6 && (live.current.journey?.current ?? 0) < 0.15
              ? Math.min(1, cycle / 0.65, (3.6 - cycle) / 0.75)
              : 0
          const blend = THREE.MathUtils.smoothstep(greeting, 0, 1)
          pose.rightArm.quaternion.slerpQuaternions(
            pose.armRest,
            pose.armWave,
            blend,
          )
          pose.rightForearm.quaternion
            .slerpQuaternions(pose.forearmRest, pose.forearmWave, blend)
            .multiply(
              new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 0, 1),
                (Math.sin(seconds * 4.2) * 0.08 +
                  Math.sin(seconds * 1.3) * 0.025) *
                  blend,
              ),
            )
        }
      }
      const upperBody = THREE.MathUtils.clamp((2.6 - currentZoom) / 0.95, 0, 1)
      const targetY = hero
        ? 0.94
        : (live.current.body.height / 100) * (0.55 + 0.23 * upperBody)
      camera.position.set(0, targetY + 0.055, currentZoom)
      camera.lookAt(0, targetY, 0)
      renderer.render(scene, camera)
      dirty.current = false
    })
    return () => {
      disposed = true
      version++
      clearTimeout(timer)
      configureRef.current = () => {}
      renderer.setAnimationLoop(null)
      io.disconnect()
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', down)
      renderer.domElement.removeEventListener('pointermove', move)
      renderer.domElement.removeEventListener('pointerup', up)
      renderer.domElement.removeEventListener('pointercancel', up)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      if (human) {
        disposeGarmentDetails(human, true)
        human.dispose()
      }
      base.geometry.dispose()
      base.material.dispose()
      shadow.geometry.dispose()
      shadow.material.dispose()
      shadowTexture.dispose()
      key.shadow.map?.dispose()
      environment.dispose()
      renderer.dispose()
      el.replaceChildren()
    }
  }, [hero])
  useEffect(() => {
    configureRef.current()
  }, [
    active,
    body.gender,
    body.height,
    body.weight,
    body.skin,
    top.id,
    top.color,
    bottom.id,
    bottom.color,
  ])
  const setAngle = (angle: number, name: string) => {
    targetAngle.current = angle
    setView(name)
    dirty.current = true
  }
  if (failed)
    return (
      <div className="avatar-fallback">
        <Rotate3D size={44} />
        <h3>{tn('Model manusia belum tersedia')}</h3>
        <p>
          {tn(
            'Pastikan koneksi aktif dan browser mendukung WebGL 2. Muat ulang halaman untuk mencoba lagi.',
          )}
        </p>
      </div>
    )
  return (
    <div className={`avatar ${hero ? 'avatar-hero' : ''}`} data-ready={ready}>
      <div
        className="canvas-host"
        ref={host}
        role="img"
        aria-label={tt(
          `Avatar 3D ${body.gender === 'male' ? 'laki-laki' : 'perempuan'}, tinggi ${body.height} cm, berat ${body.weight} kg, mengenakan ${productById(top.id)?.name} dan ${productById(bottom.id)?.name}`,
        )}
        tabIndex={hero ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            targetAngle.current += e.key === 'ArrowLeft' ? -0.25 : 0.25
            dirty.current = true
          }
        }}
      />
      {tn(
        !ready && (
          <div className="human-loading" role="status">
            <span className="human-loading-ring" />
            <span>{tn('Memuat model manusia\u2026')}</span>
          </div>
        ),
      )}
      {tn(
        !hero && (
          <>
            <div className="view-pills" aria-label={tt('Sudut pandang')}>
              {tn(
                [
                  ['front', 'Depan', -0.22],
                  ['side', 'Samping', Math.PI / 2],
                  ['back', 'Belakang', Math.PI],
                ].map(([key, name, angle]) => (
                  <button
                    key={key}
                    className={view === key ? 'active' : ''}
                    onClick={() => setAngle(Number(angle), String(key))}
                  >
                    {tn(name)}
                  </button>
                )),
              )}
            </div>
            <div className="camera-tools">
              <button
                title={tt('Perbesar avatar')}
                aria-label={tt('Perbesar avatar')}
                onClick={() => {
                  zoom.current = Math.max(1.65, zoom.current - 0.3)
                  dirty.current = true
                }}
              >
                <ZoomIn size={17} />
              </button>
              <button
                title={tt('Perkecil avatar')}
                aria-label={tt('Perkecil avatar')}
                onClick={() => {
                  zoom.current = Math.min(4.8, zoom.current + 0.3)
                  dirty.current = true
                }}
              >
                <ZoomOut size={17} />
              </button>
              <button
                title={tt('Putar otomatis')}
                aria-label={tt('Putar otomatis')}
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
                title={tt('Reset kamera')}
                aria-label={tt('Reset kamera')}
                onClick={() => {
                  setAngle(-0.22, 'front')
                  zoom.current = 3.55
                  rotating.current = false
                  setAuto(false)
                }}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="drag-label">
              <Rotate3D size={14} />
              {tn(' Geser untuk putar \xB7 360\xB0')}
            </div>
          </>
        ),
      )}
    </div>
  )
}
export default memo(Avatar)
