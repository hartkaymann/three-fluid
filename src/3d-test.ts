import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import vertexBasic from './shaders/basic.vert'
import fragmentAdvect from './shaders/displayvolume.frag'

import Slab from './lib/Slab';
import Mouse from './lib/Mouse';
import Advect from './lib/slabop/Advect';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(20, 20);
const grid = new THREE.Vector3(100, 100, 100);

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;
let raycaster: THREE.Raycaster;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let controls: OrbitControls;

let density: Slab;

let advect: Advect;

let material: THREE.ShaderMaterial;

let quad: THREE.Mesh;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  // Slabs
  density = new Slab(grid.x, grid.y, THREE.RedFormat);

  // Slabobs
  advect = new Advect(grid, vertexBasic, fragmentAdvect);

  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y, 2, 2),
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

  // Additionals
  mouse = new Mouse();
  raycaster = new THREE.Raycaster();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.mouseButtons = {
    MIDDLE: THREE.MOUSE.ROTATE
  }

}
init();

function step() {
  setTimeout(() => {
    requestAnimationFrame(step);
  }, 1000 / 60);

  // Required updates
  controls.update();

  // Advection
  advect.compute(renderer, density, density, density, 0.0, 0.0);


  // Render 
  material.uniforms.read.value = density.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.render(scene, camera);
}
step();

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});