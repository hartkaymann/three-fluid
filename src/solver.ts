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
import Incompressability from './lib/slabop/Incompressability';
import ScalarAddition from './lib/slabop/ScalarAdd';


import vertexBasic from './shaders/basic.vert'
import vertexOffset from './shaders/offset.vert'
import fragmentForce from './shaders/force.frag'
import fragmentAdvect from './shaders/advect.frag'
import fragmentJacobi from './shaders/jacobi.frag'
import fragmentDivergence from './shaders/divergence.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentBuoyancy from './shaders/buoyancy.frag'
import fragmentVorticity from './shaders/vorticity.frag'
import fragmentVorticityConfinement from './shaders/vorticityconfine.frag'
import fragmentIncompressability from './shaders/incompressability.frag'
import fragmentScalarAdd from './shaders/scalaradd.frag'

export default class Solver {

    private renderer: THREE.WebGLRenderer;

    applyBoundaries = true; // Needs more than just deactivating
    dissipation = 1.0; // Dissipation, lower value means faster dissipation
    applyViscosity: boolean = false;
    viscosity = 0.3; // Viscosity, higher value means more viscous fluid
    applyVorticity = false;
    curl = 0.3; // Curl
    pressureIterations = 50; // Jacobi iterations for poisson pressure, should be between 50-80 
    applyGravity = false;
    gravity = new THREE.Vector3(0, -9.81, 0);
    rise = 1.0; // Tendency to rise
    fall = 1.0 // Tendency to fall, maybe link both with "weight" or sth
    forceRadius = 3;
    forceMultiplier = 5;
    targetDensity = 1.0;
    pressureMultiplier = 1.0;

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
    private scalarAdd : ScalarAddition;

    constructor(renderer: THREE.WebGLRenderer, domain: THREE.Vector3, resolution: THREE.Vector3) {
        this.renderer = renderer;

        // Slabs
        this.density = new Slab(resolution, THREE.RedFormat);
        this.velocity = new Slab(resolution);
        this.pressure = new Slab(resolution, THREE.RedFormat);
        this.velocityDivergence = new Slab(resolution, THREE.RedFormat);
        this.velocityVorticity = new Slab(resolution, THREE.RedFormat);
        this.densityPressure = new Slab(resolution);

        // Slabobs
        this.advect = new Advect(renderer, resolution, vertexBasic, fragmentAdvect);
        this.force = new Force(renderer, domain, resolution, vertexBasic, fragmentForce);
        this.divergence = new Divergence(renderer, resolution, vertexBasic, fragmentDivergence);
        this.gradient = new Gradient(renderer, resolution, vertexBasic, fragmentGradient);
        this.boundary = new Boundary(renderer, resolution, vertexOffset, fragmentBoundary);
        this.jacobi = new Jacobi(renderer, resolution, vertexBasic, fragmentJacobi);
        this.buoyancy = new Buoyancy(renderer, resolution, vertexBasic, fragmentBuoyancy);
        this.vorticity = new Vorticity(renderer, resolution, vertexBasic, fragmentVorticity);
        this.vorticityConfinement = new VorticityConfinement(renderer, resolution, vertexBasic, fragmentVorticityConfinement);
        this.incompressability = new Incompressability(renderer, resolution, vertexBasic, fragmentIncompressability);
        this.scalarAdd = new ScalarAddition(renderer, resolution, vertexBasic, fragmentScalarAdd);
    }

    step(dt: number, keys: [boolean, boolean], mousePos: THREE.Vector3, mouseDir: THREE.Vector3) {
        
        // Advection
        this.advect.compute(this.density, this.velocity, this.density, dt, this.dissipation);
        this.advect.compute(this.velocity, this.velocity, this.velocity, dt);
        this.boundary.compute(this.velocity, this.velocity);
        
        //this.incompressability.compute(this.density, this.velocity, this.densityPressure, this.targetDensity, this.pressureMultiplier, dt);
        //this.scalarAdd.compute(this.velocity, this.densityPressure, this.velocity);
        
        // Body forces  
        if(this.applyGravity) {
            this.buoyancy.compute(this.velocity, this.density, this.velocity, this.gravity, dt);
        }
        
        this.addForce(dt, keys, mousePos, mouseDir);

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

            this.jacobi.compute(this.velocity, this.velocity, this.density, this.velocity, 1, this.boundary);
            this.jacobi.compute(this.density, this.density, this.density, this.density, 1);
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
        this.divergence.compute(this.velocity, this.density, this.velocityDivergence);

        // Poisson Pressure
        this.jacobi.alpha = -1.0;
        this.jacobi.beta = 6.0;
        this.jacobi.compute(this.pressure, this.velocityDivergence, this.density, this.pressure, this.pressureIterations, this.boundary, 1.0);

        // Subtract gradient
        this.gradient.compute(this.velocity, this.pressure, this.velocity);
        this.boundary.compute(this.velocity, this.velocity);
    }
}