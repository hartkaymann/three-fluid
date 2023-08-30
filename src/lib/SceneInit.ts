import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

export default class SceneInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  nearPlane = 1;
  farPlane = 1000;

  clock: THREE.Clock;
  stats: Stats;
  controls: OrbitControls;

  constructor(canvasId: string) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, this.nearPlane, this.farPlane);
    this.camera.position.z = 5;

    const canvas = <HTMLCanvasElement>document.getElementById(canvasId);

    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.clock = new THREE.Clock();
    this.stats = new Stats();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initialize() {
    document.body.appendChild(this.stats.dom);
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    this.stats.update();
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}