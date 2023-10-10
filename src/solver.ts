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

export default class Solver {

    private renderer: THREE.WebGLRenderer;

    applyBoundaries = true; // Needs more than just deactivating
    dissipation = 0.998; // Dissipation, lower value means faster dissipation
    applyViscosity: boolean = false;
    viscosity = 0.3; // Viscosity, higher value means more viscous fluid
    applyVorticity = false;
    curl = 0.3; // Curl
    pressureIterations = 50; // Jacobi iterations for poisson pressure, should be between 50-80 
    applyGravity = false;
    gravity = new THREE.Vector3(0, -9.81, 0);
    rise = 1.0; // Tendency to rise
    fall = 1.0 // Tendency to fall, maybe link both with "weight" or sth

    public density: Slab;
    public velocity: Slab;
    public pressure: Slab;
    public velocityDivergence: Slab;
    public velocityVorticity: Slab;

    private advect: Advect;
    private force: Force;
    private divergence: Divergence;
    private gradient: Gradient;
    private boundary: Boundary;
    private buoyancy: Buoyancy;
    private jacobi: Jacobi;
    private vorticity: Vorticity;
    private vorticityConfinement: VorticityConfinement;

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3) {
        this.renderer = renderer;

        // Slabs
        this.density = new Slab(resolution, THREE.RedFormat);
        this.velocity = new Slab(resolution);
        this.pressure = new Slab(resolution, THREE.RedFormat);
        this.velocityDivergence = new Slab(resolution, THREE.RedFormat);
        this.velocityVorticity = new Slab(resolution, THREE.RedFormat);

        // Slabobs
        this.advect = new Advect(resolution, vertexBasic, fragmentAdvect);
        this.force = new Force(resolution, vertexBasic, fragmentForce);
        this.divergence = new Divergence(resolution, vertexBasic, fragmentDivergence);
        this.gradient = new Gradient(resolution, vertexBasic, fragmentGradient);
        this.boundary = new Boundary(resolution, vertexOffset, fragmentBoundary);
        this.jacobi = new Jacobi(resolution, vertexBasic, fragmentJacobi);
        this.buoyancy = new Buoyancy(resolution, vertexBasic, fragmentBuoyancy);
        this.vorticity = new Vorticity(resolution, vertexBasic, fragmentVorticity);
        this.vorticityConfinement = new VorticityConfinement(resolution, vertexBasic, fragmentVorticityConfinement);
    }

    step(dt: number, keys: [boolean, boolean], mousePos: THREE.Vector3, mouseDir: THREE.Vector3) {
        // Advection
        this.advect.compute(this.renderer, this.velocity, this.velocity, this.velocity, dt);
        this.boundary.compute(this.renderer, this.velocity, this.velocity);
        
        this.advect.compute(this.renderer, this.density, this.velocity, this.density, dt, this.dissipation);
        
        // Body forces  
        if(this.applyGravity) {
            this.buoyancy.compute(this.renderer, this.velocity, this.density, this.velocity, this.gravity, dt);
        }
        this.addForce(dt, keys, mousePos, mouseDir);

        // Vorticity confinement
        if (this.applyVorticity && this.curl > 0) {
            this.vorticity.compute(this.renderer, this.velocity, this.velocityVorticity);
            this.vorticityConfinement.compute(this.renderer, this.velocity, this.velocityVorticity, this.velocity, dt, this.curl);

            this.boundary.compute(this.renderer, this.velocity, this.velocity);
        }

        // Viscous diffusion
        if (this.applyViscosity && this.viscosity > 0) {

            let alpha = 1.0 / (this.viscosity * 1.0); // timestep = 1.0
            let beta = 6.0 + alpha;

            this.jacobi.alpha = alpha;
            this.jacobi.beta = beta;

            this.jacobi.compute(this.renderer, this.velocity, this.velocity, this.density, this.velocity, 1, this.boundary);
            this.jacobi.compute(this.renderer, this.density, this.density, this.density, this.density, 1);
        }

        // Projection
        this.project();

    }

    addForce(dt: number, keys: [boolean, boolean], mousePos: THREE.Vector3, mouseDir: THREE.Vector3) {
        if (!(keys[0] || keys[1]))
            return;

        if (keys[0]) {
            this.force.compute(this.renderer, this.density, this.density, dt, mousePos, new THREE.Vector3(1, 1, 1), 0.005, 10.0);
        }

        if (keys[1]) {
            let direction = mouseDir;

            this.force.compute(this.renderer, this.velocity, this.velocity, dt, mousePos, direction, 0.005, 10.0);
            this.boundary.compute(this.renderer, this.velocity, this.velocity);
        }
    }

    project() {
        // Divergence
        this.divergence.compute(this.renderer, this.velocity, this.density, this.velocityDivergence);

        // Poisson Pressure
        this.jacobi.alpha = -1.0;
        this.jacobi.beta = 6.0;
        this.jacobi.compute(this.renderer, this.pressure, this.velocityDivergence, this.density, this.pressure, this.pressureIterations, this.boundary, 1.0);

        // Subtract gradient
        this.gradient.compute(this.renderer, this.velocity, this.pressure, this.velocity);
        this.boundary.compute(this.renderer, this.velocity, this.velocity);
    }
}