import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Vorticity extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            halfrdx: { value: 0.5 / 1.0 },
            velocity: { value: new THREE.Texture() },
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        velocity: Slab,
        output: Slab,
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}