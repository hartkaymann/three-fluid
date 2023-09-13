import * as THREE from 'three';

export abstract class Slabop {

    scene: THREE.Scene;
    camera: THREE.Camera;
    uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(
        grid: THREE.Vector2,
        vs: string,
        fs: string,
        uniforms: {
            [uniform: string]: THREE.IUniform<any>
        }
    ) {
        this.scene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = uniforms;

        const geometry = new THREE.PlaneGeometry(grid.x - 2, grid.y - 2);
        const material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vs,
            fragmentShader: fs
        });
        const quad = new THREE.Mesh(geometry, material);

        this.scene.add(quad);
    }

}