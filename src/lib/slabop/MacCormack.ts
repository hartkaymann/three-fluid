import * as THREE from 'three'

import { Slabop } from './Slabop';
import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class MacCormack extends Slabop {

    public intermediate: Slab;

    constructor(
        renderer: THREE.WebGLRenderer,
        domain: THREE.Vector3,
        tiledTex: TiledTexture,
        vs: string | string[],
        fs: string | string[]
    ) {
        let uniforms = {
            u_domain: { value: domain },
            u_advectedTexture: { value: new THREE.Texture() },
            u_velocityTexture: { value: new THREE.Texture() },
            u_forwardTexture: { value: new THREE.Texture() },
            u_backwardTexture: { value: new THREE.Texture() },
            u_deltaTime: { value: 0.0 },
        }

        super(renderer, tiledTex, vs, fs, uniforms);
        
        this.intermediate = new Slab(tiledTex.resolution);
    }

    compute(
        advected: Slab,
        velocity: Slab,
        forward: THREE.Texture,
        backward: THREE.Texture,
        output: Slab,
        dt: number,
    ): void {
        this.uniforms.u_advectedTexture.value = advected.read.texture;
        this.uniforms.u_velocityTexture.value = velocity.read.texture;
        this.uniforms.u_forwardTexture.value = forward;
        this.uniforms.u_backwardTexture.value = backward;
        this.uniforms.u_deltaTime.value = dt;

        this.wgl.setRenderTarget(output.write);
        this.wgl.render(this.scene, this.camera);
        output.swap();
        this.wgl.setRenderTarget(null);
    }

}