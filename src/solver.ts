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
import fragmentMacCormack from './shaders/maccormack.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentBuoyancy from './shaders/buoyancy.frag'
import fragmentVorticity from './shaders/vorticity.frag'
import fragmentVorticityConfinement from './shaders/vorticityconfine.frag'
import TiledTexture from './lib/TiledTexture';
import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import MacCormack from './lib/slabop/MacCormack';

export default class Solver {

    settings = {
        hasViscosity: false,
        viscosityIterations: 30,
        viscosity: 0.3,
        hasVorticity: false,
        curl: 0.3,
        pressureIterations: 80,
        hasGravity: false,
        gravity: new THREE.Vector3(0, -9.81, 0),
        forceRadius: 2.0,
        forceDensity: 5.0,
        forceVelocity: 2,
        targetDensity: 0.01,
        pressureMultiplier: 1.0
    }

    domain: THREE.Vector3;
    renderer: THREE.WebGLRenderer;

    public density: Slab;
    public velocity: Slab;
    public pressure: Slab;
    public velocityDivergence: Slab;
    public velocityVorticity: Slab;
    public densityPressure: Slab;

    private advect: Advect;
    private maccormack: MacCormack;
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
        this.maccormack = new MacCormack(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentMacCormack])
        this.force = new Force(this.renderer, domain, tiledTex, vertexBasic, [fragmentCommon, fragmentForce]);
        this.divergence = new Divergence(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentDivergence]);
        this.gradient = new Gradient(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentGradient]);
        this.boundary = new Boundary(this.renderer, tiledTex, vertexOffset, fragmentBoundary);
        this.jacobi = new Jacobi(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentJacobi]);
        this.buoyancy = new Buoyancy(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentBuoyancy]);
        this.vorticity = new Vorticity(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentVorticity]);
        this.vorticityConfinement = new VorticityConfinement(this.renderer, tiledTex, vertexBasic, [fragmentCommon, fragmentVorticityConfinement]);
    }

    step(dt: number, mouse: Mouse, pointer: Pointer3D) {

        // Advection
        this.advectMackCormack(this.velocity, this.velocity, this.velocity, dt);
        this.advectMackCormack(this.density, this.velocity, this.density, dt);
        //this.advect.compute(this.density, this.velocity, this.density, dt);
        //this.advect.compute(this.velocity, this.velocity, this.velocity, dt);
        
        // Body forces  
        if (this.settings.hasGravity) {
            this.buoyancy.compute(this.velocity, this.density, this.velocity, this.settings.gravity, dt);
        }
        this.addForce(dt, mouse, pointer);

        // Vorticity confinement
        if (this.settings.hasVorticity && this.settings.curl > 0) {
            this.vorticity.compute(this.velocity, this.velocityVorticity);
            this.vorticityConfinement.compute(this.velocity, this.velocityVorticity, this.velocity, dt, this.settings.curl);
        }

        // Viscous diffusion
        if (this.settings.hasViscosity && this.settings.viscosity > 0) {
            let alpha = 1.0 / (this.settings.viscosity * dt);
            let beta = 6.0 + alpha;

            this.jacobi.alpha = alpha;
            this.jacobi.beta = beta;

            this.jacobi.compute(this.velocity, this.velocity, this.velocity, this.settings.viscosityIterations, this.boundary, -1);
        }

        // Projection
        this.project();
    }

    advectMackCormack(
        advected: Slab,
        velocity: Slab,
        output: Slab,
        dt: number,
    ) {
        let intermediate = this.maccormack.intermediate;

        // Forward step
        this.advect.compute(advected, velocity, intermediate, dt);

        // Backward step
        this.advect.compute(intermediate, velocity, intermediate, -dt);

        // Correction
        this.maccormack.compute(advected, velocity, intermediate.write.texture, intermediate.read.texture, output);
    }

    addForce(dt: number, mouse: Mouse, pointer: Pointer3D) {
        if (!(mouse.keys[0] || mouse.keys[1]))
            return;

        if (!pointer.isHit)
            return;

        let position = new THREE.Vector3(
            (pointer.position.x + this.domain.x / 2),
            (pointer.position.y + this.domain.y / 2),
            this.domain.z - (pointer.position.z + this.domain.z / 2)
        );

        let direction = pointer.direction;
        direction.z *= -1;

        if (mouse.keys[0]) {
            let force = this.settings.forceDensity;
            if(this.settings.forceDensity < 0)
                force = -100;
                
            this.force.compute(this.density, this.density, dt, position, new THREE.Vector3(1, 1, 1), this.settings.forceRadius, force);
        }

        if (mouse.keys[1]) {
            this.force.compute(this.velocity, this.velocity, dt, position, direction, this.settings.forceRadius, this.settings.forceVelocity);
        }
    }

    project() {
        // Divergence
        this.boundary.compute(this.velocity, this.velocity, -1);
        this.divergence.compute(this.velocity, this.velocityDivergence);

        // Poisson Pressure
        this.jacobi.alpha = -1.0;
        this.jacobi.beta = 6.0;
        this.jacobi.compute(this.pressure, this.velocityDivergence, this.pressure, this.settings.pressureIterations, this.boundary, 1);

        // Subtract gradient
        this.gradient.compute(this.velocity, this.pressure, this.velocity);
    }

    getDebugSlabs(): { name: string, slab: Slab, bias: number }[] {
        return [
            { name: "Density", slab: this.density, bias: 0.0 },
            { name: "Velocity", slab: this.velocity, bias: 0.5 },
            { name: "Pressure", slab: this.pressure, bias: 0.5 },
            { name: "Divergence", slab: this.velocityDivergence, bias: 0.5 },
            { name: "Vorticity", slab: this.velocityVorticity, bias: 0.5 },
        ];
    }
}