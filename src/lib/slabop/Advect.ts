import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Advect extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            advected: { value: new THREE.Texture() },
            velocity: { value: new THREE.Texture() },
            dt: { value: 0.0 },
            dissipation: { value: 0.998 }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
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
        
        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}