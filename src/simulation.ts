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
        domain: new THREE.Vector3(40, 40, 40),
        _res: 0, // required for gui to work
        resolution: new THREE.Vector2(512, 512)
    }

    timeout: number;
    private wgl: THREE.WebGLRenderer;

    private isRunning = false;

    private tiledTexture: TiledTexture;

    private solver: Solver;
    private renderer: Renderer;

    private camera: THREE.PerspectiveCamera;
    private mouse: Mouse;
    private pointer: Pointer3D;

    private controls: OrbitControls;
    private stats: Stats;
    private clock: Clock;
    private gui: GUI;

    private debugPanel: DebugPanel;

    // TODO: add instructions as text on screen! maybe with (i)-button that can be toggled
    constructor(
        wgl: THREE.WebGLRenderer,
        container: HTMLElement
    ) {
        this.wgl = wgl;

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 20;

        this.tiledTexture = new TiledTexture();
        this.tiledTexture.computeResolution(this.settings.resolution, this.settings.domain);

        // Initialize solver and renderer
        this.solver = new Solver(this.wgl, this.settings.domain);
        this.solver.reset(this.settings.domain, this.tiledTexture);

        this.renderer = new Renderer(this.wgl, this.camera);
        this.renderer.reset(this.settings.domain, this.tiledTexture);

        this.debugPanel = new DebugPanel(this.wgl, container, this.solver.getDebugSlabs());
        this.debugPanel.create();
        this.debugPanel.setHeader(this.settings.resolution, this.tiledTexture.tileCount.z);

        this.initGui();

        // Additionals
        this.mouse = new Mouse();
        this.pointer = new Pointer3D(this.camera, this.mouse, this.settings.domain);

        this.clock = new Clock();
        this.clock.start();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        this.controls = new OrbitControls(this.camera, wgl.domElement);
        this.controls.enabled = true;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.mouseButtons = {
            MIDDLE: THREE.MOUSE.ROTATE
        }

        this.start();
        this.step();
    }

    initGui() {
        // TODO: add settings class that uses json files to generate an object that can be used in the gui
        // does that make sense or doe sit just not work with callbacks at all and is overly complicated?

        this.gui = new GUI();
        this.gui.domElement.id = 'gui';
        const simulationFolder = this.gui.addFolder("Simulation");
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
        viscosityFolder.add(this.solver.settings, "hasViscosity").name("Apply Viscosity");
        viscosityFolder.add(this.solver.settings, "viscosityIterations", 20, 50, 1).name("Iterations");
        viscosityFolder.add(this.solver.settings, "viscosity", 0, 1, 0.01).name("Viscosity");

        const vorticityFolder = simulationFolder.addFolder("Vorticity");
        vorticityFolder.add(this.solver.settings, "hasVorticity").name("Apply Vorticity");
        vorticityFolder.add(this.solver.settings, "curl", 0, 5, 0.01).name("Curl");

        const projectionFolder = simulationFolder.addFolder("Projection");
        projectionFolder.add(this.solver.settings, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");

        const bodyForcesFolder = simulationFolder.addFolder("Body Forces");
        bodyForcesFolder.add(this.solver.settings, "hasGravity").name("Apply Gravity");
        bodyForcesFolder.add(this.solver.settings.gravity, "y", -10, 0, 0.01).name("Gravity Force");
        bodyForcesFolder.add(this.solver.settings, "forceRadius", 0, 10, 0.1).name("Interaction Radius");
        bodyForcesFolder.add(this.solver.settings, "forceDensity", 0, 100, 1).name("Added Density");
        bodyForcesFolder.add(this.solver.settings, "forceVelocity", 0, 10, 0.1).name("Added Velocity");

        simulationFolder.open();

        const renderingFolder = this.gui.addFolder("Rendering");
        renderingFolder.add(this.renderer.settings, "hasShading").name("Shading");
        renderingFolder.addColor(this.renderer.settings, "color1").name("Color Slow");
        renderingFolder.addColor(this.renderer.settings, "color2").name("Color Fast");
        renderingFolder.add(this.renderer.settings, "minThreshold", 0.0, 1.1, 0.0001).name("Minumim Density");
        renderingFolder.add(this.renderer.settings, "showGuides").name("Guides");
    }

    start = () => {
        if (this.isRunning)
            return;
        this.isRunning = true;
    }

    stop = () => {
        if (!this.isRunning)
            return;
        this.isRunning = false;
    }

    reset = () => {
        // TODO: add function that copies existing slabs into new ones if possible
        this.stop();

        const isResolutionPossible =
            this.tiledTexture.computeResolution(this.settings.resolution, this.settings.domain);
        if (!isResolutionPossible) {
            (this.renderer.domainBox.material as THREE.MeshBasicMaterial).color.set(THREE.Color.NAMES.red);
            return;
        } else {
            (this.renderer.domainBox.material as THREE.MeshBasicMaterial).color.set(THREE.Color.NAMES.white);
        }

        this.solver.reset(this.settings.domain, this.tiledTexture);
        this.renderer.reset(this.settings.domain, this.tiledTexture);

        this.pointer = new Pointer3D(this.camera, this.mouse, this.settings.domain);
        this.debugPanel.setHeader(this.settings.resolution, this.tiledTexture.tileCount.z);
        this.debugPanel.setSlabs(this.solver.getDebugSlabs());

        this.start();
    }

    step = () => {
        this.timeout = requestAnimationFrame(this.step);

        let dt = this.clock.getDelta();
        if (this.isRunning) {
            this.solver.step(dt, this.mouse, this.pointer);
        }

        this.renderer.render(this.solver.density, this.solver.velocity, this.solver.densityPressure);
        this.renderer.updateGuides(this.pointer.position, this.pointer.direction, (this.mouse.keys[0] || this.mouse.keys[1]) && this.pointer.isHit);
        this.debugPanel.render();

        // Required updates
        this.stats.update();
        this.controls.update();
        this.pointer.update();
    }

    resize(w: number, h: number) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
}