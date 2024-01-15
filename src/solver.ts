import * as THREE from 'three'

import Slab from './lib/Slab';
import Curl from './lib/slabop/Curl';
import Force from './lib/slabop/Force';
import Advect from './lib/slabop/Advect';
import Jacobi from './lib/slabop/Jacobi';
import Gradient from './lib/slabop/Gradient';
import Boundary from './lib/slabop/Boundary';
import Buoyancy from './lib/slabop/Buoyancy';
import Vorticity from './lib/slabop/Vorticity';
import Divergence from './lib/slabop/Divergence';
import MacCormack from './lib/slabop/MacCormack';

import Mouse from './lib/Mouse';
import Pointer3D from './lib/Pointer3D';
import TiledTexture from './lib/TiledTexture';

import vertexBasic from './shaders/basic.vert'
import fragmentCurl from './shaders/curl.frag'
import vertexOffset from './shaders/offset.vert'
import fragmentForce from './shaders/force.frag'
import fragmentAdvect from './shaders/advect.frag'
import fragmentJacobi from './shaders/jacobi.frag'
import fragmentCommon from './shaders/common.frag'
import fragmentGradient from './shaders/gradient.frag'
import fragmentBoundary from './shaders/boundary.frag'
import fragmentBuoyancy from './shaders/buoyancy.frag'
import fragmentDivergence from './shaders/divergence.frag'
import fragmentMacCormack from './shaders/maccormack.frag'
import fragmentVorticity from './shaders/vorticity.frag'

/**
 * Handles updating of the fluid quantities according to governing equations. 
 */
export default class Solver {

    public settings = {
        speed: 1.0,
        viscosity: 0.3,
        hasViscosity: false,
        viscosityIterations: 30,
        hasVorticity: false,
        vorticityStrength: 0.03,
        pressureIterations: 80,
        hasGravity: false,
        forceRadius: 2.0,
        forceDensity: 0.5,
        forceVelocity: 0.5,
        gravity: new THREE.Vector3(0, -0.98, 0),
    }

    private _domain: THREE.Vector3;
    private _wgl: THREE.WebGLRenderer;

    // Slabs
    private _density: Slab;
    private _velocity: Slab;
    private _pressure: Slab;
    private _velocityCurl: Slab;
    private _velocityDivergence: Slab;

    // Slabops
    private _curl: Curl;
    private _force: Force;
    private _advect: Advect;
    private _jacobi: Jacobi;
    private _gradient: Gradient;
    private _boundary: Boundary;
    private _buoyancy: Buoyancy;
    private _vorticity: Vorticity;
    private _divergence: Divergence;
    private _maccormack: MacCormack;

    public get density() {
        return this._density;
    }

    public get velocity() {
        return this._velocity;
    }

    constructor(renderer: THREE.WebGLRenderer, domain: THREE.Vector3) {
        this._wgl = renderer;
        this._domain = domain;
    }

