import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Buoyancy extends Slabop {

    constructor(grid: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            velocity: { value: new THREE.Texture() },
            density: { value: new THREE.Texture() },
            rise: { value: 1.0 },
            fall: { value: 1.0 },
            gravity: { value: new THREE.Vector3()},
            dt: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
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

        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}