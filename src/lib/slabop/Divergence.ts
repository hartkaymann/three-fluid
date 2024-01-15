import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Divergence extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: tiledTex.simulationResolution },
            u_offset: { value: 1.0 },
            u_halfrdx: { value: 0.5 / 1.0 },
            u_readTexture: { value: new THREE.Texture() },
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        read: Slab,
        output: Slab,
    ): void {
        this.uniforms.u_readTexture.value = read.read.texture;
        this.uniforms.u_halfrdx.value = 0.5;

        this.wgl.setRenderTarget(output.write);
        this.wgl.render(this.scene, this.camera);
        output.swap();
        this.wgl.setRenderTarget(null);
    }

}