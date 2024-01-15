import * as THREE from 'three';

import Slab from './Slab';

import vertexBasic from '../shaders/basic.vert'
import fragmentDisplayVector from '../shaders/displayvector.frag'
import fragmentDisplayScalar from '../shaders/displayscalar.frag'

export default class DebugSlab {

    private _title: string;
    private _slab: Slab;

    private _scene: THREE.Scene;
    private _camera: THREE.OrthographicCamera;

    private _plane: THREE.Mesh;
    private _container: HTMLDivElement;
    private _scissorDiv: HTMLDivElement;

    private _material: THREE.RawShaderMaterial;


    constructor(
        title: string,
        slab: Slab,
        bias: number
    ) {
        this._title = title;
        this._slab = slab;

        let isVectorFormat = this._slab.read.texture.format == THREE.RGBAFormat;
        const vs = vertexBasic;
        const fs = isVectorFormat ? fragmentDisplayVector : fragmentDisplayScalar;
        
        const res = this._slab.resolution;
        this._material = new THREE.RawShaderMaterial({
            uniforms: {
                u_readTexture: { value: new THREE.Texture() },
                u_bias: { value: new THREE.Vector3(bias, bias, bias) },
                u_scale: { value: new THREE.Vector3(res.x, res.x, res.x) },
            },
            vertexShader: vs,
            fragmentShader: fs
        });
        this.reset();

        this._scissorDiv = document.createElement('div');
    }

    reset(): void {
        const res = this._slab.resolution;

        this._scene = new THREE.Scene();
        this._camera = new THREE.OrthographicCamera(0, res.x, res.y, 0, 1, 100);
        this._camera.position.z = 2;

        const geometry = new THREE.PlaneGeometry(res.x, res.y)
        geometry.translate(
            res.x / 2,
            res.y / 2,
            0
        );

        this._plane = new THREE.Mesh(geometry, this._material);
        this._scene.add(this._plane);
    }

    create(panel: HTMLElement): void {
        this._container = document.createElement('div');
        this._container.className = 'debug-item';

        this._container.appendChild(this._scissorDiv);

        const descriptionElemen = document.createElement('div');
        descriptionElemen.innerText = this._title;
        this._container.appendChild(descriptionElemen);

        panel.appendChild(this._container);
    }

    /**
     * Renders slab into debug panel.
     * The square in which the slab is rendered is set from the position and size of the container.
     * @returns null 
     */
    render(wgl: THREE.WebGLRenderer): void {
        const rect = this._scissorDiv.getBoundingClientRect();

        if (rect.bottom < 0 ||
            rect.top > wgl.domElement.clientHeight ||
            rect.right < 0 ||
            rect.left > wgl.domElement.clientWidth) {
            return; // it's off screen
        }

        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = wgl.domElement.clientHeight - rect.bottom;

        wgl.setViewport(left, bottom, width, height);
        wgl.setScissor(left, bottom, width, height);
        wgl.clearColor();

        this._material.uniforms.u_readTexture.value = this._slab.read.texture;

        wgl.render(this._scene, this._camera);
        wgl.setRenderTarget(null);
    }

    setSlab(slab: Slab): void {
        this._slab = slab;
        this.reset();
    }
}