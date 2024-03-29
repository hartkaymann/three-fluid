import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import Boundary from './Boundary';
import TiledTexture from '../TiledTexture';

export default class Jacobi extends Slabop {

    alpha: number;
    beta: number;

    constructor(
        renderer: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {
        
        let uniforms = {
            u_resolution: { value: tiledTex.simulationResolution },
            u_pressureTexture: { value: new THREE.Texture() },
            u_divergenceTexture: { value: new THREE.Texture() },
            u_offset: { value: 1.0},
            u_alpha: { value: 0.0 },
            u_rbeta: { value: 0.0 },
        }

        super(renderer, tiledTex, vs, fs, uniforms);

        this.alpha = -1.0;
        this.beta = 6.0;
    }

    compute(
        x: Slab,
        b: Slab,
        output: Slab,
        iterations: number,
        boundary: Boundary,
        scale: number
    ): void {
        this.uniforms.u_alpha.value = this.alpha;
        this.uniforms.u_rbeta.value = 1.0 / this.beta;
        
        for (let i = 0; i < iterations; i++) {
            this.step(x, b, output);
            boundary.compute(output, x, scale);
        }

        this.wgl.setRenderTarget(null);
    }

    step(
        x: Slab,
        b: Slab,
        output: Slab
    ) {
        this.uniforms.u_pressureTexture.value = x.read.texture;
        this.uniforms.u_divergenceTexture.value = b.read.texture;

        this.wgl.setRenderTarget(output.write);
        this.wgl.render(this.scene, this.camera);
        output.swap();
    }

}