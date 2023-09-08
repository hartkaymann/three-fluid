import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderSource from './shaders/source.frag'
import fragmentShaderAdvect from './shaders/advect.frag'
import fragmentShaderJacobi from './shaders/jacobi.frag'
import fragmentShaderDivergence from './shaders/divergence.frag'
import fragmentShaderGradient from './shaders/gradient.frag'
import fragmentShaderDisplay from './shaders/display.frag'
import fragmentShaderBoundary from './shaders/boundary.frag'

import vertexShaderBasic from './shaders/basic.vert'

import PingPongBuffer from './lib/PingPongBuffer';
import Mouse from './lib/Mouse';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(30, 20);
const grid = new THREE.Vector2(300, 200);

let viscosity = 0.3;

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;

const scenes: THREE.Scene[] = [];
let sceneApp: THREE.Scene;
let cameraApp: THREE.PerspectiveCamera;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

let bufferScene: THREE.Scene;
let bufferCamera: THREE.OrthographicCamera;
let boundaryScene: THREE.Scene;
let boundaryLines: THREE.Mesh[] = [];

let density: PingPongBuffer;
let velocity: PingPongBuffer;
let pressure: PingPongBuffer;
let divergence: PingPongBuffer;

let bufferObject: THREE.Mesh;
let sourceMaterial: THREE.RawShaderMaterial;
let diffuseMaterial: THREE.RawShaderMaterial;
let advectionMaterial: THREE.RawShaderMaterial;
let divergenceMaterial: THREE.RawShaderMaterial;
let gradientMaterial: THREE.RawShaderMaterial;
let boundaryMaterial: THREE.RawShaderMaterial;
let displayMaterial: THREE.RawShaderMaterial;

let quad: THREE.Mesh;

type DebugMaterial = {
  name: string;
  buffer: PingPongBuffer;
}
const arrDebug: DebugMaterial[] = [];

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = document.getElementById('content');

  mouse = new Mouse();

  sceneApp = new THREE.Scene();

  density = new PingPongBuffer(grid.x, grid.y);
  velocity = new PingPongBuffer(grid.x, grid.y);
  pressure = new PingPongBuffer(grid.x, grid.y);
  divergence = new PingPongBuffer(grid.x, grid.y);

  arrDebug.push({ name: "Density", buffer: density });
  arrDebug.push({ name: "Velocity", buffer: velocity });
  arrDebug.push({ name: "Pressure", buffer: pressure });
  arrDebug.push({ name: "Divergence", buffer: divergence });

  for (let i = 0; i < 4; i++) {
    const scene = new THREE.Scene();

    const element = document.createElement('div');
    element.className = 'debug-item';

    const sceneElement = document.createElement('div');
    element.appendChild(sceneElement);

    const descriptionElemen = document.createElement('div');
    descriptionElemen.innerText = arrDebug[i].name;
    element.appendChild(descriptionElemen);

    scene.userData.element = sceneElement;
    container?.appendChild(element);

    const camera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 1, 10);
    camera.position.z = 2;
    scene.userData.camera = camera;

    const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.enablePan = false;
    controls.enableZoom = false;
    scene.userData.controls = controls;

    const geometry = new THREE.PlaneGeometry(grid.x, grid.y)
    const material = new THREE.MeshBasicMaterial({ map: arrDebug[i].buffer.read.texture });
    scene.userData.buffer = arrDebug[i].buffer;

    let mesh = new THREE.Mesh(geometry, material);
    mesh.name = "plane"
    scene.add(mesh);

    scenes.push(scene);
  }

  cameraApp = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  cameraApp.position.z = 15;

  const plane = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);

  sourceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      position: { value: new THREE.Vector2(0, 0) },
      color: { value: new THREE.Vector3(0, 0, 0) },
      read: { value: density.read.texture }
    },
    fragmentShader: fragmentShaderSource,
    vertexShader: vertexShaderBasic
  });

  diffuseMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      x: { value: density.read.texture },
      b: { value: density.read.texture },
      alpha: { value: -1.0 },
      rbeta: { value: 1.0 / 4.0 }
    },
    fragmentShader: fragmentShaderJacobi,
    vertexShader: vertexShaderBasic
  });

  advectionMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      advected: { value: density.read.texture },
      velocity: { value: velocity.read.texture },
      res: { value: grid },
      dt: { value: 0.0 },
      dissipation: { value: 1.0 }
    },
    fragmentShader: fragmentShaderAdvect,
    vertexShader: vertexShaderBasic
  })

  divergenceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      halfrdx: { value: 0.5 / 1.0 },
      velocity: { value: velocity.read.texture }
    },
    fragmentShader: fragmentShaderDivergence,
    vertexShader: vertexShaderBasic
  });

  gradientMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      halfrdx: { value: 0.5 / 1.0 },
      pressure: { value: pressure.read.texture },
      velocity: { value: velocity.read.texture },
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderGradient
  });

  boundaryMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      read: { value: velocity.read.texture },
      offset: { value: new THREE.Vector2(0.0, 0.0) },
      scale: { value: 1.0 },
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderBoundary
  });

  displayMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      bias: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderDisplay,
    side: THREE.DoubleSide
  });

  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 0.1, 100);
  bufferCamera.position.z = 1;

  bufferObject = new THREE.Mesh(plane, diffuseMaterial)
  bufferScene.add(bufferObject);

  boundaryScene = new THREE.Scene();
  const points = [];
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(grid.x, grid.y / 2));
  points.push(new THREE.Vector2(grid.x / 2, grid.y / 2));
  points.push(new THREE.Vector2(grid.x / -2, grid.y / 2));

  let line1 = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([points[0], points[1]]),
    boundaryMaterial
  );

  boundaryLines.push(line1);

  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y),
    displayMaterial
  );
  sceneApp.add(quad);

  renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setClearColor(0x0e0e0e)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setScissorTest(true);
  renderer.autoClear = false;

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(cameraApp, renderer.domElement);
  controls.enabled = false;

  clock = new Clock();
  clock.start();
}
init();

