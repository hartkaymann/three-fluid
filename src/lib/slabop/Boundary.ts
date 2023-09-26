import * as THREE from 'three'

import Slab from '../Slab';

export default class Boundary {

    private scene: THREE.Scene;
    private camera: THREE.Camera;

    private uniforms: { [uniform: string]: THREE.IUniform<any> }
    private boundaries: THREE.Line[];

    constructor(grid: THREE.Vector3, vs: string, fs: string) {

        this.scene = new THREE.Scene();

        this.camera = new THREE.OrthographicCamera(grid.x / -2, grid.x / 2, grid.y / 2, grid.y / -2, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = {
            res: { value: grid },
            read: { value: new THREE.Texture() },
            offset: { value: new THREE.Vector3() },
            scale: { value: 0.0 }
        }

        const material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vs,
            fragmentShader: fs
        });

        var createLine = function (
            start: THREE.Vector2,
            end: THREE.Vector2,
            offset: THREE.Vector3
        ): THREE.Line {
            let geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const line = new THREE.Line(geometry, material);
            line.userData.offset = offset;
            return line;
        }

        this.boundaries = [
            // Left
            createLine(
                new THREE.Vector2(grid.x / -2 + 1, grid.y / -2 + 1),
                new THREE.Vector2(grid.x / -2, grid.y / 2),
                new THREE.Vector3(1, 0, 0)
            ),
            // Right
            createLine(
                new THREE.Vector2(grid.x / 2, grid.y / 2 - 1),
                new THREE.Vector2(grid.x / 2, grid.y / -2),
                new THREE.Vector3(-1, 0, 0)
            ),
            // Top
            createLine(
                new THREE.Vector2(grid.x / -2 + 1, grid.y / 2),
                new THREE.Vector2(grid.x / 2, grid.y / 2),
                new THREE.Vector3(0, -1, 0)
            ),
            // Bottom
            createLine(
                new THREE.Vector2(grid.x / 2 - 1, grid.y / -2),
                new THREE.Vector2(grid.x / -2, grid.y / -2 + 1),
                new THREE.Vector3(0, 1, 0)
            ),
        ]
    }

    compute(
        renderer: THREE.WebGLRenderer,
        read: Slab,
        output: Slab,
        scale?: number
    ): void {
        this.uniforms.read.value = read.read.texture;
        this.uniforms.scale.value = scale ? scale : -1.0;
        this.uniforms.scale.value = 0.0; // TESTING 
        renderer.setRenderTarget(output.write);

        this.boundaries.forEach(line => {
            this.uniforms.offset.value = line.userData.offset;

            this.scene.add(line);
            renderer.render(this.scene, this.camera);
            this.scene.remove(line);
        });

        renderer.setRenderTarget(null);
    }
}