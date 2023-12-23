import * as THREE from 'three'

import Simulation from './simulation';

let width = window.innerWidth;
let height = window.innerHeight;

let simulation: Simulation;


let wgl: THREE.WebGLRenderer;


function init() {
  // TODO: add webgl compatability check before anything else
  let canvas = <HTMLCanvasElement>document.getElementById('c');
  let container = <HTMLElement>document.getElementById('content');

  // Setup WebGL Renderer
  wgl = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  wgl.setClearColor(0x252525)
  wgl.setPixelRatio(window.devicePixelRatio);
  wgl.setSize(width, height);
  wgl.setScissorTest(true);
  wgl.autoClear = false;

  simulation = new Simulation(wgl, container);

}
init();


window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  
  simulation.resize(width, height);
  wgl.setSize(width, height);
});
