import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import vertexShaderBasic from './shaders/basic.vert'
import fragmentShaderSource from './shaders/source.frag'
import fragmentShaderAdvect from './shaders/advect.frag'
import fragmentShaderJacobi from './shaders/jacobi.frag'
import fragmentShaderDivergence from './shaders/divergence.frag'
import fragmentShaderGradient from './shaders/gradient.frag'
import fragmentShaderDisplay from './shaders/displayvector.frag'
import fragmentShaderBoundary from './shaders/boundary.frag'
import fragmentShaderGravity from './shaders/gravity.frag'

import PingPongBuffer from './lib/PingPongBuffer';
import Mouse from './lib/Mouse';
import Advect from './lib/slabop/Advect';
import Splat from './lib/slabop/Splat';
import Divergence from './lib/slabop/Divergence';
import Gradient from './lib/slabop/Gradient';
import Boundary from './lib/slabop/Boundary';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(20, 20);
const grid = new THREE.Vector2(200, 200);

let applyViscosity = false;
let viscosity = 0.01;
let timestep = 1.0;
let dissipation = 0.99;

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

let density: PingPongBuffer;
let velocity: PingPongBuffer;
let pressure: PingPongBuffer;
let velocityDivergence: PingPongBuffer;

let advect: Advect;
let splat: Splat;
let divergence: Divergence;
let gradient: Gradient;
let boundary: Boundary;

let bufferObject: THREE.Mesh;
let jacobiMaterial: THREE.RawShaderMaterial;
let gravityMaterial: THREE.RawShaderMaterial;
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
  velocityDivergence = new PingPongBuffer(grid.x, grid.y);

  arrDebug.push({ name: "Density", buffer: density });
  arrDebug.push({ name: "Velocity", buffer: velocity });
  arrDebug.push({ name: "Pressure", buffer: pressure });
  arrDebug.push({ name: "Divergence", buffer: velocityDivergence });

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

  jacobiMaterial = new THREE.RawShaderMaterial({
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

  advect = new Advect(grid, vertexShaderBasic, fragmentShaderAdvect);
  splat = new Splat(grid, vertexShaderBasic, fragmentShaderSource);
  divergence = new Divergence(grid, vertexShaderBasic, fragmentShaderDivergence);
  gradient = new Gradient(grid, vertexShaderBasic, fragmentShaderGradient);
  boundary = new Boundary(grid, vertexShaderBasic, fragmentShaderBoundary);

  gravityMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      res: { value: grid },
      dt: { value: 0.0 }
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderGravity
  });

  displayMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      bias: { value: new THREE.Vector3(0., 0., 0.) },
      scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderDisplay,
    side: THREE.DoubleSide
  });

  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(grid.x / -2 - 0.1, grid.x / 2 + 0.1, grid.y / 2, grid.y / -2, 1, 100);
  bufferCamera.position.z = 2;

  bufferObject = new THREE.Mesh(plane, jacobiMaterial)
  bufferScene.add(bufferObject);

  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y, 2, 2),
    displayMaterial
  );
  sceneApp.add(quad);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
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

  // 1 - Advection
  // 1.1 - Advect velocity
  advect.compute(renderer, velocity.read.texture, velocity.read.texture, velocity, timestep);
  boundary.compute(renderer, velocity.read.texture, velocity);

  // 1.2 Advect density
  advect.compute(renderer, density.read.texture, velocity.read.texture, density, timestep, dissipation);

  // 2 - Add external forces  
  // 2.1 - Gravity
  // TBA

  // 2.2 - Mouse input
  addForce();

  // 3 - Viscous diffusion
  if (applyViscosity && viscosity > 0) {

    bufferObject.material = jacobiMaterial;
    let alpha = 1.0 / (viscosity * timestep);
    jacobiMaterial.uniforms.alpha.value = alpha;
    jacobiMaterial.uniforms.rbeta.value = 1.0 / (4.0 + alpha);

    // 3.1 - Diffuse velocity
    for (let i = 0; i < 20; i++) {
      jacobiMaterial.uniforms.x.value = velocity.read.texture;
      jacobiMaterial.uniforms.b.value = velocity.read.texture;
      renderer.setRenderTarget(velocity.write);
      renderer.render(bufferScene, bufferCamera);
      velocity.swap();
      renderer.setRenderTarget(null);

      boundary.compute(renderer, velocity.read.texture, velocity);
    }

    // 3.2 - Diffuse density
    for (let i = 0; i < 20; i++) {
      jacobiMaterial.uniforms.x.value = density.read.texture;
      jacobiMaterial.uniforms.b.value = density.read.texture;
      renderer.setRenderTarget(density.write);
      renderer.render(bufferScene, bufferCamera);
      density.swap();
      renderer.setRenderTarget(null);
    }
  }


  // 4 - Projection
  project();

  // 5 - Render 
  // 5.1 - Render app scene
  displayMaterial.uniforms.read.value = density.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
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
  if (!(mouse.left || mouse.right))
    return;

  if (mouse.left) {
    splat.compute(renderer, density.read.texture, density, mouse.position, new THREE.Color(0xffffff));
  }

  if (mouse.right) {
    let color = new THREE.Color().setFromVector3(
      new THREE.Vector3(mouse.motion.x, mouse.motion.y, 0.0)
    );
    splat.compute(renderer, velocity.read.texture, velocity, mouse.position, color);
    boundary.compute(renderer, velocity.read.texture, velocity);
  }
}

function project() {

  // 4.1 - Divergence
  divergence.compute(renderer, velocity.read.texture, velocityDivergence);

  // 4.2 - Poisson Pressure
  bufferObject.material = jacobiMaterial;
  jacobiMaterial.uniforms.alpha.value = -1.0;
  jacobiMaterial.uniforms.rbeta.value = 1.0 / 4.0;
  for (let i = 0; i < 50; i++) {
    jacobiMaterial.uniforms.b.value = velocityDivergence.read.texture;
    jacobiMaterial.uniforms.x.value = pressure.read.texture;
    renderer.setRenderTarget(pressure.write);
    renderer.render(bufferScene, bufferCamera);
    pressure.swap();

    boundary.compute(renderer, pressure.read.texture, pressure, 1);
  }
  renderer.setRenderTarget(null);

  // 4.3 - Gradient
  gradient.compute(renderer, velocity.read.texture, pressure.read.texture, velocity);
  boundary.compute(renderer, velocity.read.texture, velocity);
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  cameraApp.aspect = width / height;
  cameraApp.updateProjectionMatrix();
  renderer.setSize(width, height);
});