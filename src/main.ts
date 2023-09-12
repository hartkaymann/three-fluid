import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Clock } from 'three/src/core/Clock.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import fragmentShaderSource from './shaders/source.frag'
import fragmentShaderAdvect from './shaders/advect.frag'
import fragmentShaderJacobi from './shaders/jacobi.frag'
import fragmentShaderDivergence from './shaders/divergence.frag'
import fragmentShaderGradient from './shaders/gradient.frag'
import fragmentShaderDisplay from './shaders/displayvector.frag'
import fragmentShaderBoundary from './shaders/boundary.frag'
import fragmentShaderGravity from './shaders/gravity.frag'

import vertexShaderBasic from './shaders/basic.vert'

import PingPongBuffer from './lib/PingPongBuffer';
import Mouse from './lib/Mouse';

let width = window.innerWidth;
let height = window.innerHeight;

const domain = new THREE.Vector2(30, 20);
const grid = new THREE.Vector2(300, 200);

let applyViscosity = false;
let viscosity = 0.01;
let timestep = 1.0;
let dissipation = 0.99;

let renderer: THREE.WebGLRenderer;

let mouse: Mouse;

const scenes: THREE.Scene[] = [];
let sceneApp: THREE.Scene;
let cameraApp: THREE.PerspectiveCamera;

let controls: OrbitControls;
let stats: Stats;
let clock: Clock;

let bufferScene: THREE.Scene;
let bufferCamera: THREE.OrthographicCamera;
let boundaryScene: THREE.Scene;
let boundaries: THREE.LineSegments[] = [];

let density: PingPongBuffer;
let velocity: PingPongBuffer;
let pressure: PingPongBuffer;
let divergence: PingPongBuffer;

let bufferObject: THREE.Mesh;
let sourceMaterial: THREE.RawShaderMaterial;
let jacobiMaterial: THREE.RawShaderMaterial;
let advectionMaterial: THREE.RawShaderMaterial;
let divergenceMaterial: THREE.RawShaderMaterial;
let gradientMaterial: THREE.RawShaderMaterial;
let boundaryMaterial: THREE.RawShaderMaterial;
let gravityMaterial: THREE.RawShaderMaterial;
let displayMaterial: THREE.RawShaderMaterial;

let quad: THREE.Mesh;

type DebugMaterial = {
  name: string;
  buffer: PingPongBuffer;
}
const arrDebug: DebugMaterial[] = [];

