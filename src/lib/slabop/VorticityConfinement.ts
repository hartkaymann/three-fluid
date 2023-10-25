import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class VorticityConfinement extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            dt: { value: 0.0 },
            halfrdx: { value: 0.5 / 1.0 },
            velocity: { value: new THREE.Texture() },
            vorticity: { value: new THREE.Texture() },
            curl: { value: 0.0 }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        vorticity: Slab,
        output: Slab,
        dt: number,
        curl: number
    ): void {
        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.vorticity.value = vorticity.read.texture;
        this.uniforms.dt.value = dt;
        this.uniforms.curl.value = curl;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}