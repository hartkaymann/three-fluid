import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import Boundary from './Boundary';

export default class Jacobi extends Slabop {

    alpha: number ;
    beta: number;

    constructor(grid: THREE.Vector3, vs: string, fs: string) {
        let uniforms = {
            res: { value: grid },
            x: { value: new THREE.Texture() },
            b: { value: new THREE.Texture() },
            alpha: { value: 0.0 },
            rbeta: { value: 0.0 }
        }

        super(grid, vs, fs, uniforms);
        
        this.alpha = -1.0;
        this.beta = 6.0;
    }

    compute(
        renderer: THREE.WebGLRenderer,
        x: Slab,
        b: Slab,
        output: Slab,
        iterations: number,
        boundary?: Boundary,
        scale?: number
    ): void {
        this.uniforms.alpha.value = this.alpha;
        this.uniforms.rbeta.value = 1.0 / this.beta;

        for (let i = 0; i < iterations; i++) {
            this.step(renderer, x, b, output);
            boundary?.compute(renderer, output, output, scale);
        }
        renderer.setRenderTarget(null);
    }

    step(
        renderer: THREE.WebGLRenderer,
        x: Slab,
        b: Slab,
        output: Slab
    ) {
        this.uniforms.x.value = x.read.texture;
        this.uniforms.b.value = b.read.texture;
    
        renderer.setRenderTarget(output.write);
        renderer.render(this.scene, this.camera);
        output.swap();

    }

}