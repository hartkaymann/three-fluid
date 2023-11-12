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

const domain = new THREE.Vector3(25, 20, 20);
const resolution = new THREE.Vector3(8, 8, 8);

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
  }, 1000 / 60);

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

const binarySearchResolution = () => {
  const maxTextureResolution = new THREE.Vector2(2048, 2048);
  const domainRatio = new THREE.Vector3(domain.x / domain.y, domain.y / domain.z, domain.z / domain.x);

  let targetTileAmount = domainRatio.z;
  let tileAmount = new THREE.Vector2(0, 0);

  let areaWidthScale = (domainRatio.x * maxTextureResolution.y) * maxTextureResolution.y; // area of the result when scaled by width
  let areaHeightScale = maxTextureResolution.x * (maxTextureResolution.x / domainRatio.x); // area of the result when scaled by height
  let newWidth, newHeight = 0;
  if (areaWidthScale < areaHeightScale) {
    newWidth = domainRatio.x * maxTextureResolution.y;
    newHeight = maxTextureResolution.y;
  } else {
    newWidth = maxTextureResolution.x;
    newHeight = maxTextureResolution.x / domainRatio.x;
  }

  let tileResolutionLow = new THREE.Vector2(0, 0); // low
  let tileResolutionHigh = new THREE.Vector2(newWidth, newHeight); // high
  let tileResolution = new THREE.Vector2();
  let i = 0;
  for (; i < Math.sqrt(Math.max(tileResolutionHigh.x, tileResolutionHigh.y)); i++) {
    tileResolution.set(
      (tileResolutionLow.x + tileResolutionHigh.x) / 2.0,
      (tileResolutionLow.y + tileResolutionHigh.y) / 2.0
    ).floor(); // mid
    console.log("Low: " + tileResolutionLow.x + ", " + tileResolutionLow.y);
    console.log("High: " + tileResolutionHigh.x + ", " + tileResolutionHigh.y);
    console.log("Mid: " + tileResolution.x + ", " + tileResolution.y);
    targetTileAmount = tileResolution.x * domainRatio.z;
    console.log("Target Tiles: " + targetTileAmount);

    tileAmount = new THREE.Vector2(Math.floor(maxTextureResolution.x / tileResolution.x), Math.floor(maxTextureResolution.y / tileResolution.y));
    let totalTiles = tileAmount.x * tileAmount.y; // mid value
    console.log("Total Tiles: " + totalTiles);

    if (totalTiles == targetTileAmount)
      break;
    else if (totalTiles < targetTileAmount)
      tileResolutionHigh.copy(tileResolution);
    else
      tileResolutionLow.copy(tileResolution);
  }
  console.log("Iterations: " + i);
  console.log("Final Tile Resolution: " + tileResolution.x + ", " + tileResolution.y);
  console.log("Final Texture Resolution: " + tileResolution.x * tileAmount.x + ", " + tileResolution.y * tileAmount.y);
}
binarySearchResolution();
