import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Gradient extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            halfrdx: { value: 0.5 / 1.0 },
            pressure: { value: new THREE.Texture() },
            velocity: { value: new THREE.Texture() }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        velocity: Slab,
        pressure: Slab,
        output: Slab,
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.pressure.value = pressure.read.texture;
        
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}