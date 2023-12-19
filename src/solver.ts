import * as THREE from 'three'

import Slab from './lib/Slab';
import Advect from './lib/slabop/Advect';
import Force from './lib/slabop/Force';
import Divergence from './lib/slabop/Divergence';
import Gradient from './lib/slabop/Gradient';
import Boundary from './lib/slabop/Boundary';
import Buoyancy from './lib/slabop/Buoyancy';
import Jacobi from './lib/slabop/Jacobi';
import Vorticity from './lib/slabop/Vorticity';
import VorticityConfinement from './lib/slabop/VorticityConfinement';
import Incompressability from './lib/slabop/Incompressibility';
import ScalarAddition from './lib/slabop/ScalarAdd';

import vertexBasic from './shaders/basic.vert'
import vertexOffset from './shaders/offset.vert'
import fragmentCommon from './shaders/common.frag'
import fragmentForce from './shaders/force.frag'
import fragmentAdvect from './shaders/advect.frag'
import fragmentJacobi from './shaders/jacobi.frag'
import fragmentDivergence from './shaders/divergence.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentBuoyancy from './shaders/buoyancy.frag'
import fragmentVorticity from './shaders/vorticity.frag'
import fragmentVorticityConfinement from './shaders/vorticityconfine.frag'
import fragmentIncompressability from './shaders/incompressibility.frag'
import fragmentScalarAdd from './shaders/scalaradd.frag'
import TiledTexture from './lib/TiledTexture';

export default class Solver {

    applyBoundaries = true; // Needs more than just deactivating
    dissipation = 1.0; // Dissipation, lower value means faster dissipation
    applyViscosity: boolean = false;
    viscosityIterations = 30;
    viscosity = 0.3; // Viscosity, higher value means more viscous fluid
    applyVorticity = false;
    curl = 0.3; // Curl
    pressureIterations = 80; // Jacobi iterations for poisson pressure, should be between 50-80 
    applyGravity = true;
    gravity = new THREE.Vector3(0, -9.81, 0);
    rise = 1.0; // Tendency to rise
    fall = 1.0 // Tendency to fall, maybe link both with "weight" or sth
    forceRadius = 1.;
    forceMultiplier = 1;
    targetDensity = 0.01;
    pressureMultiplier = 1.0;
    useBfecc = false;
    projectionOffset = 1.0;

    renderer: THREE.WebGLRenderer;

    public density: Slab;
    public velocity: Slab;
    public pressure: Slab;
    public velocityDivergence: Slab;
    public velocityVorticity: Slab;
    public densityPressure: Slab;

    private advect: Advect;
    private force: Force;
    private divergence: Divergence;
    private gradient: Gradient;
    private boundary: Boundary;
    private buoyancy: Buoyancy;
    private jacobi: Jacobi;
    private vorticity: Vorticity;
    private vorticityConfinement: VorticityConfinement;
    private incompressability: Incompressability;
    private scalarAdd: ScalarAddition;

    constructor(renderer: THREE.WebGLRenderer, ) {
        this.renderer = renderer;
    }
    
