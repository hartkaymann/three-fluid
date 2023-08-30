import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderCode from './shaders/fragment.glsl'

const width = window.innerWidth;
const height = window.innerHeight;

let scene: THREE.Scene;
let camera: THREE.Camera;
let renderer: THREE.WebGLRenderer;

let controls: OrbitControls;
let stats: Stats;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
}

let bufferScene: THREE.Scene;
let bufferCamera: THREE.OrthographicCamera;

let fbo1: THREE.WebGLRenderTarget;
let fbo2: THREE.WebGLRenderTarget;
let bufferObject: THREE.Mesh;
let bufferMaterial: THREE.ShaderMaterial;
let quad: THREE.Mesh;
let finalMaterial: THREE.MeshBasicMaterial;

const plane = new THREE.PlaneGeometry(width, height);

const init_rtt = () => {
  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);
  bufferCamera.position.z = 2;

  fbo1 = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
  fbo2 = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });

  bufferMaterial = new THREE.ShaderMaterial({
    uniforms: {
      bufferTexture: { value: fbo1.texture },
      res: { value: new THREE.Vector2(width, height) }
    },
    fragmentShader: fragmentShaderCode
  });

  bufferObject = new THREE.Mesh(plane, bufferMaterial)
  bufferScene.add(bufferObject);

}

const init_scene = () => {
  finalMaterial = new THREE.MeshBasicMaterial({ map: fbo2.texture });
  quad = new THREE.Mesh(plane, finalMaterial);
  scene.add(quad);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
}

const tick = () => {
  setTimeout(() => {
    requestAnimationFrame(tick);
  }, 1000 / 30);

  // Draw to textureB
  renderer.setRenderTarget(fbo2);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);

  // Swap textures
  let temp = fbo1;
  fbo1 = fbo2;
  fbo2 = temp;
  (quad.material as THREE.MeshBasicMaterial).map = fbo2.texture;
  bufferMaterial.uniforms.bufferTexture.value = fbo1.texture;

  // Required updates
  stats.update();
  controls.update();

  // Render scene
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(scene, camera);
}

init();
init_rtt();
init_scene();
tick();

