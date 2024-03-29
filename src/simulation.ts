import * as THREE from 'three'

import Solver from './solver';
import Renderer from './renderer';

import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import DebugPanel from './lib/DebugPanel';
import TiledTexture from './lib/TiledTexture';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { GUI } from 'dat.gui';
import { Clock } from 'three/src/core/Clock.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Inititializes, updates and controls the simulation.
 */
export default class Simulation {

    settings = {
        domain: new THREE.Vector3(20, 20, 20),
        _res: 0, // required for gui to work
        resolution: new THREE.Vector2(256, 256),
    }

    timeout: number;
    private _wgl: THREE.WebGLRenderer;

    private _isRunning = false;

    private _tiledTexture: TiledTexture;

    private _solver: Solver;
    private _renderer: Renderer;

    private _camera: THREE.PerspectiveCamera;
    private _mouse: Mouse;
    private _pointer: Pointer3D;

    private _controls: OrbitControls;
    private _stats: Stats;
    private _clock: Clock;
    private _gui: GUI;

    private debugPanel: DebugPanel;

    public get renderer() {
        return this._renderer;
    }

    public get solver() {
        return this._solver;
    }

    /**
     * @param wgl
     * The current WebGL Renderer element.
     * @param elemSidePanel
     * The HTML element that serves as the container for the side panel.
     * @param elemDebugPanel 
     * The HTML element that serves as the container for the debug panel. 
     */
    constructor(
        wgl: THREE.WebGLRenderer,
        elemSidePanel: HTMLElement,
        elemDebugPanel: HTMLElement
    ) {
        this._wgl = wgl;

        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this._camera.position.set(-15, 12, 25);

        this._tiledTexture = new TiledTexture();
        this._tiledTexture.computeResolution(this.settings.resolution, this.settings.domain);

        // Initialize solver and renderer
        this._solver = new Solver(this._wgl, this.settings.domain);
        this._solver.reset(this.settings.domain, this._tiledTexture);

        this._renderer = new Renderer(this._wgl, this._camera);
        this._renderer.reset(this.settings.domain, this._tiledTexture);
        this._renderer.resize(elemSidePanel.clientWidth);
        this._renderer.updateBackgroundColor();

        this.debugPanel = new DebugPanel(this._wgl, elemDebugPanel, this._solver.getDebugSlabs());
        this.debugPanel.createSlabHTMLElements();
        this.debugPanel.updateHeaderValues(this._tiledTexture.resolution, this._tiledTexture.tileResolution, this._tiledTexture.tileCount.z);

        this.initGui(elemSidePanel);

        // Additionals
        this._mouse = new Mouse();
        this._pointer = new Pointer3D(this._camera, this._mouse, this.settings.domain);

        this._clock = new Clock();
        this._clock.start();

        this._stats = new Stats();
        document.body.appendChild(this._stats.dom);

        // Initializes camera controls and sets available movements
        this._controls = new OrbitControls(this._camera, wgl.domElement);
        this._controls.enabled = true;
        this._controls.enablePan = false;
        this._controls.enableZoom = true;
        this._controls.mouseButtons = {
            MIDDLE: THREE.MOUSE.ROTATE
        }

        this.start();
        this.step();
    }

