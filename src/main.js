import * as THREE from "three/webgpu"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { Inspector } from "three/addons/inspector/Inspector.js"
import {
	add,
	color,
	dot,
	Fn,
	hash,
	materialAO,
	normalView,
	positionLocal,
	positionViewDirection,
	rand,
	time,
	uniform,
	uv,
	vec3,
	vec4,
} from "three/tsl"

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.threejs")

// Scene
const scene = new THREE.Scene()

// Loaders
const gltfLoader = new GLTFLoader()

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update Camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base Camera
const camera = new THREE.PerspectiveCamera(
	35,
	sizes.width / sizes.height,
	0.1,
	100,
)
camera.position.set(7, 7, 7)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
	canvas: canvas,
	antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x111111)
renderer.inspector = new Inspector()

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Material
 */
// Uniforms
const hologramColor = uniform(color(0xa173bf))

const material = new THREE.MeshBasicNodeMaterial({
	transparent: true,
	side: THREE.DoubleSide,
	depthWrite: false,
	blending: THREE.AdditiveBlending,
})

// Glitch
material.positionNode = Fn(() => {
	//Glitch
	const glitchTime = time.sub(positionLocal.y)
	const glitchStrength = add(
		glitchTime.sin(),
		glitchTime.mul(3.45).sin(),
		glitchTime.mul(8.76).sin(),
	)
		.div(3)
		.smoothstep(0.3, 1.0)
		.mul(0.25)

	positionLocal.x.addAssign(
		rand(positionLocal.xz.add(time)).sub(0.5).mul(glitchStrength),
	)
	positionLocal.z.addAssign(
		rand(positionLocal.zx.add(time)).sub(0.5).mul(glitchStrength),
	)

	return positionLocal
})()

// Hologram Effect
material.opacityNode = Fn(() => {
	// Stripe pattern
	const stripes = positionLocal.y.sub(time.mul(0.02)).mul(20).fract().pow(3)

	// Fresnel
	const fresnel = dot(positionViewDirection, normalView)
		.abs()
		.oneMinus()
		.pow(2)

	// FallOff
	const falloff = fresnel.smoothstep(0.95, 0.2)

	// Holographic
	const holographic = stripes.mul(fresnel).add(fresnel).mul(falloff)

	return holographic
})()

// Color
material.colorNode = hologramColor

/**
 * Objects
 */
// Torus knot
const torusKnot = new THREE.Mesh(
	new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
	material,
)
torusKnot.position.x = 3
scene.add(torusKnot)

// Sphere
const sphere = new THREE.Mesh(new THREE.SphereGeometry(), material)
sphere.position.x = -3
scene.add(sphere)

// Suzanne
let suzanne = null
gltfLoader.load("./suzanne.glb", (gltf) => {
	suzanne = gltf.scene
	suzanne.traverse((child) => {
		if (child.isMesh) child.material = material
	})
	scene.add(suzanne)
})

// Debug
const hologramGui = renderer.inspector.createParameters("Hologram")
hologramGui.addColor(hologramColor, "value").name("color")

/**
 * Animate
 */
const timer = new THREE.Timer()
timer.connect(document)

const tick = () => {
	timer.update()
	const elapsedTime = timer.getElapsed()

	// Rotate objects
	if (suzanne) {
		suzanne.rotation.x = -elapsedTime * 0.1
		suzanne.rotation.y = elapsedTime * 0.2
	}

	torusKnot.rotation.x = -elapsedTime * 0.1
	torusKnot.rotation.y = elapsedTime * 0.2

	sphere.rotation.x = -elapsedTime * 0.1
	sphere.rotation.y = elapsedTime * 0.2

	// Update controls
	controls.update()

	// Render
	renderer.render(scene, camera)
}

renderer.setAnimationLoop(tick)
