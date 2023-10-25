import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Gradient extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            halfrdx: { value: 0.5 / 1.0 },
            pressure: { value: new THREE.Texture() },
            velocity: { value: new THREE.Texture() }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        pressure: Slab,
        output: Slab,
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.pressure.value = pressure.read.texture;
        
        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}