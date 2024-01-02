import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class MacCormack extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {
        let uniforms = {
            u_advectedTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() },
            u_forwardTexture: { value: new THREE.Texture() },
            u_backwardTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 }
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        advected: Slab,
        velocity: Slab,
        forward: THREE.Texture,
        backward: THREE.Texture,
        output: Slab,
    ): void {
        this.uniforms.u_advectedTexture.value = advected.read.texture;
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_forwardTexture.value = forward;
        this.uniforms.u_backwardTexture.value = backward;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}