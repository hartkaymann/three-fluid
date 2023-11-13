import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Advect extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: tiledTex.tileResolution }, // should be vec3 where z value is tiledTex.tileCount.z (i think)
            u_advectedTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 },
            u_dissipation: { value: 0.998 },
            u_bfecc: { value: false }
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        advected: Slab,
        velocity: Slab,
        output: Slab,
        dt: number,
        dissipation: number,
        bfecc: boolean
    ): void {
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_advectedTexture.value = advected.read.texture;
        this.uniforms.u_deltaTime.value = dt;
        this.uniforms.u_dissipation.value = dissipation;
        this.uniforms.u_bfecc.value = bfecc;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}