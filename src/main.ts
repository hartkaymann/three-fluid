import * as THREE from 'three'

import Simulation from './simulation';

import WebGL from 'three/addons/capabilities/WebGL.js';

let width = window.innerWidth;
let height = window.innerHeight;

let simulation: Simulation;


let wgl: THREE.WebGLRenderer;


function init() {

  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.body.appendChild(warning);
    return;
  }

  // TODO: add webgl compatability check before anything else
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let debugPanel = <HTMLElement>document.getElementById('debug-panel');

  // Setup WebGL Renderer
  wgl = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  wgl.setClearColor(0x252525)
  wgl.setPixelRatio(window.devicePixelRatio);
  wgl.setSize(width, height);
  wgl.setScissorTest(true);
  wgl.autoClear = false;

  simulation = new Simulation(wgl, debugPanel);
}
init();

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;

  simulation.resize(width, height);
  wgl.setSize(width, height);
});
