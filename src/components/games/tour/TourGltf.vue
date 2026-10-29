<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const props = defineProps({
  src: { type: String, required: true },
  clip: { type: String, default: 'idle' },
  size: { type: Number, default: 96 },
  facing: { type: String, default: 'se' },
  label: { type: String, default: '' },
})

const canvasRef = ref(null)
const error = ref('')
let renderer
let scene
let camera
let mixer
let actions = {}
let current
let wrapper
let frame
let clock
let gen = 0

const FACE_Y = { se: 0.7, ne: -0.5, sw: 2.4, nw: 3.9 }

function play(name) {
  if (!mixer) return
  const next = actions[name] || actions.idle || Object.values(actions)[0]
  if (!next || next === current) return
  current?.fadeOut(0.1)
  next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.1).play()
  current = next
}

function stopLoop() {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function dispose() {
  stopLoop()
  mixer?.stopAllAction()
  mixer = current = null
  actions = {}
  scene?.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m.dispose?.())
    }
  })
  renderer?.dispose()
  renderer = scene = camera = wrapper = null
}

function urlOf(src) {
  if (/^https?:\/\//.test(src)) return src
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${src.replace(/^\//, '')}`
}

function frameCamera(object) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) {
    camera.position.set(2, 2, 2)
    camera.lookAt(0, 0.5, 0)
    return
  }
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.4)
  const half = maxDim * 0.95
  const aspect = props.size / Math.round(props.size * 1.2)
  camera.left = -half * aspect
  camera.right = half * aspect
  camera.top = half
  camera.bottom = -half
  camera.near = 0.01
  camera.far = maxDim * 20
  camera.position.set(center.x + maxDim * 1.15, center.y + maxDim * 0.95, center.z + maxDim * 1.15)
  camera.lookAt(center)
  camera.updateProjectionMatrix()
}

async function boot() {
  const my = ++gen
  error.value = ''
  await nextTick()
  const canvas = canvasRef.value
  if (!canvas) return
  dispose()
  const w = Math.max(64, props.size)
  const h = Math.round(w * 1.2)

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50)
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(w, h, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.style.transform = 'translateZ(0)'

  scene.add(new THREE.AmbientLight(0xffffff, 1.2))
  scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.9))
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(4, 8, 5)
  scene.add(sun)

  try {
    const gltf = await new GLTFLoader().loadAsync(urlOf(props.src))
    if (my !== gen) return
    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          if (!m) return
          m.side = THREE.DoubleSide
          m.transparent = false
          m.depthWrite = true
          if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0.2, 0.35)
        })
      }
    })
    wrapper = new THREE.Group()
    wrapper.add(gltf.scene)
    wrapper.rotation.y = FACE_Y[props.facing] ?? FACE_Y.se
    scene.add(wrapper)
    frameCamera(wrapper)

    mixer = new THREE.AnimationMixer(gltf.scene)
    actions = {}
    for (const clip of gltf.animations) {
      actions[clip.name] = mixer.clipAction(clip)
    }
    play(props.clip)
  } catch (e) {
    if (my !== gen) return
    error.value = `Không tải được ${props.src}`
    console.error('[TourGltf]', props.src, e)
  }

  clock = new THREE.Clock()
  const tick = () => {
    if (my !== gen) return
    frame = requestAnimationFrame(tick)
    mixer?.update(clock.getDelta())
    renderer?.render(scene, camera)
  }
  tick()
}

watch(() => props.src, boot)
watch(() => props.clip, (name) => play(name))
watch(
  () => props.facing,
  (f) => {
    if (wrapper) {
      wrapper.rotation.y = FACE_Y[f] ?? FACE_Y.se
      frameCamera(wrapper)
    }
  },
)
watch(
  () => props.size,
  () => {
    if (!renderer || !camera) return
    const w = Math.max(64, props.size)
    const h = Math.round(w * 1.2)
    renderer.setSize(w, h, false)
    if (wrapper) frameCamera(wrapper)
  },
)

onMounted(boot)
onUnmounted(() => {
  gen += 1
  dispose()
})
</script>

<template>
  <div class="gltf" :style="{ width: Math.max(64, size) + 'px', height: Math.round(Math.max(64, size) * 1.2) + 'px' }">
    <canvas ref="canvasRef" />
    <p v-if="error" class="err">{{ error }}</p>
    <span v-if="label" class="tag">{{ label }}</span>
  </div>
</template>

<style scoped>
.gltf {
  position: relative;
  isolation: isolate;
  transform: translateZ(0);
  background: transparent;
}
canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: transparent;
}
.err {
  position: absolute;
  inset: 8px;
  margin: 0;
  font-size: 11px;
  color: #b91c1c;
  text-align: center;
  align-content: center;
}
.tag {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: #0f172acc;
  padding: 1px 6px;
  border-radius: 999px;
  white-space: nowrap;
}
</style>