    /**
     * Initialize the GUI and sets the available parameters.
     * @param parent 
     * The HTML element that the GUI element will be attached to.
     */
    initGui(parent: HTMLElement) {
        // TODO: add settings class that uses json files to generate an object that can be used in the gui
        // Does that even make sense or does it just not work with callbacks and overly complicates things?
        this._gui = new GUI({ autoPlace: false });
        this._gui.domElement.id = 'gui';
        this._gui.domElement.classList.add('gui-customized');
        this._gui.domElement
        const simulationFolder = this._gui.addFolder("Simulation");
        simulationFolder.add(this, "start").name("Start");
        simulationFolder.add(this, "stop").name("Stop");
        simulationFolder.add(this, "reset").name("Reset");

        const generalFolder = simulationFolder.addFolder("General");
        generalFolder.add(this.settings, "_res",
            {
                'Very Low': 64,
                'Low': 128,
                'Medium': 256,
                'High': 512,
                'Very High': 1024,
                'Super High': 2048,
                'Ultra(4K)': 4096
            }).name("Resolution")
            .setValue(this.settings.resolution.x)
            .onChange(val => {
                this.settings.resolution = new THREE.Vector2(val, val);
                this.reset();
            });
        generalFolder.add(this._solver.settings, "speed", 0.0, 10.0, 0.01).name("Speed");

        const domainFolder = generalFolder.addFolder("Domain");
        domainFolder.add(this.settings.domain, "x", 1, 100, 1).name("Width").onChange(() => { this.reset(); });
        domainFolder.add(this.settings.domain, "y", 1, 100, 1).name("Height").onChange(() => { this.reset(); });
        domainFolder.add(this.settings.domain, "z", 1, 100, 1).name("Depth").onChange(() => { this.reset(); });

        const viscosityFolder = simulationFolder.addFolder("Viscosity");
        viscosityFolder.add(this._solver.settings, "hasViscosity").name("Apply Viscosity");
        viscosityFolder.add(this._solver.settings, "viscosityIterations", 20, 50, 1).name("Iterations");
        viscosityFolder.add(this._solver.settings, "viscosity", 0, 1, 0.01).name("Viscosity");

        const vorticityFolder = simulationFolder.addFolder("Vorticity");
        vorticityFolder.add(this._solver.settings, "hasVorticity").name("Apply Vorticity");
        vorticityFolder.add(this._solver.settings, "vorticityStrength", 0, 0.1, 0.001).name("Strength");

        const projectionFolder = simulationFolder.addFolder("Projection");
        projectionFolder.add(this._solver.settings, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");

        const bodyForcesFolder = simulationFolder.addFolder("Body Forces");
        bodyForcesFolder.add(this._solver.settings, "hasGravity").name("Apply Gravity");
        bodyForcesFolder.add(this._solver.settings.gravity, "y", -2.0, 2.0, 0.01).name("Gravity Force");
        bodyForcesFolder.add(this._solver.settings, "forceRadius", 0, 10, 0.1).name("Radius");
        bodyForcesFolder.add(this._solver.settings, "forceDensity", -1, 5.0, 0.1).name("Added Density");
        bodyForcesFolder.add(this._solver.settings, "forceVelocity", 0, 1.0, 0.01).name("Added Velocity");

        const renderingFolder = this._gui.addFolder("Rendering");
        renderingFolder.add(this._renderer.settings, "showGuides").name("Guides");
        renderingFolder.add(this._renderer.settings, "hasShading").name("Shading");
        renderingFolder.add(this._renderer.settings, "slices", 10, 1000, 1).name("Volume Slices").onChange(() => { this._renderer.reset(this.settings.domain, this._tiledTexture) });
        renderingFolder.addColor(this._renderer.settings, "color1").name("Color Slow");
        renderingFolder.addColor(this._renderer.settings, "color2").name("Color Fast");
        renderingFolder.addColor(this._renderer.settings, "background").name("Background").onChange(() => this._renderer.updateBackgroundColor());
        renderingFolder.add(this._renderer.settings, "ambient", 0.0, 1.0, 0.01).name("Ambient Intensity").onChange(() => this._renderer.updateBackgroundColor());
        renderingFolder.add(this._renderer.settings, "minThreshold", 0.0, 1.1, 0.0001).name("Min. Density");

        simulationFolder.open();
        parent.prepend(this._gui.domElement);
    }

    /**
     * Continue the simulation.
     * @returns null
     */
    start = () => {
        if (this._isRunning)
            return;
        this._isRunning = true;
    }

    /**
     * Pauses update calls of the solver.
     * @returns null
     */
    stop = () => {
        if (!this._isRunning)
            return;
        this._isRunning = false;
    }

    /**
     * Resets the entire simulation.
     * Reinitializes important fields.
     *
     * Should be called whenever changes to the resolution or domain are made.
     * @returns null
     */
    reset = () => {
        // TODO: add function that copies existing slabs into new ones if possible
        this.stop();

        const isResolutionPossible =
            this._tiledTexture.computeResolution(this.settings.resolution, this.settings.domain);
        if (!isResolutionPossible) {
            (this._renderer.domainBox.material as THREE.MeshBasicMaterial).color.set(THREE.Color.NAMES.red);
            return;
        } else {
            (this._renderer.domainBox.material as THREE.MeshBasicMaterial).color.set(THREE.Color.NAMES.white);
        }

        this._solver.reset(this.settings.domain, this._tiledTexture);
        this._renderer.reset(this.settings.domain, this._tiledTexture);
        this._gui.updateDisplay();

        this._pointer = new Pointer3D(this._camera, this._mouse, this.settings.domain);
        this.debugPanel.updateHeaderValues(this._tiledTexture.resolution, this._tiledTexture.tileResolution, this._tiledTexture.tileCount.z);
        this.debugPanel.setSlabs(this._solver.getDebugSlabs());

        this.start();
    }

    /**
     *  Update the simulation once.
     */ 
    step = () => {
        this.timeout = requestAnimationFrame(this.step);

        let dt = this._clock.getDelta();
        if (this._isRunning) {
            this._solver.step(dt, this._mouse, this._pointer);
        }

        this._renderer.render(this._solver.density, this._solver.velocity);
        this._renderer.updateGuides(this._pointer.position, this._pointer.direction, this._pointer.isHit, (this._mouse.keys[0] || this._mouse.keys[1]));
        this.debugPanel.render();

        // Required updates
        this._stats.update();
        this._controls.update();
        this._pointer.update();
    }

    resize(w: number, h: number) {
        this._camera.aspect = w / h;
        this._camera.updateProjectionMatrix();
    }
}