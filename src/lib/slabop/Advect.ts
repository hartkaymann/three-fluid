import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Advect extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        resolution: THREE.Vector3,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: resolution },
            u_advectedTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 },
            u_dissipation: { value: 0.998 }
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
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_advectedTexture.value = advected.read.texture;
        this.uniforms.u_deltaTime.value = dt;
        this.uniforms.u_dissipation.value = dissipation ? dissipation : 1.0;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}