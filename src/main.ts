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

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector3(40, 20, 20);
const resolution = new THREE.Vector3(80, 40, 40); 

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

  // Initialize solver and renderer
  solver = new Solver(wgl, domain, resolution);
  renderer = new Renderer(wgl, camera, new THREE.Vector2(window.innerWidth, window.innerHeight), domain, resolution);

  // Texture debug panel
  slabDebugs.push(new SlabDebug("Density", solver.density, resolution, vertexBasic, fragmentDisplayVector));
  slabDebugs.push(new SlabDebug("Velocity", solver.velocity, resolution, vertexBasic, fragmentDisplayVector, 0.5));
  slabDebugs.push(new SlabDebug("Pressure", solver.pressure, resolution, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Divergence", solver.velocityDivergence, resolution, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Vorticity", solver.velocityVorticity, resolution, vertexBasic, fragmentDisplayScalar, 0.5));
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
  //simulationFolder.add(solver, "applyBoundaries");
  simulationFolder.add(solver, "dissipation", 0.9, 1, 0.001).name("Dissipation");
  simulationFolder.add(solver, "applyViscosity").name("Apply Viscosity");
  simulationFolder.add(solver, "viscosity", 0, 1, 0.01).name("Viscosity");
  simulationFolder.add(solver, "applyVorticity").name("Apply Vorticity");
  simulationFolder.add(solver, "curl", 0, 10, 0.01).name("Curl");
  simulationFolder.add(solver, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");
  simulationFolder.add(solver, "applyGravity").name("Apply Gravity");
  simulationFolder.add(solver.gravity, "y", -10, 10, 0.01).name("Gravity Force");
  simulationFolder.add(solver, "forceRadius", 0, 10, 0.1).name("Interaction Radius");
  simulationFolder.add(solver, "forceMultiplier", 0, 100, 0.1).name("Interaction Force");
  simulationFolder.open();
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
  pointer.update();

  renderer.updateGuides(pointer.position, mouse.keys[0] || mouse.keys[1]);

  let position = new THREE.Vector3(
    (pointer.position.x + domain.x / 2) ,
    (pointer.position.y + domain.y / 2) ,
    domain.z - (pointer.position.z + domain.z / 2) 
  );

  let direction = pointer.direction;
  direction.z *= -1;

  solver.step(dt, mouse.keys, position, direction);
  renderer.render(solver.density);

  slabDebugs.forEach(element => {
    element.render(wgl);
  });
}
step();


window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  renderer.resize(width, height);
  wgl.setSize(width, height, false);
});