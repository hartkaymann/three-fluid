import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import vertexBasic from './shaders/basic.vert'

import vertexTiled from './shaders/displaytiled.vert'
import fragmentTiled from './shaders/displaytiled.frag'
import fragmentDisplayVector from './shaders/displayvector.frag'
import fragmentDisplayScalar from './shaders/displayscalar.frag'

import SlabDebug from './lib/SlabDebug';

import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import Solver from './solver';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector3(20, 20, 20);
const grid = new THREE.Vector3(50, 50, 50);

let solver: Solver;

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;
let pointer: Pointer3D;

let slabDebugs: SlabDebug[] = [];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

let materialDisplay: THREE.RawShaderMaterial;
let materialTiled: THREE.RawShaderMaterial;

let domainBox: THREE.LineSegments;
let pointerSphere: THREE.Mesh;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = <HTMLElement>document.getElementById('content');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 20;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor(0x0e0e0e)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setScissorTest(true);
  renderer.autoClear = false;

  // Initialize solver
  solver = new Solver(renderer, grid);

  // Display mesh
  materialDisplay = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: new THREE.Texture() },
      bias: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: vertexBasic,
    fragmentShader: fragmentDisplayVector,
    side: THREE.DoubleSide
  });

  // Setup tiled rendering
  materialTiled = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: new THREE.Texture() },
      res: { value: grid },
      size: { value: domain }
    },
    vertexShader: vertexTiled,
    fragmentShader: fragmentTiled,
    side: THREE.DoubleSide,
    transparent: true
  });

  for (let i = 1; i < grid.z - 1; i++) {
    const geometry = new THREE.PlaneGeometry(domain.x, domain.y);
    geometry.translate(0.0, 0.0, domain.z / 2 - i * (domain.z / grid.z));

    const quad = new THREE.Mesh(geometry, materialTiled);

    scene.add(quad);
  }

  // Add visual guides
  const geometryDomainBox = new THREE.BoxGeometry(domain.x, domain.y, domain.z);
  domainBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometryDomainBox),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  scene.add(domainBox);

  pointerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );
  scene.add(pointerSphere);

  // Texture debug panel
  slabDebugs.push(new SlabDebug("Density", solver.density, grid, vertexBasic, fragmentDisplayVector));
  slabDebugs.push(new SlabDebug("Velocity", solver.velocity, grid, vertexBasic, fragmentDisplayVector, 0.5));
  slabDebugs.push(new SlabDebug("Pressure", solver.pressure, grid, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Divergence", solver.velocityDivergence, grid, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.push(new SlabDebug("Vorticity", solver.velocityVorticity, grid, vertexBasic, fragmentDisplayScalar, 0.5));
  slabDebugs.forEach(element => {
    element.create(container);
  });

  // Additionals
  mouse = new Mouse();
  pointer = new Pointer3D(camera, mouse, domain);

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
  pointer.update();

  pointerSphere.visible = mouse.keys[0] || mouse.keys[1];
  pointerSphere.position.set(pointer.position.x, pointer.position.y, pointer.position.z);

  let position = new THREE.Vector3(
    (pointer.position.x + domain.x / 2) / domain.x,
    (pointer.position.y + domain.y / 2) / domain.y,
    1 - (pointer.position.z + domain.z / 2) / domain.z
  );
  
  let direction = pointer.direction;
  direction.z *= -1;
  
  solver.step(dt, mouse.keys, position, direction);
  
  // Render 
  materialTiled.uniforms.read.value = solver.density.read.texture;
  
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.render(scene, camera);
  
  slabDebugs.forEach(element => {
    element.render(renderer);
  });
}
step();


window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});