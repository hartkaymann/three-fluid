import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'dat.gui'

import vertexBasic from './shaders/basic.vert'


import fragmentDisplayVector from './shaders/displayvector.frag'
import fragmentDisplayScalar from './shaders/displayscalar.frag'

import SlabDebug from './lib/SlabDebug';

import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import Solver from './solver';
import Renderer from './renderer';
import TiledTexture from './lib/TiledTexture';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector3(40, 20, 20);
const maxResolution = new THREE.Vector2(4096, 4096);

let solver: Solver;
let renderer: Renderer;

let wgl: THREE.WebGLRenderer;

let mouse: Mouse;
let pointer: Pointer3D;

let slabDebugs: SlabDebug[] = [];

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;
let gui: GUI;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = <HTMLElement>document.getElementById('content');

  // Setup WebGL Renderer
  wgl = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  wgl.setClearColor(0x252525)
  wgl.setPixelRatio(window.devicePixelRatio);
  wgl.setSize(width, height);
  wgl.setScissorTest(true);
  wgl.autoClear = false;

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 20;

  const tiledTexture = new TiledTexture();
  tiledTexture.computeResolution(maxResolution, domain);

  // Initialize solver and renderer
  solver = new Solver(wgl, domain, tiledTexture);
  renderer = new Renderer(wgl, camera, new THREE.Vector2(window.innerWidth, window.innerHeight), domain, tiledTexture);

  // Texture debug panel
  slabDebugs.push(new SlabDebug("Density", solver.density, tiledTexture.resolution, vertexBasic, fragmentDisplayVector));
  slabDebugs.push(new SlabDebug("Velocity", solver.velocity, tiledTexture.resolution, vertexBasic, fragmentDisplayVector, 0.5));
  slabDebugs.push(new SlabDebug("Pressure", solver.pressure, tiledTexture.resolution, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Divergence", solver.velocityDivergence, tiledTexture.resolution, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Vorticity", solver.velocityVorticity, tiledTexture.resolution, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.forEach(element => {
    element.create(container);
  });

  // Additionals
  mouse = new Mouse();
  pointer = new Pointer3D(camera, mouse, domain);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, wgl.domElement);
  controls.enabled = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.mouseButtons = {
    MIDDLE: THREE.MOUSE.ROTATE
  }

  clock = new Clock();
  clock.start();

  gui = new GUI();
  gui.domElement.id = 'gui';
  const simulationFolder = gui.addFolder("Simulation");
  simulationFolder.add(solver, "dissipation", 0.9, 1, 0.001).name("Dissipation");
  simulationFolder.add(solver, "applyBoundaries").name("Apply Boundaries").onChange((val) => { solver.setBoundaries(val) });
  simulationFolder.add(solver, "useBfecc").name("Use BFECC");

  //const viscosityFolder = simulationFolder.addFolder("Viscosity"); 
  //viscosityFolder.add(solver, "applyViscosity").name("Apply Viscosity");
  //viscosityFolder.add(solver, "viscosity", 0, 1, 0.01).name("Viscosity");

  const vorticityFolder = simulationFolder.addFolder("Vorticity");
  vorticityFolder.add(solver, "applyVorticity").name("Apply Vorticity");
  vorticityFolder.add(solver, "curl", 0, 10, 0.01).name("Curl");

  const projectionFolder = simulationFolder.addFolder("Projection");
  projectionFolder.add(solver, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");
  //projectionFolder.add(solver, "projectionOffset", 0.5, 5.0, 0.01).name("Projection Offset");

  const bodyForcesFolder = simulationFolder.addFolder("Body Forces");
  bodyForcesFolder.add(solver, "applyGravity").name("Apply Gravity");
  bodyForcesFolder.add(solver.gravity, "y", -25, 25, 0.01).name("Gravity Force");
  bodyForcesFolder.add(solver, "forceRadius", 0, 10, 0.1).name("Interaction Radius");
  bodyForcesFolder.add(solver, "forceMultiplier", 0, 100, 0.1).name("Interaction Force");

  const incompressibilityFolder = simulationFolder.addFolder("Incompressibility");
  incompressibilityFolder.add(solver, "targetDensity", 0, 10, 0.0001).name("Target Density");
  incompressibilityFolder.add(solver, "pressureMultiplier", 0, 100, 0.1).name("Pressure Multiplier");

  simulationFolder.open();

  const renderingFolder = gui.addFolder("Rendering");
  renderingFolder.add(renderer, "minThreshold", 0.0, 0.01, 0.00001).name("Minumim Density");

}
init();

function step() {
  setTimeout(() => {
    requestAnimationFrame(step);
  });

  let dt = clock.getDelta();

  // Required updates
  stats.update();
  controls.update();
  pointer.update();

  renderer.updateGuides(pointer.position, mouse.keys[0] || mouse.keys[1]);

  let position = new THREE.Vector3(
    (pointer.position.x + domain.x / 2),
    (pointer.position.y + domain.y / 2),
    domain.z - (pointer.position.z + domain.z / 2)
  );

  let direction = pointer.direction;
  direction.z *= -1;

  solver.step(dt, mouse.keys, position, direction);
  renderer.render(solver.density, solver.velocity, solver.densityPressure);

  slabDebugs.forEach(element => {
    element.render(wgl);
  });
}
step();

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;

  renderer.resize(width, height);
  wgl.setSize(width, height);
});
