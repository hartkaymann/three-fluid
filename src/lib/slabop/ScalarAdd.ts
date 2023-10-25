import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class ScalarAddition extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            res: { value: resolution },
            augend: { value: new THREE.Texture() },
            addend: { value: new THREE.Texture() },
            scale: { value: 1.0}
        }

        super(renderer, resolution, vs, fs, uniforms);
    }

    compute(
        augend: Slab,
        addend: Slab,
        output: Slab,
        scale?: number
    ): void {
        this.uniforms.augend.value = augend.read.texture;
        this.uniforms.addend.value = addend.read.texture;
        this.uniforms.scale.value = scale ? scale : 1.0;
        
        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }

}