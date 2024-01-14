import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Vorticity extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: tiledTex.simulationResolution },
            u_velocityTexture: { value: new THREE.Texture() },
            u_curlTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 },
            u_halfrdx: { value: 0.5 / 1.0 },
            u_strength: { value: 0.0 }
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        curl: Slab,
        output: Slab,
        dt: number,
        strength: number
    ): void {
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_curlTexture.value = curl.read.texture;
        this.uniforms.u_deltaTime.value = dt;
        this.uniforms.u_strength.value = strength;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}