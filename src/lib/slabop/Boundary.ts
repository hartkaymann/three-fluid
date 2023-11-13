import * as THREE from 'three'

import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Boundary {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;

    private uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(renderer: THREE.WebGLRenderer, tiledTex: TiledTexture, vs: string, fs: string) {

        this.renderer = renderer;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, tiledTex.resolution.x, tiledTex.resolution.y, 0, 1, 100);
        this.camera.position.z = 2;

        this.uniforms = {
            u_resolution: { value: tiledTex.tileResolution },
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

        let x0 = 0.0;
        let y0 = 0.0;
        let x1 = tiledTex.resolution.x;
        let y1 = tiledTex.resolution.y;

        // Create and add vertical boundary lines
        for (let i = 0; i < tiledTex.tileCount.z; i++) {
            let xl = x0 + i * tiledTex.tileResolution.x;
            this.scene.add(
                createLine(
                    new THREE.Vector2(xl, y0),
                    new THREE.Vector2(xl, y1),
                    new THREE.Vector2(1, 0)
                )
            );
            let xr = x0 + (tiledTex.tileResolution.x - 1) + i * tiledTex.tileResolution.x
            this.scene.add(
                createLine(
                    new THREE.Vector2(xr, y0),
                    new THREE.Vector2(xr, y1),
                    new THREE.Vector2(-1, 0)
                )
            );
        }
        // Create and add horizontal boundary lines
        for (let i = 0; i < tiledTex.tileCount.z; i++) {
            let yb = y0 + i * tiledTex.tileResolution.y;
            this.scene.add(
                createLine(
                    new THREE.Vector2(x0, yb),
                    new THREE.Vector2(x1, yb),
                    new THREE.Vector2(0, 1)
                )
            );
            let yt = y0 + (tiledTex.tileResolution.y - 1) + i * tiledTex.tileResolution.y
            this.scene.add(
                createLine(
                    new THREE.Vector2(x0, yt),
                    new THREE.Vector2(x1, yt),
                    new THREE.Vector2(0, -1)
                )
            );
        }


        // Create and add front and back boundary quads
        let geometryFront = new THREE.PlaneGeometry(tiledTex.tileResolution.x, tiledTex.tileResolution.y);
        let geometryBack = new THREE.PlaneGeometry(tiledTex.tileResolution.x, tiledTex.tileResolution.y);
        geometryFront.translate(
            tiledTex.tileResolution.x / 2,
            tiledTex.tileResolution.y / 2,
            0
        );
        geometryBack.translate(
            (tiledTex.tileResolution.x) / 2 * (tiledTex.tileCount.x * tiledTex.tileResolution.x),
            (tiledTex.tileResolution.y) / 2 * (tiledTex.tileCount.y * tiledTex.tileResolution.y),
            0
        );
        let attribOffsetFront = [];
        let attribOffsetBack = [];
        for (let i = 0; i < geometryFront.getAttribute("position").count; i++) {
            attribOffsetFront.push(tiledTex.tileResolution.x);
            attribOffsetFront.push(0);
            attribOffsetBack.push(-tiledTex.tileResolution.x);
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