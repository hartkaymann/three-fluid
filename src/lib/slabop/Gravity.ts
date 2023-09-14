import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Gravity extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            read: { value: new THREE.Texture() },
            dt: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        read: Slab,
        output: Slab,
        dt: number
    ): void {
        this.uniforms.read.value = read.read.texture;
        this.uniforms.dt.value = dt;
    
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}