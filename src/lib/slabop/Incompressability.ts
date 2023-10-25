import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Incompressability extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            density: { value: new THREE.Texture() },
            velocity: { value: new THREE.Texture() },
            target: { value: 10.0 },
            multiplier: { value: 10.0 },
            halfrdx: { value: 0.5 / 1.0 },
            dt: { value: 0.0 }
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
        this.uniforms.density.value = density.read.texture;
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.target.value = target;
        this.uniforms.multiplier.value = multiplier;
        this.uniforms.dt.value = dt;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}