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
import TiledTexture from './lib/TiledTexture';
import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';

export default class Solver {

    applyBoundaries = true; // Needs more than just deactivating
    dissipation = 1.0; // Dissipation, lower value means faster dissipation
    applyViscosity: boolean = false;
    viscosityIterations = 30;
    viscosity = 0.3; // Viscosity, higher value means more viscous fluid
    applyVorticity = false;
    curl = 0.3; // Curl
    pressureIterations = 80; // Jacobi iterations for poisson pressure, should be between 50-80 
    applyGravity = false;
    gravity = new THREE.Vector3(0, -9.81, 0);
    rise = 1.0; // Tendency to rise
    fall = 1.0 // Tendency to fall, maybe link both with "weight" or sth
    forceRadius = 2.0;
    forceDensity = 20.0;
    forceVelocity = 0.2;
    targetDensity = 0.01;
    pressureMultiplier = 1.0;
    useBfecc = false;

    domain: THREE.Vector3;
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

    constructor(renderer: THREE.WebGLRenderer, domain: THREE.Vector3) {
        this.renderer = renderer;
        this.domain = domain;
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
    }

    step(dt: number, mouse: Mouse, pointer: Pointer3D) {

        // Body forces  
        if (this.applyGravity) {
            this.buoyancy.compute(this.velocity, this.density, this.velocity, this.gravity, dt);
            this.boundary.compute(this.velocity, this.velocity);
        }
        this.addForce(dt, mouse, pointer);

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

    addForce(dt: number, mouse: Mouse, pointer: Pointer3D) {
        if (!(mouse.keys[0] || mouse.keys[1]))
            return;

        if(!pointer.isHit)
            return;

        let position = new THREE.Vector3(
            (pointer.position.x + this.domain.x / 2),
            (pointer.position.y + this.domain.y / 2),
            this.domain.z - (pointer.position.z + this.domain.z / 2)
        );

        let direction = pointer.direction;
        direction.z *= -1;

        if (mouse.keys[0]) {
            this.force.compute(this.density, this.density, dt, position, new THREE.Vector3(1, 1, 1), this.forceRadius, this.forceDensity);
        }

        if (mouse.keys[1]) {
            this.force.compute(this.velocity, this.velocity, dt, position, direction, this.forceRadius, this.forceVelocity);
            this.boundary.compute(this.velocity, this.velocity);
        }
    }

    project() {
        // Divergence
        this.divergence.compute(this.velocity, this.density, this.velocityDivergence);

        // Poisson Pressure
        this.jacobi.alpha = -1.0;
        this.jacobi.beta = 6.0;
        this.jacobi.compute(this.pressure, this.velocityDivergence, this.density, this.pressure, this.pressureIterations, this.boundary);

        // Subtract gradient
        this.gradient.compute(this.velocity, this.pressure, this.velocity);
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