import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import vertexBasic from './shaders/basic.vert'
import fragmentForce from './shaders/force.frag'
import fragmentAdvect from './shaders/advect.frag'
import fragmentJacobi from './shaders/jacobi.frag'
import fragmentDivergence from './shaders/divergence.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentDisplayVector from './shaders/displayvector.frag'
import fragmentDisplayScalar from './shaders/displayscalar.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentBuoyancy from './shaders/buoyancy.frag'
import fragmentVorticity from './shaders/vorticity.frag'
import fragmentVorticityConfinement from './shaders/vorticityconfine.frag'


import Slab from './lib/Slab';
import Mouse from './lib/Mouse';
import Advect from './lib/slabop/Advect';
import Force from './lib/slabop/Force';
import Divergence from './lib/slabop/Divergence';
import Gradient from './lib/slabop/Gradient';
import Boundary from './lib/slabop/Boundary';
import Buoyancy from './lib/slabop/Buoyancy';
import Jacobi from './lib/slabop/Jacobi';
import SlabDebug from './lib/SlabDebug';
import Vorticity from './lib/slabop/Vorticity';
import VorticityConfinement from './lib/slabop/VorticityConfinement';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(20, 20);
const grid = new THREE.Vector3(50, 50, 2);

let applyViscosity = false;
let viscosity = 0.3; // Viscosity, higher value means more viscous fluid
let applyVorticity = false; 
let curl = 0.3; // Curl
let dissipation = 1.; // Dissipation, lower value means faster dissipation
let rise = 1.0; // Tendency to rise
let fall = 1.0 // Tendency to fall, maybe link both with "weight" or sth
let applyBoundaries = true;
let pressureIterations = 80; // Jacobi iterations for poisson pressure, should be between 50-80 

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;
let raycaster: THREE.Raycaster;

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
let velocityVorticity: Slab;

let advect: Advect;
let force: Force;
let divergence: Divergence;
let gradient: Gradient;
let boundary: Boundary;
let buoyancy: Buoyancy;
let jacobi: Jacobi;
let vorticity: Vorticity;
let vorticityConfinement: VorticityConfinement;

let materialDisplayVector: THREE.RawShaderMaterial;

let quad: THREE.Mesh;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = <HTMLElement>document.getElementById('content');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  // Slabs
  density = new Slab(grid.x, grid.y, grid.z, THREE.RedFormat);
  velocity = new Slab(grid.x, grid.y, grid.z);
  pressure = new Slab(grid.x, grid.y, grid.z, THREE.RedFormat);
  velocityDivergence = new Slab(grid.x, grid.y, grid.z, THREE.RedFormat);
  velocityVorticity = new Slab(grid.x, grid.y, grid.z, THREE.RedFormat);

  // Slabobs
  advect = new Advect(grid, vertexBasic, fragmentAdvect);
  force = new Force(grid, vertexBasic, fragmentForce);
  divergence = new Divergence(grid, vertexBasic, fragmentDivergence);
  gradient = new Gradient(grid, vertexBasic, fragmentGradient);
  boundary = new Boundary(grid, vertexBasic, fragmentBoundary);
  jacobi = new Jacobi(grid, vertexBasic, fragmentJacobi);
  buoyancy = new Buoyancy(grid, vertexBasic, fragmentBuoyancy);
  vorticity = new Vorticity(grid, vertexBasic, fragmentVorticity);
  vorticityConfinement = new VorticityConfinement(grid, vertexBasic, fragmentVorticityConfinement);

  // Display mesh
  materialDisplayVector = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      bias: { value: new THREE.Vector3(-0.0, -0.0, -0.0) },
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
  quad.name = "main quad";
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
  slabDebugs.push(new SlabDebug("Vorticity", velocityVorticity, grid, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.forEach(element => {
    element.create(container);
  });

  // Additionals
  mouse = new Mouse();
  raycaster = new THREE.Raycaster();

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.mouseButtons = {
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

  let dt = clock.getDelta();

  // Required updates
  stats.update();
  controls.update();

  // Advection
  advect.compute(renderer, velocity, velocity, velocity, dt);
  //boundary.compute(renderer, velocity, velocity);

  advect.compute(renderer, density, velocity, density, dt, dissipation);

  // Body forces  
  //buoyancy.compute(renderer, velocity, density, velocity, dt);
  addSource(dt);

  // Vorticity confinement
  if( applyVorticity && curl > 0) {
    vorticity.compute(renderer, velocity, velocityVorticity);
    vorticityConfinement.compute(renderer, velocity, velocityVorticity, velocity, dt, curl);

    boundary.compute(renderer, velocity, velocity);
  }

  // Viscous diffusion
  if (applyViscosity && viscosity > 0) {

    let alpha = 1.0 / (viscosity * dt);
    let beta = 4.0 + alpha;

    jacobi.alpha = alpha;
    jacobi.beta = beta;

    jacobi.compute(renderer, velocity, velocity, velocity, 20, boundary);

    jacobi.compute(renderer, density, density, density, 20);
  }

  // Projection
  //project();

  // Render 
  materialDisplayVector.uniforms.read.value = velocity.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.render(scene, camera);


  slabDebugs.forEach(element => {
    element.render(renderer);
  });
}
step();

function addSource(dt: number) {
  if (!(mouse.left || mouse.right))
    return;

  let pointer = new THREE.Vector2(
    mouse.position.x * 2 - 1,
    -mouse.position.y * 2 + 1
  );

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length == 0)
    return;

  let position = new THREE.Vector3(
    (intersects[0].point.x + domain.x / 2) / domain.x,
    (intersects[0].point.y + domain.y / 2) / domain.y,
    0.0
  );

  if (mouse.left) {
    force.compute(renderer, density, density, dt, position, new THREE.Color(0xffffff), 0.001, 10.0);
  }

  if (mouse.right) {
    let direction = new THREE.Color().setFromVector3(
      new THREE.Vector3(mouse.motion.x, mouse.motion.y, 0.0).normalize()
    );
    force.compute(renderer, velocity, velocity, dt, position, direction, 0.001, 1.0);
    boundary.compute(renderer, velocity, velocity);
  }
}

function project() {

  // Divergence
  divergence.compute(renderer, velocity, velocityDivergence);

  // Poisson Pressure
  jacobi.alpha = -1.0;
  jacobi.beta = 4.0;
  jacobi.compute(renderer, pressure, velocityDivergence, pressure, pressureIterations, boundary, 1.0);

  // Subtract gradient
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