function init() {
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = document.getElementById('content');

  mouse = new Mouse();

  sceneApp = new THREE.Scene();

  density = new PingPongBuffer(grid.x, grid.y);
  velocity = new PingPongBuffer(grid.x, grid.y);
  pressure = new PingPongBuffer(grid.x, grid.y);
  divergence = new PingPongBuffer(grid.x, grid.y);

  arrDebug.push({ name: "Density", buffer: density });
  arrDebug.push({ name: "Velocity", buffer: velocity });
  arrDebug.push({ name: "Pressure", buffer: pressure });
  arrDebug.push({ name: "Divergence", buffer: divergence });

  for (let i = 0; i < 4; i++) {
    const scene = new THREE.Scene();

    const element = document.createElement('div');
    element.className = 'debug-item';

    const sceneElement = document.createElement('div');
    element.appendChild(sceneElement);

    const descriptionElemen = document.createElement('div');
    descriptionElemen.innerText = arrDebug[i].name;
    element.appendChild(descriptionElemen);

    scene.userData.element = sceneElement;
    container?.appendChild(element);

    const camera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 1, 10);
    camera.position.z = 2;
    scene.userData.camera = camera;

    const controls = new OrbitControls(scene.userData.camera, scene.userData.element);
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.enablePan = false;
    controls.enableZoom = false;
    scene.userData.controls = controls;

    const geometry = new THREE.PlaneGeometry(grid.x, grid.y)
    const material = new THREE.MeshBasicMaterial({ map: arrDebug[i].buffer.read.texture });
    scene.userData.buffer = arrDebug[i].buffer;

    let mesh = new THREE.Mesh(geometry, material);
    mesh.name = "plane"
    scene.add(mesh);

    scenes.push(scene);
  }

  cameraApp = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  cameraApp.position.z = 15;

  const plane = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);

  sourceMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      position: { value: new THREE.Vector2(0, 0) },
      color: { value: new THREE.Vector3(0, 0, 0) },
      read: { value: density.read.texture }
    },
    fragmentShader: fragmentShaderSource,
    vertexShader: vertexShaderBasic
  });

  jacobiMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      x: { value: density.read.texture },
      b: { value: density.read.texture },
      alpha: { value: -1.0 },
      rbeta: { value: 1.0 / 4.0 }
    },
    fragmentShader: fragmentShaderJacobi,
    vertexShader: vertexShaderBasic
  });

  advectionMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      advected: { value: density.read.texture },
      velocity: { value: velocity.read.texture },
      res: { value: grid },
      dt: { value: 0.0 },
      dissipation: { value: dissipation }
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

  gradientMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      halfrdx: { value: 0.5 / 1.0 },
      pressure: { value: pressure.read.texture },
      velocity: { value: velocity.read.texture },
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderGradient
  });

  boundaryMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      res: { value: grid },
      read: { value: velocity.read.texture },
      offset: { value: new THREE.Vector2(0.0, 0.0) },
      scale: { value: 1.0 },
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderBoundary
  });

  gravityMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      res: { value: grid },
      dt: { value: 0.0 }
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderGravity
  });

  displayMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      read: { value: velocity.read.texture },
      bias: { value: new THREE.Vector3(0., 0., 0.) },
      scale: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: vertexShaderBasic,
    fragmentShader: fragmentShaderDisplay,
    side: THREE.DoubleSide
  });

  bufferScene = new THREE.Scene();
  bufferCamera = new THREE.OrthographicCamera(grid.x / -2 - 0.1, grid.x / 2 + 0.1, grid.y / 2, grid.y / -2, 1, 100);
  bufferCamera.position.z = 2;

  bufferObject = new THREE.Mesh(plane, jacobiMaterial)
  bufferScene.add(bufferObject);

  boundaryScene = new THREE.Scene();
  const points = [];
  points.push(new THREE.Vector2(grid.x / -2 + 1, grid.y / 2));
  points.push(new THREE.Vector2(grid.x / 2, grid.y / 2));
  points.push(new THREE.Vector2(grid.x / 2, grid.y / -2));
  points.push(new THREE.Vector2(grid.x / -2, grid.y / -2 + 1));

  // Top
  const lineT = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        new THREE.Vector2(grid.x / -2 + 1, grid.y / 2),
        new THREE.Vector2(grid.x / 2, grid.y / 2)
      ]
    ),
    boundaryMaterial);
  lineT.userData.offset = new THREE.Vector2(0, -1);
  boundaries.push(lineT);

  // Right
  const lineR = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        new THREE.Vector2(grid.x / 2, grid.y / 2 - 1),
        new THREE.Vector2(grid.x / 2, grid.y / -2)
      ]
    ),
    boundaryMaterial,
  );
  lineR.userData.offset = new THREE.Vector2(-1, 0);
  boundaries.push(lineR);

  // Bottom
  const lineB = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        new THREE.Vector2(grid.x / 2 - 1, grid.y / -2),
        new THREE.Vector2(grid.x / -2, grid.y / -2 + 1)
      ]
    ),
    boundaryMaterial
  );
  lineB.userData.offset = new THREE.Vector2(0, 1);
  boundaries.push(lineB);

  // Left
  const lineL = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        new THREE.Vector2(grid.x / -2, grid.y / -2 + 1),
        new THREE.Vector2(grid.x / -2, grid.y / 2)
      ]
    ), boundaryMaterial
  );
  lineL.userData.offset = new THREE.Vector2(1, 0);
  boundaries.push(lineL);

  quad = new THREE.Mesh(
    new THREE.PlaneGeometry(domain.x, domain.y, 2, 2),
    displayMaterial
  );
  sceneApp.add(quad);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setClearColor(0x0e0e0e)
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setScissorTest(true);
  renderer.autoClear = false;

  stats = new Stats();
  document.body.appendChild(stats.dom);

  controls = new OrbitControls(cameraApp, renderer.domElement);
  controls.enabled = false;

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

  // 1 - Advection
  bufferObject.material = advectionMaterial;
  advectionMaterial.uniforms.dt.value = timestep;

  // 1.1 - Advect velocity
  advectionMaterial.uniforms.dissipation.value = 1.0;
  advectionMaterial.uniforms.advected.value = velocity.read.texture;
  advectionMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write)
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();
  renderer.setRenderTarget(null);
  boundary(velocity);

  // 1.2 Advect density
  advectionMaterial.uniforms.dissipation.value = dissipation;
  advectionMaterial.uniforms.advected.value = density.read.texture;
  advectionMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(density.write)
  renderer.render(bufferScene, bufferCamera);
  density.swap();
  renderer.setRenderTarget(null);


  // 2 - Add external forces  
  // 2.1 - Gravity
  bufferObject.material = gravityMaterial;
  gravityMaterial.uniforms.dt.value = dt;
  gravityMaterial.uniforms.read.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write)
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();
  renderer.setRenderTarget(null);
  boundary(velocity);

  // 2.2 - Mouse input
  addForce();

  // 3 - Viscous diffusion
  if (applyViscosity && viscosity > 0) {

    bufferObject.material = jacobiMaterial;
    let alpha = 1.0 / (viscosity * timestep);
    jacobiMaterial.uniforms.alpha.value = alpha;
    jacobiMaterial.uniforms.rbeta.value = 1.0 / (4.0 + alpha);
    jacobiMaterial.uniforms.alpha.value = alpha;
    jacobiMaterial.uniforms.rbeta.value = 1.0 / (4.0 + alpha);

    // 3.1 - Diffuse velocity
    for (let i = 0; i < 20; i++) {
      jacobiMaterial.uniforms.x.value = velocity.read.texture;
      jacobiMaterial.uniforms.b.value = velocity.read.texture;
      renderer.setRenderTarget(velocity.write);
      renderer.render(bufferScene, bufferCamera);
      velocity.swap();
      renderer.setRenderTarget(null);

      boundary(velocity);
    }

    // 3.2 - Diffuse density
    for (let i = 0; i < 20; i++) {
      jacobiMaterial.uniforms.x.value = density.read.texture;
      jacobiMaterial.uniforms.b.value = density.read.texture;
      renderer.setRenderTarget(density.write);
      renderer.render(bufferScene, bufferCamera);
      density.swap();
      renderer.setRenderTarget(null);
    }
  }


  // 4 - Projection
  project();

  // 5 - Render 
  // 5.1 - Render app scene
  displayMaterial.uniforms.read.value = density.read.texture;
  renderer.setRenderTarget(null);
  renderer.setViewport(0, 0, width, height);
  renderer.setScissor(0, 0, width - 350, height);
  renderer.render(sceneApp, cameraApp);

  // 5.2 - Render debug scenes
  scenes.forEach(function (scene) {
    const element = <HTMLElement>scene.userData.element;
    const rect = element.getBoundingClientRect();

    if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
      rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
      return; // it's off screen
    }

    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    const left = rect.left;
    const bottom = renderer.domElement.clientHeight - rect.bottom;

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);

    let plane = scene.getObjectByName("plane") as THREE.Mesh;
    let material = plane.material as THREE.MeshBasicMaterial;
    material.map = scene.userData.buffer.read.texture;

    const camera = scene.userData.camera;
    renderer.render(scene, camera);
  });
}
step();

