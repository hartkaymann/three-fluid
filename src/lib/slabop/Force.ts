import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Force extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        size: THREE.Vector3,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_size: { value: size },
            u_resolution: { value: tiledTex.tileResolution },
            u_readTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 },
            u_position: { value: new THREE.Vector3() },
            u_color: { value: new THREE.Vector3() },
            u_radius: { value: 0.0 },
            u_amount: { value: 0.0 }
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        read: Slab,
        output: Slab,
        dt: number,
        position: THREE.Vector3,
        color: THREE.Vector3,
        radius: number,
        amount: number
    ): void {
        this.uniforms.u_readTexture.value = read.read.texture;
        this.uniforms.u_deltaTime.value = dt;
        this.uniforms.u_position.value = position;
        this.uniforms.u_color.value = color;
        this.uniforms.u_radius.value = radius;
        this.uniforms.u_amount.value = amount;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}