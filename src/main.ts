import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderDiffuse from './shaders/diffuse.frag'
import fragmentShaderSource from './shaders/source.frag'
import vertexShaderBasic from './shaders/basic.vert'

import PingPongBuffer from './lib/PingPongBuffer';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(30, 20);
const grid = new THREE.Vector2(300, 200);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
}
init();

let bufferScene: THREE.Scene;
let bufferCamera: THREE.OrthographicCamera;

let density: PingPongBuffer;
let velocity: PingPongBuffer;

let bufferObject: THREE.Mesh;
let densityMaterial: THREE.ShaderMaterial;
let sourceMaterial: THREE.ShaderMaterial;


const init_rtt = () => {
  const plane = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);
  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 0.1, 100);
  bufferCamera.position.z = 1;

  density = new PingPongBuffer(grid.x, grid.y);
  velocity = new PingPongBuffer(grid.x, grid.y);

  sourceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      bufferTexture: { value: density.read.texture },
      res: { value: new THREE.Vector2(grid.x, grid.y) },
      source: { value: new THREE.Vector3(0, 0, 0) }
    },
    fragmentShader: fragmentShaderSource,
    vertexShader: vertexShaderBasic
  });

  densityMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      bufferTexture: { value: density.read.texture },
      res: { value: new THREE.Vector2(grid.x, grid.y) },
      dt: { value: 0.0 }
    },
    fragmentShader: fragmentShaderDiffuse,
    vertexShader: vertexShaderBasic
  });

  bufferObject = new THREE.Mesh(plane, densityMaterial)
  bufferScene.add(bufferObject);

}
init_rtt();

let quad: THREE.Mesh;
let finalMaterial: THREE.MeshBasicMaterial;

const init_scene = () => {
  finalMaterial = new THREE.MeshBasicMaterial({ map: density.write.texture, side: THREE.DoubleSide });
  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y),
    finalMaterial
  );
  scene.add(quad);
  scene.background = new THREE.Color(0x050505);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;

  clock = new Clock();
  clock.start();
}
init_scene();

const tick = () => {
  setTimeout(() => {
    requestAnimationFrame(tick);
  }, 1000 / 30);

  bufferObject.material = sourceMaterial;
  sourceMaterial.uniforms.bufferTexture.value = density.read.texture;
  renderer.setRenderTarget(density.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  density.swap();

  bufferObject.material = densityMaterial;
  densityMaterial.uniforms.bufferTexture.value = density.read.texture;
  densityMaterial.uniforms.dt.value = clock.getDelta();
  renderer.setRenderTarget(density.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  density.swap();

  // Swap textures
  (quad.material as THREE.MeshBasicMaterial).map = density.read.texture;


  // Required updates
  stats.update();
  controls.update();

  // Render scene
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(scene, camera);
}
tick();


// Controls
let mouseDown = false;
const update_mouse = (x: number, y: number) => {
  let mouseX = x;
  let mouseY = y;
  sourceMaterial.uniforms.source.value.x = mouseX;
  sourceMaterial.uniforms.source.value.y = mouseY;
}

document.onmousemove = function (event) {
  let x = (event.clientX / width) * grid.x;
  let y = grid.y - (event.clientY / height) * grid.y;
  update_mouse(x, y);
}

document.onmousedown = function (_) {
  mouseDown = true;
  sourceMaterial.uniforms.source.value.z = 0.1;
}

document.onmouseup = function (_) {
  mouseDown = false;
  sourceMaterial.uniforms.source.value.z = 0;
}

document.onkeydown = function (event) {
  if (event.key == 'Control') {
    controls.enabled = true;
  }
}

document.onkeyup = function (event) {
  if (event.key == 'Control') {
    controls.enabled = false;
  }
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

