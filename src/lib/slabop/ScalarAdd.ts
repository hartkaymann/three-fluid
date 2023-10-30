import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class ScalarAddition extends Slabop {

    constructor(
        renderer: THREE.WebGLRenderer,
        resolution: THREE.Vector3,
        vs: string | string[],
        fs: string | string[]
    ) {

        let uniforms = {
            u_resolution: { value: resolution },
            u_augendTexture: { value: new THREE.Texture() },
            u_addendTexture: { value: new THREE.Texture() },
            u_scale: { value: 1.0 }
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        augend: Slab,
        addend: Slab,
        output: Slab,
        scale?: number
    ): void {
        this.uniforms.u_augendTexture.value = augend.read.texture;
        this.uniforms.u_addendTexture.value = addend.read.texture;
        this.uniforms.u_scale.value = scale ? scale : 1.0;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}