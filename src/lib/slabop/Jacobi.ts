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
            u_markerTexture: { value: new THREE.Texture() },
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
        marker: Slab,
        output: Slab,
        iterations: number,
        boundary: Boundary,
        offset?: number
    ): void {
        this.uniforms.u_alpha.value = this.alpha;
        this.uniforms.u_rbeta.value = 1.0 / this.beta;
        this.uniforms.u_markerTexture.value = marker.read.texture;
        this.uniforms.u_offset.value = offset ? offset : 1.0;
        
        const tempBoundaryScale = boundary.getScale();
        boundary.setScale(1);

        for (let i = 0; i < iterations; i++) {
            this.step(x, b, output);
            boundary.compute(output, output);
        }
        
        boundary.setScale(tempBoundaryScale);

        this.renderer.setRenderTarget(null);
    }

    step(
        x: Slab,
        b: Slab,
        output: Slab
    ) {
        this.uniforms.u_pressureTexture.value = x.read.texture;
        this.uniforms.u_divergenceTexture.value = b.read.texture;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();

    }

}