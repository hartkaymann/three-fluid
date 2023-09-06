import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderSource from './shaders/source.frag'
import fragmentShaderAdvect from './shaders/advect.frag'
import fragmentShaderDiffuse from './shaders/jacobivector.frag'
import fragmentShaderPressure from './shaders/jacobiscalar.frag'
import fragmentShaderDivergence from './shaders/divergence.frag'
import fragmentShaderGradient from './shaders/divergence.frag'

import vertexShaderBasic from './shaders/basic.vert'

import PingPongBuffer from './lib/PingPongBuffer';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(30, 20);
const grid = new THREE.Vector2(300, 200);

let viscosity = 0.3;

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
}
init();

let bufferScene: THREE.Scene;
let bufferCamera: THREE.OrthographicCamera;

let density: PingPongBuffer;
let velocity: PingPongBuffer;
let pressure: PingPongBuffer;
let divergence: PingPongBuffer;

let bufferObject: THREE.Mesh;
let sourceMaterial: THREE.ShaderMaterial;
let diffuseMaterial: THREE.ShaderMaterial;
let advectionMaterial: THREE.ShaderMaterial;
let pressureMaterial: THREE.ShaderMaterial;
let divergenceMaterial: THREE.ShaderMaterial;
let gradientMaterial: THREE.ShaderMaterial;


const init_rtt = () => {
  const plane = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);
  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 0.1, 100);
  bufferCamera.position.z = 1;

  density = new PingPongBuffer(grid.x, grid.y);
  velocity = new PingPongBuffer(grid.x, grid.y);
  pressure = new PingPongBuffer(grid.x, grid.y);
  divergence = new PingPongBuffer(grid.x, grid.y);

  sourceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      source: { value: new THREE.Vector3(0, 0, 0) },
      texDensity: { value: density.read.texture }
    },
    fragmentShader: fragmentShaderSource,
    vertexShader: vertexShaderBasic
  });

  diffuseMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      density: { value: density.read.texture },
      res: { value: grid },
      alpha: { value: 0.0 },
      rbeta: { value: 0.0 }
    },
    fragmentShader: fragmentShaderDiffuse,
    vertexShader: vertexShaderBasic
  });

  advectionMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      advected: { value: density.read.texture },
      velocity: { value: velocity.read.texture },
      res: { value: grid },
      dt: { value: 0.0 },
      dissipation: { value: 1.0 }
    },
    fragmentShader: fragmentShaderAdvect,
    vertexShader: vertexShaderBasic
  })

  divergenceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      halfrdx: { value: 0.5 / 1.0 },
      velocity: { value: velocity.read.texture }
    },
    fragmentShader: fragmentShaderDivergence,
    vertexShader: vertexShaderBasic
  });

  pressureMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      pressure: { value: pressure.read.texture },
      divergence: { value: divergence.read.texture },
      alpha: { value: 0.0 },
      rbeta: { value: 0.0 }
    },
    fragmentShader: fragmentShaderPressure,
    vertexShader: vertexShaderBasic
  });

  gradientMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      halfdrx: { value: 0.5 / 1.0 },
      pressure: { value: pressure.read.texture },
      velocity: { value: velocity.read.texture },
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderGradient
  })

  bufferObject = new THREE.Mesh(plane, diffuseMaterial)
  bufferScene.add(bufferObject);

}
init_rtt();

let quad: THREE.Mesh;
let finalMaterial: THREE.MeshBasicMaterial;

const init_scene = () => {
  finalMaterial = new THREE.MeshBasicMaterial({ map: density.write.texture, side: THREE.DoubleSide });
  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y),
    finalMaterial
  );
  scene.add(quad);
  scene.background = new THREE.Color(0x050505);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;

  clock = new Clock();
  clock.start();
}
init_scene();

const step = () => {
  setTimeout(() => {
    requestAnimationFrame(step);
  }, 1000 / 30);

  // Required updates
  stats.update();
  controls.update();

  const timestep = clock.getDelta();

  // 1 - Advection
  // 1.1 - Advect velocity
  //TODO: Dissipation should not affect velocity, so set it to one here and change value to original before advecting density
  bufferObject.material = advectionMaterial;
  advectionMaterial.uniforms.dt.value = timestep;
  advectionMaterial.uniforms.advected.value = velocity.read.texture;
  advectionMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write)
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  velocity.swap(); //TODO: Maybe do this only after advection is finished, otherwise density advection will happen with "future" velocity already

  // 1.2 - Advect density
  advectionMaterial.uniforms.advected.value = density.read.texture;
  advectionMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(density.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  density.swap();

  // 2 - Diffuse
  bufferObject.material = diffuseMaterial;
  diffuseMaterial.uniforms.dt.value = timestep;
  let alpha = viscosity * timestep;
  diffuseMaterial.uniforms.alpha.value = alpha;
  diffuseMaterial.uniforms.beta.value = 1 / (4 + alpha);
  for (let i = 0; i < 20; i++) {
    diffuseMaterial.uniforms.density.value = density.read.texture;
    renderer.setRenderTarget(density.write);
    renderer.clear();
    renderer.render(bufferScene, bufferCamera);
    density.swap();
  }

  // 3 - Add external forces  
  bufferObject.material = sourceMaterial;
  sourceMaterial.uniforms.texDensity.value = density.read.texture;
  renderer.setRenderTarget(density.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  density.swap();


  // 4 - Projection

  // 4.1 - Divergence
  bufferObject.material = divergenceMaterial;
  divergenceMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(divergence.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  divergence.swap();

  // 4.2 - Poisson Pressure
  bufferObject.material = pressureMaterial;
  pressureMaterial.uniforms.alpha.value = -1.0;
  pressureMaterial.uniforms.rbeta.value = 1 / 4;
  pressureMaterial.uniforms.divergence.value = divergence.read.texture;
  for (let i = 0; i < 20; i++) {
    pressureMaterial.uniforms.pressure.value = pressure.read.texture;
    renderer.setRenderTarget(pressure.write);
    renderer.clear();
    renderer.render(bufferScene, bufferCamera);
    pressure.swap();
  }

  // 4.3 - Gradient
  bufferObject.material = gradientMaterial;
  pressureMaterial.uniforms.pressure.value = pressure.read.texture;
  pressureMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write);
  renderer.clear();
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();

  // Render scene
  (quad.material as THREE.MeshBasicMaterial).map = density.read.texture;
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(scene, camera);
}
step();


// Controls
let mouseDown = false;
const update_mouse = (x: number, y: number) => {
  let mouseX = x;
  let mouseY = y;
  sourceMaterial.uniforms.source.value.x = mouseX;
  sourceMaterial.uniforms.source.value.y = mouseY;
}

document.onmousemove = function (event) {
  let x = (event.clientX / width) * grid.x;
  let y = grid.y - (event.clientY / height) * grid.y;
  update_mouse(x, y);
}

document.onmousedown = function (_) {
  mouseDown = true;
  sourceMaterial.uniforms.source.value.z = 0.1;
}

document.onmouseup = function (_) {
  mouseDown = false;
  sourceMaterial.uniforms.source.value.z = 0;
}

document.onkeydown = function (event) {
  if (event.key == 'Control') {
    controls.enabled = true;
  }
}

document.onkeyup = function (event) {
  if (event.key == 'Control') {
    controls.enabled = false;
  }
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

