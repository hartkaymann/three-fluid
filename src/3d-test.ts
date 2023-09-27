import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import vertexBasic from './shaders/basic300.vert'
import fragmentVolume from './shaders/displayvolume.frag'

import Slab from './lib/Slab';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector3(1, 1, 1);
const grid = new THREE.Vector3(10, 10, 10);

let renderer: THREE.WebGLRenderer;

let material: THREE.RawShaderMaterial;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;

let controls: OrbitControls;

let slab: Slab;

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 5;

  // Slabs
  slab = new Slab(grid.x, grid.y, THREE.RedFormat);


  // create a buffer with some data
  const size = 16;

  const data3D = [];
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const r = Math.random() * 255;
        const g = Math.random() * 255;
        const b = Math.random() * 255;
        data3D.push(r, g, b, 1.0);
      }
    }
  }
  let texture3D = new THREE.Data3DTexture(
    Uint8Array.from(data3D),
    size, size, size
  );
  texture3D.format = THREE.RGBAFormat;
  texture3D.minFilter = THREE.LinearFilter;
  texture3D.magFilter = THREE.LinearFilter;
  texture3D.mapping = THREE.UVMapping;
  texture3D.type = THREE.UnsignedByteType;
  texture3D.needsUpdate = true;

  let box = new THREE.BoxGeometry(domain.x, domain.y, domain.z, 1, 1, 1);
  material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      map: { value: texture3D },
      uZCoord: { value: 1 },
    },
    vertexShader: vertexBasic,
    fragmentShader: fragmentVolume,
    side: THREE.BackSide,
    transparent: true
  });

  let mesh = new THREE.Mesh(box, material);

  scene.add(mesh);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor(0x0e0e0e)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.autoClear = false;

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

  for(let i = 0; i < 16; i++) {
    material.uniforms.uZCoord.value = i;
    renderer.render(scene, camera);
  }

  // Render 
  renderer.setRenderTarget(null);
  renderer.setScissor(0, 0, width - 350, height);
}
step();

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});