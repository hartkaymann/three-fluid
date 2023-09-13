import * as THREE from 'three'

import { Slabop } from './Slabop';
import PingPongBuffer from '../PingPongBuffer';

export default class Splat extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            read: { value: new THREE.Texture() },
            position: { value: new THREE.Vector2() },
            color: { value: new THREE.Color() }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        read: THREE.Texture,
        output: PingPongBuffer,
        position: THREE.Vector2,
        color: THREE.Color
    ): void {
        this.uniforms.read.value = read;
        this.uniforms.position.value = position;
        this.uniforms.color.value = color;

        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }
}