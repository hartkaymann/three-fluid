import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderDiffuse from './shaders/diffuse.frag'
import fragmentShaderSource from './shaders/source.frag'
import vertexShaderBasic from './shaders/basic.vert'

import PingPongBuffer from './lib/PingPongBuffer';

let width = window.innerWidth;
let height = window.innerHeight;

const gridSize = new THREE.Vector2(30, 20);
const gridResolution = new THREE.Vector2(300, 200);

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;

let controls: OrbitControls;
let stats: Stats;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 20;

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

const plane = new THREE.PlaneGeometry(gridSize.x, gridSize.y);

const init_rtt = () => {
  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(gridSize.x / -2, gridSize.x / 2, gridSize.y / 2, gridSize.y / -2, 1, 1000);
  bufferCamera.position.z = 2;
  
  density = new PingPongBuffer(gridResolution.x, gridResolution.y);
  velocity = new PingPongBuffer(gridResolution.x, gridResolution.y);
  
  sourceMaterial  = new THREE.RawShaderMaterial({
    uniforms: {
      bufferTexture: { value: density.read.texture },
      res: { value: new THREE.Vector2(gridResolution.x, gridResolution.y) },
      source: { value: new THREE.Vector3(0, 0, 0) }
    },
    fragmentShader: fragmentShaderSource,
    vertexShader: vertexShaderBasic
  });

  densityMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      bufferTexture: { value: density.read.texture },
      res: { value: new THREE.Vector2(gridResolution.x, gridResolution.y) },
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
  quad = new THREE.Mesh(plane, finalMaterial);
  scene.add(quad);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
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
  renderer.setRenderTarget(density.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  density.swap();
  
  // Swap textures
  (quad.material as THREE.MeshBasicMaterial).map = density.write.texture;


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
  let x = (event.clientX / width) * gridResolution.x;
  let y = gridResolution.y - (event.clientY / height) * gridResolution.y;
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

