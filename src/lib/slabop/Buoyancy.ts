import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Buoyancy extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            velocity: { value: new THREE.Texture() },
            density: { value: new THREE.Texture() },
            rise: { value: 1.0 },
            fall: { value: 1.0 },
            gravity: { value: new THREE.Vector3()},
            dt: { value: 0.0 }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        density: Slab,
        output: Slab,
        gravity: THREE.Vector3,
        dt: number
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.density.value = density.read.texture;
        this.uniforms.gravity.value = gravity;
        this.uniforms.dt.value = dt;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}