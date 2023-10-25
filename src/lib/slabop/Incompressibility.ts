import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Incompressability extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        resolution: THREE.Vector3,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: resolution },
            u_densityTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() },
            u_target: { value: 10.0 },
            u_multiplier: { value: 10.0 },
            u_halfrdx: { value: 0.5 / 1.0 },
            u_deltaTime: { value: 0.0 }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        density: Slab,
        velocity: Slab,
        output: Slab,
        target: number,
        multiplier: number,
        dt: number
    ): void {
        this.uniforms.u_densityTexture.value = density.read.texture;
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_target.value = target;
        this.uniforms.u_multiplier.value = multiplier;
        this.uniforms.u_deltaTime.value = dt;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}