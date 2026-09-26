import * as THREE from "three/webgpu"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"
import {Inspector} from "three/addons/inspector/Inspector.js"

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
const material = new THREE.MeshBasicNodeMaterial()

/**
 * Objects
 */
// Torus knot
const torusKnot = new THREE.Mesh(
	new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
	material
)
torusKnot.position.x = 3
scene.add(torusKnot)

// Sphere
const sphere = new THREE.Mesh(
	new THREE.SphereGeometry(),
	material
)
sphere.position.x = -3
scene.add(sphere)

// Suzanne
let suzanne = null
gltfLoader.load(
	"./suzanne.glb",
	(gltf) => {
		suzanne = gltf.scene
		suzanne.traverse((child) => {
			if(child.isMesh)
				child.material = material
		})
		scene.add(suzanne)
	}
)


/**
 * Animate
 */
const timer = new THREE.Timer()
timer.connect(document)

const tick = () => {
	timer.update()
	const elapsedTime = timer.getElapsed()

	// Rotate objects
	if(suzanne){
		suzanne.rotation.x = - elapsedTime * 0.1
		suzanne.rotation.y = elapsedTime * 0.2
	}

	torusKnot.rotation.x = - elapsedTime * 0.1
	torusKnot.rotation.y = elapsedTime * 0.2

	sphere.rotation.x = - elapsedTime * 0.1
	sphere.rotation.y = elapsedTime * 0.2

	// Update controls
	controls.update()

	// Render
	renderer.render(scene, camera)
}

renderer.setAnimationLoop(tick)
