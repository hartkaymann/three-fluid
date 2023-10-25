import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Gradient extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        resolution: THREE.Vector3,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: resolution },
            u_halfrdx: { value: 0.5 / 1.0 },
            u_pressureTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        velocity: Slab,
        pressure: Slab,
        output: Slab,
    ): void {
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_pressureTexture.value = pressure.read.texture;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}