    reset(domain: THREE.Vector3, tiledTex: TiledTexture) {
        // Slabs
        this.density = new Slab(tiledTex.resolution, THREE.RedFormat);
        this.velocity = new Slab(tiledTex.resolution);
        this.pressure = new Slab(tiledTex.resolution, THREE.RedFormat);
        this.velocityDivergence = new Slab(tiledTex.resolution, THREE.RedFormat);
        this.velocityVorticity = new Slab(tiledTex.resolution);
        this.densityPressure = new Slab(tiledTex.resolution);
    
        // Slabobs
        this.advect = new Advect(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentAdvect]);
        this.force = new Force(this.renderer, domain, tiledTex, vertexBasic, [fragmentCommon, fragmentForce]);
        this.divergence = new Divergence(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentDivergence]);
        this.gradient = new Gradient(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentGradient]);
        this.boundary = new Boundary(this.renderer, tiledTex, vertexOffset, [fragmentCommon, fragmentBoundary]);
        this.jacobi = new Jacobi(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentJacobi]);
        this.buoyancy = new Buoyancy(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentBuoyancy]);
        this.vorticity = new Vorticity(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentVorticity]);
        this.vorticityConfinement = new VorticityConfinement(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentVorticityConfinement]);
        this.incompressability = new Incompressability(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentIncompressability]);
        this.scalarAdd = new ScalarAddition(this.renderer, tiledTex, vertexBasic, fragmentScalarAdd);
    }

    step(dt: number, keys: [boolean, boolean], mousePos: THREE.Vector3, mouseDir: THREE.Vector3) {

        // Body forces  
        if (this.applyGravity) {
            this.buoyancy.compute(this.velocity, this.density, this.velocity, this.gravity, dt);
            this.boundary.compute(this.velocity, this.velocity);
        }
        this.addForce(dt, keys, mousePos, mouseDir);

        // Advection
        this.advect.compute(this.density, this.velocity, this.density, dt, 1.0, this.useBfecc);
        this.advect.compute(this.velocity, this.velocity, this.velocity, dt, this.dissipation, false);
        this.boundary.compute(this.velocity, this.velocity);

        //this.incompressability.compute(this.density, this.velocity, this.densityPressure, this.targetDensity, this.pressureMultiplier, dt);
        //this.scalarAdd.compute(this.velocity, this.densityPressure, this.velocity);

        // Vorticity confinement
        if (this.applyVorticity && this.curl > 0) {
            this.vorticity.compute(this.velocity, this.velocityVorticity);
            this.vorticityConfinement.compute(this.velocity, this.velocityVorticity, this.velocity, dt, this.curl);

            this.boundary.compute(this.velocity, this.velocity);
        }

        // Viscous diffusion
        if (this.applyViscosity && this.viscosity > 0) {

            let alpha = 1.0 / (this.viscosity * 1.0); // timestep = 1.0
            let beta = 6.0 + alpha;

            this.jacobi.alpha = alpha;
            this.jacobi.beta = beta;

            this.jacobi.compute(this.velocity, this.velocity, this.density, this.velocity, this.viscosityIterations, this.boundary);
            this.boundary.compute(this.velocity, this.velocity);
        }

        // Projection
        this.project();

    }

    addForce(dt: number, keys: [boolean, boolean], mousePos: THREE.Vector3, mouseDir: THREE.Vector3) {
        if (!(keys[0] || keys[1]))
            return;

        if (keys[0]) {
            this.force.compute(this.density, this.density, dt, mousePos, new THREE.Vector3(1, 1, 1), this.forceRadius, this.forceMultiplier);
        }

        if (keys[1]) {
            let direction = mouseDir;

            this.force.compute(this.velocity, this.velocity, dt, mousePos, direction, this.forceRadius, this.forceMultiplier);
            this.boundary.compute(this.velocity, this.velocity);
        }
    }

    project() {
        // Divergence
        this.divergence.compute(this.velocity, this.density, this.velocityDivergence, this.projectionOffset);

        // Poisson Pressure
        this.jacobi.alpha = -1.0;
        this.jacobi.beta = 6.0;
        this.jacobi.compute(this.pressure, this.velocityDivergence, this.density, this.pressure, this.pressureIterations, this.boundary, this.projectionOffset);

        // Subtract gradient
        this.gradient.compute(this.velocity, this.pressure, this.velocity, this.projectionOffset);
        this.boundary.compute(this.velocity, this.velocity);
    }

    setBoundaries(applyBounds: any) {
        this.boundary.setScale(applyBounds ? -1.0 : 1.0);
    }

    getDebugSlabs(): { name: string, slab: Slab }[] {
        return [
            { name: "Density", slab: this.density },
            { name: "Velocity", slab: this.velocity },
            { name: "Pressure", slab: this.pressure },
            { name: "Divergence", slab: this.velocityDivergence },
            { name: "Vorticity", slab: this.velocityVorticity },
        ];
    }
}