import * as THREE from 'three'
import {
  HumanAvatar,
  loadHumanPackage,
  type HumanPackage,
  type HumanConfig,
} from './vendor/humanforge/runtime'
import { productById, type Body, type Selection } from './data'
import { addGarmentDetails } from './garmentDetails'

let packagePromise: Promise<HumanPackage> | undefined
let fabricBump: THREE.Texture | undefined
let teePrint: THREE.Texture | undefined
export function humanPackage() {
  if (!packagePromise) {
    packagePromise = loadHumanPackage(`${import.meta.env.BASE_URL}human`, {
      fetch: async (url) => {
        const response = await fetch(url)
        if (!response.ok)
          throw new Error(`Human asset unavailable (${response.status})`)
        return response.arrayBuffer()
      },
    })
      .then(async (pkg) => {
        fabricBump = await new THREE.TextureLoader().loadAsync(
          `${import.meta.env.BASE_URL}human/textures/fabric-cotton.webp`,
        )
        fabricBump.wrapS = fabricBump.wrapT = THREE.RepeatWrapping
        fabricBump.repeat.set(28, 28)
        const photograph = await new THREE.TextureLoader().loadAsync(
          `${import.meta.env.BASE_URL}images/tee-washed.jpg`,
        )
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 256
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(photograph.image, 300, 460, 125, 260, 0, 0, 128, 256)
        const pixels = ctx.getImageData(0, 0, 128, 256)
        for (let i = 0; i < pixels.data.length; i += 4) {
          const luminance =
            (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3 / 255
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 242
          pixels.data[i + 3] =
            THREE.MathUtils.clamp((luminance - 0.4) / 0.4, 0, 1) * 255
        }
        ctx.putImageData(pixels, 0, 0)
        teePrint = new THREE.CanvasTexture(canvas)
        teePrint.colorSpace = THREE.SRGBColorSpace
        photograph.dispose()
        return pkg
      })
      .catch((error) => {
        packagePromise = undefined
        throw error
      })
  }
  return packagePromise
}
const topModels: Record<string, string> = {
  'essential-tee': 'lmor_top_tee',
  'washed-tee': 'lmor_top_washed',
  'resort-shirt': 'lmor_top_shirt',
  'oxford-shirt': 'lmor_top_oxford',
  'cloud-hoodie': 'lmor_top_hoodie',
  'daily-jacket': 'lmor_top_jacket',
}
const bottomModels: Record<string, string> = {
  'pleated-trouser': 'lmor_bottom_trousers',
  'straight-denim': 'lmor_bottom_denim',
  'utility-cargo': 'lmor_bottom_cargo',
  'light-denim': 'lmor_bottom_denim',
  'daily-chino': 'lmor_bottom_trousers',
  'weekend-short': 'lmor_bottom_trousers',
}
export function humanConfig(
  body: Body,
  top: Selection,
  bottom: Selection,
): Partial<HumanConfig> {
  const sex = body.gender,
    bmi = body.weight / (body.height / 100) ** 2
  const family =
    body.skin < 2 ? 'caucasian' : body.skin < 4 ? 'asian' : 'african'
  const tints = [
    '#fff4e8',
    '#e2ba96',
    '#d6aa82',
    '#aa7952',
    '#d2af90',
    '#a17a5f',
  ]
  return {
    gender: sex === 'male' ? 1 : 0,
    age: 0.13,
    muscle: sex === 'male' ? 0.53 : 0.4,
    weight: THREE.MathUtils.clamp((bmi - 16) / 22, 0.04, 0.98),
    height: THREE.MathUtils.clamp((body.height - 140) / 65, 0, 1),
    proportions: 0.58,
    detail:
      sex === 'male'
        ? {
            jaw: 0.1,
            cheekBones: 0.1,
            faceFat: -0.06,
            headOval: 0.08,
            eyeOpening: -0.04,
            noseWidth: -0.04,
            mouthCorners: 0.08,
            shoulders: 0.04,
          }
        : {
            headOval: 0.2,
            jaw: -0.13,
            chinWidth: -0.08,
            cheekBones: 0.12,
            faceFat: -0.08,
            eyeSize: 0.045,
            eyeTilt: 0.04,
            upperLip: 0.06,
            lowerLip: 0.05,
            mouthCorners: 0.09,
          },
    cupSize: 0.4,
    firmness: 0.5,
    asian: 0.55,
    caucasian: 0.3,
    african: 0.15,
    skin: `young_${family}_${sex}`,
    skinTint: tints[body.skin],
    eyes: 'brownlight',
    eyebrows: 'eyebrow001',
    eyelashes: 'eyelashes01',
    hair: sex === 'male' ? 'short02' : 'culturalibre_hair_01',
    hairColor: '#30251e',
    eyebrowColor: '#352820',
    clothes: [
      topModels[top.id],
      bottomModels[bottom.id],
      'shoes02',
      ...(top.id === 'cloud-hoodie' ? ['lmor_hood'] : []),
    ],
  }
}

/** Retain photographed folds/seams while allowing each garment its own fabric color. */
function tintFabric(
  material: THREE.MeshStandardMaterial,
  denim: boolean,
  printed = false,
) {
  material.onBeforeCompile = (shader) => {
    if (printed) {
      shader.uniforms.uLmorPrint = { value: teePrint }
      shader.uniforms.uLmorPrintBounds = material.userData.printBounds
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vLmorFabricPosition;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvLmorFabricPosition = position;',
        )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vLmorFabricPosition; uniform sampler2D uLmorPrint; uniform vec4 uLmorPrintBounds;',
      )
    }
    const fabricMap = THREE.ShaderChunk.map_fragment.replace(
      'vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
      `vec4 sampledDiffuseColor = texture2D( map, vMapUv );
       float fabricLuminance = dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
       sampledDiffuseColor.rgb = vec3(${denim ? '0.45 + 0.55' : '0.7 + 0.3'} * sqrt(max(fabricLuminance, 0.0)));`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      fabricMap +
        (printed
          ? `
      vec2 printUv = (vLmorFabricPosition.xy - uLmorPrintBounds.xy) / uLmorPrintBounds.zw + 0.5;
      float inPrint = step(0.0, printUv.x) * step(printUv.x, 1.0) * step(0.0, printUv.y) * step(printUv.y, 1.0) * smoothstep(0.015, 0.06, vLmorFabricPosition.z);
      vec4 ink = texture2D(uLmorPrint, printUv);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88), ink.a * inPrint);
      `
          : ''),
    )
  }
  material.customProgramCacheKey = () =>
    printed ? 'lmor-printed-tee-v1' : denim ? 'lmor-denim-v1' : 'lmor-cotton-v1'
  material.roughness = denim ? 0.94 : 0.9
  material.bumpMap = fabricBump ?? null
  material.bumpScale = 0.00065
  material.envMapIntensity = 0.45
  material.needsUpdate = true
}
export function finishHuman(
  avatar: HumanAvatar,
  body: Body,
  top: Selection,
  bottom: Selection,
  hero: boolean,
) {
  // Actual MakeHuman shape targets reshape the connected anatomical mesh and all fitted proxies.
  const actualHeight = avatar.metrics().height
  avatar.group.scale.set(1, body.height / 100 / actualHeight, 1)
  avatar.group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.castShadow = true
    object.receiveShadow = true
    if (object.name.startsWith('clothes-lmor_')) {
      const upper =
          object.name.startsWith('clothes-lmor_top_') ||
          object.name === 'clothes-lmor_hood',
        selection = upper ? top : bottom
      const product = productById(selection.id)!,
        material = object.material as THREE.MeshStandardMaterial
      material.color.set(product.colors[selection.color].hex)
      material.side = THREE.DoubleSide
      const ease = upper
        ? selection.id === 'essential-tee'
          ? 1.075
          : selection.id === 'cloud-hoodie'
            ? 1.055
            : 1.025
        : selection.id === 'light-denim'
          ? 1.06
          : 1.015
      const positions = object.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++)
        positions.setXYZ(
          i,
          positions.getX(i) * ease,
          positions.getY(i),
          positions.getZ(i) * (1 + (ease - 1) * 0.65),
        )
      positions.needsUpdate = true
      object.geometry.computeBoundingSphere()
      if (material.userData.printBounds)
        material.userData.printBounds.value.set(
          0,
          actualHeight * 0.655,
          actualHeight * 0.095,
          actualHeight * 0.18,
        )
      if (!material.userData.lmorFabric) {
        material.userData.printBounds = {
          value: new THREE.Vector4(
            0,
            actualHeight * 0.655,
            actualHeight * 0.095,
            actualHeight * 0.18,
          ),
        }
        tintFabric(
          material,
          product.type === 'denim',
          product.id === 'washed-tee',
        )
        material.userData.lmorFabric = true
      }
      if (product.id === 'daily-jacket') {
        material.roughness = 0.46
        material.envMapIntensity = 0.8
        material.normalScale.set(0.3, 0.3)
        material.bumpScale = 0.00025
        if (material.map) {
          material.map = null
          material.needsUpdate = true
        }
      }
    }
    if (object.name === 'body') {
      const skin = object.material as THREE.MeshStandardMaterial
      skin.roughness = 0.57
      skin.envMapIntensity = 0.55
    }
  })
  addGarmentDetails(avatar, top, actualHeight)
  // A slightly asymmetric, relaxed stance avoids a rigid mannequin pose.
  for (const side of ['Left', 'Right']) {
    const arm = avatar.bones.find((b) => b.name.endsWith(`${side}Arm`))
    const forearm = avatar.bones.find((b) => b.name.endsWith(`${side}ForeArm`))
    if (!arm || !forearm) continue
    const sign = side === 'Left' ? 1 : -1
    aimBone(
      avatar,
      arm,
      new THREE.Vector3(sign * (side === 'Left' ? 0.12 : 0.07), -1, 0.055),
    )
    aimBone(
      avatar,
      forearm,
      new THREE.Vector3(sign * 0.025, -0.99, side === 'Left' ? 0.15 : 0.2),
    )
  }
  const rightArm = avatar.bones.find((b) => b.name.endsWith('RightArm'))
  const rightForearm = avatar.bones.find((b) => b.name.endsWith('RightForeArm'))
  const armRest = rightArm?.quaternion.clone(),
    forearmRest = rightForearm?.quaternion.clone()
  let armWave: THREE.Quaternion | undefined,
    forearmWave: THREE.Quaternion | undefined
  if (hero && rightArm && rightForearm) {
    aimBone(avatar, rightArm, new THREE.Vector3(-0.78, 0.28, 0.12))
    aimBone(avatar, rightForearm, new THREE.Vector3(-0.04, 1, 0.12))
    armWave = rightArm.quaternion.clone()
    forearmWave = rightForearm.quaternion.clone()
    rightArm.quaternion.copy(armRest!)
    rightForearm.quaternion.copy(forearmRest!)
  }
  const head = avatar.bones.find((b) => b.name.endsWith(':Head'))
  const chest = avatar.bones.find((b) => b.name.endsWith(':Spine2'))
  head?.quaternion.multiply(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0.005, -0.025, 0.012)),
  )
  chest?.quaternion.multiply(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.01)),
  )
  avatar.setExpression('mouthSmile', hero ? 0.22 : 0.13)
  avatar.group.updateMatrixWorld(true)
  return {
    rightArm,
    rightForearm,
    armRest,
    forearmRest,
    armWave,
    forearmWave,
    head,
    headRest: head?.quaternion.clone(),
    chest,
    chestRest: chest?.quaternion.clone(),
  }
}

function aimBone(
  avatar: HumanAvatar,
  bone: THREE.Bone,
  direction: THREE.Vector3,
) {
  avatar.group.updateMatrixWorld(true)
  const rootRotation = avatar.group.getWorldQuaternion(new THREE.Quaternion())
  direction.normalize().applyQuaternion(rootRotation)
  const desired = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction,
  )
  const parent =
    bone.parent?.getWorldQuaternion(new THREE.Quaternion()) ??
    new THREE.Quaternion()
  bone.quaternion.copy(parent.invert().multiply(desired))
  avatar.group.updateMatrixWorld(true)
}
