import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Advect extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            advected: { value: new THREE.Texture() },
            velocity: { value: new THREE.Texture() },
            dt: { value: 0.0 },
            dissipation: { value: 0.998 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        advected: Slab,
        velocity: Slab,
        output: Slab,
        dt: number,
        dissipation?: number
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.advected.value = advected.read.texture;
        this.uniforms.dt.value = dt;
        this.uniforms.dissipation.value = dissipation ? dissipation : 1.0;
        
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }

}