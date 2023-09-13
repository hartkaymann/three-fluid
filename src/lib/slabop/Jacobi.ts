import * as THREE from 'three'

import { Slabop } from './Slabop';
import PingPongBuffer from '../PingPongBuffer';

export default class Jacobi extends Slabop {

    constructor(grid: THREE.Vector2, vs: string, fs: string) {

        let uniforms = {
            res: { value: grid },
            x: { value: new THREE.Texture() },
            b: { value: new THREE.Texture() },
            alpha: { value: 0.0 },
            rbeta: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
    }

    compute(
        renderer: THREE.WebGLRenderer,
        x: THREE.Texture,
        b: THREE.Texture,
        output: PingPongBuffer,
        iterations: number,
        alpha: number,
        rbeta?: number
    ): void {
        this.uniforms.alpha.value = alpha;
        this.uniforms.rbeta.value = rbeta ? rbeta : 1.0 / 4.0;

        for (let i = 0; i < iterations; i++) {
            this.step(renderer, x, b, output);
            // apply boundary
        }
    }

    step(
        renderer: THREE.WebGLRenderer,
        x: THREE.Texture,
        b: THREE.Texture,
        output: PingPongBuffer
    ) {
        this.uniforms.x.value = x;
        this.uniforms.b.value = b;
    
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();
        renderer.setRenderTarget(null);

    }

}