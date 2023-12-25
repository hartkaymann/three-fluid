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

    domain = new THREE.Vector3(40, 40, 40);
    resolution = new THREE.Vector2(256, 256);

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

    constructor(
        wgl: THREE.WebGLRenderer,
        container: HTMLElement
    ) {
        this.wgl = wgl;

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 20;

        this.tiledTexture = new TiledTexture();
        this.tiledTexture.computeResolution(this.resolution, this.domain);


        // Initialize solver and renderer
        this.solver = new Solver(this.wgl);
        this.solver.reset(this.domain, this.tiledTexture);

        this.renderer = new Renderer(this.wgl, this.camera, this.domain, this.tiledTexture);

        this.debugPanel = new DebugPanel(this.wgl, container, this.solver.getDebugSlabs());
        this.debugPanel.create();

        this.initGui();

        // Additionals
        this.mouse = new Mouse();
        this.pointer = new Pointer3D(this.camera, this.mouse, this.domain);

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
        this.gui = new GUI();
        this.gui.domElement.id = 'gui';
        const simulationFolder = this.gui.addFolder("Simulation");
        simulationFolder.add(this, "start").name("Start");
        simulationFolder.add(this, "stop").name("Stop");
        simulationFolder.add(this, "reset").name("Reset");

        const generalFolder = simulationFolder.addFolder("General");
        generalFolder.add(this.solver, "dissipation", 0.9, 1, 0.001).name("Dissipation");
        generalFolder.add(this.solver, "applyBoundaries").name("Apply Boundaries").onChange((val) => { this.solver.setBoundaries(val) });
        generalFolder.add(this.solver, "useBfecc").name("Use BFECC");

        const viscosityFolder = simulationFolder.addFolder("Viscosity");
        viscosityFolder.add(this.solver, "applyViscosity").name("Apply Viscosity");
        viscosityFolder.add(this.solver, "viscosityIterations", 20, 50, 1).name("Iterations");
        viscosityFolder.add(this.solver, "viscosity", 0, 1, 0.01).name("Viscosity");

        const vorticityFolder = simulationFolder.addFolder("Vorticity");
        vorticityFolder.add(this.solver, "applyVorticity").name("Apply Vorticity");
        vorticityFolder.add(this.solver, "curl", 0, 10, 0.01).name("Curl");

        const projectionFolder = simulationFolder.addFolder("Projection");
        projectionFolder.add(this.solver, "pressureIterations", 0, 200, 1).name("Jacobi Iterations");
        //projectionFolder.add(solver, "projectionOffset", 0.5, 5.0, 0.01).name("Projection Offset");

        const bodyForcesFolder = simulationFolder.addFolder("Body Forces");
        bodyForcesFolder.add(this.solver, "applyGravity").name("Apply Gravity");
        bodyForcesFolder.add(this.solver.gravity, "y", -25, 25, 0.01).name("Gravity Force");
        bodyForcesFolder.add(this.solver, "forceRadius", 0, 10, 0.1).name("Interaction Radius");
        bodyForcesFolder.add(this.solver, "forceDensity", 0, 100, 1).name("Added Density");
        bodyForcesFolder.add(this.solver, "forceVelocity", 0, 1, 0.01).name("Added Velocity");

        // const incompressibilityFolder = simulationFolder.addFolder("Incompressibility");
        // incompressibilityFolder.add(this.solver, "targetDensity", 0, 10, 0.0001).name("Target Density");
        // incompressibilityFolder.add(this.solver, "pressureMultiplier", 0, 100, 0.1).name("Pressure Multiplier");   
        simulationFolder.open();

        const renderingFolder = this.gui.addFolder("Rendering");
        renderingFolder.add(this.renderer, "applyShading").name("Shading");
        renderingFolder.addColor(this.renderer, "color1").name("Color Slow");
        renderingFolder.addColor(this.renderer, "color2").name("Color Fast");
        renderingFolder.add(this.renderer, "minThreshold", 0.0, 0.1, 0.0001).name("Minumim Density");
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
        // TODO: Also debug slabs have to be set to the new ones otherwise they dont update!
        this.stop();
        this.tiledTexture.computeResolution(this.resolution, this.domain);
        this.solver.reset(this.domain, this.tiledTexture);
        this.debugPanel.setSlabs(this.solver.getDebugSlabs());
//        this.renderer = new Renderer(this.wgl, this.camera, this.domain, this.tiledTexture);
        this.start();
    }

    step = () => {
        setTimeout(() => {
            requestAnimationFrame(this.step);
        }, 60 / 1000);

        let dt = this.clock.getDelta();

        // Required updates
        this.stats.update();
        this.controls.update();
        this.pointer.update();

        this.renderer.updateGuides(this.pointer.position, this.mouse.keys[0] || this.mouse.keys[1]);

        let position = new THREE.Vector3(
            (this.pointer.position.x + this.domain.x / 2),
            (this.pointer.position.y + this.domain.y / 2),
            this.domain.z - (this.pointer.position.z + this.domain.z / 2)
        );

        let direction = this.pointer.direction;
        direction.z *= -1;

        if (!this.isRunning)
            dt = 0.0;
        this.solver.step(dt, this.mouse.keys, position, direction);
        this.renderer.render(this.solver.density, this.solver.velocity, this.solver.densityPressure);

        this.debugPanel.render();
    }

    resize(w: number, h: number) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
}