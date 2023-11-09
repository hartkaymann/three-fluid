import * as THREE from 'three'

import Slab from '../Slab';

export default class Boundary {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;

    private uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(renderer: THREE.WebGLRenderer, resolution: THREE.Vector3, vs: string, fs: string) {

        this.renderer = renderer;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera((resolution.x * resolution.z) / -2, (resolution.x * resolution.z) / 2, resolution.y / 2, resolution.y / -2, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = {
            u_resolution: { value: resolution },
            u_readTexture: { value: new THREE.Texture() },
            u_scale: { value: -1.0 }
        }

        const material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vs,
            fragmentShader: fs
        });

        var createLine = function (
            start: THREE.Vector2,
            end: THREE.Vector2,
            offset: THREE.Vector2
        ): THREE.Line {
            let geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            geometry.setAttribute("offset", new THREE.Float32BufferAttribute([offset.x, offset.y, offset.x, offset.y], 2));
            const line = new THREE.Line(geometry, material);
            return line;
        }

        // Create and add left and right boundary lines
        let x0 = (resolution.x * resolution.z) / -2 + resolution.x + 0.5;
        let x1 = (resolution.x * resolution.z) / 2 - resolution.x;
        let y0 = resolution.y / 2 - 0.5;
        let y1 = resolution.y / -2 + 1;
        for (let i = 0; i < resolution.z - 2; i++) {
            let xl = x0 + i * resolution.x;
            this.scene.add(
                createLine(
                    new THREE.Vector2(xl, y0 - 0.5),
                    new THREE.Vector2(xl, y1),
                    new THREE.Vector2(1, 0)
                )
            );
            let xr = x0 + (resolution.x - 1) + i * resolution.x
            this.scene.add(
                createLine(
                    new THREE.Vector2(xr, y0 - 0.5),
                    new THREE.Vector2(xr, y1),
                    new THREE.Vector2(-1, 0)
                )
            );
        }

        // Create and add top and bottom boundary lines
        this.scene.add(
            createLine(
                new THREE.Vector2(x0, y0),
                new THREE.Vector2(x1, y0),
                new THREE.Vector2(0, -1)
            )
        );
        this.scene.add(
            createLine(
                new THREE.Vector2(x0, y1),
                new THREE.Vector2(x1, y1),
                new THREE.Vector2(0, 1)
            )
        );
        // Create and add front and back boundary quads
        let geometryFront = new THREE.PlaneGeometry(resolution.x, resolution.y);
        let geometryBack = new THREE.PlaneGeometry(resolution.x, resolution.y);
        geometryFront.translate(resolution.x * resolution.z / -2 + resolution.x / 2, 0, 0);
        geometryBack.translate(resolution.x * resolution.z / 2 - resolution.x / 2, 0, 0);
        let attribOffsetFront = [];
        let attribOffsetBack = [];
        for (let i = 0; i < geometryFront.getAttribute("position").count; i++) {
            attribOffsetFront.push(resolution.x);
            attribOffsetFront.push(0);
            attribOffsetBack.push(-resolution.x);
            attribOffsetBack.push(0);
        }
        geometryFront.setAttribute("offset", new THREE.Float32BufferAttribute(attribOffsetFront, 2));
        geometryBack.setAttribute("offset", new THREE.Float32BufferAttribute(attribOffsetBack, 2));
        const quadFront = new THREE.Mesh(geometryFront, material);
        const quadBack = new THREE.Mesh(geometryBack, material);
        this.scene.add(quadFront);
        this.scene.add(quadBack);
    }

    compute(
        read: Slab,
        output: Slab,
    ): void {
        this.uniforms.u_readTexture.value = read.read.texture;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }

    setScale(scale: number) {
        this.uniforms.u_scale.value = scale;
    }
}