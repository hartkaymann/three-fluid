import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Buoyancy extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
                vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: tiledTex.tileResolution },
            u_velocityTexture: { value: new THREE.Texture() },
            u_densityTexture: { value: new THREE.Texture() },
            u_rise: { value: 1.0 },
            u_fall: { value: 1.0 },
            u_gravity: { value: new THREE.Vector3() },
            u_deltaTime: { value: 0.0 }
        }

        super(renderer, tiledTex, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        density: Slab,
        output: Slab,
        gravity: THREE.Vector3,
        dt: number
    ): void {
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_densityTexture.value = density.read.texture;
        this.uniforms.u_gravity.value = gravity;
        this.uniforms.u_deltaTime.value = dt;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}