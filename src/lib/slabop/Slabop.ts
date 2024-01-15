import * as THREE from 'three';
import TiledTexture from '../TiledTexture';

/**
 * Abstract class that handles setup of flat 3D texture updating.
 */
export abstract class Slabop {

    protected wgl: THREE.WebGLRenderer;
    protected scene: THREE.Scene;
    protected camera: THREE.Camera;

    public uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(
        wgl: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vertexShaders: string | string[],
        fragmentShaders: string | string[],
        uniforms: {
            [uniform: string]: THREE.IUniform<any>
        }
    ) {
        this.wgl = wgl;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, tiledTex.resolution.x, tiledTex.resolution.y, 0, 1, tiledTex.tileCount.z + 1);
        this.camera.position.z = tiledTex.tileCount.z + 2;

        this.uniforms = uniforms;
        this.uniforms.u_resolution = {value: tiledTex.simulationResolution};
        this.uniforms.u_textureResolution = {value: tiledTex.resolution};
        this.uniforms.u_tileCount = {value: tiledTex.tileCount};

        let vs = Array.isArray(vertexShaders) ? vertexShaders.join('\n') : vertexShaders;
        let fs = Array.isArray(fragmentShaders) ? fragmentShaders.join('\n') : fragmentShaders;

        // Add planes in grid pattern where interior cells are
        for (let i = 1; i < tiledTex.tileCount.z - 1; i++) {
            const geometry = new THREE.PlaneGeometry(tiledTex.tileResolution.x - 2, tiledTex.tileResolution.y - 2);
            geometry.translate(
                (tiledTex.tileResolution.x / 2) + tiledTex.tileResolution.x * (i % tiledTex.tileCount.x),
                (tiledTex.tileResolution.y / 2) + tiledTex.tileResolution.y * Math.floor(i / tiledTex.tileCount.x),
                i
            );
            
            const material = new THREE.RawShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: vs,
                fragmentShader: fs,
            });
            const quad = new THREE.Mesh(geometry, material);

            this.scene.add(quad);
        }
    }
}