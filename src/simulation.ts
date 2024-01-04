import * as THREE from 'three'
import TiledTexture from './lib/TiledTexture';
import Solver from './solver';
import Renderer from './renderer';
import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'dat.gui';
import { Clock } from 'three/src/core/Clock.js'
import DebugPanel from './lib/DebugPanel';
import Stats from 'three/examples/jsm/libs/stats.module.js';

export default class Simulation {

    settings = {
        domain: new THREE.Vector3(20, 20, 20),
        _res: 0, // required for gui to work
        resolution: new THREE.Vector2(512, 512)
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

    // TODO: add instructions as text on screen! maybe with (i)-button that can be toggled
    constructor(
        wgl: THREE.WebGLRenderer,
        sidePanel: HTMLElement,
        container: HTMLElement
    ) {
        this._wgl = wgl;

        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this._camera.position.set(-15, 12, 25);

        this._tiledTexture = new TiledTexture();
        this._tiledTexture.computeResolution(this.settings.resolution, this.settings.domain);

        // Initialize solver and renderer
        this._solver = new Solver(this._wgl, this.settings.domain);
        this._solver.reset(this.settings.domain, this._tiledTexture);

        this._renderer = new Renderer(this._wgl, this._camera, this.settings.domain);
        this._renderer.reset(this.settings.domain, this._tiledTexture);
        this._renderer.resize(sidePanel.clientWidth);

        this.debugPanel = new DebugPanel(this._wgl, container, this._solver.getDebugSlabs());
        this.debugPanel.create();
        this.debugPanel.setHeader(this._tiledTexture.resolution, this.settings.resolution, this._tiledTexture.tileCount.z);

        this.initGui(sidePanel);

        // Additionals
        this._mouse = new Mouse();
        this._pointer = new Pointer3D(this._camera, this._mouse, this.settings.domain);

        this._clock = new Clock();
        this._clock.start();

        this._stats = new Stats();
        document.body.appendChild(this._stats.dom);

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
                'Super High': 2048
            }).name("Resolution")
            .setValue(this.settings.resolution.x)
            .onChange(val => {
                this.settings.resolution = new THREE.Vector2(val, val);
                this.reset();
            });

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
        vorticityFolder.add(this._solver.settings, "curl", 0, 5, 0.01).name("Curl");

        const projectionFolder = simulationFolder.addFolder("Projection");
        projectionFolder.add(this._solver.settings, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");

        const bodyForcesFolder = simulationFolder.addFolder("Body Forces");
        bodyForcesFolder.add(this._solver.settings, "hasGravity").name("Apply Gravity");
        bodyForcesFolder.add(this._solver.settings.gravity, "y", -9.81, 9.81, 0.01).name("Gravity Force");
        bodyForcesFolder.add(this._solver.settings, "forceRadius", 0, 10, 0.1).name("Interaction Radius");
        bodyForcesFolder.add(this._solver.settings, "forceDensity", -1, 10, 1).name("Added Density");
        bodyForcesFolder.add(this._solver.settings, "forceVelocity", 0, 10, 0.1).name("Added Velocity");

        const renderingFolder = this._gui.addFolder("Rendering");
        renderingFolder.add(this._renderer.settings, "showGuides").name("Guides");
        renderingFolder.add(this._renderer.settings, "hasShading").name("Shading");
        renderingFolder.add(this._renderer.settings, "slices", 10, 1000, 1).name("Volume Slices").onChange(() => { this._renderer.reset(this.settings.domain, this._tiledTexture) });
        renderingFolder.addColor(this._renderer.settings, "color1").name("Color Slow");
        renderingFolder.addColor(this._renderer.settings, "color2").name("Color Fast");
        renderingFolder.add(this._renderer.settings, "ambient", 0.0, 1.0, 0.01).name("Ambient Intensity");
        renderingFolder.add(this._renderer.settings, "minThreshold", 0.0, 1.1, 0.0001).name("Density Threshold");

        simulationFolder.open();
        parent.prepend(this._gui.domElement);
    }

    start = () => {
        if (this._isRunning)
            return;
        this._isRunning = true;
    }

    stop = () => {
        if (!this._isRunning)
            return;
        this._isRunning = false;
    }

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
        this._renderer.reset(this.settings.domain, this._tiledTexture, true);
        this._gui.updateDisplay();

        this._pointer = new Pointer3D(this._camera, this._mouse, this.settings.domain);
        this.debugPanel.setHeader(this._tiledTexture.resolution, this.settings.resolution, this._tiledTexture.tileCount.z);
        this.debugPanel.setSlabs(this._solver.getDebugSlabs());

        this.start();
    }

    step = () => {
        this.timeout = requestAnimationFrame(this.step);

        let dt = this._clock.getDelta();
        if (this._isRunning) {
            this._solver.step(dt, this._mouse, this._pointer);
        }

        this._renderer.render(this._solver.density, this._solver.velocity, this._solver.densityPressure);
        this._renderer.updateGuides(this._pointer.position, this._pointer.direction, (this._mouse.keys[0] || this._mouse.keys[1]) && this._pointer.isHit);
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