function step() {
  setTimeout(() => {
    requestAnimationFrame(step);
  }, 1000 / 60);

  // Required updates
  stats.update();
  controls.update();

  const timestep = clock.getDelta();

  // 1 - Advection
  //TODO: Dissipation should not affect velocity, so set it to one here and change value to original before advecting density
  bufferObject.material = advectionMaterial;
  advectionMaterial.uniforms.dt.value = timestep;
  advectionMaterial.uniforms.advected.value = velocity.read.texture;
  advectionMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write)
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  velocity.swap(); 

  boundary();

  // 2 - Diffusion
  bufferObject.material = diffuseMaterial;
  let alpha = 1.0 / (viscosity * timestep);
  diffuseMaterial.uniforms.alpha.value = alpha;
  diffuseMaterial.uniforms.rbeta.value = 1.0 / (4.0 + alpha);
  for (let i = 0; i < 0; i++) {
    diffuseMaterial.uniforms.x.value = velocity.read.texture;
    diffuseMaterial.uniforms.b.value = velocity.read.texture;
    renderer.setRenderTarget(velocity.write);
    renderer.clear();
    renderer.render(bufferScene, bufferCamera);
    velocity.swap();
  }

  // 3 - Add external forces  
  addForce();

  // 4 - Projection
  //project();

  // 5 - Render 
  // 5.1 - Render app scene
  //displayMaterial.uniforms.read.value = velocity.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.clear();
  renderer.render(sceneApp, cameraApp);

  // 5.2 - Render debug scenes
  scenes.forEach(function (scene) {
    const element = <HTMLElement>scene.userData.element;
    const rect = element.getBoundingClientRect();

    if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
      rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
      return; // it's off screen
    }

    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left = rect.left;
    const bottom = renderer.domElement.clientHeight - rect.bottom;

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);

    let plane = scene.getObjectByName("plane") as THREE.Mesh;
    let material = plane.material as THREE.MeshBasicMaterial;
    material.map = scene.userData.buffer.read.texture;

    const camera = scene.userData.camera;
    renderer.render(scene, camera);
  });
}
step();

function addForce() {
  if (!mouse.left)
    return;

  if (mouse.motions.length == 0)
    return;

  bufferObject.material = sourceMaterial;
  sourceMaterial.uniforms.read.value = velocity.read.texture;
  sourceMaterial.uniforms.position.value = mouse.position;
  sourceMaterial.uniforms.color.value = mouse.motions[mouse.motions.length - 1]?.drag;
  renderer.setRenderTarget(velocity.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();
}

function project() {

  // 4.1 - Divergence
  bufferObject.material = divergenceMaterial;
  divergenceMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(divergence.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  divergence.swap();

  // 4.2 - Poisson Pressure
  bufferObject.material = diffuseMaterial;
  diffuseMaterial.uniforms.alpha.value = -1.0;
  diffuseMaterial.uniforms.rbeta.value = 1.0 / 4.0;
  diffuseMaterial.uniforms.b.value = divergence.read.texture;
  for (let i = 0; i < 40; i++) {
    diffuseMaterial.uniforms.x.value = pressure.read.texture;
    renderer.setRenderTarget(pressure.write);
    renderer.clear();
    renderer.render(bufferScene, bufferCamera);
    pressure.swap();
  }

  // 4.3 - Gradient
  bufferObject.material = gradientMaterial;
  gradientMaterial.uniforms.pressure.value = pressure.read.texture;
  gradientMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();
}

function boundary() {
  boundaryMaterial.uniforms.read.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write);

  boundaryLines.forEach(line => {
    boundaryMaterial.uniforms.offset.value = new THREE.Vector2(0, 0);
    boundaryMaterial.uniforms.scale.value = 1;
    boundaryScene.add(line);
    renderer.render(boundaryScene, bufferCamera);
    boundaryScene.remove(line);
  });
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  cameraApp.aspect = width / height;
  cameraApp.updateProjectionMatrix();
  renderer.setSize(width, height);
});

