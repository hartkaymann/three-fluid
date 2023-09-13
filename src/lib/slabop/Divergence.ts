import * as THREE from 'three'

import { Slabop } from './Slabop';
import PingPongBuffer from '../PingPongBuffer';

export default class Divergence extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            halfrdx: { value: 0.5 / 1.0 },
            velocity: { value: new THREE.Texture() }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        velocity: THREE.Texture,
        output: PingPongBuffer,
    ): void {
        this.uniforms.velocity.value = velocity;
        
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);
    }

}