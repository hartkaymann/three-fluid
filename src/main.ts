import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import vertexBasic from './shaders/basic.vert'
import fragmentSource from './shaders/source.frag'
import fragmentAdvect from './shaders/advect.frag'
import fragmentJacobi from './shaders/jacobi.frag'
import fragmentDivergence from './shaders/divergence.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentDisplayVector from './shaders/displayvector.frag'
import fragmentDisplayScalar from './shaders/displayscalar.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentGravity from './shaders/gravity.frag'

import Slab from './lib/Slab';
import Mouse from './lib/Mouse';
import Advect from './lib/slabop/Advect';
import Splat from './lib/slabop/Splat';
import Divergence from './lib/slabop/Divergence';
import Gradient from './lib/slabop/Gradient';
import Boundary from './lib/slabop/Boundary';
import Gravity from './lib/slabop/Gravity';
import Jacobi from './lib/slabop/Jacobi';
import SlabDebug from './lib/SlabDebug';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(20, 20);
const grid = new THREE.Vector2(1000, 1000);

let applyViscosity = false;
let viscosity = 0.3;
let timestep = 1.0;
let dissipation = 0.99;
let applyBoundaries = true;
let pressureIterations = 50;

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;

let slabDebugs: SlabDebug[] = [];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

let density: Slab;
let velocity: Slab;
let pressure: Slab;
let velocityDivergence: Slab;

let advect: Advect;
let splat: Splat;
let divergence: Divergence;
let gradient: Gradient;
let boundary: Boundary;
let gravity: Gravity;
let jacobi: Jacobi;

let materialDisplayVector: THREE.RawShaderMaterial;

let quad: THREE.Mesh;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = <HTMLElement>document.getElementById('content');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  // Slabs
  density = new Slab(grid.x, grid.y);
  velocity = new Slab(grid.x, grid.y);
  pressure = new Slab(grid.x, grid.y);
  velocityDivergence = new Slab(grid.x, grid.y);

  // Slabobs
  advect = new Advect(grid, vertexBasic, fragmentAdvect);
  splat = new Splat(grid, vertexBasic, fragmentSource);
  divergence = new Divergence(grid, vertexBasic, fragmentDivergence);
  gradient = new Gradient(grid, vertexBasic, fragmentGradient);
  boundary = new Boundary(grid, vertexBasic, fragmentBoundary);
  jacobi = new Jacobi(grid, vertexBasic, fragmentJacobi);
  gravity = new Gravity(grid, vertexBasic, fragmentGravity);

  // Display mesh
  materialDisplayVector = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      bias: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
      scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: vertexBasic,
    fragmentShader: fragmentDisplayVector,
    side: THREE.DoubleSide
  });

  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y, 2, 2),
    materialDisplayVector
  );
  scene.add(quad);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor(0x0e0e0e)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setScissorTest(true);
  renderer.autoClear = false;

  // Texture debug panel
  slabDebugs.push(new SlabDebug("Density", density, grid, vertexBasic, fragmentDisplayVector));
  slabDebugs.push(new SlabDebug("Velocity", velocity, grid, vertexBasic, fragmentDisplayVector, 0.5));
  slabDebugs.push(new SlabDebug("Pressure", pressure, grid, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Divergence", velocityDivergence, grid, vertexBasic, fragmentDisplayScalar, 0.5));

  slabDebugs.forEach(element => {
    element.create(container);
  });

  // Additionals
  mouse = new Mouse();


  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.mouseButtons =  {
    MIDDLE: THREE.MOUSE.ROTATE
  }

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
  advect.compute(renderer, velocity, velocity, velocity, timestep);
  boundary.compute(renderer, velocity, velocity);

  advect.compute(renderer, density, velocity, density, timestep, dissipation);

  // 2 - Add external forces  
  addForce();

  // 3 - Viscous diffusion
  if (applyViscosity && viscosity > 0) {

    let alpha = 1.0 / (viscosity * timestep);
    let beta = 4.0 + alpha;

    jacobi.alpha = alpha;
    jacobi.beta = beta;

    jacobi.compute(renderer, velocity, velocity, velocity, 20, boundary);

    jacobi.compute(renderer, density, density, density, 20);
  }

  // Projection
  project();

  // 5 - Render 
  materialDisplayVector.uniforms.read.value = density.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.render(scene, camera);


  slabDebugs.forEach(element => {
    element.render(renderer);
  });
}
step();

function addForce() {
  if (!(mouse.left || mouse.right))
    return;

  if (mouse.left) {
    splat.compute(renderer, density, density, mouse.position, new THREE.Color(0xffffff));
  }

  if (mouse.right) {
    let color = new THREE.Color().setFromVector3(
      new THREE.Vector3(mouse.motion.x, mouse.motion.y, 0.0)
    );
    splat.compute(renderer, velocity, velocity, mouse.position, color);
    boundary.compute(renderer, velocity, velocity);
  }
}

function project() {

  // Divergence
  divergence.compute(renderer, velocity, velocityDivergence);

  // Poisson Pressure
  jacobi.alpha = -1.0;
  jacobi.beta = 4.0;
  jacobi.compute(renderer, pressure, velocityDivergence, pressure, 50, boundary, 1.0);

  // Subtracting Gradient
  gradient.compute(renderer, velocity, pressure, velocity);
  boundary.compute(renderer, velocity, velocity);
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});