    /**
     * @param domain 
     * Dimensions of the fluid domain. 
     * @param tiledTex 
     * Current flat 3D texture object.
     */
    reset(
        domain: THREE.Vector3,
        tiledTex: TiledTexture
    ) {
        // Initialize slabs
        this._density = new Slab(tiledTex.resolution, THREE.RedFormat);
        this._velocity = new Slab(tiledTex.resolution);
        this._pressure = new Slab(tiledTex.resolution, THREE.RedFormat);
        this._velocityDivergence = new Slab(tiledTex.resolution, THREE.RedFormat);
        this._velocityCurl = new Slab(tiledTex.resolution);

        // Initialize slabops
        this._advect = new Advect(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentAdvect]);
        this._maccormack = new MacCormack(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentMacCormack])
        this._force = new Force(this._wgl, domain, tiledTex, vertexBasic, [fragmentCommon, fragmentForce]);
        this._divergence = new Divergence(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentDivergence]);
        this._gradient = new Gradient(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentGradient]);
        this._boundary = new Boundary(this._wgl, tiledTex, vertexOffset, fragmentBoundary);
        this._jacobi = new Jacobi(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentJacobi]);
        this._buoyancy = new Buoyancy(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentBuoyancy]);
        this._curl = new Curl(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentCurl]);
        this._vorticity = new Vorticity(this._wgl, tiledTex, vertexBasic, [fragmentCommon, fragmentVorticity]);
    }

    /**
     * @param dt 
     * Time since last simulation step.
     * @param mouse 
     * Tracks cursor position and button status. 
     * @param pointer 
     * Tracks position of cursor in 3D world space.
     */
    step(
        dt: number,
        mouse: Mouse,
        pointer: Pointer3D
    ) {
        dt *= this.settings.speed;

        // Advection
        this.advectMackCormack(this._velocity, this._velocity, this._velocity, dt);
        this.advectMackCormack(this._density, this._velocity, this._density, dt);
        this._boundary.compute(this._velocity, this._velocity, -1);

        // Body forces  
        if (this.settings.hasGravity) {
            this._buoyancy.compute(this._velocity, this._density, this._velocity, this.settings.gravity);
            this._boundary.compute(this._velocity, this._velocity, -1);
        }
        this.addForce(mouse, pointer);

        // Vorticity confinement
        if (this.settings.hasVorticity && this.settings.vorticityStrength > 0) {
            this._curl.compute(this._velocity, this._velocityCurl);
            this._vorticity.compute(this._velocity, this._velocityCurl, this._velocity, dt, this.settings.vorticityStrength);
            this._boundary.compute(this._velocity, this._velocity, -1);
        }

        // Viscous diffusion
        if (this.settings.hasViscosity && this.settings.viscosity > 0) {
            let alpha = 1.0 / (this.settings.viscosity * dt);
            let beta = 6.0 + alpha;

            this._jacobi.alpha = alpha;
            this._jacobi.beta = beta;

            this._jacobi.compute(this._velocity, this._velocity, this._velocity, this.settings.viscosityIterations, this._boundary, -1);
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
        let intermediate = this._maccormack.intermediate;

        // Forward step
        this._advect.compute(advected, velocity, intermediate, dt);

        // Backward step
        this._advect.compute(intermediate, velocity, intermediate, -dt);

        // Correction
        this._maccormack.compute(advected, velocity, intermediate.write.texture, intermediate.read.texture, output);
    }

    /**
     * Adds force from used interaction.
     * @returns null
     */
    addForce(mouse: Mouse, pointer: Pointer3D) {
        if (!(mouse.keys[0] || mouse.keys[1]))
            return;

        if (!pointer.isHit)
            return;

        let position = new THREE.Vector3(
            (pointer.position.x + this._domain.x / 2),
            (pointer.position.y + this._domain.y / 2),
            this._domain.z - (pointer.position.z + this._domain.z / 2)
        );

        let direction = pointer.direction;
        direction.z *= -1;

        if (mouse.keys[0]) {
            let force = this.settings.forceDensity;
            if (this.settings.forceDensity < 0)
                force = -100;

            this._force.compute(this._density, this._density, position, new THREE.Vector3(1, 1, 1), this.settings.forceRadius, force);
        }

        if (mouse.keys[1]) {
            this._force.compute(this._velocity, this._velocity, position, direction, this.settings.forceRadius, this.settings.forceVelocity);
        }
    }

    project() {
        // Divergence
        this._divergence.compute(this._velocity, this._velocityDivergence);

        // Poisson Pressure
        this._jacobi.alpha = -1.0;
        this._jacobi.beta = 6.0;
        this._jacobi.compute(this._pressure, this._velocityDivergence, this._pressure, this.settings.pressureIterations, this._boundary, 1);

        // Subtract gradient
        this._gradient.compute(this._velocity, this._pressure, this._velocity);
        this._boundary.compute(this._velocity, this._velocity, -1);
    }

    /**
     * @returns 
     * Slabs that should be in debug panel.
     * Bias is added to color values before displaying.
     */
    getDebugSlabs(): { name: string, slab: Slab, bias: number }[] {
        return [
            { name: "Density", slab: this._density, bias: 0.0 },
            { name: "Velocity", slab: this._velocity, bias: 0.5 },
            { name: "Pressure", slab: this._pressure, bias: 0.5 },
            { name: "Divergence", slab: this._velocityDivergence, bias: 0.5 },
            { name: "Vorticity", slab: this._velocityCurl, bias: 0.5 },
        ];
    }
}