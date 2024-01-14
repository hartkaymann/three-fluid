import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Curl extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: tiledTex.simulationResolution },
            u_velocityTexture: { value: new THREE.Texture() },
            u_halfrdx: { value: 0.5 / 1.0 },
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        output: Slab,
    ): void {
        this.uniforms.u_velocityTexture.value = velocity.read.texture;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}