function addForce() {
  if (mouse.motions.length == 0)
    return;

  if (!(mouse.left || mouse.right))
    return;

  bufferObject.material = sourceMaterial;
  sourceMaterial.uniforms.position.value = mouse.position;

  if (mouse.left) {
    sourceMaterial.uniforms.read.value = density.read.texture;
    sourceMaterial.uniforms.color.value = new THREE.Color(0xffffff);
    renderer.setRenderTarget(density.write);
    renderer.render(bufferScene, bufferCamera);
    density.swap();
    renderer.setRenderTarget(null);
  }

  if (mouse.right) {
    sourceMaterial.uniforms.read.value = velocity.read.texture;
    sourceMaterial.uniforms.color.value = mouse.motions[mouse.motions.length - 1]?.drag;
    renderer.setRenderTarget(velocity.write);
    renderer.render(bufferScene, bufferCamera);
    velocity.swap();
    renderer.setRenderTarget(null);
    boundary(velocity);
  }

}

function project() {

  // 4.1 - Divergence
  bufferObject.material = divergenceMaterial;
  divergenceMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(divergence.write);
  renderer.render(bufferScene, bufferCamera);
  divergence.swap();
  renderer.setRenderTarget(null);

  // 4.2 - Poisson Pressure
  bufferObject.material = jacobiMaterial;
  jacobiMaterial.uniforms.alpha.value = -1.0;
  jacobiMaterial.uniforms.rbeta.value = 1.0 / 4.0;
  for (let i = 0; i < 50; i++) {
    jacobiMaterial.uniforms.b.value = divergence.read.texture;
    jacobiMaterial.uniforms.x.value = pressure.read.texture;
    renderer.setRenderTarget(pressure.write);
    renderer.render(bufferScene, bufferCamera);
    pressure.swap();

    boundary(pressure, 1);
  }
  renderer.setRenderTarget(null);

  // 4.3 - Gradient
  bufferObject.material = gradientMaterial;
  gradientMaterial.uniforms.pressure.value = pressure.read.texture;
  gradientMaterial.uniforms.velocity.value = velocity.read.texture;
  renderer.setRenderTarget(velocity.write);
  renderer.render(bufferScene, bufferCamera);
  velocity.swap();
  renderer.setRenderTarget(null);

  boundary(velocity);
}

function boundary(output: PingPongBuffer, scale: number = -1.0) {
  boundaryMaterial.uniforms.read.value = output.read.texture;
  renderer.setRenderTarget(output.write);

  boundaries.forEach(line => {
    boundaryMaterial.uniforms.offset.value = line.userData.offset;
    boundaryMaterial.uniforms.scale.value = scale;
    boundaryScene.add(line);
    renderer.render(boundaryScene, bufferCamera);
    boundaryScene.remove(line);
  });

  renderer.setRenderTarget(null);
}

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  cameraApp.aspect = width / height;
  cameraApp.updateProjectionMatrix();
  renderer.setSize(width, height);
});

