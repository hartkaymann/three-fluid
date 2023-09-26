import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class VorticityConfinement extends Slabop {

    constructor(grid: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            dt: { value: 0.0 },
            halfrdx: { value: 0.5 / 1.0 },
            velocity: { value: new THREE.Texture() },
            vorticity: { value: new THREE.Texture() },
            curl: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
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

        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}