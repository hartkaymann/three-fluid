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
        },
        // Render every cell of every slice (incl. walls) instead of just interior cells.
        fullTile: boolean = false
    ) {
        this.wgl = wgl;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, tiledTex.resolution.x, tiledTex.resolution.y, 0, 1, tiledTex.tileCount.z + 3);
        this.camera.position.z = tiledTex.tileCount.z + 2;

        this.uniforms = uniforms;
        this.uniforms.u_resolution = {value: tiledTex.simulationResolution};
        this.uniforms.u_textureResolution = {value: tiledTex.resolution};
        this.uniforms.u_tileCount = {value: tiledTex.tileCount};

        let vs = Array.isArray(vertexShaders) ? vertexShaders.join('\n') : vertexShaders;
        let fs = Array.isArray(fragmentShaders) ? fragmentShaders.join('\n') : fragmentShaders;

        // Interior ops skip the 1-cell border and the front/back slices; full-tile ops cover everything.
        const first = fullTile ? 0 : 1;
        const last = fullTile ? tiledTex.tileCount.z : tiledTex.tileCount.z - 1;
        const width = fullTile ? tiledTex.tileResolution.x : tiledTex.tileResolution.x - 2;
        const height = fullTile ? tiledTex.tileResolution.y : tiledTex.tileResolution.y - 2;

        for (let i = first; i < last; i++) {
            const geometry = new THREE.PlaneGeometry(width, height);
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