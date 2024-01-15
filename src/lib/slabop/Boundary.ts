import * as THREE from 'three'

import Slab from '../Slab';
import TiledTexture from '../TiledTexture';

export default class Boundary {

    private _wgl: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.Camera;

    private _uniforms: { [uniform: string]: THREE.IUniform<any> }

    constructor(
        wgl: THREE.WebGLRenderer,
        tiledTex: TiledTexture,
        vs: string,
        fs: string
    ) {
        this._wgl = wgl;

        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(0, tiledTex.resolution.x, tiledTex.resolution.y, 0, 1, 5);
        this._camera.position.z = 4;

        this._uniforms = {
            u_resolution: { value: tiledTex.simulationResolution },
            u_textureResolution : {value: tiledTex.resolution},
            u_readTexture: { value: new THREE.Texture() },
            u_scale: { value: 0.0 }
        }

        const material = new THREE.RawShaderMaterial({
            uniforms: this._uniforms,
            vertexShader: vs,
            fragmentShader: fs
        });

        this.createGeometry(tiledTex, material);
    }

    /**
     * Add boundary geometry with with offsets as additional attribute.
     */
    createGeometry(
        tiledTex: TiledTexture,
        material: THREE.Material
    ) {

        let x0 = 0.5;
        let y0 = 0.5;
        let x1 = tiledTex.resolution.x;
        let y1 = tiledTex.resolution.y;

        // Create and add vertical boundary lines
        for (let i = 0; i < tiledTex.tileCount.x; i++) {
            let xr = x0 + (tiledTex.tileResolution.x - 1) + i * tiledTex.tileResolution.x
            this._scene.add(
                this.createLine(
                    new THREE.Vector3(xr, y0, 0),
                    new THREE.Vector3(xr, y1, 0),
                    material,
                    new THREE.Vector2(-1, 0)
                )
            );
            let xl = x0 + i * tiledTex.tileResolution.x;
            this._scene.add(
                this.createLine(
                    new THREE.Vector3(xl, y0, 0),
                    new THREE.Vector3(xl, y1, 0),
                    material,
                    new THREE.Vector2(1, 0)
                )
            );
        }
        // Create and add horizontal boundary lines
        for (let i = 0; i < tiledTex.tileCount.z; i++) {
            let yt = y0 + (tiledTex.tileResolution.y - 1) + i * tiledTex.tileResolution.y
            this._scene.add(
                this.createLine(
                    new THREE.Vector3(x0, yt, 1),
                    new THREE.Vector3(x1, yt, 1),
                    material,
                    new THREE.Vector2(0, -1)
                )
            );
            let yb = y0 + i * tiledTex.tileResolution.y;
            this._scene.add(
                this.createLine(
                    new THREE.Vector3(x0, yb, 1),
                    new THREE.Vector3(x1, yb, 1),
                    material,
                    new THREE.Vector2(0, 1)
                )
            );
        }

        // Create and add front and back boundary quads
        let geometryFront = new THREE.PlaneGeometry(tiledTex.tileResolution.x - 2, tiledTex.tileResolution.y - 2);
        let geometryBack = new THREE.PlaneGeometry(tiledTex.tileResolution.x - 2, tiledTex.tileResolution.y - 2);
        geometryFront.translate(
            tiledTex.tileResolution.x / 2,
            tiledTex.tileResolution.y / 2,
            3
        );
        geometryBack.translate(
            tiledTex.resolution.x - tiledTex.tileResolution.x / 2,
            tiledTex.resolution.y - tiledTex.tileResolution.y / 2,
            3
        );
        let attribOffsetFront = [];
        let attribOffsetBack = [];
        for (let i = 0; i < geometryFront.getAttribute("position").count; i++) {
            attribOffsetFront.push(tiledTex.tileResolution.x, 0 );
            attribOffsetBack.push(-tiledTex.tileResolution.x, 0);
        }
        geometryFront.setAttribute("offset", new THREE.Float32BufferAttribute(attribOffsetFront, 2));
        geometryBack.setAttribute("offset", new THREE.Float32BufferAttribute(attribOffsetBack, 2));
        const quadFront = new THREE.Mesh(geometryFront, material);
        const quadBack = new THREE.Mesh(geometryBack, material);
        this._scene.add(quadFront);
        this._scene.add(quadBack);
    }

    createLine(
        start: THREE.Vector3,
        end: THREE.Vector3,
        material: THREE.Material,
        offset: THREE.Vector2
    ): THREE.Line {
        let geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        geometry.setAttribute("offset", new THREE.Float32BufferAttribute([offset.x, offset.y, offset.x, offset.y], 2));
        return new THREE.Line(geometry, material);
    }

    compute(
        read: Slab,
        output: Slab,
        scale: number
    ): void {
        this._uniforms.u_readTexture.value = read.read.texture;
        this._uniforms.u_scale.value = scale;

        this._wgl.setRenderTarget(output.write);
        this._wgl.render(this._scene, this._camera);
        this._wgl.setRenderTarget(null);
    }

    getScale() {
        return this._uniforms.u_scale.value;
    }
}