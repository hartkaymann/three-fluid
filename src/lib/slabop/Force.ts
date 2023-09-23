import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';

export default class Force extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            read: { value: new THREE.Texture() },
            dt: { value: 0.0 },
            position: { value: new THREE.Vector2() },
            color: { value: new THREE.Color() },
            radius: { value: 0.0 },
            amount: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        read: Slab,
        output: Slab,
        dt: number,
        position: THREE.Vector2,
        color: THREE.Color,
        radius: number,
        amount: number
    ): void {
        this.uniforms.read.value = read.read.texture;
        this.uniforms.dt.value = dt;
        this.uniforms.position.value = position;
        this.uniforms.color.value = color;
        this.uniforms.radius.value = radius;
        this.uniforms.amount.value = amount;

        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}