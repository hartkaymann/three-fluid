import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Force extends Slabop {

    constructor(renderer: THREE.WebGLRenderer, size: THREE.Vector3, resolution: THREE.Vector3, vs: string, fs: string) {

        let uniforms = {
            size: {value: size},
            res: { value: resolution },
            read: { value: new THREE.Texture() },
            dt: { value: 0.0 },
            position: { value: new THREE.Vector3() },
            color: { value: new THREE.Vector3() },
            radius: { value: 0.0 },
            amount: { value: 0.0 }
        }

        super(renderer, resolution, vs, fs, uniforms);
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
        this.uniforms.read.value = read.read.texture;
        this.uniforms.dt.value = dt;
        this.uniforms.position.value = position;
        this.uniforms.color.value = color;
        this.uniforms.radius.value = radius;
        this.uniforms.amount.value = amount;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();
        this.renderer.setRenderTarget(null);
    }
}