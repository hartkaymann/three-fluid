import * as THREE from 'three'

import Simulation from './simulation';

import WebGL from 'three/addons/capabilities/WebGL.js';

let width = window.innerWidth;
let height = window.innerHeight;

let simulation: Simulation;

let wgl: THREE.WebGLRenderer;

const canvas = <HTMLCanvasElement>document.getElementById('canvas');
const sidePanel = <HTMLElement>document.getElementById('side-panel');
const debugPanel = <HTMLElement>document.getElementById('debug-panel')

function init() {

  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.body.appendChild(warning);
    return;
  }

  // Setup WebGL Renderer
  wgl = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  wgl.setClearColor(0x252525)
  wgl.setPixelRatio(window.devicePixelRatio);
  wgl.setSize(width, height);
  wgl.setScissorTest(true);
  wgl.autoClear = false;

  simulation = new Simulation(wgl, sidePanel, debugPanel);

  initSlider();
}
init();

function initSlider() {
  const slider = document.querySelector('.panel-slider') as HTMLDivElement;

  let onPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  let onPointerUp = (event: PointerEvent) => {
    event.preventDefault();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  let onPointerMove = (event: PointerEvent) => {
    event.preventDefault();
    let sliderPos = Math.min(500, window.innerWidth - event.pageX);

    if(sliderPos < 50) {
      // TODO: Stop rendering debug panel
      sidePanel.style.width = '1px';
      slider.style.right = '-14px';
    } else {
      sliderPos = Math.max(200, sliderPos);
      slider.style.right = sliderPos - (slider.offsetWidth / 2) + 'px';
      sidePanel.style.width = sliderPos + 'px';
    }

    simulation.renderer?.resize(sliderPos);
  }

  slider.addEventListener('pointerdown', onPointerDown);
}


window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;

  simulation.resize(width, height);
  wgl.setSize(width, height);
});
