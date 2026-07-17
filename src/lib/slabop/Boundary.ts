import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Boundary extends Slabop {

    constructor(
        wgl: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {
        let uniforms = {
            u_readTexture: { value: new THREE.Texture() },
            u_scale: { value: 0.0 },
        }

        super(wgl, tiledTex, vs, fs, uniforms, true);
    }

    compute(
        read: Slab,
        output: Slab,
        scale: number
    ): void {
        this.uniforms.u_readTexture.value = read.read.texture;
        this.uniforms.u_scale.value = scale;

        this.wgl.setRenderTarget(output.write);
        this.wgl.render(this.scene, this.camera);
        output.swap();
        this.wgl.setRenderTarget(null);
    }
}
